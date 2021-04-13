import fetch from 'node-fetch'

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
  private static branchesEndpoint = (owner: string, repo: string, page = 1, perPage = 100) => `https://api.github.com/repos/${owner}/${repo}/branches?page=${page}&per_page=${perPage}`

  constructor(private readonly githubToken: string) {}

  async listAllBranches(owner: string, repo: string, page = 1): Promise<BranchesResponse> {
    const branches = await fetch(
      GithubHelper.branchesEndpoint(owner, repo, page),
      { headers: { 'Authorization': `token ${this.githubToken}` } },
    )
      .then((r) => r.json())

    if (branches.length) {
      return [
        ...branches,
        ...await this.listAllBranches(owner, repo, page + 1),
      ]
    } else {
      return branches
    }
  }


}

