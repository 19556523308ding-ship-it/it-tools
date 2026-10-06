<script setup lang="ts">
import { computed } from 'vue';
import { getCategoryIcon } from './category-icons';
import { selectCategory } from './home-filter';
import type { SiteCategory } from '@/config/categories';
import { useLang } from '@/composable/useLang';

const props = defineProps<{ category: SiteCategory }>();
const { lang } = useLang();

const icon = computed(() => getCategoryIcon(props.category.icon));

// 数量永远从 toolPaths.length 动态算，新增工具自动更新
const count = computed(() => props.category.toolPaths.length);
const unit = computed(() => (lang.value === 'zh' ? '个工具' : 'tools'));
</script>

<template>
  <button
    type="button"
    class="category-card jz-card"
    :style="{ '--category-accent': category.accent }"
    @click="selectCategory(category.id)"
  >
    <span class="category-card__icon">
      <component :is="icon" />
    </span>

    <span class="category-card__body">
      <span class="category-card__name">{{ category.name }}</span>
      <span class="category-card__count">{{ count }} {{ unit }}</span>
    </span>

    <icon-mdi-chevron-right class="category-card__arrow jz-arrow" />
  </button>
</template>

<style scoped>
.category-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 18px 20px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  background-color: var(--bg-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  text-align: left;
}

.category-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  font-size: 24px;
  color: var(--category-accent);
  background-color: color-mix(in srgb, var(--category-accent) 12%, transparent);
}

.category-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.category-card__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.category-card__count {
  font-size: 13px;
  color: var(--text-tertiary);
}

.category-card__arrow {
  flex-shrink: 0;
  font-size: 20px;
  color: var(--text-tertiary);
}
</style>
