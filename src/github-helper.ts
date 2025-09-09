import * as core from '@actions/core'

export interface BranchesResponseItem {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
}

export type BranchesResponse = BranchesResponseItem[]

export class GithubHelper {
  constructor(private readonly githubToken: string) {}

  /**
   * list all branches (with multiple requests if necessary)
   */
  async listAllBranches(owner: string, repo: string, page = 1, perPage = 100): Promise<string[]> {
    const branches = await this.listBranches(owner, repo, page, perPage)

    if (branches.length) {
      return [...branches, ...(await this.listAllBranches(owner, repo, page + 1, perPage))]
    } else {
      return branches
    }
  }

  private async listBranches(owner: string, repo: string, page = 1, perPage = 100): Promise<string[]> {
    const opts: RequestInit = {
      headers: { Authorization: `token ${this.githubToken}` },
    }
    const url = `https://api.github.com/repos/${owner}/${repo}/branches?page=${page}&per_page=${perPage}`
    const req = await fetch(url, opts)

    if (req.ok) {
      const branches: BranchesResponse = <BranchesResponse>await req.json()
      return branches.map((b) => b.name)
    } else {
      core.setFailed(
        `Failed to list branches for ${owner}/${repo} with status: ${req.status} / status text: ${
          req.statusText
        } and message ${await req.text()}`,
      )
    }
  }
}
