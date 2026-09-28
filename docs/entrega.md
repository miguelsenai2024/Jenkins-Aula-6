# Balanco dos entregaveis - Aula 6

## Concluido e comprovado

- E1: diagrama de controller, agents, portas e Azure, com justificativa de Jenkins local e descricao da extensao Windows.
- E2: controller Docker com plugins.txt e JCasC, inicializado de verdade em Ubuntu 24.04. Prova: numExecutors=0, autenticacao habilitada e resposta HTTP 403 para acesso anonimo. Agent Linux separado, com um executor.
- E3 (CI): Jenkinsfile validado pelo proprio Jenkins; dez builds passaram em qualidade, quatro testes JUnit, build Docker e smoke test do artefato. Capturas reais em evidencias/jenkins/stage-view.png e controller-agents.png. Etapas Azure ficaram desabilitadas, sem simular deploy.
- E5 (Multibranch e PR): job carparts criado e branch main executada; PR #1 descoberta como PR-1, dez builds aprovados e check Jenkins CI verde. PR integrada apos a validacao.
- E6 (CI e custos): dez registros brutos, CSV e relatorio de duracao/falhas de CI; estimativa Azure de US$ 73,48 a US$ 78,88/mes, com premissas e fonte oficial de precos.

## Pendencias que exigem acesso externo

- E3/E4: conta Azure, ACR e Container Apps reais; credenciais no Jenkins; execucao completa com publicacao, homologacao, smoke test, aprovacao registrada e producao. O codigo esta implementado, mas esses eventos ainda nao ocorreram.
- E5: endpoint Jenkins HTTPS permanente, webhook push/PR com entrega HTTP 2xx e regra de protecao da main. O acesso as configuracoes pelo navegador foi recusado pelo controle de permissoes; nenhuma regra foi apresentada como aplicada.
- E6: lead time ate producao, frequencia de implantacao, falhas de mudanca e recuperacao. Sem entrega de producao, sao nao medidos. A meta de 2 dias e um objetivo, nao um resultado comprovado.

## Proveniencia

Execucao main: [36462516876](https://github.com/miguelsenai2024/Jenkins-Aula-6/actions/runs/36462516876), source do workflow c6fc646d92df81f8a167586cdc4963b1c9ec2966. Os logs de build identificam o commit exato da API que o Jenkins construiu.

Execucao PR: [36462529337](https://github.com/miguelsenai2024/Jenkins-Aula-6/actions/runs/36462529337), head 403a07fe0a6bc28a8bf4b4a3d66b8cac5cda66e2. Dez builds, zero falhas de CI, media de 12,74 segundos. Capturas e registros brutos no artefato [evidencias-jenkins](https://github.com/miguelsenai2024/Jenkins-Aula-6/actions/runs/36462529337/artifacts/10987884722). Historico de revisao: [PR #1](https://github.com/miguelsenai2024/Jenkins-Aula-6/pull/1).

As capturas mostram stages Azure ignorados, e nao verdes ficticios. Nenhum segredo e necessario para consultar esses registros.
