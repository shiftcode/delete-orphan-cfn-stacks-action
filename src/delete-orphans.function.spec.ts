import { jest } from '@jest/globals'
import { deleteOrphans, DeleteOrphansOptions } from './delete-orphans.function.js'
import { StackSummary } from '@aws-sdk/client-cloudformation'
import { CfnHelper } from './cfn-helper.js'
import { GithubHelper } from './github-helper.js'

describe('delete-orphans.function', () => {
  describe('with master', () => {
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
      { StackName: 'my-stack-nonProd' },
      { StackName: 'my-stack-prod' },
      { StackName: 'my-stack-xx789' },
    ]
    const LIST_OF_BRANCHES: string[] = ['master', '#01-dev', '#222-basic-auth', 'copilot/fix-789']

    let ghMock: Record<keyof GithubHelper, jest.Mock>
    let cfnMock: Record<keyof CfnHelper, jest.Mock>

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

    test('should not delete master', async () => {
      const res = await deleteOrphans(<any>ghMock, <any>cfnMock, opts)
      expect(res.includes('my-stack-master')).toBeFalsy()
    })

    test('should only delete orphans', async () => {
      const res = await deleteOrphans(<any>ghMock, <any>cfnMock, opts)
      expect(res).toEqual(['my-stack-xx2', 'my-stack-pr2'])
    })

    test('should call deleteStack accordingly', async () => {
      await deleteOrphans(<any>ghMock, <any>cfnMock, opts)
      expect(cfnMock.deleteStack.mock.calls.length).toBe(2)
      expect(cfnMock.deleteStack.mock.calls[0][0]).toEqual('my-stack-xx2')
      expect(cfnMock.deleteStack.mock.calls[1][0]).toEqual('my-stack-pr2')
    })

    test('ignores stacks when specified', async () => {
      const res = await deleteOrphans(<any>ghMock, <any>cfnMock, { ...opts, ignoreStacks: ['xx2'] })
      expect(res).toEqual(['my-stack-pr2'])
      expect(cfnMock.deleteStack.mock.calls.length).toBe(1)
      expect(cfnMock.deleteStack.mock.calls[0][0]).toEqual('my-stack-pr2')
    })
    test('supports dry mode', async () => {
      const res = await deleteOrphans(<any>ghMock, <any>cfnMock, { ...opts, dry: true })
      expect(res).toEqual(['my-stack-xx2', 'my-stack-pr2'])
      expect(cfnMock.deleteStack.mock.calls.length).toBe(0)
    })
  })

  describe('with main', () => {
    const LIST_OF_STACKS = <StackSummary[]>[
      { StackName: 'my-other-stack-main' },
      { StackName: 'my-other-stack-xx2' },
      { StackName: 'my-stack-main' },
      { StackName: 'my-stack-xx1' },
      { StackName: 'my-stack-pr1' },
      { StackName: 'my-stack-xx222' },
      { StackName: 'my-stack-pr222' },
      { StackName: 'my-stack-xx2' },
      { StackName: 'my-stack-pr2' },
      { StackName: 'my-stack-nonProd' },
      { StackName: 'my-stack-prod' },
    ]
    const LIST_OF_BRANCHES: string[] = ['main', '#01-dev', '#222-basic-auth']

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

    test('should not delete main, prod, nonProd branches', async () => {
      const res = await deleteOrphans(<any>ghMock, <any>cfnMock, opts)
      expect(res.includes('my-stack-main')).toBeFalsy()
    })
  })
})
