# E6 - Medicoes reais de CI

Amostra: 10 execucoes Jenkins. Duracao media: 16.51 segundos. Falhas de CI: 0/10 (0.0%).

Essas execucoes usaram DEPLOY_AZURE=false. Duracao de CI nao e lead time ate producao; falhas de CI nao sao a taxa DORA de falhas de mudanca.

Nao houve entrega em producao nesta amostra. Lead time de producao, frequencia de implantacao, taxa de falha de mudanca e tempo de recuperacao permanecem **nao medidos**.

Linha de base do enunciado: 11 dias (264 horas). Meta: ate 2 dias (48 horas), reducao planejada de 81,8%. Essa reducao e uma meta, nao um resultado demonstrado.

Apos habilitar Azure, exportar release.json de cada entrega e registrar incidentes reais. Medir pelo menos dez execucoes completas. Lead time = deployedAt - commitAt; frequencia = entregas em producao / dias observados; taxa de falha = entregas que causaram incidente / entregas; recuperacao = restauracao - inicio do incidente.

Plano de dois meses: semanas 1-2 CI e revisao por PR; 3-4 homologacao e aprovacoes; 5-6 coleta e analise; 7-8 reduzir esperas, corrigir testes instaveis e conferir a meta de 48h.
