/**
 * 构建后预渲染：为每个路由生成一份带完整 SEO 信息的静态 HTML。
 *
 * 为什么要这个：SPA 的 index.html 对所有路由都是同一份（2.6 KB 空壳），
 * 爬虫首抓看不到任何正文，canonical 还全部指向首页 —— 86 个工具页在
 * Google 眼里等于同一个页面。本脚本在 vite build 之后按路由写出
 * dist/<path>/index.html，把真实的title / description / keywords /
 * canonical / OG / JSON-LD 写进去，交互仍由原来的 SPA 负责。
 *
 * 用法: node scripts/prerender.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

const SITE_URL = 'https://tools.jinzhai.icu';
const SITE_NAME = 'Jinzhai Tools';

/**
 * 极简 YAML 取值。locales/en.yml 里 `tools.<tool>.title` 是三层缩进，
 * 所以必须按缩进层级建树，不能只处理两层。
 */
function parseLocale(file) {
  const out = {};
  if (!existsSync(file)) return out;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  /** 每一层记录「缩进 → 该层最后一个键」，用于回溯父节点 */
  const stack = [];

  for (const raw of lines) {
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;

    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();
    const m = line.match(/^([\w'".-]+):\s*(.*)$/);
    if (!m) continue;

    const [, key, rawValue] = m;
    const value = rawValue.replace(/^['"]|['"]$/g, '').replace(/''/g, "'");

    // 弹出所有缩进大于等于当前层的栈帧
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack.length > 0 ? stack[stack.length - 1] : null;
    let container;
    if (parent) {
      container = parent.node;
    } else {
      container = out;
    }

    if (value === '') {
      const node = {};
      container[key] = node;
      stack.push({ indent, node, key });
    } else {
      container[key] = value;
    }
  }
  return out;
}

const en = parseLocale(resolve(root, 'locales/en.yml'));

/**
 * 静态提取工具列表。
 * 工具的 name/description 来自 translate('tools.<key>.title')，
 * 因此从 locale 反查；keywords 直接在源码里，是纯数组，可直接解析。
 */
function collectTools() {
  const toolsDir = resolve(root, 'src/tools');
  const tools = [];

  for (const dirName of readdirSync(toolsDir)) {
    const file = join(toolsDir, dirName, 'index.ts');
    if (!existsSync(file)) continue;
    const src = readFileSync(file, 'utf8');

    const path = (src.match(/path:\s*'([^']+)'/) || [])[1];
    if (!path) continue;

    // translate('tools.<key>.title') —— key 可能含点号
    const titleKey = (src.match(/name:\s*translate\('tools\.([\w.-]+)\.title'\)/) || [])[1];
    const descKey = (src.match(/description:\s*translate\('tools\.([\w.-]+)\.description'\)/) || [])[1];

    // 少数工具直接写死字符串
    const rawName = (src.match(/name:\s*'([^']+)'/) || [])[1];
    const rawDesc = (src.match(/description:\s*'([^']*)'/) || [])[1];

    const title = (titleKey && en.tools?.[titleKey]?.title) || rawName || dirName;
    const description = (descKey && en.tools?.[descKey]?.description) || rawDesc || '';

    const kwMatch = src.match(/keywords:\s*\[([^\]]*)\]/);
    const keywords = kwMatch
      ? kwMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
      : [];

    tools.push({ path: path.replace(/^\//, ''), dir: dirName, title, description, keywords });
  }

  return tools;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 描述后缀：把工具自己的关键词自然带进 description，覆盖长尾搜索 */
function buildDescription(tool) {
  const base = tool.description.replace(/\s+/g, ' ').trim();
  const kw = tool.keywords.slice(0, 8).join(', ');
  let d = base;
  if (kw) d += ` (${kw})`;
  d += ` — free online tool by ${SITE_NAME}.`;
  // 控制在 ~300 字符内，超出会被Google 截断
  return d.length > 300 ? d.slice(0, 297).trimEnd() + '…' : d;
}

function buildTitle(tool) {
  return `${tool.title} - ${SITE_NAME}`;
}

/** 工具页 JSON-LD：SoftwareApplication */
function softwareJsonLd(tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${tool.title} - ${SITE_NAME}`,
    url: `${SITE_URL}/${tool.path}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    description: tool.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
    ...(tool.keywords.length ? { keywords: tool.keywords.join(', ') } : {}),
  };
}

function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/#all-tools?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

function breadcrumbJsonLd(tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'All tools', item: `${SITE_URL}/#all-tools` },
      { '@type': 'ListItem', position: 3, name: tool.title, item: `${SITE_URL}/${tool.path}` },
    ],
  };
}

/**
 * 页面输出路径。
 *
 * 用 `<path>.html` 而不是 `<path>/index.html`：Cloudflare Pages 看到目录会自动
 * 308 补尾斜杠（/json-prettify -> /json-prettify/），每个工具页都白白多一跳。
 * 写成 .html 文件则不会触发补斜杠，再由 _redirects 把无后缀URL 301 到 .html。
 */
function outputFileFor(routePath) {
  return routePath === '' ? 'index.html' : `${routePath}.html`;
}
function injectHead(html, { title, description, keywords, canonical, jsonLd, ogType }) {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    keywords ? `<meta name="keywords" content="${esc(keywords)}" />` : '',
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${SITE_URL}/og/jinzhai-tools.png" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${SITE_URL}/og/jinzhai-tools.png" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '',
  ].filter(Boolean).join('\n    ');

  // 去掉原有的 title/description/canonical/og/twitter，再插入新的
  let out = html
    .replace(/<title>[^<]*<\/title>\s*/g, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/g, '')
    .replace(/<meta\s+itemprop="name"[^>]*>\s*/g, '')
    .replace(/<meta\s+itemprop="description"[^>]*>\s*/g, '')
    .replace(/<meta\s+name="keywords"[^>]*>\s*/g, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/g, '')
    .replace(/<meta\s+property="og:[^>]*>\s*/g, '')
    .replace(/<meta\s+name="twitter:[^>]*>\s*/g, '');

  return out.replace('</head>', `    ${tags}\n  </head>`);
}

const template = readFileSync(resolve(dist, 'index.html'), 'utf8');
const tools = collectTools();
console.log(`已解析 ${tools.length} 个工具元信息`);

// 清理上一轮可能残留的目录式产物（早期版本输出 <path>/index.html，会被
// Cloudflare 自动补尾斜杠）。只删「本脚本会生成的」那些目录，不碰
// assets / icons / og 等真实资源目录。
{
  const KEEP = new Set(['assets', 'icons', 'og', 'api']);
  let removed = 0;
  for (const entry of readdirSync(dist, { withFileTypes: true })) {
    if (!entry.isDirectory() || KEEP.has(entry.name)) continue;
    const asIndex = join(dist, entry.name, 'index.html');
    if (existsSync(asIndex) || existsSync(join(dist, `${entry.name}.html`))) {
      rmSync(join(dist, entry.name), { recursive: true, force: true });
      removed++;
    }
  }
  if (removed > 0) console.log(`清理旧的目录式产物: ${removed} 个`);
}

let written = 0;

// ---- 首页 ----
{
  const home = injectHead(template, {
    title: `${SITE_NAME} - Free online developer tools for JSON, Base64, UUID, Hash and more`,
    description:
      `${SITE_NAME} is a free, open-source collection of online developer tools: JSON formatter, Base64 encoder, UUID generator, Hash calculator, timestamp converter, regex tester and 80+ more. Everything runs in your browser — your data never leaves the device.`,
    keywords: 'developer tools,online tools,json formatter,base64,uuid generator,hash calculator,free developer tools,open source,Jinzhai Tools,开发者工具,在线工具,JSON格式化,Base64,UUID生成,Hash计算',
    canonical: `${SITE_URL}/`,
    ogType: 'website',
    jsonLd: [websiteJsonLd()],
  });
  writeFileSync(resolve(dist, 'index.html'), home);
  written++;
}

// ---- About ----
{
  const about = injectHead(template, {
    title: `About - ${SITE_NAME}`,
    description: `${SITE_NAME} is a free and open-source collection of ${tools.length} online developer tools, forked from IT-Tools and released under the GNU GPL v3 license.`,
    keywords: `about,${SITE_NAME},open source,developer tools,GPL`,
    canonical: `${SITE_URL}/about`,
    ogType: 'article',
    jsonLd: null,
  });
  const dir = resolve(dist, 'about');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dist, outputFileFor('about')), about);
  written++;
  rmSync(dir, { recursive: true, force: true });
}

// ---- 86 个工具页 ----
for (const tool of tools) {
  const html = injectHead(template, {
    title: buildTitle(tool),
    description: buildDescription(tool),
    keywords: tool.keywords.join(', '),
    canonical: `${SITE_URL}/${tool.path}`,
    ogType: 'article',
    jsonLd: [softwareJsonLd(tool), breadcrumbJsonLd(tool)],
  });
  writeFileSync(resolve(dist, outputFileFor(tool.path)), html);
  written++;
}

// ---- sitemap.xml ----
{
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${SITE_URL}/about`, priority: '0.5', changefreq: 'monthly' },
    ...tools.map(t => ({ loc: `${SITE_URL}/${t.path}`, priority: '0.8', changefreq: 'monthly' })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  writeFileSync(resolve(dist, 'sitemap.xml'), xml);
  console.log(`sitemap.xml: ${urls.length} 条 URL`);
}

// ---- robots.txt（静态那份也要声明 sitemap）----
{
  const robots = `User-agent: *
Allow: /
Disallow:

Sitemap: ${SITE_URL}/sitemap.xml
`;
  writeFileSync(resolve(dist, 'robots.txt'), robots);
}

console.log(`✅ 预渲染完成：${written} 个页面（首页 + About + ${tools.length} 个工具）`);

// ---- 抽样自检 ----
const sample = tools[0];
const check = readFileSync(resolve(dist, outputFileFor(sample.path)), 'utf8');
const checks = [
  ['title', check.includes(`<title>${sample.title} - ${SITE_NAME}</title>`)],
  ['canonical', check.includes(`rel="canonical" href="${SITE_URL}/${sample.path}"`)],
  ['description', check.includes('name="description"')],
  ['keywords', check.includes('name="keywords"')],
  ['json-ld', check.includes('SoftwareApplication')],
  ['breadcrumb', check.includes('BreadcrumbList')],
  ['无残留默认 canonical', !check.includes(`rel="canonical" href="${SITE_URL}/"`)],
];
console.log(`\n自检 ${sample.path}:`);
for (const [label, ok] of checks) console.log(`  ${ok ? '✅' : '❌'} ${label}`);

const sitemapCheck = readFileSync(resolve(dist, 'sitemap.xml'), 'utf8');
console.log(`\n  ${sitemapCheck.startsWith('<?xml') ? '✅' : '❌'} sitemap 是合法 XML`);
console.log(`  ${(readFileSync(resolve(dist, 'robots.txt'), 'utf8')).includes('Sitemap:') ? '✅' : '❌'} robots.txt 声明了 Sitemap`);
