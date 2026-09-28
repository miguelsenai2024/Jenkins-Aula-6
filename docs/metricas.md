# E6 - Metricas e plano de melhoria

Linha de base fornecida no enunciado: 11 dias entre commit e producao. Meta: ate 2 dias em dois meses, reducao planejada de 81,8% (264h para 48h).

`node scripts/lab.mjs collect` coleta dez execucoes reais do Jenkins; `node scripts/metrics.mjs` calcula duracao media e taxa de falhas de CI. Os arquivos brutos ficam em `evidencias/jenkins`: JSON, logs, CSV e resultados JUnit. A coleta sem Azure executa dez vezes a esteira de CI; nao inventa dez entregas em producao.

Para medir DORA, registrar `release.json` em cada deploy completo aprovado e um diario de incidentes. Lead time = horario de producao menos horario do commit; frequencia = entregas de producao por periodo; taxa de falha = entregas que causaram incidente divididas pelo total de entregas; recuperacao = fim menos inicio do incidente. Sem entrega em producao, esses indicadores sao **nao medidos**, e nao zero.

Plano: semanas 1-2 automatizar CI, proteger main e revisar PRs; 3-4 integrar Azure e aprovacao; 5-6 coletar historico, identificar espera e testes instaveis; 7-8 reduzir gargalos e comparar dez ou mais execucoes completas com a linha de base. Monitorar o orcamento semanalmente.
