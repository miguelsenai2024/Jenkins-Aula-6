import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from './server.js';
async function request(path, options) {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, options);
    return { status: response.status, type: response.headers.get('content-type'), body: await response.json() };
  } finally { await new Promise(resolve => server.close(resolve)); }
}
test('health confirma disponibilidade e identifica o artefato', async () => {
  const response = await request('/health');
  assert.equal(response.status, 200); assert.equal(response.body.status, 'ok');
  assert.equal(response.body.app, 'carparts-api');
  assert.ok(response.body.commit); assert.ok(response.body.version);
});
test('consulta de pecas retorna codigo e estoque', async () => {
  const response = await request('/pecas');
  assert.equal(response.status, 200); assert.equal(response.body[0].codigo, 'CP-001');
  assert.equal(response.body[0].estoque, 24);
});
test('rota inexistente retorna erro 404 em JSON', async () => {
  const response = await request('/inexistente');
  assert.equal(response.status, 404); assert.match(response.type, /application\/json/);
  assert.ok(response.body.error);
});
test('metodo sem suporte nao e aceito como consulta', async () => {
  assert.equal((await request('/pecas', { method: 'POST' })).status, 404);
});
