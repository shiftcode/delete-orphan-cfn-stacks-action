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
  private static branchesEndpoint = (fullRepoName: string, page = 1, perPage = 100) => `https://api.github.com/repos/${fullRepoName}/branches?page=${page}&per_page=${perPage}`

  constructor(private readonly githubToken: string) {}

  /**
   * list all branches (with multiple requests if necessary)
   * @param fullRepoName consists of the owner and the repo name divided by a slash like 'shiftcode/the-repo'
   * @param page which page to fetch
   * @param perPage how many items to fetch per request
   */
  async listAllBranches(fullRepoName: string, page = 1, perPage = 100): Promise<BranchesResponse> {
    const branches = await fetch(
      GithubHelper.branchesEndpoint(fullRepoName, page, perPage),
      { headers: { 'Authorization': `token ${this.githubToken}` } },
    )
      .then((r) => r.json())

    if (branches.length) {
      return [
        ...branches,
        ...await this.listAllBranches(fullRepoName, page + 1, perPage),
      ]
    } else {
      return branches
    }
  }


}

