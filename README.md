# Delete orphan CloudFormation stacks action
![version](https://img.shields.io/github/last-commit/shiftcode/delete-orphan-cfn-stacks-action)
![version](https://img.shields.io/github/tag/shiftcode/delete-orphan-cfn-stacks-action?label=version)


This action deletes all cloudformation xx/pr stacks in the provided region with the given name prefix when there's no corresponding branch.\
The stage is transformed from the branch name (eg. `#85-my-feature` > `xx85` / `pr85`).\
`master` stack is always ignored.

Make sure your CloudFormation Stacks are fully deletable (if autoDeleteBuckets=true also autoDeleteItems, etc.)

## Usage
### Inputs

#### `githubToken`
**Required** `string` The github access token with scope `repo`

#### `stackNamePrefix`
**Required** `string` The prefix of the stack names to delete.

#### `ignoreStacks`
**Optional** `JSON String Array` of stack identifiers to ignore. `master` stack is always ignored.


### Example workflow step config
```
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v1
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    role-to-assume: 'arn:aws:iam::{ACCOUNT_ID}:role/{ROLE_NAME}'
    aws-region: eu-central-1
- name: Delete Orphan Stacks
  uses: shiftcode/delete-orphan-cfn-stacks-action@v0.0.X
  with:
    githubToken: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    stackNamePrefix: 'ch-website'
    ignoreStacks: '["xx1"]'
```
###Hints
- if there are stacks in multiple regions: use both actions two times with their corresponding region.
- if working with `assumedRoles` and [`aws-actions/configure-aws-credentials@v1`](https://github.com/aws-actions/configure-aws-credentials) the policy statement for the static iam user needs to have the actions `"sts:AssumeRole` AND `sts:TagSession` allowed on the role to assume. The Trust relationship of the assumed role needs to allow those actions for the assuming user. 

## Development
### testing
To test the action locally: call `index.js` with the env vars for the action inputs and repo name:\
 `GITHUB_REPOSITORY="shiftcode/my-repo" INPUT_STACKNAMEPREFIX="ch-website" INPUT_GITHUBTOKEN="ghp_xxx"" INPUT_IGNORESTACKS="[]" node ./dist/index.js`
### new version
1) implement your changes
2) commit with `npx commit`
3) set tag `git tag -a -m "my fancy release" v0.0.X`
4) push with tags `git push --follow-tags`
