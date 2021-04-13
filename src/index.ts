import * as core from '@actions/core'
import * as github from '@actions/github'
import { parseBranchName } from '@shiftcode/build-helper/branch.utils'
import { CfnHelper } from './cfn-helper'
import { GithubHelper } from './github-helper'


export async function run() {
  console.debug('github', github.context)

  const stackNamePrefix = core.getInput('stackNamePrefix', { required: true })
  const ignoreStacks: string[] = JSON.parse(core.getInput('ignoreStacks', { required: true }))
  const githubToken: string = core.getInput('githubToken', { required: true })


  if (!Array.isArray(ignoreStacks)) {
    throw new Error(`action input 'ignoreStacks' needs to be a json array. provided value '${core.getInput('ignoreStacks')}' could not be parsed`)
  }

  const githubHelper = new GithubHelper(githubToken)
  const cfnHelper = new CfnHelper()

  const [branches, stacks] = await Promise.all([
    githubHelper.listAllBranches(github.context.payload.repository.full_name),
    cfnHelper.listAllStacks(),
  ])

  const possibleBranchIds = branches
    .filter((b) => b.name !== 'master')
    .map((b) => {
      try {
        return parseBranchName(b.name)
      } catch (err) {
        core.warning(err.message)
        return null
      }
    })
    .filter((b) => !!b)
    .reduce((u, b) => [...u, `xx${b.branchId}`, `pr${b.branchId}`], [])

  console.info('existing branches: ', branches.map((b) => b.name))

  const existingStacks = stacks
    .filter((stack) => stack.ParentId === undefined)// no nested-stacks
    .filter((stack) => stack.StackName.startsWith(stackNamePrefix))

  console.debug('existing stacks:', existingStacks.map((s) => s.StackName))

  const stacksNames = existingStacks
    .filter((stack) => stack.StackName.indexOf('master') === -1)
    .filter((stack) => {
      const stackId = /((xx|pr)\d+)/.exec(stack.StackName)[1]
      return !possibleBranchIds.includes(stackId) && !ignoreStacks.includes(stackId)
    })
    .map((stack) => stack.StackName)

  if (stacksNames.length) {
    core.info(`stacks to delete: ${JSON.stringify(stacksNames)}`)
  } else {
    core.info('no orphan stacks detected')
  }

  // todo: delete stacks
  core.setOutput('deletedStacks', stacksNames)
}

run()
