import * as core from '@actions/core'
import * as github from '@actions/github'
import { parseBranchName } from '@shiftcode/build-helper/branch.utils'
import { CfnHelper } from './cfn-helper'
import { GithubHelper } from './github-helper'


export async function run() {
  // reading the inputs (inputs defined in action.yml)
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
        console.warn(err.message)
        return null
      }
    })
    .filter((b) => !!b)
    .reduce((u, b) => [...u, `xx${b.branchId}`, `pr${b.branchId}`], [])

  console.debug('existing branches: ', branches.map((b) => b.name))

  const existingStacks = stacks
    .filter((stack) => stack.ParentId === undefined) // get rid of the nested stacks
    .filter((stack) => stack.StackName.startsWith(stackNamePrefix))

  console.debug('existing stacks:', existingStacks.map((s) => s.StackName))

  const stacksToDelete = existingStacks
    .filter((stack) => stack.StackName.indexOf('master') === -1)
    .filter((stack) => {
      const stackId = /((xx|pr)\d+)/.exec(stack.StackName)[1]
      return !possibleBranchIds.includes(stackId) && !ignoreStacks.includes(stackId)
    })
    .map((s) => s.StackName)

  if (stacksToDelete.length) {
    console.info('stacks to delete:', stacksToDelete)
    await Promise.all(stacksToDelete.map((s) => cfnHelper.deleteStack(s)))
  } else {
    console.info('no orphan stacks detected')
  }

  core.setOutput('deletedStacks', stacksToDelete)
}

run()
