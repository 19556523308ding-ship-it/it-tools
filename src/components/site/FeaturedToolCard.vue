<script setup lang="ts">
import type { ToolWithCategory } from '@/tools/tools.types';
import { categories, categoryIdByToolPath } from '@/config/categories';
import FavoriteButton from '@/components/FavoriteButton.vue';

defineProps<{ tool: ToolWithCategory }>();

// 分类色带：直接复用 config/categories.ts 里的 accent，不在这里重复写一份色值
function accentFor(path: string) {
  const id = categoryIdByToolPath[path];
  return categories.find(c => c.id === id)?.accent ?? 'var(--brand-blue)';
}
</script>

<template>
  <router-link
    :to="tool.path"
    class="jz-card featured-card"
    :style="{ '--card-accent': accentFor(tool.path) }"
  >
    <div class="featured-card__top">
      <n-icon class="featured-card__icon" size="26" :component="tool.icon" />

      <div class="featured-card__badges">
        <span v-if="tool.isNew" class="featured-card__badge featured-card__badge--new">
          {{ $t('toolCard.new') }}
        </span>
        <FavoriteButton :tool="tool" />
      </div>
    </div>

    <h3 class="featured-card__name">
      {{ tool.name }}
    </h3>

    <p class="featured-card__desc">
      {{ tool.description }}
    </p>

    <div class="featured-card__foot">
      <span class="featured-card__category">{{ tool.category }}</span>
      <icon-mdi-arrow-right class="jz-arrow featured-card__arrow" />
    </div>
  </router-link>
</template>

<style scoped>
.featured-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 22px;
  border: 1px solid var(--border-soft);
  border-top: 3px solid var(--card-accent);
  border-radius: var(--radius-md);
  background-color: var(--bg-card);
  box-shadow: var(--shadow-card);
  text-decoration: none;
  overflow: hidden;
}

.featured-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.featured-card__icon {
  color: var(--card-accent);
}

.featured-card__badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.featured-card__badge {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
}

.featured-card__badge--new {
  background-color: var(--grad-brand);
  color: #fff;
}

.featured-card__name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
}

.featured-card__desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.featured-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
}

.featured-card__category {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
}

.featured-card__arrow {
  font-size: 18px;
  color: var(--card-accent);
}
</style>
