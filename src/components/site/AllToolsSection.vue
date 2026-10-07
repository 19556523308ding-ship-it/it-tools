<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { activeCategoryId, clearCategory, pendingScrollTarget } from './home-filter';
import FeaturedToolCard from './FeaturedToolCard.vue';
import { useToolStore } from '@/tools/tools.store';
import { categories } from '@/config/categories';
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';

const toolStore = useToolStore();
const { pick, fill, lang } = useLang();
const route = useRoute();
const router = useRouter();

const keyword = ref('');

const total = computed(() => toolStore.tools.length);

const filteredTools = computed(() => {
  const activeId = activeCategoryId.value;
  const kw = keyword.value.trim().toLowerCase();

  return toolStore.tools.filter((tool) => {
    if (activeId) {
      const category = categories.find(c => c.id === activeId);
      if (category && !category.toolPaths.includes(tool.path)) {
        return false;
      }
    }
    if (kw) {
      return `${tool.name} ${tool.description}`.toLowerCase().includes(kw);
    }
    return true;
  });
});

/** 分类筛选 chip 上的双语分类名 */
function categoryLabel(category: { name: { en: string; zh: string } }) {
  return category.name[lang.value] ?? category.name.en;
}

function scrollToAllTools() {
  document.getElementById('all-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 分类卡片点了之后自动跳到全部工具区并应用筛选
watch(activeCategoryId, (id) => {
  if (id) {
    scrollToAllTools();
  }
});

/**
 * 支持 /#all-tools?category=security 这种深链：
 * 页脚的分类链接直接带上category 参数，点进来就已经筛好。
 */
function applyCategoryFromQuery(value: unknown) {
  const id = typeof value === 'string' ? value : null;
  if (!id) {
    return;
  }
  if (!categories.some(c => c.id === id)) {
    return;
  }
  activeCategoryId.value = id;
}

// 首次进入与query 变化（例如点了页脚某个分类）都要应用
watch(() => route.query.category, applyCategoryFromQuery, { immediate: true });

onMounted(() => {
  if (pendingScrollTarget.value === 'all-tools') {
    pendingScrollTarget.value = null;
    window.requestAnimationFrame(scrollToAllTools);
  }
});

/** 空状态：清掉关键词 + 分类，回到全部工具 */
function resetFilters() {
  keyword.value = '';
  clearCategory();
  // 同步清掉地址栏上的 ?category，否则刷新后又会被query 还原
  if (route.query.category) {
    const { category, ...rest } = route.query;
    router.replace({ path: route.path, hash: route.hash, query: rest });
  }
}

const hasFilters = computed(() => Boolean(keyword.value.trim()) || Boolean(activeCategoryId.value));
</script>

<template>
  <section id="all-tools" class="section">
    <div class="site-container">
      <div class="section-head">
        <div>
          <h2 class="section-title">
            {{ pick(site.copy.allTools.title) }}
          </h2>
          <p class="section-subtitle">
            {{ fill(pick(site.copy.allTools.subtitle), { count: total }) }}
          </p>
        </div>

        <div class="alltools-search">
          <icon-mdi-magnify class="alltools-search__icon" />
          <input
            v-model="keyword"
            type="search"
            class="alltools-search__input"
            :placeholder="pick(site.copy.allTools.search)"
            :aria-label="pick(site.copy.allTools.search)"
          >
        </div>
      </div>

      <div class="alltools-filters" role="group" :aria-label="pick(site.copy.nav.categories)">
        <button
          type="button"
          class="alltools-filter"
          :class="{ 'alltools-filter--active': activeCategoryId === null }"
          @click="clearCategory()"
        >
          {{ pick(site.copy.allTools.filterAll) }}
        </button>

        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          class="alltools-filter"
          :class="{ 'alltools-filter--active': activeCategoryId === category.id }"
          :style="{ '--chip-accent': category.accent }"
          @click="activeCategoryId = activeCategoryId === category.id ? null : category.id"
        >
          {{ categoryLabel(category) }}
        </button>
      </div>

      <div v-if="filteredTools.length === 0" class="alltools-empty">
        <icon-mdi-magnify-close-outline class="alltools-empty__icon" />
        <p class="alltools-empty__text">
          {{ pick(site.copy.allTools.noResults) }}
        </p>
        <button
          v-if="hasFilters"
          type="button"
          class="alltools-empty__reset jz-btn jz-btn--ghost"
          @click="resetFilters"
        >
          {{ pick(site.copy.allTools.clearFilters) }}
        </button>
      </div>

      <div v-else class="alltools-grid">
        <FeaturedToolCard
          v-for="tool in filteredTools"
          :key="tool.path"
          :tool="tool"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: 64px 0;
  scroll-margin-top: calc(var(--header-h) + 16px);
}

.alltools-search {
  position: relative;
  display: flex;
  align-items: center;
  width: 280px;
  max-width: 100%;
}

.alltools-search__icon {
  position: absolute;
  left: 14px;
  font-size: 18px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.alltools-search__input {
  width: 100%;
  height: 42px;
  padding: 0 14px 0 40px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-pill);
  background-color: var(--bg-card);
  font-family: inherit;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--dur-fast), box-shadow var(--dur-fast);
}

.alltools-search__input:focus {
  border-color: var(--border-brand);
  box-shadow: 0 0 0 3px rgb(37 99 255 / 10%);
}

.alltools-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.alltools-filter {
  height: 34px;
  padding: 0 16px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-pill);
  background-color: var(--bg-card);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--dur-fast);
}

.alltools-filter:hover {
  border-color: var(--border-brand);
  color: var(--brand-blue);
}

.alltools-filter--active {
  border-color: transparent;
  background: var(--grad-brand);
  color: #fff;
}

.alltools-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  text-align: center;
  color: var(--text-tertiary);
}

.alltools-empty__icon {
  font-size: 40px;
  opacity: 0.45;
}

.alltools-empty__text {
  margin: 0;
  font-size: 15px;
}

.alltools-empty__reset {
  margin-top: 4px;
}

.alltools-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .alltools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .alltools-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .alltools-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 640px) {
  .section {
    padding: 48px 0;
  }

  .alltools-search {
    width: 100%;
  }
}
</style>
