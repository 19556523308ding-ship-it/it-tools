import type { Component } from 'vue';

import CodeBraces from '~icons/mdi/code-braces';
import SwapHorizontal from '~icons/mdi/swap-horizontal';
import CodeTags from '~icons/mdi/code-tags';
import Web from '~icons/mdi/web';
import Image from '~icons/mdi/image';
import Text from '~icons/mdi/text';
import Shield from '~icons/mdi/shield';
import Wrench from '~icons/mdi/wrench';

/**
 * 分类 id/图标 key → 图标组件。
 * config/categories.ts 里只存字符串 key，这里负责映射到真实图标，
 * 这样配置文件保持纯数据、可读，也不用在配置里 import 组件。
 */
export const categoryIcons: Record<string, Component> = {
  braces: CodeBraces,
  switch: SwapHorizontal,
  code: CodeTags,
  world: Web,
  photo: Image,
  text: Text,
  shield: Shield,
  tool: Wrench,
};

export function getCategoryIcon(iconKey: string): Component {
  return categoryIcons[iconKey] ?? CodeBraces;
}
