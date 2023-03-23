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
    return req.json().then((branches: BranchesResponse) => branches.map((b) => b.name))
  }
}
