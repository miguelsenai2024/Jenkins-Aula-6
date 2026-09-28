import http from 'node:http';
import { pathToFileURL } from 'node:url';
export function createServer() {
  return http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', app: 'carparts-api',
        version: process.env.APP_VERSION || 'dev', commit: process.env.BUILD_COMMIT || 'local' }));
    } else if (req.method === 'GET' && req.url === '/pecas') {
      res.writeHead(200);
      res.end(JSON.stringify([{ codigo: 'CP-001', descricao: 'Filtro de oleo', estoque: 24 }]));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Recurso nao encontrado' }));
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createServer();
  server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Carparts API iniciada'));
  process.on('SIGTERM', () => server.close());
}
