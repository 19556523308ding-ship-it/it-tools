// 本地静态服务器（带 SPA fallback），用于在真实浏览器里验证生产构建。
// 用法: node scripts/serve-dist.mjs [port]
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', 'dist');
const port = Number(process.argv[2] || 4173);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = join(root, normalize(urlPath));

  // 阻止路径穿越
  if (!filePath.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  // SPA fallback：与 Cloudflare Pages 的 `/* /index.html 200` 行为保持一致
  if (!existsSync(filePath)) {
    filePath = join(root, 'index.html');
  }

  const type = mime[extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  createReadStream(filePath).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} with SPA fallback on http://127.0.0.1:${port}`);
});
