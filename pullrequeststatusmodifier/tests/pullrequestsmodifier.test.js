
import { PRMStatusodifier } from '../pullrequestmodifier'
import { taskLibRelease, defaults, taskLibManual, taskLibManualWithUpdate } from './helpers'
import { when } from 'jest-when'

describe('Initial Tests', () => {
    test('Ensure can instantiate', () => {
        let pr = new PRMStatusodifier()
        expect(pr).not.toBe(null);
    });

    test('Ensure can receive GitApi', () => {
        let gitApi = {}
        let pr = new PRMStatusodifier(gitApi)
        expect(pr.gitApi).toBe(gitApi);
    });

    test('Ensure will throw error if not confiured', async () => {
        let pr = new PRMStatusodifier()
        await expect(pr.createPullRequestStatus())
        .rejects
        .toThrow('You must configure with loadAndParseSettings before calling this method!');

        await expect(pr.updatePullRequest())
        .rejects
        .toThrow('You must configure with loadAndParseSettings before calling this method!');
    });
})

describe('Release Config Tests', () => {
    test('Ensure on Release will load configuration', async () => {
        let pr = new PRMStatusodifier({})
        await pr.loadAndParseSettings(taskLibRelease)
        
        expect(taskLibRelease.getVariable).toHaveBeenCalled()
        expect(taskLibRelease.getInput).toHaveBeenCalled()

        expect(taskLibRelease.getInput).toHaveBeenCalledWith('msgvalidacao', true)
        expect(taskLibRelease.getVariable).toHaveBeenCalledWith('Build.PullRequest.TargetBranch')
        expect(taskLibRelease.getVariable).not.toHaveBeenCalledWith('System.PullRequest.TargetBranch')

        expect(pr.config.sourceBranch).toBe(defaults.sourceBranch)
        expect(pr.config.targetBranch).toBe(defaults.targetBranch)
        expect(pr.config.repoId).toBe(defaults.repoId)
        expect(pr.config.projectId).toBe(defaults.projectId)
        expect(pr.config.pullRequestId).toBe(defaults.pullRequestId)
        expect(pr.config.referenceUrl).toBe('http://teste.com/release')
        expect(pr.config.msgValidacao).toBe(defaults.msgValidacao)
    })
    test('Ensure will try to update status and update CreatedBy', async () => {
        const gitApi = {
            createPullRequestStatus: jest.fn()
        }
        gitApi.createPullRequestStatus.mockReturnValue({
            createdBy: {
                id: '30'
            }
        })

        let pr = new PRMStatusodifier(gitApi)
        await pr.loadAndParseSettings(taskLibRelease)
        await pr.createPullRequestStatus()
        expect(gitApi.createPullRequestStatus).toHaveBeenCalled()
        expect(pr.createdBy).toBe('30')                
    })
    test('Ensure will try to update status and not update CreatedBy', async () => {
        const gitApi = {
            createPullRequestStatus: jest.fn(),
            updatePullRequest: jest.fn()
        }
        gitApi.createPullRequestStatus.mockReturnValue({
            createdBy: {
                id: false
            }
        })
        let pr = new PRMStatusodifier(gitApi)
        await pr.loadAndParseSettings(taskLibRelease)
        await pr.createPullRequestStatus()
        await pr.updatePullRequest()
        expect(gitApi.createPullRequestStatus).toHaveBeenCalled()
        expect(pr.createdBy).not.toBe(false)                
        expect(gitApi.updatePullRequest).not.toHaveBeenCalled()
    })
    test('Ensure will try to update status and not update CreatedBy', async () => {
        const gitApi = {
            createPullRequestStatus: jest.fn(),
            updatePullRequest: jest.fn()
        }
        gitApi.createPullRequestStatus.mockReturnValue({
            createdBy: {
                id: false
            }
        })
        let pr = new PRMStatusodifier(gitApi)
        await pr.loadAndParseSettings(taskLibRelease)
        await pr.createPullRequestStatus()
        await pr.updatePullRequest()
        expect(gitApi.createPullRequestStatus).toHaveBeenCalled()
        expect(pr.createdBy).not.toBe(false)                
        expect(gitApi.updatePullRequest).not.toHaveBeenCalled()
    })
})

describe('Build Config Tests', () => {
    test('Ensure will try to update status', async () => {
        const gitApi = {
            createPullRequestStatus: jest.fn(),
            updatePullRequest: jest.fn(),
            getPullRequests: jest.fn()
        }
        gitApi.createPullRequestStatus.mockReturnValue({
            createdBy: {
                id: false
            }
        })
        gitApi.getPullRequests.mockReturnValue([
            {
                pullRequestId: 5
            }
        ])
        let pr = new PRMStatusodifier(gitApi)
        await pr.loadAndParseSettings(taskLibManual)
        await pr.createPullRequestStatus()
        await pr.updatePullRequest()
        expect(gitApi.createPullRequestStatus).toHaveBeenCalled()
        expect(pr.createdBy).not.toBe(false)                
        expect(gitApi.updatePullRequest).not.toHaveBeenCalled()
        expect(pr.config.pullRequestId).toBe(5)
    })
    test('Ensure will try to update status and autocomplete', async () => {
        const gitApi = {
            createPullRequestStatus: jest.fn(),
            updatePullRequest: jest.fn(),
            getPullRequests: jest.fn()
        }
        gitApi.createPullRequestStatus.mockReturnValue({
            createdBy: {
                id: false
            }
        })
        gitApi.getPullRequests.mockReturnValue([
            {
                pullRequestId: 5
            }
        ])
        let pr = new PRMStatusodifier(gitApi)
        await pr.loadAndParseSettings(taskLibManualWithUpdate)
        await pr.createPullRequestStatus()
        await pr.updatePullRequest()
        expect(gitApi.createPullRequestStatus).toHaveBeenCalled()
        expect(pr.createdBy).not.toBe(false)                
        expect(gitApi.updatePullRequest).toHaveBeenCalled()
        expect(pr.config.pullRequestId).toBe(5)
    })
})

