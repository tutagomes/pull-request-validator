## Introdução

Uma simples extensão para adicionar aprovações de forma programática ao Pull Request.

Ao executar em uma pipeline de build/release, é possível adicionar um Status de Sucesso ou Erro/Pendência/Falha, representando estados de aprovação de um fluxo DevOps.



### Exemplo de Fluxo

![diagram](diagram.png)







### Realizando a build


```
npm i -g tfx-cli
cd pullrequeststatusmodifier
npm install
tsc
cd ..
tfx extension create --manifest-globs vss-extension.json

```





### TODO:

- Criar documentação de como utilizar
  - ~~Fluxo de Desenvolvimento em diagrama~~
  - Opções da Task
  - Motivo de criação
- Explicitar permissões necessárias
  - Visualizar problemas comuns
    - https://github.com/MicrosoftDocs/azure-devops-docs/issues/5159
    - https://github.com/microsoft/azure-devops-node-api/issues/300
    - https://github.com/shayki5/azure-devops-create-pr-task/issues/35
- Criar Testes
  - Testes de fluxo de funcionamento