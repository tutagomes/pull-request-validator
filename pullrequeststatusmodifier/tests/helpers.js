import { when } from 'jest-when'

let defaults = {
    pullRequestId: 1,
    repoId: '1',
    projectId: '1',
    targetBranch: 'refs/pull/1',
    sourceBranch: 'refs/pull/1',
    manualTarget: '',
    manualSource: '',
    msgValidacao: 'Validacao',
    prstatus: "3",
    autocomplete: "3"
}

let taskLibBuild = {
    getInput: jest.fn(),
    getVariable: jest.fn()
} 
when(taskLibBuild.getVariable).calledWith('Agent.JobName').mockReturnValue('Build');
when(taskLibBuild.getVariable).calledWith('Build.BuildUri').mockReturnValue('http://teste.com/build');
when(taskLibBuild.getVariable).calledWith('System.PullRequest.PullRequestId').mockReturnValue(defaults.pullRequestId);
when(taskLibBuild.getVariable).calledWith('System.TeamProjectId').mockReturnValue(defaults.projectId);
when(taskLibBuild.getVariable).calledWith('Build.Repository.ID').mockReturnValue(defaults.repoId);
when(taskLibBuild.getVariable).calledWith('System.PullRequest.TargetBranch').mockReturnValue(defaults.targetBranch);
when(taskLibBuild.getVariable).calledWith('System.PullRequest.SourceBranch').mockReturnValue(defaults.sourceBranch);
when(taskLibBuild.getInput).calledWith('msgvalidacao', true).mockReturnValue(defaults.msgValidacao);
when(taskLibBuild.getInput).calledWith('getDefaults').mockReturnValue('true');
when(taskLibBuild.getInput).calledWith('prstatus', true).mockReturnValue(defaults.prstatus);
when(taskLibBuild.getInput).calledWith('autocomplete', true).mockReturnValue(defaults.autocomplete);

let taskLibRelease = {
    getInput: jest.fn(),
    getVariable: jest.fn()
}

when(taskLibRelease.getVariable).calledWith('Agent.JobName').mockReturnValue('Release');
when(taskLibRelease.getVariable).calledWith('Release.ReleaseWebURL').mockReturnValue('http://teste.com/release');
when(taskLibRelease.getVariable).calledWith('Build.PullRequest.id').mockReturnValue(defaults.pullRequestId);
when(taskLibRelease.getVariable).calledWith('Build.projectId').mockReturnValue(defaults.projectId);
when(taskLibRelease.getVariable).calledWith('Build.Repository.id').mockReturnValue(defaults.repoId);
when(taskLibRelease.getVariable).calledWith('Build.PullRequest.TargetBranch').mockReturnValue(defaults.targetBranch);
when(taskLibRelease.getVariable).calledWith('Build.PullRequest.SourceBranch').mockReturnValue(defaults.sourceBranch);
when(taskLibRelease.getInput).calledWith('msgvalidacao', true).mockReturnValue(defaults.msgValidacao);
when(taskLibRelease.getInput).calledWith('getDefaults').mockReturnValue('true');
when(taskLibRelease.getInput).calledWith('prstatus', true).mockReturnValue(defaults.prstatus);
when(taskLibRelease.getInput).calledWith('prstatus', true).mockReturnValue(defaults.prstatus);
when(taskLibRelease.getInput).calledWith('autocomplete', true).mockReturnValue(defaults.autocomplete);


let taskLibManual =  {
    getInput: jest.fn(),
    getVariable: jest.fn()
}

when(taskLibManual.getVariable).calledWith('Agent.JobName').mockReturnValue('Release');
when(taskLibManual.getInput).calledWith('msgvalidacao').mockReturnValue(defaults.msgValidacao);
when(taskLibManual.getInput).calledWith('getDefaults').mockReturnValue('false');
when(taskLibManual.getInput).calledWith('targetbranch').mockReturnValue(defaults.manualTarget);
when(taskLibManual.getInput).calledWith('sourcebranch').mockReturnValue(defaults.manualSource);
when(taskLibManual.getInput).calledWith('repoId').mockReturnValue(defaults.projectId);
when(taskLibManual.getInput).calledWith('projectId').mockReturnValue(defaults.projectId);
when(taskLibManual.getInput).calledWith('prstatus', true).mockReturnValue(defaults.prstatus);
when(taskLibManual.getInput).calledWith('prstatus', true).mockReturnValue(defaults.prstatus);
when(taskLibManual.getInput).calledWith('autocomplete', true).mockReturnValue(defaults.autocomplete);

export { defaults, taskLibBuild, taskLibRelease, taskLibManual }