/**
 * Jinzhai Tools — 工具分类配置
 *
 * ⚠️ 约定：分类数量一律用 `category.toolPaths.length` 动态计算，禁止在模板里硬编码数字。
 * 这里维护「分类 → 工具 path 列表」的映射；新增工具时只需把 path 加进相应分类，
 * 首页分类数量会自动变化。（与 src/tools/index.ts 的 86 个工具 path 一一对应）
 */

export interface SiteCategory {
  id: string
  name: string
  /** tabler 图标 key，见 components/site/category-icons.ts 的映射 */
  icon: string
  accent: string
  toolPaths: string[]
}

export const categories: SiteCategory[] = [
  {
    id: 'json',
    name: 'JSON',
    icon: 'braces',
    accent: '#2563ff',
    toolPaths: [
      '/json-prettify',
      '/json-minify',
      '/json-to-csv',
      '/json-diff',
      '/json-to-yaml-converter',
      '/yaml-to-json-converter',
      '/json-to-toml',
      '/toml-to-json',
      '/json-to-xml',
      '/xml-to-json',
    ],
  },
  {
    id: 'convert',
    name: '转换',
    icon: 'switch',
    accent: '#06b6d4',
    toolPaths: [
      '/date-converter',
      '/base-converter',
      '/roman-numeral-converter',
      '/color-converter',
      '/list-converter',
      '/toml-to-yaml',
      '/yaml-to-toml',
      '/temperature-converter',
      '/phone-parser-and-formatter',
      '/iban-validator-and-parser',
    ],
  },
  {
    id: 'codec',
    name: '编码/解码',
    icon: 'code',
    accent: '#14b8a6',
    toolPaths: [
      '/base64-string-converter',
      '/base64-file-converter',
      '/url-encoder',
      '/html-entities',
      '/text-to-binary',
      '/text-to-unicode',
      '/text-to-nato-alphabet',
    ],
  },
  {
    id: 'web',
    name: '网络',
    icon: 'world',
    accent: '#3b82ff',
    toolPaths: [
      '/url-parser',
      '/device-information',
      '/og-meta-generator',
      '/mime-types',
      '/keycode-info',
      '/user-agent-parser',
      '/http-status-codes',
      '/safelink-decoder',
      '/email-normalizer',
      '/ipv4-subnet-calculator',
      '/ipv4-address-converter',
      '/ipv4-range-expander',
      '/ipv6-ula-generator',
      '/mac-address-generator',
      '/mac-address-lookup',
    ],
  },
  {
    id: 'image',
    name: '图片',
    icon: 'photo',
    accent: '#8b5cf6',
    toolPaths: [
      '/qrcode-generator',
      '/wifi-qrcode-generator',
      '/svg-placeholder-generator',
      '/camera-recorder',
    ],
  },
  {
    id: 'text',
    name: '文本',
    icon: 'text',
    accent: '#f59e0b',
    toolPaths: [
      '/case-converter',
      '/slugify-string',
      '/string-obfuscator',
      '/text-diff',
      '/text-statistics',
      '/lorem-ipsum-generator',
      '/emoji-picker',
      '/numeronym-generator',
      '/ascii-text-drawer',
    ],
  },
  {
    id: 'security',
    name: '安全',
    icon: 'shield',
    accent: '#ef4444',
    toolPaths: [
      '/token-generator',
      '/hash-text',
      '/hmac-generator',
      '/bcrypt',
      '/encryption',
      '/bip39-generator',
      '/uuid-generator',
      '/ulid-generator',
      '/rsa-key-pair-generator',
      '/password-strength-analyser',
      '/pdf-signature-checker',
      '/otp-generator',
      '/basic-auth-generator',
      '/jwt-parser',
    ],
  },
  {
    id: 'dev',
    name: '开发',
    icon: 'tool',
    accent: '#0ea5e9',
    toolPaths: [
      '/git-memo',
      '/crontab-generator',
      '/chmod-calculator',
      '/docker-run-to-docker-compose-converter',
      '/random-port-generator',
      '/regex-tester',
      '/regex-memo',
      '/sql-prettify',
      '/xml-formatter',
      '/yaml-prettify',
      '/markdown-to-html',
      '/html-wysiwyg-editor',
      '/math-evaluator',
      '/percentage-calculator',
      '/eta-calculator',
      '/chronometer',
      '/benchmark-builder',
    ],
  },
];

/** 分类 id → 分类（便捷查询） */
export const categoryById = Object.fromEntries(categories.map(c => [c.id, c]));

/** 工具 path → 分类 id（用于工具页面包屑与相关分类） */
export const categoryIdByToolPath: Record<string, string> = Object.fromEntries(
  categories.flatMap(c => c.toolPaths.map(p => [p, c.id])),
);
