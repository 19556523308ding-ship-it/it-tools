// 用品牌 logo 生成全套 favicon / PWA 图标。
// 用法: node scripts/generate-favicons.mjs
//
// 16/32px 这种小尺寸下，原 logo 的速度线会糊成一团，所以这里用一个
// favicon 专用版本：去掉速度线、放大主体，只保留扳手与星光。
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readdirSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');
mkdirSync(publicDir, { recursive: true });

function resolvePlaywrightCoreEntry() {
  const pnpmDir = resolve(root, 'node_modules/.pnpm');
  const p = readdirSync(pnpmDir)
    .filter(n => n.startsWith('playwright-core@'))
    .map(n => resolve(pnpmDir, n, 'node_modules/playwright-core/index.mjs'))
    .find(existsSync);
  if (!p) throw new Error('playwright-core not found; run `pnpm install` first.');
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
      c.push(
        resolve(pwRoot, e, 'chrome-win64/chrome.exe'),
        resolve(pwRoot, e, 'chrome-win/chrome.exe'),
        resolve(pwRoot, e, 'chrome-linux/chrome'),
        resolve(pwRoot, e, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'),
      );
    }
  }
  return c.find(existsSync);
}

/**
 * favicon 专用图形。
 *
 * 与页面内的 logo-mark 的区别：主体放大到几乎撑满画布（原来只占 54%，
 * 在标签页里看着很小），速度线去掉（小尺寸糊成一团），星光缩小并收进
 * 画布内（原来超出 viewBox 被裁掉）。
 */
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="g" x1="4" y1="4" x2="60" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3B82FF"/><stop offset="0.5" stop-color="#06B6D4"/><stop offset="1" stop-color="#14B8A6"/>
    </linearGradient>
    <linearGradient id="s" x1="42" y1="4" x2="56" y2="18" gradientUnits="userSpaceOnUse">
      <stop stop-color="#C8F26A"/><stop offset="1" stop-color="#7DE3B0"/>
    </linearGradient>
  </defs>
  <path d="M25 20v-5.5a5.5 5.5 0 0 1 11 0V20" stroke="url(#g)" stroke-width="5" stroke-linecap="round"/>
  <rect x="4" y="18" width="56" height="44" rx="13" fill="url(#g)"/>
  <g transform="translate(11 21)" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M7 10h3v-3l-3.5-3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1-3 3l-6-6a6 6 0 0 1-8-8l3.5 3.5"/>
  </g>
  <path d="M50 3.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3 2.3-6.2Z" fill="url(#s)"/>
</svg>`;

/** safari-pinned-tab 必须是单色剪影，Safari 用 <link color> 着色 */
const PINNED_TAB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M25 20v-5.5a5.5 5.5 0 0 1 11 0V20h4v42a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4V20h4Z"/>
  <path d="M29 34l3.5-3.5a6 6 0 0 0-8 8l6 6a2 2 0 0 0 3-3l-6-6a6 6 0 0 0 1.5-1.5Z" fill="#fff"/>
</svg>`;

/** 把若干 PNG 打包成 ICO（ICO 允许直接内嵌 PNG 数据） */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;

  for (const [i, e] of entries.entries()) {
    const o = i * 16;
    dir[o] = e.size >= 256 ? 0 : e.size;
    dir[o + 1] = e.size >= 256 ? 0 : e.size;
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(e.buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.buf.length;
  }

  return Buffer.concat([header, dir, ...entries.map(e => e.buf)]);
}

const ICON_SVG_PATH = resolve(root, '.favicon-tmp.svg');
writeFileSync(ICON_SVG_PATH, ICON_SVG, 'utf8');
writeFileSync(resolve(publicDir, 'safari-pinned-tab.svg'), PINNED_TAB_SVG, 'utf8');

const { chromium } = await import(resolvePlaywrightCoreEntry());
const exe = resolveChromiumExecutable();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

async function render({ w, h, bg, scale }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const inner = Math.round(Math.min(w, h) * scale);
  // 内联 SVG 而不是 file:// 引用：避免临时文件被回收 / 异步加载竞态导致截到空白
  await page.setContent(
    `<!DOCTYPE html><html><body style="margin:0;width:${w}px;height:${h}px;`
    + `display:flex;align-items:center;justify-content:center;background:${bg};">`
    + `<div style="width:${inner}px;height:${inner}px;">${ICON_SVG}</div>`
    + `</body></html>`,
    { waitUntil: 'load' },
  );
  await page.waitForTimeout(120);
  const buf = await page.screenshot({ omitBackground: bg === 'transparent' });
  await ctx.close();
  return buf;
}

try {
  const targets = [
    { file: 'favicon-16x16.png', size: 16, scale: 1 },
    { file: 'favicon-32x32.png', size: 32, scale: 1 },
    { file: 'apple-touch-icon.png', size: 180, scale: 1, bg: '#ffffff' },
    { file: 'android-chrome-192x192.png', size: 192, scale: 1 },
    { file: 'android-chrome-512x512.png', size: 512, scale: 1 },
    // maskable 图标要留安全区，否则 Android 会裁掉主体。
    // 图形本身已占约 87% 画布，这里只需再收一点给圆形裁切留余量。
    { file: 'mstile-144x144.png', size: 144, scale: 0.88 },
    { file: 'mstile-150x150.png', size: 150, scale: 0.88 },
    { file: 'mstile-70x70.png', size: 70, scale: 0.9 },
    { file: 'mstile-310x310.png', size: 310, scale: 0.88 },
    { file: 'mstile-310x150.png', w: 310, h: 150, scale: 0.8 },
  ];

  for (const t of targets) {
    const w = t.w ?? t.size;
    const h = t.h ?? t.size;
    const buf = await render({ w, h, bg: t.bg ?? 'transparent', scale: t.scale });
    writeFileSync(resolve(publicDir, t.file), buf);
    console.log(`  ✓ ${t.file}  ${w}x${h}`);
  }

  const icoEntries = [];
  for (const size of [16, 32, 48]) {
    icoEntries.push({ size, buf: await render({ w: size, h: size, bg: 'transparent', scale: 1 }) });
  }
  writeFileSync(resolve(publicDir, 'favicon.ico'), buildIco(icoEntries));
  console.log('  ✓ favicon.ico  16+32+48');
  console.log('  ✓ safari-pinned-tab.svg');
}
finally {
  await browser.close();
  rmSync(ICON_SVG_PATH, { force: true });
}