const [url, commit, version] = process.argv.slice(2);
if (!url || !commit || !version) throw new Error('Uso: smoke.mjs URL COMMIT VERSAO');
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const health = await response.json();
    if (health.status !== 'ok' || health.commit !== commit || health.version !== version) {
      throw new Error('A revisao ativa ainda nao corresponde ao artefato aprovado');
    }
    console.log(JSON.stringify({ url, ...health, checkedAt: new Date().toISOString() }));
    process.exit(0);
  } catch (error) {
    if (attempt === 29) throw error;
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
