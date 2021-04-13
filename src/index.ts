import * as core from '@actions/core'
import { deleteOrphans } from './delete-orphans.function'
import { CfnHelper } from './cfn-helper'
import { GithubHelper } from './github-helper'


async function run() {
  // reading the inputs (inputs defined in action.yml)
  const stackNamePrefix = core.getInput('stackNamePrefix', { required: true })
  const ignoreStacks: string[] = JSON.parse(core.getInput('ignoreStacks', { required: true }))
  const githubToken: string = core.getInput('githubToken', { required: true })

  if (!Array.isArray(ignoreStacks)) {
    throw new Error(`action input 'ignoreStacks' needs to be a json array. provided value '${core.getInput('ignoreStacks')}' could not be parsed`)
  }

  const ghHelper = new GithubHelper(githubToken)
  const cfnHelper = new CfnHelper()
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

  return await deleteOrphans(ghHelper, cfnHelper, { stackNamePrefix, ignoreStacks, owner, repo })
}

run()
  .then((deletedStacks) => core.setOutput('deletedStacks', deletedStacks))
  .catch((err: Error) => core.setFailed(err.message))


