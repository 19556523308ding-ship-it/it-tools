<script setup lang="ts">
import { computed } from 'vue';
import FeaturedToolCard from './FeaturedToolCard.vue';
import { useToolStore } from '@/tools/tools.store';
import { categories, categoryIdByToolPath } from '@/config/categories';
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';

const props = defineProps<{ currentPath: string }>();

const toolStore = useToolStore();
const { pick } = useLang();

// 同分类下、排除当前工具，最多取 4 个
const relatedTools = computed(() => {
  const categoryId = categoryIdByToolPath[props.currentPath];
  if (!categoryId) {
    return [];
  }

  const category = categories.find(c => c.id === categoryId);
  if (!category) {
    return [];
  }

  return category.toolPaths
    .filter(path => path !== props.currentPath)
    .map(path => toolStore.tools.find(tool => tool.path === path))
    .filter(Boolean)
    .slice(0, 4);
});
</script>

<template>
  <section v-if="relatedTools.length > 0" class="related">
    <div class="site-container">
      <div class="section-head">
        <div>
          <h2 class="section-title">
            {{ pick(site.copy.related.title) }}
          </h2>
        </div>
      </div>

      <div class="related__grid">
        <FeaturedToolCard
          v-for="tool in relatedTools"
          :key="tool.path"
          :tool="tool"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.related {
  padding: 40px 0 8px;
}

.related__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .related__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .related__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
