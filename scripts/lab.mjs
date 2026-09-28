import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const command = process.argv[2] || 'start';
mkdirSync('.runtime', { recursive: true });
const envFile = '.runtime/controller.env';
if (!existsSync(envFile)) writeFileSync(envFile, `ADMIN_PASSWORD=${randomBytes(24).toString('hex')}\n`, { mode: 0o600 });
const password = readFileSync(envFile, 'utf8').match(/^ADMIN_PASSWORD=(.+)$/m)[1];
if (process.env.GITHUB_ACTIONS) console.log(`::add-mask::${password}`);
const base = 'http://127.0.0.1:8080';
const authorization = `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`;
let cookie = '';
let crumb = {};
export async function api(path, options = {}) {
  const response = await fetch(base + path, { ...options, headers: { authorization, cookie, ...crumb, ...options.headers }, signal: AbortSignal.timeout(30000) });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) cookie = cookies.map(value => value.split(';')[0]).join('; ');
  return response;
}
async function waitFor(label, predicate, seconds = 300) {
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) {
    try { if (await predicate()) return; } catch { /* Startup may not have opened its port yet. */ }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  throw new Error(`Prazo esgotado: ${label}`);
}
function compose(...args) {
  const result = spawnSync('docker', ['compose', '--env-file', envFile, '--profile', 'agent', ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Docker Compose falhou');
}
async function check(response, label) {
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}: ${(await response.text()).slice(0,1200)}`);
  return response;
}
if (command === 'start') {
  if (!existsSync('.runtime/agent.env')) writeFileSync('.runtime/agent.env', '', { mode: 0o600 });
  compose('up', '-d', '--build', 'jenkins', 'docker');
  await waitFor('Jenkins inicializar', async () => (await api('/api/json')).ok, 600);
  const csrf = await (await check(await api('/crumbIssuer/api/json'), 'CSRF')).json();
  crumb = { [csrf.crumbRequestField]: csrf.crumb };
  const secret = (await (await check(await api('/scriptText', {
    method: 'POST', body: new URLSearchParams({ script: 'print(jenkins.model.Jenkins.get().getComputer("linux-docker").getJnlpMac())' })
  }), 'Secret do agent')).text()).trim();
  if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error('Jenkins nao forneceu um secret de agent valido');
  if (process.env.GITHUB_ACTIONS) console.log(`::add-mask::${secret}`);
  writeFileSync('.runtime/agent.env', `JENKINS_SECRET=${secret}\n`, { mode: 0o600 });
  compose('up', '-d', '--build', 'agent');
  await waitFor('agent Linux conectar', async () => {
    const response = await api('/computer/linux-docker/api/json');
    return response.ok && !(await response.json()).offline;
  }, 600);
  // Valida a sintaxe declarativa com os plugins efetivamente instalados.
  const validation = await (await check(await api('/pipeline-model-converter/validate', {
    method: 'POST', body: new URLSearchParams({ jenkinsfile: readFileSync('Jenkinsfile', 'utf8') })
  }), 'Validacao Jenkinsfile')).text();
  console.log(validation.trim());
  if (!validation.includes('successfully validated')) throw new Error('Jenkinsfile rejeitado pelo Jenkins');
  if ((await api('/job/carparts/api/json')).status === 404) {
    await check(await api('/createItem?name=carparts', { method: 'POST', headers: { 'content-type': 'application/xml' }, body: readFileSync('scripts/multibranch.xml', 'utf8') }), 'Criacao Multibranch');
  }
  await check(await api('/job/carparts/build?delay=0sec', { method: 'POST' }), 'Indexacao GitHub');
  console.log('Controller sem executores, agent Linux e Multibranch iniciados. URL: http://localhost:8080/');
} else if (command === 'collect') {
  const csrf = await (await check(await api('/crumbIssuer/api/json'), 'CSRF')).json();
  crumb = { [csrf.crumbRequestField]: csrf.crumb };
  const out = process.argv[3] || 'evidencias/jenkins';
  mkdirSync(out, { recursive: true });
  const requestedBranch = process.env.LAB_BRANCH || 'main';
  const job = `/job/carparts/job/${encodeURIComponent(requestedBranch)}`;
  await waitFor('descoberta da branch', async () => (await api(`${job}/api/json`)).ok, 300);
  const builds = [];
  for (let iteration = 0; iteration < 10; iteration++) {
    await waitFor('fim do build anterior', async () => {
      const response = await api(`${job}/lastBuild/api/json`);
      return response.status === 404 || !(await response.json()).building;
    }, 600);
    const before = await (await api(`${job}/api/json`)).json();
    const next = before.nextBuildNumber;
    await check(await api(`${job}/buildWithParameters?DEPLOY_AZURE=false`, { method: 'POST' }), 'Disparo CI');
    await waitFor(`build #${next}`, async () => {
      const response = await api(`${job}/${next}/api/json`);
      if (!response.ok) return false;
      const build = await response.json();
      if (build.building) return false;
      builds.push(build);
      return true;
    }, 600);
    const build = builds.at(-1);
    writeFileSync(`${out}/build-${next}.json`, JSON.stringify(build, null, 2));
    writeFileSync(`${out}/build-${next}.log`, await (await api(`${job}/${next}/consoleText`)).text());
    const stages = await api(`${job}/${next}/wfapi/describe`);
    if (stages.ok) writeFileSync(`${out}/stages-${next}.json`, JSON.stringify(await stages.json(), null, 2));
    const tests = await api(`${job}/${next}/testReport/api/json`);
    if (tests.ok) writeFileSync(`${out}/testes-${next}.json`, JSON.stringify(await tests.json(), null, 2));
    console.log(`Execucao ${iteration + 1}/10: build #${next}, ${build.result}, ${(build.duration/1000).toFixed(1)}s`);
    if (build.result !== 'SUCCESS') throw new Error(`Build #${next} falhou; consulte ${out}/build-${next}.log`);
  }
  writeFileSync(`${out}/builds.json`, JSON.stringify(builds, null, 2));
  const controller = await (await api('/computer/api/json')).json();
  writeFileSync(`${out}/nodes.json`, JSON.stringify(controller, null, 2));
  const security = await (await api('/api/json?tree=useSecurity')).json();
  const anonymous = await fetch(base + '/api/json');
  const configProof = await (await check(await api('/scriptText', { method: 'POST', body: new URLSearchParams({ script: 'def j=jenkins.model.Jenkins.get(); println("numExecutors="+j.numExecutors); println("securityRealm="+j.securityRealm.class.simpleName); println("authorizationStrategy="+j.authorizationStrategy.class.simpleName)' }) }), 'Prova JCasC')).text();
  writeFileSync(`${out}/seguranca.json`, JSON.stringify({ ...security, anonymousHttpStatus: anonymous.status, configProof }, null, 2));
  if (anonymous.status !== 403 || !configProof.includes('numExecutors=0')) throw new Error('Configuracao de isolamento ou autenticacao incorreta');
  const statuses = spawnSync('docker', ['compose', '--env-file', envFile, '--profile', 'agent', 'ps'], { encoding: 'utf8' });
  writeFileSync(`${out}/containers.log`, statuses.stdout);
  const startup = spawnSync('docker', ['compose', '--env-file', envFile, 'logs', '--no-color', 'jenkins'], { encoding: 'utf8', maxBuffer: 5*1024*1024 });
  writeFileSync(`${out}/controller.log`, startup.stdout + startup.stderr);
  writeFileSync(`${out}/multibranch.xml`, await (await api('/job/carparts/config.xml')).text());
  writeFileSync(`${out}/proveniencia.json`, JSON.stringify({ generatedAt: new Date().toISOString(), mode: 'CI sem Azure', repository: process.env.GITHUB_REPOSITORY || 'miguelsenai2024/Jenkins-Aula-6', commit: process.env.GITHUB_SHA || null, workflow: process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null }, null, 2));
} else if (command === 'stop') {
  compose('stop');
} else { throw new Error('Uso: lab.mjs start|collect [pasta]|stop'); }
