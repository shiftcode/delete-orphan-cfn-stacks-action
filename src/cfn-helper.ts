import { default as CloudFormation, StackStatus, StackSummary } from 'aws-sdk/clients/cloudformation'

export class CfnHelper {
  static COMPLETED_STATI: StackStatus[] = ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'ROLLBACK_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE', 'IMPORT_COMPLETE']
  private readonly cfn: CloudFormation

  constructor(cfn?: CloudFormation) {
    this.cfn = cfn || new CloudFormation()
  }

  async listAllStacks(statusFilter: StackStatus[] = CfnHelper.COMPLETED_STATI, nextToken: string | undefined = undefined): Promise<StackSummary[]> {
    const resp = await this.cfn.listStacks({ NextToken: nextToken, StackStatusFilter: statusFilter }).promise()

    if (resp.NextToken) {
      return [
        ...resp.StackSummaries,
        ...await this.listAllStacks(statusFilter, resp.NextToken),
      ]
    } else {
      return resp.StackSummaries
    }

  }

  deleteStack(stackName: string) {
    return this.cfn.deleteStack({ StackName: stackName }).promise()
  }

}
