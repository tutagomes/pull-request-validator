import { GitPullRequestMergeStrategy, GitStatusState } from "azure-devops-node-api/interfaces/GitInterfaces";
import { GitApi } from 'azure-devops-node-api/GitApi';

class PullRequestConfig {

    autoComplete: boolean = false;
    deleteSourceBrach: boolean = false;
    closeWorkItens: boolean = false;
    mergeStrategy: GitPullRequestMergeStrategy = GitPullRequestMergeStrategy.NoFastForward

}

class Config {

    sourceBranch: string = '';
    targetBranch: string = '';
    repoId: string = '';
    projectId: string = '';
    pullRequestId: number = -1;
    referenceUrl: string = '';
    msgValidacao: string = '';
    state: GitStatusState = GitStatusState.NotSet;
    prUpdateConfig: PullRequestConfig = new PullRequestConfig();

}

class PRMStatusodifier {

    gitApi: GitApi;
    config: Config = new Config();
    configurated: boolean = false;
    createdBy: string = '00000000-0000-0000-0000-000000000000'

    constructor (gitAPI: GitApi) {
        this.gitApi = gitAPI
    }

    async loadAndParseSettings (taskLib: any) {
        
        let getDefault = taskLib.getInput('getDefaults')!
        
        let isRelease = taskLib.getVariable('Agent.JobName') === 'Release'
        this.config.msgValidacao = taskLib.getInput('msgvalidacao', true)!
        this.config.referenceUrl = isRelease ? taskLib.getVariable('Release.ReleaseWebURL') : taskLib.getVariable('Build.BuildUri')
        this.config.pullRequestId = isRelease ? taskLib.getVariable('Build.PullRequest.id')! : taskLib.getVariable('System.PullRequest.PullRequestId')!
        this.config.projectId = isRelease ? taskLib.getVariable('Build.projectId')! : taskLib.getVariable('System.TeamProjectId')!
        this.config.repoId = isRelease ? taskLib.getVariable('Build.Repository.id')! : taskLib.getVariable('Build.Repository.ID')!
        this.config.targetBranch = isRelease ? taskLib.getVariable('Build.PullRequest.TargetBranch')! : taskLib.getVariable('System.PullRequest.TargetBranch')!
        this.config.sourceBranch = isRelease ? taskLib.getVariable('Build.PullRequest.SourceBranch')! : taskLib.getVariable('System.PullRequest.SourceBranch')!

        if (getDefault === 'false') {
            this.config.sourceBranch = taskLib.getInput('sourcebranch')!
            this.config.targetBranch = taskLib.getInput('targetbranch')!
            this.config.repoId = taskLib.getInput('repoId')!
            this.config.projectId = taskLib.getInput('projectId')!
            this.config.pullRequestId = -1
        }

         // Preparando para procurar o Pull Request e Recolher o ID
         let searchCriteria = {
            repositoryId: this.config.repoId,
            sourceRefName: this.config.sourceBranch,
            targetRefName: this.config.targetBranch
        }

        // Caso seja um branch já do tipo refs/pull/{pullId}/merge, não é necessário buscar na API
        if (searchCriteria.sourceRefName.includes('pull')) {
            this.config.pullRequestId = parseInt(searchCriteria.sourceRefName.split('/')[2])
        }
        // Caso contrário, bora buscar lá na API e pegar o primeiro encontrado com os parâmetros definidos
        else {
            let pullRequestResult = await this.gitApi.getPullRequests(this.config.repoId, searchCriteria, this.config.projectId)
            // Caso encontre
            if (pullRequestResult.length > 0) {
                this.config.pullRequestId = pullRequestResult[0].pullRequestId!
            } else {
                // Caso não encontre, já enviar um erro e finalizar a task
                let msg = 'Pull Request from ' + searchCriteria.sourceRefName + ' -->> ' + searchCriteria.targetRefName + ' was not found'
                console.log(msg)
                taskLib.setResult(taskLib.TaskResult.Failed, msg);
                return
            }
        }
        // Escolhendo o status do PR
        switch (taskLib.getInput('prstatus', true)) {
            case "1":
                this.config.state = GitStatusState.Pending
                break;
            case "2":
                this.config.state = GitStatusState.Succeeded
                break;
            case "3":
                this.config.state = GitStatusState.Failed
                break;
            case "4":
                this.config.state = GitStatusState.Error
                break;
        }
        // Caso o usuário queira habilitar/desabilitar o auto complete do PR
        if (taskLib.getInput('autocomplete', true) !== "3") {
            this.config.prUpdateConfig.autoComplete = true
            // Configurando opções de PR
            let choosenStrategy = taskLib.getInput('mergestrategy', true)
            switch (choosenStrategy) {
                case "2":
                    this.config.prUpdateConfig.mergeStrategy = GitPullRequestMergeStrategy.Squash
                    break;
                case "3":
                    this.config.prUpdateConfig.mergeStrategy = GitPullRequestMergeStrategy.Rebase
                    break;
                case "4":
                    this.config.prUpdateConfig.mergeStrategy = GitPullRequestMergeStrategy.RebaseMerge
                    break;
            }
            this.config.prUpdateConfig.deleteSourceBrach = taskLib.getInput('deletesourcebranch', true) === 'true' ? true : false
            this.config.prUpdateConfig.closeWorkItens = taskLib.getInput('closeworkitens', true) === 'true' ? true : false
        }
        this.configurated = true
    }

    async createPullRequestStatus () {
        if (!this.configurated) {
            throw new Error("You must configure with loadAndParseSettings before calling this method!")
        }
        // Montando objeto de criação de status
        let status = {
            "state": this.config.state,
            "description": this.config.msgValidacao,
            "targetUrl": this.config.referenceUrl,
            "context": {
                "name": "deploy-checker",
                "genre": "continuous-deploy"
            }
        };

        // Cria o status no PR
        let response = await this.gitApi.createPullRequestStatus(status, this.config.repoId, this.config.pullRequestId, this.config.projectId);
        this.createdBy = response.createdBy!.id ? response.createdBy!.id : this.createdBy
    }

    async updatePullRequest () {
        
        if (!this.configurated) {
            throw new Error("You must configure with loadAndParseSettings before calling this method!")
        }
        if (!this.config.prUpdateConfig.autoComplete) {
            console.log("You asked to not update Pull Request")
            return
        }
        let body = {
            autoCompleteSetBy: {
                id: this.createdBy
            },
            completionOptions: {
                deleteSourceBranch: this.config.prUpdateConfig.deleteSourceBrach,
                mergeStrategy: this.config.prUpdateConfig.mergeStrategy,
                transitionWorkItems: this.config.prUpdateConfig.closeWorkItens
            }
        }
        let result = await this.gitApi.updatePullRequest(body, this.config.repoId, this.config.pullRequestId, this.config.projectId)
        console.log(result)
    }
}

export { PRMStatusodifier }
