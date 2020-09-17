Uma simples extensão para adicionar aprovações de forma programática ao Pull Request.

Ao executar em uma pipeline de build/release, é possível adicionar um Status de Sucesso ou Erro/Pendência/Falha, representando estados de aprovação de um fluxo DevOps.


```
npm i -g tfx-cli
cd pullrequeststatusmodifier
npm install
tsc
cd ..
tfx extension create --manifest-globs vss-extension.json

```

TODO:
- Criar documentação de como utilizar
- Explicitar permissões necessárias
- Subir fluxo de DevOps exemplo
- Criar Testes