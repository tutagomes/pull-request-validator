import tl = require('azure-pipelines-task-lib/task');
import * as vsts from "azure-devops-node-api";
import { GitPullRequestCommentThread, Comment, CommentType } from "azure-devops-node-api/interfaces/GitInterfaces";
import { ReleaseUpdateMetadata } from "azure-devops-node-api/interfaces/ReleaseInterfaces";

async function run() {
    try {
        // Conectando com Token e recolhendo API
        const hostType: string = tl.getVariable("System.HostType")!;

        if (hostType === 'build') {
            let msg = 'Cannot be run within build definition!'
            console.log(msg)
            tl.setResult(tl.TaskResult.Failed, msg);
            return
        }
        let token: any = tl.getEndpointAuthorizationParameter("SYSTEMVSSCONNECTION", "AccessToken", false);
        let collectionUrl: string = tl.getEndpointUrl("SYSTEMVSSCONNECTION", false).replace(".vsrm.visualstudio.com", ".visualstudio.com"); // need build

        let authHandler = token.length === 52 ? vsts.getPersonalAccessTokenHandler(token) : vsts.getBearerHandler(token);
        let connection = new vsts.WebApi(collectionUrl, authHandler);
        let gitapi = await connection.getGitApi();
        const vstsReleaseApi = await connection.getReleaseApi();


        let repositoryId = tl.getInput('repoId', true)!

        // Preparando para procurar o Pull Request e Recolher o ID
        let searchCriteria = {
            repositoryId: repositoryId,
            sourceRefName: tl.getInput('sourcebranch', true)!,
            targetRefName: tl.getInput('targetbranch', true)!
        }

        let pullRequestId = -1
        let pullRequest

        // Caso seja um branch já do tipo refs/pull/{pullId}/merge, não é necessário buscar na API
        if (searchCriteria.sourceRefName.includes('pull')) {
            pullRequestId = parseInt(searchCriteria.sourceRefName.split('/')[2])
            pullRequest = await gitapi.getPullRequest(repositoryId, pullRequestId, tl.getInput('projectId', true))
        }
        // Caso contrário, bora buscar lá na API e pegar o primeiro encontrado com os parâmetros definidos
        else {
            let pullRequestResult = await gitapi.getPullRequests(repositoryId, searchCriteria, tl.getInput('projectId', true))
            // Caso encontre
            if (pullRequestResult.length > 0) {
                pullRequestId = pullRequestResult[0].pullRequestId!
                pullRequest = pullRequestResult[0]!
            } else {
                // Caso não encontre, já enviar um erro e finalizar a task
                let msg = 'Pull Request from ' + searchCriteria.sourceRefName + ' -->> ' + searchCriteria.targetRefName + ' was not found'
                console.log(msg)
                tl.setResult(tl.TaskResult.Failed, msg);
                return
            }
        }

        // Informações para atualização de Release e possível adição de comentário em pull request
        const releaseId = tl.getVariable("Release.ReleaseId")!;
        let newName = tl.getInput('releasename', true)!
        let branchName = pullRequest ? (pullRequest.sourceRefName || '').split('heads/')[1] : ''
        newName = newName.replace("%sourcebranch%", branchName)
        console.log("Pull Request")
        console.log(pullRequest)
        console.log("Novo Nome")
        console.log(newName)
        console.log("SourceBranch")
        console.log(branchName)
        console.log("Source Ref Name")
        console.log(pullRequest.sourceRefName)
        // Criando objeto para atualização
        const metaData: ReleaseUpdateMetadata = <ReleaseUpdateMetadata>{ name:  newName};
        // Atualiza nome da release
        await vstsReleaseApi.updateReleaseResource(metaData, tl.getInput('projectId', true)!, parseInt(releaseId));

        // Caso o usuário queira comentar algo no Pull Request
        if (tl.getInput('enablecomment', true)) {
            // Criando thread
            let threadInfo: GitPullRequestCommentThread = {}
            // Montando comentário
            let comment: Comment = {}
            comment.commentType = CommentType.System
            comment.content = (tl.getInput('comment', true)!).replace("%sourcebranch%", branchName)
            threadInfo.comments = []
            threadInfo.comments.push(comment)

            // Criando comentário
            await gitapi.createThread(threadInfo, repositoryId, pullRequestId)
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();


