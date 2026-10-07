// 本地静态服务器（带 SPA fallback + _redirects 解析），用于在真实浏览器里验证生产构建。
// 用法: node scripts/serve-dist.mjs [port]
//
// ⚠️ 为什么要解析 _redirects：预渲染把每个工具写成 dist/<path>.html，靠
// `/* /:splat.html 301` 把 /json-prettify 转过去。如果本地不实现这条规则，
// 就会「本地好好的、线上 404/走错文件」，验证等于没做。
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, readFileSync } from 'node:fs';
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
  '.xml': 'application/xml; charset=utf-8',
};

/** 解析 public/_redirects，按 Cloudflare Pages「自上而下首次匹配」语义 */
function loadRedirects() {
  const file = resolve(root, '_redirects');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(line => {
      const [from, toAndStatus] = line.split(/\s+/);
      const parts = (toAndStatus || '').split(/\s+/);
      return { from, to: parts[0], status: Number(parts[1] || 301) };
    });
}

const redirects = loadRedirects();

/** 把 Cloudflare 的 splat 规则转成正则；只支持 `/* /:splat 3xx` 这种简单形式 */
function matchRedirect(urlPath) {
  for (const r of redirects) {
    // SPA fallback 的 200 规则不在这里处理（由调用方兜底）
    if (r.status === 200) continue;
    if (!r.from.endsWith('/*')) continue;
    const prefix = r.from.slice(0, -2); // 去掉结尾的 /*
    if (!urlPath.startsWith(prefix + '/') && urlPath !== prefix) continue;
    // splat 是不含前导斜杠的那一段：/json-prettify -> "json-prettify"
    const splat = urlPath.slice(prefix.length + 1);
    const target = r.to.replace(':splat', splat);
    if (target === urlPath || target === prefix + '/' + splat) continue; // 防自循环
    return { target, status: r.status };
  }
  return null;
}

createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // Cloudflare Pages 默认路由匹配（官方文档 Serving Pages → Route matching）：
  //   请求 /about 若存在 /about.html  → 直接 200 提供该文件
  //   请求 /about.html              → 308 到 /about（去后缀）
  //   请求 /about/ 若存在 /about/index.html → 308 到 /about/（补尾斜杠）
  if (urlPath.endsWith('.html')) {
    const withoutExt = urlPath.slice(0, -'.html'.length);
    res.writeHead(308, { Location: withoutExt || '/' });
    res.end();
    return;
  }

  if (!urlPath.endsWith('/')) {
    const asHtml = join(root, normalize(`${urlPath}.html`));
    if (existsSync(asHtml) && statSync(asHtml).isFile()) {
      const type = mime['.html'];
      res.writeHead(200, { 'Content-Type': type });
      createReadStream(asHtml).pipe(res);
      return;
    }
  }

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
  console.log(`serving ${root} (Cloudflare-like routing + SPA fallback) on http://127.0.0.1:${port}`);
});
