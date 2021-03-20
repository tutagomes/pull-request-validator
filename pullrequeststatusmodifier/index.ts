import tl = require('azure-pipelines-task-lib/task');
import * as vsts from "azure-devops-node-api";
import { PRMStatusodifier } from './pullrequestmodifier'

async function run() {
    try {
        // Conectando com Token e recolhendo API
        let token: any = tl.getEndpointAuthorizationParameter("SYSTEMVSSCONNECTION", "AccessToken", false);
        let collectionUrl: string = tl.getEndpointUrl("SYSTEMVSSCONNECTION", false).replace(".vsrm.visualstudio.com", ".visualstudio.com"); // need build
        let authHandler = token.length === 52 ? vsts.getPersonalAccessTokenHandler(token) : vsts.getBearerHandler(token);
        let connection = new vsts.WebApi(collectionUrl, authHandler);
        let gitapi = await connection.getGitApi();

        let prStatusModififer = new PRMStatusodifier(gitapi)
        await prStatusModififer.loadAndParseSettings(tl)
        await prStatusModififer.createPullRequestStatus()
        await prStatusModififer.updatePullRequest()
        
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();


