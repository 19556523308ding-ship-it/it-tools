// 验证 favicon 在真实浏览器中确实被请求并成功渲染。
// 用法: node scripts/verify-favicon.mjs [baseUrl]
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = resolve(root, '..', '..', 'redesign-shots-favicon');
mkdirSync(outDir, { recursive: true });

function resolvePlaywrightCoreEntry() {
  const pnpmDir = resolve(root, 'node_modules/.pnpm');
  const p = readdirSync(pnpmDir)
    .filter(n => n.startsWith('playwright-core@'))
    .map(n => resolve(pnpmDir, n, 'node_modules/playwright-core/index.mjs'))
    .find(existsSync);
  if (!p) throw new Error('playwright-core not found');
  return pathToFileURL(p).href;
}

function resolveChromiumExecutable() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  const pwRoot = process.env.LOCALAPPDATA
    ? resolve(process.env.LOCALAPPDATA, 'ms-playwright')
    : resolve(process.env.HOME ?? '', 'AppData/Local/ms-playwright');
  if (!existsSync(pwRoot)) return undefined;
  const c = [];
  for (const e of readdirSync(pwRoot)) {
    if (e.startsWith('chromium-')) {
      c.push(resolve(pwRoot, e, 'chrome-win64/chrome.exe'), resolve(pwRoot, e, 'chrome-linux/chrome'));
    }
  }
  return c.find(existsSync);
}

const { chromium } = await import(resolvePlaywrightCoreEntry());
const exe = resolveChromiumExecutable();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

const problems = [];
const requested = [];
let links = [];
let metas = {};
let icoOk = { status: 0, bytes: 0, magic: [] };

try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('response', (r) => {
    const u = r.url();
    if (/favicon|apple-touch|mstile|android-chrome|safari-pinned/.test(u)) {
      requested.push(`${r.status()} ${u.replace(baseUrl, '')}`);
      if (r.status() >= 400) problems.push(`图标加载失败 ${r.status()}: ${u}`);
    }
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  links = await page.evaluate(() => Array.from(document.querySelectorAll('link[rel*="icon"]')).map(l => ({
    rel: l.rel,
    href: l.getAttribute('href'),
    sizes: l.getAttribute('sizes'),
    type: l.getAttribute('type'),
  })));
  metas = await page.evaluate(() => ({
    tile: document.querySelector('meta[name="msapplication-TileColor"]')?.content,
    theme: document.querySelector('meta[name="theme-color"]')?.content,
  }));

  // 截图浏览器标签页区域附近（favicon 在左上角）
  await page.screenshot({ path: resolve(outDir, 'tab-favicon.png'), clip: { x: 0, y: 0, width: 420, height: 120 } });

  // 单独打开 favicon.ico 确认能解码
  icoOk = await page.evaluate(async () => {
    const res = await fetch('/favicon.ico');
    const buf = await res.arrayBuffer();
    const head = new Uint8Array(buf, 0, 4);
    return { status: res.status, bytes: buf.byteLength, magic: Array.from(head) };
  });

  await ctx.close();
}
finally {
  await browser.close();
}

console.log('页面声明的图标:');
for (const l of links) console.log(`  rel=${l.rel.padEnd(18)} sizes=${(l.sizes || '-').padEnd(9)} ${l.href}`);
console.log(`  msapplication-TileColor=${metas.tile}  theme-color=${metas.theme}`);
console.log('\n浏览器实际请求:');
for (const r of [...new Set(requested)]) console.log('  ' + r);
console.log(`\nfavicon.ico: HTTP ${icoOk.status}, ${icoOk.bytes} 字节, magic=[${icoOk.magic}]`);
console.log(`\n截图 -> ${outDir}`);

if (problems.length) {
  console.log('\n❌ 问题:');
  for (const p of problems) console.log(' - ' + p);
  process.exitCode = 1;
} else {
  console.log('\n✅ 所有图标声明与请求均正常');
}