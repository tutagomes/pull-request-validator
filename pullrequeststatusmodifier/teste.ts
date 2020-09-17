const vsts = require("azure-devops-node-api")

async function connect() {
    const collectionURL = 'https://dev.azure.com/tutagomes'
    const token = 'tiadivsjkxzxjmuezjvoezrdnypo4iudtqt7d4prf22xnnpru3kq'
    
    var authHandler = vsts.getPersonalAccessTokenHandler(token)
    var connection = new vsts.WebApi(collectionURL, authHandler)
    
    var vstsGit = await connection.getGitApi()
    
    let status = {
        "state": 1,
        "description": "Teste",
        "targetUrl": "https://visualstudio.microsoft.com",
        "context": {
            "name": "deploy-checker",
            "genre": "continuous-deploy"
        }
    };
    await vstsGit.createPullRequestStatus(status, '49776c42-5b63-462c-acab-a5faddb18017', 8, 'Teste')
}

connect()
