// 验证本次修复：页脚分类深链、搜索空状态、分类名双语、meta/404/语言。
// 用法: node scripts/verify-fixes.mjs [baseUrl]
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = resolve(root, '..', '..', 'redesign-shots-fixes');
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

// ---- 1. 页脚分类链接带 query 且真正生效 ----
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const footerHrefs = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('.site-footer__link'));
  return links.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') }));
});
const catLinks = footerHrefs.filter(l => l.href && l.href.includes('category='));
if (catLinks.length < 8) {
  problems.push(`页脚分类链接只有 ${catLinks.length} 条带 category 参数（应为 8）`);
}

await page.screenshot({ path: resolve(outDir, 'footer-links.png'), fullPage: false });

// 点第一个分类链接，验证列表被筛选
if (catLinks.length > 0) {
  await page.locator('.site-footer__link[href*="category="]').first().click();
  await page.waitForTimeout(1400);
  const state = await page.evaluate(() => ({
    url: location.href,
    scrollY: Math.round(window.scrollY),
    activeChip: document.querySelector('.alltools-filter--active')?.textContent.trim(),
    cardCount: document.querySelectorAll('#all-tools .featured-card').length,
  }));
  if (!state.url.includes('category=')) problems.push('点击页脚分类后 URL 没有 category 参数');
  if (state.scrollY < 100) problems.push(`点击页脚分类后未滚动到工具区 (scrollY=${state.scrollY})`);
  if (state.cardCount >= 86) problems.push(`点击页脚分类后列表未筛选 (仍有 ${state.cardCount} 个工具)`);
  await page.screenshot({ path: resolve(outDir, 'footer-filter-applied.png') });
}

// ---- 2. 搜索空状态 + 清除筛选 ----
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.locator('.alltools-search input').fill('zzzzz-not-exist');
await page.waitForTimeout(600);
const emptyState = await page.evaluate(() => ({
  hasEmpty: Boolean(document.querySelector('.alltools-empty')),
  text: document.querySelector('.alltools-empty__text')?.textContent.trim(),
  hasReset: Boolean(document.querySelector('.alltools-empty__reset')),
  cardCount: document.querySelectorAll('#all-tools .featured-card').length,
}));
if (!emptyState.hasEmpty) problems.push('搜索无结果时没有显示空状态');
if (!emptyState.hasReset) problems.push('空状态缺少「清除筛选」按钮');
if (emptyState.cardCount !== 0) problems.push(`空状态但仍渲染了 ${emptyState.cardCount} 个工具卡片`);
await page.screenshot({ path: resolve(outDir, 'empty-state.png') });

if (emptyState.hasReset) {
  await page.locator('.alltools-empty__reset').click();
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => ({
    keyword: document.querySelector('.alltools-search input')?.value,
    cardCount: document.querySelectorAll('#all-tools .featured-card').length,
  }));
  if (after.keyword !== '') problems.push(`清除筛选后关键词未清空: "${after.keyword}"`);
  if (after.cardCount < 80) problems.push(`清除筛选后工具未恢复 (仅 ${after.cardCount} 个)`);
}

// ---- 3. 分类名双语（默认英文，不含中文）----
const chipNames = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.alltools-filter')).map(b => b.textContent.trim()),
);
const hasChinese = chipNames.filter(t => /[\u4e00-\u9fa5]/.test(t));
if (hasChinese.length > 0) {
  problems.push(`英文 UI 的分类 chip 仍含中文: ${hasChinese.join(', ')}`);
}

// ---- 4. meta ----
const meta = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  keywords: document.querySelector('meta[name="keywords"]')?.content?.slice(0, 40) || null,
  description: document.querySelector('meta[name="description"]')?.content?.slice(0, 30) || null,
}));
if (meta.lang !== 'en') problems.push(`html lang 仍是 ${meta.lang}（应为 en）`);
if (!meta.keywords) problems.push('meta keywords 仍缺失');

// ---- 5. 404 页 ----
await page.goto(`${baseUrl}/definitely-not-a-real-page-xyz`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const e404 = await page.evaluate(() => ({
  title: document.title,
  robots: document.querySelector('meta[name="robots"]')?.content || null,
}));
if (e404.title.includes('IT Tools')) problems.push(`404 页标题仍含 IT Tools: "${e404.title}"`);
if (!e404.robots?.includes('noindex')) problems.push('404 页缺少 robots noindex');
await page.screenshot({ path: resolve(outDir, '404-page.png') });

await ctx.close();
await browser.close();

console.log('页脚分类链接（前 3 条）:');
for (const l of catLinks.slice(0, 3)) console.log(`  ${l.text.padEnd(18)} ${l.href}`);
console.log('\n分类 chip:', chipNames.join(' | '));
console.log('\n空状态:', JSON.stringify(emptyState, null, 2));
console.log('meta:', JSON.stringify(meta, null, 2));
console.log('404:', JSON.stringify(e404, null, 2));
console.log(`\n截图 -> ${outDir}`);

if (problems.length) {
  console.log('\n❌ 发现问题:');
  for (const p of problems) console.log(' - ' + p);
  process.exitCode = 1;
} else {
  console.log('\n✅ 全部修复验证通过');
}