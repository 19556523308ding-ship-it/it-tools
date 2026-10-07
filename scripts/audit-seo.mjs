// Google 可抓取性审计：SPA 最核心的风险是「爬虫看到的 HTML 里没有内容」。
// 用法: node scripts/audit-seo.mjs [baseUrl]
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const baseUrl = process.argv[2] || 'https://tools.jinzhai.icu';
const outDir = resolve(root, '..', '..', 'seo-audit');
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

const problems = [];
const { chromium } = await import(resolvePlaywrightCoreEntry());
const exe = resolveChromiumExecutable();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

// ---- 1. 原始 HTML（Googlebot 首次抓取看到的内容）----
console.log('=== 1. 原始 HTML（爬虫首抓）===');
const sample = ['/', '/json-prettify', '/uuid-generator', '/about'];
const rawReport = {};
for (const p of sample) {
  const res = await fetch(baseUrl + p, { redirect: 'follow' });
  const html = await res.text();
  const has = (re) => re.test(html);
  rawReport[p] = {
    status: res.status,
    bytes: html.length,
    title: (html.match(/<title>([^<]*)<\/title>/) || [])[1] || null,
    description: has(/<meta name="description"/),
    canonical: (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || null,
    // 关键：HTML 里有没有正文文字
    hasBodyText: /工具|tool|json|JSON|developer/i.test(html.replace(/<script[\s\S]*?<\/script>/g, '')),
  };
  console.log(` ${p.padEnd(18)} status=${res.status} bytes=${String(html.length).padEnd(6)} desc=${rawReport[p].description} canonical=${rawReport[p].canonical || '-'}`);
}

// ---- 2. 渲染后 DOM（Google 执行的最终结果）----
console.log('\n=== 2. 渲染后 DOM ===');
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const domReport = {};
for (const p of sample) {
  await page.goto(baseUrl + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const d = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || null,
    keywords: document.querySelector('meta[name="keywords"]')?.content || null,
    canonical: document.querySelector('link[rel=canonical]')?.href || null,
    h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
    h2Count: document.querySelectorAll('h2').length,
    textLen: document.body.innerText.replace(/\s+/g, ' ').trim().length,
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
    lang: document.documentElement.lang,
    imgsNoAlt: Array.from(document.querySelectorAll('img')).filter(i => !i.hasAttribute('alt')).length,
    linksNoText: Array.from(document.querySelectorAll('a')).filter(a => !a.textContent.trim() && !a.getAttribute('aria-label')).length,
  }));
  domReport[p] = d;
  console.log(` ${p.padEnd(18)} title="${(d.title || '').slice(0, 40)}" h1=${d.h1.length} h2=${d.h2Count} textLen=${d.textLen} ld+json=${d.jsonLd}`);
}

await ctx.close();
await browser.close();

// ---- 3. 基础设施 ----
console.log('\n=== 3. 基础设施 ===');
const infra = {};
for (const f of ['/robots.txt', '/sitemap.xml', '/sitemap-0.xml', '/sitemap_index.xml']) {
  try {
    const r = await fetch(baseUrl + f, { redirect: 'follow' });
    const t = await r.text();
    const isXml = t.trimStart().startsWith('<?xml') || t.includes('<urlset') || t.includes('<sitemapindex');
    infra[f] = { status: r.status, isXml, bytes: t.length };
    console.log(` ${f.padEnd(20)} ${r.status} ${isXml ? '真 XML ✅' : '不是 XML ⚠️'} ${t.length}B`);
  } catch (e) {
    infra[f] = { error: e.message };
    console.log(` ${f.padEnd(20)} ❌ ${e.message.slice(0, 40)}`);
  }
}

const robots = await (await fetch(baseUrl + '/robots.txt')).text();
infra.robotsHasSitemap = /sitemap/i.test(robots);
console.log(` robots.txt 声明 Sitemap: ${infra.robotsHasSitemap ? '是 ✅' : '否 ⚠️'}`);

// ---- 判定 ----
if (!infra['/sitemap.xml'].isXml) problems.push('sitemap.xml 返回的不是 XML（SPA fallback），Google 无法发现 86 个工具页');
if (!infra.robotsHasSitemap) problems.push('robots.txt 没有 Sitemap 声明');
if (!domReport['/json-prettify'].jsonLd) problems.push('没有结构化数据（JSON-LD），富媒体结果无从展示');
if (domReport['/json-prettify'].h1.length !== 1) problems.push(`工具页 h1 数量为 ${domReport['/json-prettify'].h1.length}（应为 1）`);

writeFileSync(resolve(outDir, 'seo-audit.json'), JSON.stringify({ rawReport, domReport, infra }, null, 2));
console.log(`\n报告 -> ${resolve(outDir, 'seo-audit.json')}`);

if (problems.length) {
  console.log('\n❌ 发现问题:');
  for (const p of problems) console.log(' - ' + p);
} else {
  console.log('\n✅ 基础 SEO 无明显缺陷');
}