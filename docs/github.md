# E5 - Multibranch, webhook e protecao

O bootstrap cria `carparts` a partir de `scripts/multibranch.xml`. A origem GitHub descobre branches sem PR e PRs do proprio repositorio, testando a revisao de merge dos PRs. Cada item com Jenkinsfile gera um job. PRs de forks foram excluidos desta configuracao.

O workflow `Laboratorio Jenkins` executa o Jenkins em Ubuntu 24.04 em pushes na main e em pull requests. O check se chama **Jenkins CI**. Um check verde indica que os testes e a imagem passaram pelo Jenkins; nao indica um deploy Azure quando DEPLOY_AZURE=false.

A PR #1 foi validada e integrada: o Jenkins descobriu o item PR-1 e concluiu dez builds. No Actions, a indexacao usa o token temporario github.token, guardado em credencial do Jenkins, para evitar o limite de API anonima. Na execucao local sem token, o acesso publico ainda pode sofrer esse limite. O historico e as evidencias estao em entrega.md.

## Webhook persistente

O Jenkins do runner existe apenas enquanto o workflow roda e nao tem URL publica. Para o webhook pedido pelo enunciado, inicie o laboratorio em um host local permanente. Configure proxy HTTPS ou tunel aprovado, mantenha autenticacao e exponha somente o caminho necessario. Nao publique 8080 ou 50000 para qualquer origem.

Em GitHub > Settings > Webhooks > Add webhook:

- Payload URL: `https://SEU-ENDERECO-JENKINS/github-webhook/`.
- Content type: application/json.
- Secret: valor forte gerado localmente e configurado tambem no Jenkins; nunca versionar.
- SSL verification habilitada.
- Eventos: push e pull request.

Em Jenkins, ajuste a URL global para o endereco HTTPS, configure a conexao GitHub e o segredo do webhook. Use credencial com apenas as permissoes de leitura de repositorio e escrita de status necessarias; sem permitir que PRs executem deploy.

Comprove com Recent Deliveries exibindo HTTP 2xx, log de indexacao no Jenkins e build criado apos um push. Uma URL de exemplo ou arquivo de configuracao nao comprova webhook funcionando.

## Protecao da main

Em GitHub > Settings > Branches > Add classic branch protection rule, defina `main`, Require a pull request before merging e Require status checks to pass before merging. Selecione **Jenkins CI** depois de ele aparecer na lista. Exija branch atualizada e bloqueie force push e exclusao. Aplique a regra aos administradores quando o fluxo de trabalho estiver pronto.

A protecao e um estado do GitHub, nao um arquivo do repositorio. Adicionar YAML ou este documento nao a ativa. Junte print da regra salva e de um PR com o check verde.

Referencias: [Webhooks GitHub](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks), [Branches protegidas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
