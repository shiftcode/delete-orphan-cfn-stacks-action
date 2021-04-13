import { StackSummary } from 'aws-sdk/clients/cloudformation'
import { deleteOrphans, DeleteOrphansOptions } from './delete-orphans.function'

const LIST_OF_STACKS = <StackSummary[]>[
  { StackName: 'my-other-stack-master' },
  { StackName: 'my-other-stack-xx2' },
  { StackName: 'my-stack-master' },
  { StackName: 'my-stack-xx1' },
  { StackName: 'my-stack-pr1' },
  { StackName: 'my-stack-xx222' },
  { StackName: 'my-stack-pr222' },
  { StackName: 'my-stack-xx2' },
  { StackName: 'my-stack-pr2' },
]
const LIST_OF_BRANCHES: string[] = ['master', '#01-dev', '#222-basic-auth']

describe('delete-orphans.function', () => {
  let ghMock: {
    listAllBranches: jest.Mock
  }
  let cfnMock: {
    listAllStacks: jest.Mock
    deleteStack: jest.Mock
  }

  beforeEach(() => {
    ghMock = {
      listAllBranches: jest.fn().mockReturnValue(Promise.resolve(LIST_OF_BRANCHES)),
    }
    cfnMock = {
      listAllStacks: jest.fn().mockReturnValue(Promise.resolve(LIST_OF_STACKS)),
      deleteStack: jest.fn().mockReturnValue(Promise.resolve()),
    }
  })

  const opts: DeleteOrphansOptions = {
    repo: 'my-repo',
    owner: 'shiftcode',
    ignoreStacks: [],
    stackNamePrefix: 'my-stack',
  }

  it('should not delete master', async () => {
    const res = await deleteOrphans(<any>ghMock, <any>cfnMock, opts)
    expect(res.includes('my-stack-master')).toBeFalsy()
  })

  it('should only delete orphans', async () => {
    const res = await deleteOrphans(<any>ghMock, <any>cfnMock, opts)
    expect(res).toEqual(['my-stack-xx2', 'my-stack-pr2'])
  })

  it('should call deleteStack accordingly', async () => {
    await deleteOrphans(<any>ghMock, <any>cfnMock, opts)
    expect(cfnMock.deleteStack.mock.calls.length).toBe(2)
    expect(cfnMock.deleteStack.mock.calls[0][0]).toEqual('my-stack-xx2')
    expect(cfnMock.deleteStack.mock.calls[1][0]).toEqual('my-stack-pr2')
  })

  it('ignores stacks when specified', async () => {
    const res = await deleteOrphans(<any>ghMock, <any>cfnMock, { ...opts, ignoreStacks: ['xx2'] })
    expect(res).toEqual(['my-stack-pr2'])
    expect(cfnMock.deleteStack.mock.calls.length).toBe(1)
    expect(cfnMock.deleteStack.mock.calls[0][0]).toEqual('my-stack-pr2')
  })
})
