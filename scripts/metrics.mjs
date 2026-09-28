import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const folder = process.argv[2] || 'evidencias/jenkins';
const builds = JSON.parse(readFileSync(`${folder}/builds.json`, 'utf8'));
if (builds.length < 10) throw new Error('Sao necessarias pelo menos dez execucoes reais');
const failures = builds.filter(build => build.result !== 'SUCCESS').length;
const meanSeconds = builds.reduce((sum, build) => sum + build.duration/1000, 0) / builds.length;
writeFileSync(`${folder}/execucoes.csv`, 'build,inicio_utc,duracao_segundos,resultado,deploy_azure\n' + builds.map(build => `${build.number},${new Date(build.timestamp).toISOString()},${build.duration/1000},${build.result},false`).join('\n') + '\n');
const releases = existsSync(`${folder}/releases.json`) ? JSON.parse(readFileSync(`${folder}/releases.json`, 'utf8')) : [];
const report = `# E6 - Medicoes reais de CI\n\n` +
  `Amostra: ${builds.length} execucoes Jenkins. Duracao media: ${meanSeconds.toFixed(2)} segundos. Falhas de CI: ${failures}/${builds.length} (${(failures/builds.length*100).toFixed(1)}%).\n\n` +
  `Essas execucoes usaram DEPLOY_AZURE=false. Duracao de CI nao e lead time ate producao; falhas de CI nao sao a taxa DORA de falhas de mudanca.\n\n` +
  (releases.length ? `Entregas em producao registradas: ${releases.length}.\n` : `Nao houve entrega em producao nesta amostra. Lead time de producao, frequencia de implantacao, taxa de falha de mudanca e tempo de recuperacao permanecem **nao medidos**.\n`) +
  `\nLinha de base do enunciado: 11 dias (264 horas). Meta: ate 2 dias (48 horas), reducao planejada de 81,8%. Essa reducao e uma meta, nao um resultado demonstrado.\n\n` +
  `Apos habilitar Azure, exportar release.json de cada entrega e registrar incidentes reais. Medir pelo menos dez execucoes completas. Lead time = deployedAt - commitAt; frequencia = entregas em producao / dias observados; taxa de falha = entregas que causaram incidente / entregas; recuperacao = restauracao - inicio do incidente.\n\n` +
  `Plano de dois meses: semanas 1-2 CI e revisao por PR; 3-4 homologacao e aprovacoes; 5-6 coleta e analise; 7-8 reduzir esperas, corrigir testes instaveis e conferir a meta de 48h.\n`;
writeFileSync(`${folder}/metricas.md`, report);
console.log(report);
