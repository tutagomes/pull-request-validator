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
        let opts = {
            enableComment: tl.getInput('enablecomment', true)!,
            comment: tl.getInput('comment', true)!,
            commentOnce: tl.getInput('commentonce')!,
            justReturn: tl.getInput('justReturn', true)!,
            getDefault: tl.getInput('getDefaults')!
        }
        let config = {
            sourcebranch: tl.getVariable('build.pullrequest.sourceBranch')!,
            targetbranch: tl.getVariable('build.pullrequest.targetBranch')!,
            repoId: tl.getVariable('build.repository.id')!,
            projectId: tl.getVariable('build.projectId')!,
            releaseId: tl.getVariable('Release.ReleaseId')!,
            pullRequestId: tl.getVariable('build.pullrequest.id')!,
            sourceBranchName: tl.getVariable('build.pullrequest.sourceBranchName')!
        }

        if (opts.getDefault === 'false') {
            config = {
                sourcebranch: tl.getInput('sourcebranch')!,
                targetbranch: tl.getInput('targetbranch')!,
                repoId: tl.getInput('repoId')!,
                projectId: tl.getInput('projectId')!,
                releaseId: tl.getInput('projectId')!,
                pullRequestId: '-1',
                sourceBranchName: ''
            }
        }

        let token: any = tl.getEndpointAuthorizationParameter("SYSTEMVSSCONNECTION", "AccessToken", false);
        let collectionUrl: string = tl.getEndpointUrl("SYSTEMVSSCONNECTION", false).replace(".vsrm.visualstudio.com", ".visualstudio.com"); // need build

        let authHandler = token.length === 52 ? vsts.getPersonalAccessTokenHandler(token) : vsts.getBearerHandler(token);
        let connection = new vsts.WebApi(collectionUrl, authHandler);
        let gitapi = await connection.getGitApi();
        const vstsReleaseApi = await connection.getReleaseApi();

        // Preparando para procurar o Pull Request e Recolher o ID
        let searchCriteria = {
            repositoryId: config.repoId!,
            sourceRefName: config.sourcebranch!,
            targetRefName: config.targetbranch!
        }

        // Caso não tenha nada passado
        if (opts.getDefault === 'false') {
            let pullRequestResult = await gitapi.getPullRequests(config.repoId, searchCriteria, config.projectId)
            // Caso encontre
            if (pullRequestResult.length > 0) {
                config.pullRequestId = pullRequestResult[0]!.pullRequestId!.toString()
                config.sourceBranchName = pullRequestResult[0]!.sourceRefName!
             } else {
                // Caso não encontre, já enviar um erro e finalizar a task
                let msg = 'Pull Request from ' + searchCriteria.sourceRefName + ' -->> ' + searchCriteria.targetRefName + ' was not found'
                console.log(msg)
                tl.setResult(tl.TaskResult.Failed, msg);
                return
            }
        }

        // Informações para atualização de Release e possível adição de comentário em pull request
        let newName = tl.getInput('releasename', true)!
        let branchName = config.sourceBranchName
        newName = newName.replace("%sourcebranch%", branchName)

        tl.setVariable('PRSOURCEBRANCH', config.sourcebranch)
        tl.setVariable('PRSOURCEBRANCHNAME', config.sourceBranchName)

        // Caso seja só para recolher as variáveis
        if (opts.justReturn === 'true') {
            return
        }

        // Criando objeto para atualização
        const metaData: ReleaseUpdateMetadata = <ReleaseUpdateMetadata>{ name:  newName };

        // Atualiza nome da release
        try {
            let response = await vstsReleaseApi.updateReleaseResource(metaData, config.projectId, parseInt(config.releaseId));
        } catch (e) {
            console.log(e)
        }
        
        // Caso o usuário queira comentar algo no Pull Request
        if (opts.enableComment === 'true') {
            // Criando thread
            let threadInfo: GitPullRequestCommentThread = {}

            // Montando comentário
            let comment: Comment = {}
            comment.commentType = CommentType.Unknown
            comment.content = (opts.comment).replace("%sourcebranch%", branchName)
            threadInfo.comments = []
            threadInfo.comments.push(comment)
            let alreadyCommented = false
            if (opts.commentOnce === 'true') {
                let threads = await gitapi.getThreads(config.repoId, parseInt(config.pullRequestId), config.projectId)
                for (let th of threads) {
                    for (let cmmt of th.comments!) {
                        if (cmmt.content === comment.content) {
                            alreadyCommented = true
                            break
                        }
                    }
                }
            }
            // Caso não tenha comentado ou não tenha encontrado comentário igual, comente
            if (!alreadyCommented) {
                // Criando comentário
                await gitapi.createThread(threadInfo, config.repoId, parseInt(config.pullRequestId))
            }
        }
    }
    catch (err) {
        console.log(err)
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();


