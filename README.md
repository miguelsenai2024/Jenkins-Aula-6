# Aula 6 - Jenkins CI/CD - Carparts

Implementacao da atividade SAP1-DEVOPS: controller Jenkins em Docker, configuracao JCasC, agent Linux separado, API Node.js, pipeline declarativo, Multibranch e coleta de evidencias.

## Entregaveis

| Item | Arquivos / evidencias | Situacao |
|---|---|---|
| E1 - Arquitetura | [Diagrama](docs/arquitetura.svg), [justificativa](docs/arquitetura.md) | Projeto documentado |
| E2 - Controller | Dockerfile, plugins.txt, casc.yaml, compose.yaml | Executado pelo workflow; conferir logs e evidencias |
| E3 - Pipeline | Jenkinsfile, API, testes JUnit, smoke test da imagem | CI executada; CD depende da Azure |
| E4 - Azure | [Configuracao](docs/azure.md), pipeline com Azure CLI | Requer conta, recursos e credenciais do responsavel |
| E5 - Multibranch/webhook | scripts/multibranch.xml, [instrucoes](docs/github.md) | Multibranch reproduzivel; webhook publico e protecao precisam ser configurados |
| E6 - Metricas/custos | scripts/metrics.mjs, [custos](docs/custos.md), [plano](docs/metricas.md) | Dez execucoes de CI; DORA de producao depende de entregas reais |

**Nao declarar a atividade integralmente concluida antes de executar a parte Azure e juntar suas evidencias.** Um build verde com DEPLOY_AZURE=false comprova CI, nao deploy em homologacao/producao.

## Executar o laboratorio

Requisitos: Docker com containers Linux, plugin Docker Compose, Node.js 22+ e acesso a internet. Windows: Docker Desktop com WSL 2; Linux: Docker Engine. O GitHub Actions ja fornece um host Ubuntu 24.04 para validar a implementacao.

```sh
node scripts/lab.mjs start
node scripts/lab.mjs collect
node scripts/metrics.mjs
```

Acesse http://localhost:8080/ com usuario `admin`. A senha gerada fica em `.runtime/controller.env`; nao publique esse arquivo. O bootstrap registra o agent e cria o job Multibranch `carparts`, indexando branches e PRs de origem. Nenhum build roda no controller.

O comando `collect` executa dez builds de CI e grava logs, status, testes, CSV e provas de seguranca. Para gerar capturas reais da interface:

```sh
npm ci
npx playwright install chromium
node scripts/capture.mjs
```

Encerrar sem apagar dados: `node scripts/lab.mjs stop`.

## Publicacao na Azure

Siga [docs/azure.md](docs/azure.md), cadastre as credenciais no Jenkins e execute `carparts/main` com `DEPLOY_AZURE=true` e os nomes reais de recursos. Homologacao deve passar no `/health` com o commit e a versao esperados. A producao aguarda aprovacao do usuario `admin` sem reservar executor; depois recebe o **mesmo digest** da imagem. O registro `release.json` inclui commit, imagem, aprovador, horario e lead time.

## Evidencias

O workflow [Laboratorio Jenkins](https://github.com/miguelsenai2024/Jenkins-Aula-6/actions) roda Jenkins de verdade dentro do runner e publica o artefato `evidencias-jenkins`. GitHub Actions fornece o host; o trabalho de build e teste e executado pelo Jenkins em seu agent. Logs, capturas e resultados sao gerados a partir das execucoes, sem simulacao de deploy Azure.

As execucoes de CI podem validar dez vezes o mesmo commit; isso mede repetibilidade e duracao da esteira, nao dez mudancas distintas entregues em producao.
