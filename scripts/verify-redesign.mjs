// 用本地 Chromium 对生产构建做真实浏览器验证并截图。
// 用法: node scripts/verify-redesign.mjs [baseUrl]
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, readdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = resolve(root, '..', '..', 'redesign-shots');

function resolvePlaywrightCoreEntry() {
  const pnpmDir = resolve(root, 'node_modules/.pnpm');
  const candidate = readdirSync(pnpmDir)
    .filter(name => name.startsWith('playwright-core@'))
    .map(name => resolve(pnpmDir, name, 'node_modules/playwright-core/index.mjs'))
    .find(path => existsSync(path));
  if (!candidate) {
    throw new Error('playwright-core not found in the pnpm store; run `pnpm install` first.');
  }
  return pathToFileURL(candidate).href;
}

function resolveChromiumExecutable() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }
  const pwRoot = process.env.LOCALAPPDATA
    ? resolve(process.env.LOCALAPPDATA, 'ms-playwright')
    : resolve(process.env.HOME ?? '', 'AppData/Local/ms-playwright');
  if (!existsSync(pwRoot)) {
    return undefined;
  }
  const candidates = [];
  for (const entry of readdirSync(pwRoot)) {
    if (!entry.startsWith('chromium-')) {
      continue;
    }
    candidates.push(
      resolve(pwRoot, entry, 'chrome-win64/chrome.exe'),
      resolve(pwRoot, entry, 'chrome-win/chrome.exe'),
      resolve(pwRoot, entry, 'chrome-linux/chrome'),
    );
  }
  return candidates.find(path => existsSync(path));
}

const { chromium } = await import(resolvePlaywrightCoreEntry());
mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: '375-mobile', width: 375, height: 900 },
  { name: '768-tablet', width: 768, height: 1000 },
  { name: '1440-desktop', width: 1440, height: 900 },
];

const pages = [
  { name: 'home', path: '/' },
  { name: 'tool', path: '/json-prettify' },
  { name: 'tool-wide', path: '/html-wysiwyg-editor' },
  { name: 'about', path: '/about' },
];

const browser = await chromium.launch(
  resolveChromiumExecutable() ? { executablePath: resolveChromiumExecutable() } : {},
);

const problems = [];

try {
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => consoleErrors.push(`pageerror: ${err.message}`));

    for (const target of pages) {
      await page.goto(`${baseUrl}${target.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 1) {
        problems.push(`${vp.name} ${target.path}: horizontal overflow ${overflow}px`);
      }

      const file = `${target.name}__${vp.name}.png`;
      await page.screenshot({ path: resolve(outDir, file), fullPage: false });
    }

    if (consoleErrors.length > 0) {
      problems.push(`${vp.name} console errors: ${consoleErrors.slice(0, 5).join(' | ')}`);
    }

    await ctx.close();
  }

  // Ctrl+K palette check
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(500);
  const paletteVisible = await page.locator('.palette-modal').isVisible().catch(() => false);
  if (!paletteVisible) {
    problems.push('Ctrl+K did not open the command palette');
  }
  else {
    await page.screenshot({ path: resolve(outDir, 'command-palette__1440.png') });
  }
  await ctx.close();
}
finally {
  await browser.close();
}

console.log(`Screenshots -> ${outDir}`);
if (problems.length > 0) {
  console.log('\nPROBLEMS FOUND:');
  for (const p of problems) {
    console.log(` - ${p}`);
  }
  process.exitCode = 1;
}
else {
  console.log('\nNo layout/console problems detected.');
}
