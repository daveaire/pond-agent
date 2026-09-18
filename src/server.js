import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarizePortfolio } from './portfolio.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(fs.readFileSync(path.join(root, 'data/sample-portfolio.json'), 'utf8'));
const page = fs.readFileSync(path.join(root, 'web/index.html'));
const port = Number(process.env.PORT || 4180);

http.createServer((request, response) => {
  if (request.url === '/api/report') {
    response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(summarizePortfolio(report)));
    return;
  }
  if (request.url === '/' || request.url === '/index.html') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(page);
    return;
  }
  response.writeHead(404).end('Not found');
}).listen(port, '127.0.0.1', () => {
  console.log(`Pond Agent evidence dashboard: http://127.0.0.1:${port}`);
});
