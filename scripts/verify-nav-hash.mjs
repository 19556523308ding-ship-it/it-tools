// 复现并验证「Header 导航 → 全部工具 / 工具分类」点击不跳转的问题。
// 用法: node scripts/verify-nav-hash.mjs [baseUrl]
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = resolve(root, '..', '..', 'redesign-shots-nav');
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
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// ---- 场景 1：首页顶部点击「全部工具」导航 ----
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const link = page.locator('.site-header__nav a', { hasText: /全部工具|All tools/ }).first();
const href = await link.getAttribute('href');
await link.click();
await page.waitForTimeout(1200);

const state1 = await page.evaluate(() => ({
  hash: location.hash,
  scrollY: Math.round(window.scrollY),
  allToolsTop: Math.round(document.getElementById('all-tools')?.getBoundingClientRect().top ?? -9999),
}));
if (state1.scrollY < 100) {
  problems.push(`场景1 首页点「全部工具」：页面未滚动 (scrollY=${state1.scrollY}, hash=${state1.hash})`);
}
await page.screenshot({ path: resolve(outDir, 'nav-1-alltools-from-home.png') });

// ---- 场景 2：首页顶部点击「工具分类」导航 ----
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const catLink = page.locator('.site-header__nav a', { hasText: /工具分类|Categories/ }).first();
await catLink.click();
await page.waitForTimeout(1200);
const state2 = await page.evaluate(() => ({
  hash: location.hash,
  scrollY: Math.round(window.scrollY),
  catTop: Math.round(document.getElementById('categories')?.getBoundingClientRect().top ?? -9999),
}));
if (state2.scrollY < 100) {
  problems.push(`场景2 首页点「工具分类」：页面未滚动 (scrollY=${state2.scrollY}, hash=${state2.hash})`);
}
await page.screenshot({ path: resolve(outDir, 'nav-2-categories-from-home.png') });

// ---- 场景 3：从 /about 页点击「全部工具」（跨页 hash）----
await page.goto(`${baseUrl}/about`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const link3 = page.locator('.site-header__nav a', { hasText: /全部工具|All tools/ }).first();
await link3.click();
await page.waitForTimeout(1500);
const state3 = await page.evaluate(() => ({
  path: location.pathname,
  hash: location.hash,
  scrollY: Math.round(window.scrollY),
}));
if (state3.path !== '/' || state3.scrollY < 100) {
  problems.push(`场景3 /about 点「全部工具」：未跳回首页并滚动 (path=${state3.path}, scrollY=${state3.scrollY})`);
}
await page.screenshot({ path: resolve(outDir, 'nav-3-from-about.png') });

await ctx.close();
await browser.close();

console.log(`nav link href = ${href}`);
console.log(JSON.stringify({ state1, state2, state3 }, null, 2));
console.log(`\n截图 -> ${outDir}`);
if (problems.length) {
  console.log('\n❌ 发现问题:');
  for (const p of problems) console.log(' - ' + p);
  process.exitCode = 1;
} else {
  console.log('\n✅ 三个导航场景均正常滚动');
}
