// 用本地 Chromium 把 OG 模板渲染成 1200x630 PNG。
// 用法: node scripts/generate-og-image.mjs
//
// playwright-core 是 pnpm 的间接依赖，没有被提升到顶层 node_modules，
// 所以这里按需从 .pnpm store 里解析它的 ESM 入口。
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, readdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const templatePath = resolve(root, 'scripts/og-image.template.html');
const outDir = resolve(root, 'public/og');
const outPath = resolve(outDir, 'jinzhai-tools.png');

// 找到 node_modules/.pnpm/playwright-core@<version>/node_modules/playwright-core/index.mjs
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

const { chromium } = await import(resolvePlaywrightCoreEntry());

// playwright-core 的版本可能与本机已安装的 Chromium 修订号不一致，
// 因此显式指定可执行文件（可通过 CHROMIUM_PATH 覆盖）。
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
      resolve(pwRoot, entry, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'),
    );
  }

  return candidates.find(path => existsSync(path));
}

const executablePath = resolveChromiumExecutable();

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch(executablePath ? { executablePath } : {});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(templatePath).href, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outPath, type: 'png' });
  console.log(`OG image written: ${outPath}`);
} finally {
  await browser.close();
}

// 保留 require 引用，避免打包器把 createRequire 判定为未使用
void createRequire;
