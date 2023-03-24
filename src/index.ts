import * as core from '@actions/core'
import { GithubHelper } from './github-helper.js'
import { CfnHelper } from './cfn-helper.js'
import { deleteOrphans } from './delete-orphans.function.js'
import { StackStatus } from '@aws-sdk/client-cloudformation'

try {
  // reading the inputs (inputs defined in action.yml)
  const stackNamePrefix = core.getInput('stackNamePrefix', { required: true })
  const ignoreStacks: string[] = JSON.parse(core.getInput('ignoreStacks', { required: true }))
  const githubToken: string = core.getInput('githubToken', { required: true })
  const dry: boolean = core.getInput('dryMode') === 'true'

  
  if (!Array.isArray(ignoreStacks)) {
    throw new Error(
      `action input 'ignoreStacks' needs to be a json array. provided value '${core.getInput(
        'ignoreStacks',
      )}' could not be parsed`,
    )
  }

  const ghHelper = new GithubHelper(githubToken)
  const cfnHelper = new CfnHelper()

  // print stacks in DELETE_FAILED state
  const deleteFailedStacks = await cfnHelper.listAllStacks([StackStatus.DELETE_FAILED])
  if (deleteFailedStacks.length) {
    const details = deleteFailedStacks
      .map((stack) => `${stack.StackName} (deletion time: ${stack.DeletionTime.toUTCString()})`)
      .join(' / ')
    core.notice(`found ${deleteFailedStacks.length} stacks in state DELETE_FAILED, here are the details: ${details}`)
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

  const deletedStacks = await deleteOrphans(ghHelper, cfnHelper, { stackNamePrefix, ignoreStacks, owner, repo, dry })
  if(deletedStacks.length){
    core.notice(`A delete action was initiated for the following stacks: ${deletedStacks}`)
  }else{
    core.notice(`No stacks to delete`)
  }
} catch (err) {
  core.setFailed(err.message)
}
