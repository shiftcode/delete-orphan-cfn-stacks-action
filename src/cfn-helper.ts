import { CloudFormation, StackStatus, StackSummary, DeleteStackCommandOutput } from '@aws-sdk/client-cloudformation'

export class CfnHelper {
  static COMPLETED_STATI: StackStatus[] = [
    StackStatus.CREATE_COMPLETE,
    StackStatus.UPDATE_COMPLETE,
    StackStatus.ROLLBACK_COMPLETE,
    StackStatus.UPDATE_ROLLBACK_COMPLETE,
    StackStatus.IMPORT_COMPLETE,
  ]
  private readonly cfn: CloudFormation

  constructor(cfn?: CloudFormation) {
    this.cfn = cfn || new CloudFormation({})
  }

  async listAllStacks(
    statusFilter: StackStatus[] = CfnHelper.COMPLETED_STATI,
    nextToken: string | undefined = undefined,
  ): Promise<StackSummary[]> {
    const resp = await this.cfn.listStacks({ NextToken: nextToken, StackStatusFilter: statusFilter })

    if (resp.NextToken) {
      return [...resp.StackSummaries, ...(await this.listAllStacks(statusFilter, resp.NextToken))]
    } else {
      return resp.StackSummaries
    }
  }

  deleteStack(stackName: string): Promise<DeleteStackCommandOutput> {
    return this.cfn.deleteStack({ StackName: stackName })
  }
}
