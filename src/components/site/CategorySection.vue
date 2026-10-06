<script setup lang="ts">
import CategoryCard from './CategoryCard.vue';
import { categories } from '@/config/categories';
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';

const { pick } = useLang();
</script>

<template>
  <section id="categories" class="section">
    <div class="site-container">
      <div class="section-head">
        <div>
          <h2 class="section-title">
            {{ pick(site.copy.categories.title) }}
          </h2>
          <p class="section-subtitle">
            {{ pick(site.copy.categories.subtitle) }}
          </p>
        </div>
      </div>

      <div class="category-grid">
        <CategoryCard
          v-for="category in categories"
          :key="category.id"
          :category="category"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: 64px 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 480px) {
  .section {
    padding: 48px 0;
  }
}
</style>
