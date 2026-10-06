<script setup lang="ts">
import { computed } from 'vue';
import FeaturedToolCard from './FeaturedToolCard.vue';
import { useToolStore } from '@/tools/tools.store';
import { featuredToolPaths } from '@/config/featured-tools';
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';

const toolStore = useToolStore();
const { pick } = useLang();

// 只维护 path，名字/描述/图标/分类全部从 toolStore 动态取，永远跟工具数据同步
const tools = computed(() => featuredToolPaths
  .map(path => toolStore.tools.find(tool => tool.path === path))
  .filter(Boolean));
</script>

<template>
  <section class="section">
    <div class="site-container">
      <div class="section-head">
        <div>
          <h2 class="section-title">
            {{ pick(site.copy.featured.title) }}
          </h2>
          <p class="section-subtitle">
            {{ pick(site.copy.featured.subtitle) }}
          </p>
        </div>
      </div>

      <div class="featured-grid">
        <FeaturedToolCard
          v-for="tool in tools"
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
}

.featured-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .featured-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .featured-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .section {
    padding: 48px 0;
  }
}
</style>
