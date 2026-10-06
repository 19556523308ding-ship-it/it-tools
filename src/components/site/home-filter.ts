import { ref } from 'vue';

/**
 * 首页「分类卡片 → 全部工具」的跨组件共享筛选状态。
 * 用模块级 ref 而不是 Pinia store：这个状态只在首页内部用，不需要持久化，
 * 也不值得为此多一个 store。
 */
export const activeCategoryId = ref<string | null>(null);

/** 首页 hash 路由跳转后要滚动的目标 */
export const pendingScrollTarget = ref<string | null>(null);

export function selectCategory(id: string) {
  activeCategoryId.value = activeCategoryId.value === id ? null : id;
  pendingScrollTarget.value = 'all-tools';
}

export function clearCategory() {
  activeCategoryId.value = null;
}
