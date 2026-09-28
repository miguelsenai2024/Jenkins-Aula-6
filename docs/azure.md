# E4 - Integracao segura com Azure

## Condicoes para executar

Uma assinatura Azure acessivel, Azure CLI autenticada por um administrador e recursos existentes: ACR Basic e dois Container Apps Consumption (`homologacao` e `producao`). Este documento nao comprova que recursos tenham sido criados ou que um deploy Azure tenha ocorrido. A execucao de CI do repositorio dispensa Azure.

Configure cada app com 0,25 vCPU, 0,5 GiB, ingresso HTTPS externo na porta 3000, revisao unica, minimo zero e maximo uma replica. O endpoint `/health` precisa estar acessivel ao agent. Use o mesmo ACR para os dois apps. Em producao real, restrinja acesso de negocio conforme a politica da empresa.

## Identidades e permissoes

Ative a identidade gerenciada de cada Container App e atribua `AcrPull` somente no ACR. Configure o registro nos apps com essa identidade; nao use a senha administrativa do registro. O administrador prepara os recursos e o Jenkins apenas atualiza imagens.

Crie um service principal para CI/CD, sem papel em toda a assinatura. Atribua `AcrPush` somente no ACR e `Contributor` somente em cada um dos dois Container Apps (nao no grupo inteiro). `Contributor` ainda permite outras alteracoes dentro desses apps; uma evolucao e criar um papel customizado apenas com as operacoes usadas pelo deploy.

Se o ACR usar permissoes de repositorio com ABAC, `AcrPush/AcrPull` nao sao os papeis adequados: configure `Container Registry Repository Writer/Reader` com condicoes de repositorio. A proposta deste laboratorio assume modo RBAC Registry Permissions convencional.

No Jenkins: Manage Jenkins > Credentials > System > Global credentials > Add Credentials:

| ID | Tipo | Valor |
|---|---|---|
| azure-sp | Username with password | Usuario: client ID; senha: client secret |
| azure-tenant | Secret text | Tenant ID |
| azure-subscription | Secret text | Subscription ID |

Nao grave valores em Jenkinsfile, YAML, GitHub ou prints. Recorte/oculte campos de senha em evidencias. O pipeline usa `withCredentials`, shell sem tracing e aspas simples para impedir interpolacao Groovy de segredos. A sessao Azure/Docker usa configuracao separada por workspace e faz logout no fim.

## Executar e comprovar

1. No job `carparts/main`, use Build with Parameters e marque `DEPLOY_AZURE=true`, preenchendo os nomes reais de ACR, grupo e apps.
2. Qualidade executa npm ci, lint e quatro testes com JUnit. A imagem inclui commit e versao no endpoint `/health`.
3. O agent faz build uma vez e push no ACR. Guarda o identificador `registro/app@sha256:...`.
4. Azure CLI atualiza homologacao para esse digest. O smoke test aguarda o `/health` retornar **commit e versao esperados**, evitando aprovar a revisao antiga.
5. O stage Aprovacao espera o usuario admin por ate um dia, sem ocupar executor.
6. Producao recebe o mesmo digest; novo smoke test confirma a versao aprovada. `release.json` registra aprovador, horario, commit e lead time.

Evidencias a adicionar: print dos IDs de credenciais (sem valores); log real de publicacao e homologacao; resposta do `/health`; print do input com aprovador; log de producao e `release.json`. Nao alterar o registro para aparentar execucao.

Referencias: [Identidade gerenciada para pull de imagens](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull), [Azure CLI - containerapp update](https://learn.microsoft.com/en-us/cli/azure/containerapp#az-containerapp-update).
