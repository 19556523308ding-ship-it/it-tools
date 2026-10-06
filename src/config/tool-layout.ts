/**
 * Jinzhai Tools — 需要「宽布局」的工具列表
 *
 * 为什么放在 config 而不是 86 个工具的 metadata 里：
 * 改版原则是「不重写 86 个工具」，所以不去动 src/tools/**。
 * 这里用一份 path 白名单，让 tool.layout.vue 决定容器宽度。
 *
 * 判断标准：编辑器 / 对比 / 大表格类工具，600px 明显太窄。
 */
export const wideToolPaths: string[] = [
  '/json-diff',
  '/text-diff',
  '/html-wysiwyg-editor',
  '/sql-prettify',
  '/xml-formatter',
  '/yaml-prettify',
  '/json-prettify',
  '/docker-run-to-docker-compose-converter',
  '/chmod-calculator',
  '/crontab-generator',
  '/markdown-to-html',
  '/benchmark-builder',
  '/math-evaluator',
  '/git-memo',
  '/regex-tester',
  '/emoji-picker',
  '/roman-numeral-converter',
  '/json-to-yaml-converter',
  '/yaml-to-json-converter',
  '/benchmark-generator',
  '/color-converter',
];

const wideToolSet = new Set(wideToolPaths);

export function isWideTool(path: string): boolean {
  return wideToolSet.has(path);
}
