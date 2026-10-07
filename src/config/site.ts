/**
 * Jinzhai Tools — 站点级品牌与文案配置（唯一来源）
 *
 * 所有组件引用这里，避免品牌名/域名/仓库地址/营销文案散落各处。
 * 文案以 { zh, en } 双语文案存放，组件通过 useLang().pick() 按当前语言选取。
 */

export const site = {
  name: 'Jinzhai Tools',
  nameZh: '金寨工具箱',
  tagline: 'MAKE DEVELOPMENT SIMPLER',
  description:
    'Jinzhai Tools 是一个免费开源的在线开发者工具集合，提供 JSON、Base64、UUID、Hash、网络、文本、图片等实用工具。',
  url: 'https://tools.jinzhai.icu',
  ogImage: 'https://tools.jinzhai.icu/og/jinzhai-tools.png',
  github: 'https://github.com/19556523308ding-ship-it/it-tools',
  upstream: 'https://github.com/CorentinTh/it-tools',
  license: 'GNU GPL v3',
  licenseUrl: 'https://www.gnu.org/licenses/gpl-3.0.html',

  copy: {
    nav: {
      home: { zh: '首页', en: 'Home' },
      allTools: { zh: '全部工具', en: 'All tools' },
      categories: { zh: '工具分类', en: 'Categories' },
      about: { zh: '关于', en: 'About' },
    },
    hero: {
      eyebrow: { zh: '免费 · 开源 · 开发者工具', en: 'FREE · OPEN SOURCE · DEVELOPER TOOLS' },
      title: { zh: '实用的在线工具，助力开发者', en: 'Handy online tools for developers' },
      subtitle: {
        zh: '一个现代化的在线工具集合，帮助开发者让工作更简单、更高效、更有创造力。',
        en: 'A modern collection of online tools to make development simpler, faster, and more creative.',
      },
      searchPlaceholder: { zh: '搜索 JSON、Base64、UUID…', en: 'Search JSON, Base64, UUID...' },
      search: { zh: '搜索工具', en: 'Search tools' },
      browseAll: { zh: '浏览全部工具', en: 'Browse all tools' },
      viewGitHub: { zh: '在 GitHub 上查看', en: 'View on GitHub' },
    },
    categories: {
      title: { zh: '工具分类', en: 'Tool categories' },
      subtitle: { zh: '按你的需求，快速找到合适的工具', en: 'Find the right tool for the job' },
    },
    featured: {
      title: { zh: '精选工具', en: 'Featured tools' },
      subtitle: { zh: '最受欢迎、最实用的工具精选', en: 'The most popular utilities, picked for you' },
    },
    openSource: {
      title: { zh: '免费且开源', en: 'Free and open source' },
      subtitle: { zh: '基于 IT-Tools 二次开发，遵循 GNU GPL v3', en: 'A fork of the open-source IT-Tools, under the GNU GPL v3' },
      body: {
        zh: 'Jinzhai Tools 永久免费、完全开源。如果你觉得好用，欢迎在 GitHub 上点个 Star，或提交 Issue 帮助我们改进。',
        en: 'Jinzhai Tools is free and fully open-source. If you find it useful, give it a Star on GitHub or open an issue.',
      },
      cta: { zh: '前往 GitHub', en: 'Go to GitHub' },
    },
    allTools: {
      title: { zh: '全部工具', en: 'All tools' },
      subtitle: { zh: '共 {count} 个实用工具', en: '{count} handy tools in total' },
      filterAll: { zh: '全部', en: 'All' },
      search: { zh: '搜索工具…', en: 'Search tools...' },
      noResults: {
        zh: '没有找到匹配的工具，换个关键词或清除筛选试试。',
        en: 'No tools match your search. Try another keyword or clear the filters.',
      },
      clearFilters: { zh: '清除筛选', en: 'Clear filters' },
    },
    related: {
      title: { zh: '相关工具', en: 'Related tools' },
    },
    footer: {
      slogan: { zh: '让开发更简单', en: 'Make development simpler' },
      aboutTitle: { zh: '关于', en: 'About' },
      resourcesTitle: { zh: '资源', en: 'Resources' },
      openSourceTitle: { zh: '开源', en: 'Open source' },
      copyright: {
        zh: '© {year} Jinzhai Tools · 基于开源项目 IT-Tools 构建',
        en: '© {year} Jinzhai Tools · Built on the open-source IT-Tools',
      },
    },
    theme: {
      toggle: { zh: '切换主题', en: 'Toggle theme' },
    },
  },

  about: {
    content: {
      zh: `# 关于 Jinzhai Tools

Jinzhai Tools 是一个免费、开源的在线开发者工具集合，致力于让常见的开发任务变得更简单、更快速。

目前包含 80+ 个在线工具，覆盖数据转换、JSON、文本、安全、网络、图片等领域。

## 开源

Jinzhai Tools 基于开源项目 [IT-Tools](https://github.com/CorentinTh/it-tools) 进行二次开发，遵循 [GNU GPL v3](https://www.gnu.org/licenses/gpl-3.0.html) 开源协议。

- Upstream：CorentinTh/it-tools
- Jinzhai Tools：19556523308ding-ship-it/it-tools

## 技术

Jinzhai Tools 采用 Vue 3 + Naive UI 构建，并部署于 Cloudflare Pages。部分工具使用了第三方开源库，完整列表见仓库 [package.json](https://github.com/19556523308ding-ship-it/it-tools/blob/main/package.json)。

## 反馈与贡献

如果你需要某个工具、发现了 Bug，或想参与贡献，欢迎在 [GitHub 仓库](https://github.com/19556523308ding-ship-it/it-tools/issues) 提交 Issue。`,
      en: `# About Jinzhai Tools

Jinzhai Tools is a free, open-source collection of online developer tools, built to make common development tasks simpler and faster.

It currently ships 80+ online tools covering data conversion, JSON, text, security, network, images and more.

## Open source

Jinzhai Tools is a fork of the open-source [IT-Tools](https://github.com/CorentinTh/it-tools), released under the [GNU GPL v3](https://www.gnu.org/licenses/gpl-3.0.html) license.

- Upstream: CorentinTh/it-tools
- Jinzhai Tools: 19556523308ding-ship-it/it-tools

## Technology

Jinzhai Tools is built with Vue 3 and Naive UI, and deployed on Cloudflare Pages. Some tools use third-party open-source libraries; the full list is in the repository [package.json](https://github.com/19556523308ding-ship-it/it-tools/blob/main/package.json).

## Feedback & contribution

If you need a tool, found a bug, or want to contribute, please open an issue in the [GitHub repository](https://github.com/19556523308ding-ship-it/it-tools/issues).`,
    },
  },
};

export type SiteConfig = typeof site;
export interface Bilingual { zh: string; en: string }
