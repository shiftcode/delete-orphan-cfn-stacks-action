import { parseBranchName, isProduction } from '@shiftcode/branch-utilities'
import { CfnHelper } from './cfn-helper.js'
import { GithubHelper } from './github-helper.js'
import * as core from '@actions/core'

export interface DeleteOrphansOptions {
  stackNamePrefix: string
  ignoreStacks: string[]
  owner: string
  repo: string
  dry?: boolean
}

export async function deleteOrphans(
  githubHelper: GithubHelper,
  cfnHelper: CfnHelper,
  options: DeleteOrphansOptions,
): Promise<string[]> {
  if (options.dry) {
    core.notice('running in DRY mode, no stacks will be deleted')
  }

  const [branches, stacks] = await Promise.all([
    githubHelper.listAllBranches(options.owner, options.repo),
    cfnHelper.listAllStacks(),
  ])

  const possibleBranchIds = branches
    .filter((branch) => !isProduction(branch))
    .map((branch) => {
      try {
        return parseBranchName(branch)
      } catch (err) {
        core.error(err)
        return null
      }
    })
    .filter((b) => !!b)
    .map((b) => [`xx${b.branchId}`, `pr${b.branchId}`])
    .flat(1)

  core.info(`existing branches: ${branches}`)

  const existingStacks = stacks
    .filter((stack) => stack.ParentId === undefined) // get rid of the nested stacks
    .filter((stack) => stack.StackName.startsWith(options.stackNamePrefix))

  core.info(`existing stacks: ${existingStacks.map((s) => s.StackName)}`)

  // when there's no `xx` or `pr` with following numbers we don't have a match
  // therefore prod/nonProd and master/main stacks are ignored
  const stacksToDelete = existingStacks
    .filter((stack) => {
      const stackId = /((xx|pr)\d+)/.exec(stack.StackName)?.[1]
      return stackId && !possibleBranchIds.includes(stackId) && !options.ignoreStacks.includes(stackId)
    })
    .map((s) => s.StackName)

  if (stacksToDelete.length) {
    core.info(`stacks to delete: ${stacksToDelete}`)
    if (!options.dry) {
      await Promise.allSettled(stacksToDelete.map((s) => cfnHelper.deleteStack(s)))
    }
  } else {
    core.info('no orphan stacks detected')
  }

  return stacksToDelete
}
