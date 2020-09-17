import tl = require('azure-pipelines-task-lib/task');
import * as vsts from "azure-devops-node-api";
import { GitStatusState } from "azure-devops-node-api/interfaces/GitInterfaces";

async function run() {
    try {
        let token: any = tl.getEndpointAuthorizationParameter("SYSTEMVSSCONNECTION", "AccessToken", false);
        let collectionUrl: string = tl.getEndpointUrl("SYSTEMVSSCONNECTION", false).replace(".vsrm.visualstudio.com", ".visualstudio.com"); // need build
        console.log(collectionUrl)
        let authHandler = token.length === 52 ? vsts.getPersonalAccessTokenHandler(token) : vsts.getBearerHandler(token);
        let connection = new vsts.WebApi(collectionUrl, authHandler);
        let gitapi = await connection.getGitApi();

        let state = GitStatusState.NotSet;
        if (tl.getInput('prstatus', true) === "1") {
            state = GitStatusState.Pending
        }
        else if (tl.getInput('prstatus', true) === "2") {
            state = GitStatusState.Succeeded
        }
        else if (tl.getInput('prstatus', true) === "3") {
            state = GitStatusState.Failed
        }
        else if (tl.getInput('prstatus', true) === "4") {
            state = GitStatusState.Error
        }
        
        let status = {
            "state": state,
            "description": tl.getInput('msgvalidacao', true)!,
            "targetUrl": "https://visualstudio.microsoft.com",
            "context": {
                "name": "deploy-checker",
                "genre": "continuous-deploy"
            }
        };
        let repositoryId = ''
        if (tl.getInput('repoId', true)) {
            repositoryId = tl.getInput('repoId', true)!
        }

        console.log(status)
        console.log(repositoryId)
        let searchCriteria = {
            repositoryId: repositoryId,
            sourceRefName: tl.getInput('sourcebranch', true)!,
            targetRefName: tl.getInput('targetbranch', true)!
        }
        let pullRequestId = -1
        console.log(searchCriteria)
        // Caso seja um branch já do tipo refs/pull/{pullId}/merge
        if (searchCriteria.sourceRefName.includes('pull')) {
            pullRequestId = parseInt(searchCriteria.sourceRefName.split('/')[2])
        } else {
            // Caso contrário, bora buscar lá na API e pegar o primeiro com os parâmetros definidos
            let pullRequestResult = await gitapi.getPullRequests(repositoryId, searchCriteria)
            console.log(pullRequestResult)
            if (pullRequestResult.length > 0) {
                pullRequestId = pullRequestResult[0].pullRequestId!
            } else {
                console.log('Pull Request from ' + searchCriteria.sourceRefName + ' -->> ' + searchCriteria.targetRefName + ' was not found')
            }
        }
        let response = await gitapi.createPullRequestStatus(status, repositoryId, pullRequestId, tl.getInput('projectId', true));
        console.log(response)
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();