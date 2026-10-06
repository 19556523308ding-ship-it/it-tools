// 把 favicon 和页内 logo 并排渲染，用于视觉协调性检查。
// 用法: node scripts/compare-icon.mjs [baseUrl]
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

try {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 300 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // 取页内 logo 的 SVG 源码，和 favicon 并排
  const logoSvg = await page.evaluate(() => {
    const svg = document.querySelector('.site-logo') || document.querySelector('header svg');
    return svg ? svg.outerHTML : null;
  });

  const cards = [
    { src: '/favicon-16x16.png', size: 16, label: '16px' },
    { src: '/favicon-32x32.png', size: 32, label: '32px' },
    { src: '/apple-touch-icon.png', size: 48, label: '48px' },
  ].map(c => `
    <div class="cell">
      <img src="${baseUrl}${c.src}" style="width:${c.size}px;height:${c.size}px;">
      <span>${c.label}</span>
    </div>`).join('');

  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;font-family:system-ui;background:#f7fbff;padding:24px;">
    <div style="display:flex;gap:28px;align-items:flex-end;">
      <div style="display:flex;gap:18px;align-items:flex-end;background:#fff;padding:16px;border-radius:12px;border:1px solid #dbeafe;">
        ${cards}
        <div class="cell">
          <img src="${baseUrl}/apple-touch-icon.png" style="width:60px;height:60px;border-radius:12px;">
          <span>apple-touch</span>
        </div>
        <div class="cell">
          <img src="${baseUrl}/android-chrome-192x192.png" style="width:76px;height:76px;border-radius:16px;">
          <span>android 192</span>
        </div>
      </div>
      <div style="display:flex;gap:18px;align-items:flex-end;background:#fff;padding:16px;border-radius:12px;border:1px solid #dbeafe;">
        <div class="cell">${logoSvg ? `<div style="width:60px;height:60px;">${logoSvg.replace('<svg', '<svg width="60" height="60"')}</div>` : ''}<span>页内 logo</span></div>
      </div>
    </div>
    <style>
      .cell{display:flex;flex-direction:column;align-items:center;gap:6px;}
      .cell span{font-size:11px;color:#64748b;}
    </style>
  </body></html>`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(outDir, 'icon-comparison.png') });
  await ctx.close();
  console.log(`对比图 -> ${resolve(outDir, 'icon-comparison.png')}`);
}
finally {
  await browser.close();
}