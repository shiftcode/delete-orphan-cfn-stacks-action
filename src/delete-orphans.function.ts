import { parseBranchName } from '@shiftcode/build-helper/branch.utils'
import { CfnHelper } from './cfn-helper'
import { GithubHelper } from './github-helper'

export interface DeleteOrphansOptions {
  stackNamePrefix: string
  ignoreStacks: string[]
  owner: string,
  repo: string
}

export async function deleteOrphans(githubHelper: GithubHelper,
                                    cfnHelper: CfnHelper,
                                    options: DeleteOrphansOptions): Promise<string[]> {

  const [branches, stacks] = await Promise.all([
    githubHelper.listAllBranches(options.owner, options.repo),
    cfnHelper.listAllStacks(),
  ])

  const possibleBranchIds = branches
    .filter((branch) => branch !== 'master')
    .map((branch) => {
      try {
        return parseBranchName(branch)
      } catch (err) {
        console.warn(err.message)
        return null
      }
    })
    .filter((b) => !!b)
    .reduce((u, b) => [...u, `xx${b.branchId}`, `pr${b.branchId}`], [])

  console.debug('existing branches: ', branches)

  const existingStacks = stacks
    .filter((stack) => stack.ParentId === undefined) // get rid of the nested stacks
    .filter((stack) => stack.StackName.startsWith(options.stackNamePrefix))

  console.debug('existing stacks:', existingStacks.map((s) => s.StackName))

  const stacksToDelete = existingStacks
    .filter((stack) => stack.StackName.indexOf('master') === -1)
    .filter((stack) => {
      const stackId = /((xx|pr)\d+)/.exec(stack.StackName)[1]
      return !possibleBranchIds.includes(stackId) && !options.ignoreStacks.includes(stackId)
    })
    .map((s) => s.StackName)

  if (stacksToDelete.length) {
    console.info('stacks to delete:', stacksToDelete)
    await Promise.all(stacksToDelete.map((s) => cfnHelper.deleteStack(s)))
  } else {
    console.info('no orphan stacks detected')
  }

  return stacksToDelete
}
