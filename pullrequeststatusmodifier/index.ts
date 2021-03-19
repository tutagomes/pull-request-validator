import tl = require('azure-pipelines-task-lib/task');
import * as vsts from "azure-devops-node-api";
import { GitPullRequestMergeStrategy, GitStatusState } from "azure-devops-node-api/interfaces/GitInterfaces";

async function run() {
    try {
        // Conectando com Token e recolhendo API
        let token: any = tl.getEndpointAuthorizationParameter("SYSTEMVSSCONNECTION", "AccessToken", false);
        let collectionUrl: string = tl.getEndpointUrl("SYSTEMVSSCONNECTION", false).replace(".vsrm.visualstudio.com", ".visualstudio.com"); // need build
        let authHandler = token.length === 52 ? vsts.getPersonalAccessTokenHandler(token) : vsts.getBearerHandler(token);
        let connection = new vsts.WebApi(collectionUrl, authHandler);
        let gitapi = await connection.getGitApi();

        // Escolhendo o status do PR
        let state = GitStatusState.NotSet;
        switch (tl.getInput('prstatus', true)) {
            case "1":
                state = GitStatusState.Pending
                break;
            case "2":
                state = GitStatusState.Succeeded
                break;
            case "3":
                state = GitStatusState.Failed
                break;
            case "4":
                state = GitStatusState.Error
                break;
        }
        let opts = {
            getDefault: tl.getInput('getDefaults')!
        }
        let isRelease = tl.getVariable('Agent.JobName') === 'Release'
        let config = {
            sourcebranch: isRelease ? tl.getVariable('build.pullrequest.sourceBranch')! : tl.getVariable('System.PullRequest.SourceBranch')!,
            targetbranch: isRelease ? tl.getVariable('Build.PullRequest.TargetBranch')! : tl.getVariable('System.PullRequest.TargetBranch')!,
            repoId: isRelease ? tl.getVariable('build.repository.id')! : tl.getVariable('Build.Repository.ID')!,
            projectId: isRelease ? tl.getVariable('build.projectId')! : tl.getVariable('System.TeamProjectId')!,
            pullRequestId: isRelease ? tl.getVariable('build.pullrequest.id')! : tl.getVariable('System.PullRequest.PullRequestId')!,
            referenceUrl: isRelease ? tl.getVariable('Release.ReleaseWebURL') : tl.getVariable('Build.BuildUri')
        }

        if (opts.getDefault === 'false') {
            config = {
                sourcebranch: tl.getInput('sourcebranch')!,
                targetbranch: tl.getInput('targetbranch')!,
                repoId: tl.getInput('repoId')!,
                projectId: tl.getInput('projectId')!,
                pullRequestId: '-1',
                referenceUrl: isRelease ?  tl.getVariable('Release.ReleaseWebURL') :  tl.getVariable('Build.BuildUri')
            }
        }

        // Montando objeto de criação de status
        let status = {
            "state": state,
            "description": tl.getInput('msgvalidacao', true)!,
            "targetUrl": config.referenceUrl,
            "context": {
                "name": "deploy-checker",
                "genre": "continuous-deploy"
            }
        };
                
        // Preparando para procurar o Pull Request e Recolher o ID
        let searchCriteria = {
            repositoryId: config.repoId,
            sourceRefName: config.sourcebranch,
            targetRefName: config.targetbranch
        }

        let pullRequestId = -1
        console.log(config)
        console.log(opts)
        console.log(searchCriteria)
        // Caso seja um branch já do tipo refs/pull/{pullId}/merge, não é necessário buscar na API
        if (searchCriteria.sourceRefName.includes('pull')) {
            pullRequestId = parseInt(searchCriteria.sourceRefName.split('/')[2])
        }
        // Caso contrário, bora buscar lá na API e pegar o primeiro encontrado com os parâmetros definidos
        else {
            let pullRequestResult = await gitapi.getPullRequests(config.repoId, searchCriteria, config.projectId)
            // Caso encontre
            if (pullRequestResult.length > 0) {
                pullRequestId = pullRequestResult[0].pullRequestId!
            } else {
                // Caso não encontre, já enviar um erro e finalizar a task
                let msg = 'Pull Request from ' + searchCriteria.sourceRefName + ' -->> ' + searchCriteria.targetRefName + ' was not found'
                console.log(msg)
                tl.setResult(tl.TaskResult.Failed, msg);
                return
            }
        }
        // Cria o status no PR
        let response = await gitapi.createPullRequestStatus(status, config.repoId, parseInt(config.pullRequestId), config.projectId);
        console.log(response)
        // Caso o usuário queira habilitar/desabilitar o auto complete do PR
        if (tl.getInput('autocomplete', true) !== "3") {
            let mergeStategy = GitPullRequestMergeStrategy.NoFastForward
            let choosenStrategy = tl.getInput('mergestrategy', true)
            switch (choosenStrategy) {
                case "2":
                    mergeStategy = GitPullRequestMergeStrategy.Squash
                    break;
                case "3":
                    mergeStategy = GitPullRequestMergeStrategy.Rebase
                    break;
                case "4":
                    mergeStategy = GitPullRequestMergeStrategy.RebaseMerge
                    break;
            }
            let body = {
                autoCompleteSetBy: {
                    id: tl.getInput('autocomplete', true) === "1" ? response.createdBy!.id : '00000000-0000-0000-0000-000000000000'
                },
                completionOptions: {
                    deleteSourceBranch: tl.getInput('deletesourcebranch', true) === 'true' ? true : false,
                    mergeStrategy: mergeStategy,
                    transitionWorkItems: tl.getInput('closeworkitens', true) === 'true' ? true : false
                }
            }
            let result = await gitapi.updatePullRequest(body, config.repoId, parseInt(config.pullRequestId), config.projectId)
            console.log(result)
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();


