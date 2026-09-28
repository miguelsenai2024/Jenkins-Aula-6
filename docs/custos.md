# E6 - Estimativa de custo mensal Azure

**Projecao, nao fatura nem recursos provisionados.** Regiao East US, USD, 30 dias, precos consultados em 28/09/2026 na API oficial Azure Retail Prices. Dados brutos e URLs de consulta: [precos-azure.json](precos-azure.json).

Premissas: controller e agents locais; ACR Basic com ate 10 GB de imagens; dois Container Apps Consumption, cada um com 0,25 vCPU e 0,5 GiB, maximo uma replica, revisao unica. Para ser conservador, calcular ambos ativos durante 24h/dia, mesmo configurados para escala a zero. Ate 1 milhao de requisicoes mensais. Sem VM, AKS, GPU, ambiente Dedicated, private endpoint ou manutencao planejada paga.

| Componente | Calculo | USD/mes |
|---|---|---:|
| ACR Basic | 30 dias x 0,1666/dia | 5,00 |
| vCPU dos dois apps | (2 x 0,25 x 2.592.000 - 180.000) x 0,000024 | 26,78 |
| Memoria dos dois apps | (2 x 0,5 x 2.592.000 - 360.000) x 0,000003 | 6,70 |
| Requisicoes | 1 milhao, abaixo da franquia de 2 milhoes | 0,00 |
| Reserva para trafego | Verba prevista; nao e cotacao por GB | 5,00 |
| Reserva para observabilidade | Verba prevista; limitar ingestao de logs | 10,00 |
| Contingencia | Verba prevista | 20,00 |
| **Total planejado** | | **73,48** |

As franquias sao por assinatura, compartilhadas com outros apps. Se ja estiverem consumidas, CPU+memoria passam de US$ 33,48 para US$ 38,88, levando o total planejado a **US$ 78,88**. Continua abaixo dos US$ 150, sob as mesmas premissas. Reservas nao substituem a estimativa real de trafego e ingestao.

Nao habilitar recursos pagos extras sem recalcular: private endpoint ou manutencao planejada podem introduzir taxa de gerenciamento mesmo em Consumption. Recursos de rede, excesso de armazenamento, replicas simultaneas durante rollout, impostos e variacao de cambio podem acrescentar custos. O calculo nao garante um teto de cobranca.

Na [calculadora Azure](https://azure.microsoft.com/en-us/pricing/calculator/), reproduzir East US + ACR Basic + Container Apps Consumption com essas quantidades, salvar a estimativa e anexar o print. Este relatorio usa a API de precos; nao apresenta um print ficticio da calculadora. Criar alerta de orcamento em US$ 100 e US$ 130; alerta nao bloqueia despesas. Rever uso semanalmente e configurar retencao de imagens e logs.

Fontes: [precos ACR](https://azure.microsoft.com/en-us/pricing/details/container-registry/), [precos Container Apps](https://azure.microsoft.com/en-us/pricing/details/container-apps/), [regras de cobranca](https://learn.microsoft.com/en-us/azure/container-apps/billing), [API oficial de precos](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices).
