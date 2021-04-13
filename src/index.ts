import * as core from '@actions/core'
import { parseBranchName } from '@shiftcode/build-helper/branch.utils'
import { CfnHelper } from './cfn-helper'
import { GithubHelper } from './github-helper'


export async function run() {
  const stackNamePrefix = core.getInput('stackNamePrefix', { required: true })
  const ignoreStacks: string[] = JSON.parse(core.getInput('ignoreStacks', { required: true }))
  const githubToken: string = core.getInput('githubToken', { required: true })


  if (!Array.isArray(ignoreStacks)) {
    throw new Error(`action input 'ignoreStacks' needs to be a json array. provided value '${core.getInput('ignoreStacks')}' could not be parsed`)
  }

  const githubHelper = new GithubHelper(githubToken)
  const cfnHelper = new CfnHelper()

  const owner = 'shiftcode'
  const repo = 'bag-covid-19-dashboard'

  const [branches, stacks] = await Promise.all([
    githubHelper.listAllBranches(owner, repo),
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

  const stacksNames = stacks
    .filter((stack) => stack.ParentId === undefined)// no nested-stacks
    .filter((stack) => stack.StackName.startsWith(stackNamePrefix))
    .filter((stack) => stack.StackName.indexOf('master') === -1)
    .filter((stack) => {
      const stackId = /((xx|pr)\d+)/.exec(stack.StackName)[1]
      return !possibleBranchIds.includes(stackId) && !ignoreStacks.includes(stackId)
    })
    .map((stack) => stack.StackName)

  console.log('stacks to delete', stacksNames)

  // todo: delete stacks

  core.setOutput('deletedStacks', stacksNames)
}

run()
