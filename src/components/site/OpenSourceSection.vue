<script setup lang="ts">
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';

const { pick } = useLang();
</script>

<template>
  <section class="section">
    <div class="site-container">
      <div class="opensource">
        <div class="opensource__icon" aria-hidden="true">
          <icon-mdi-github />
        </div>

        <div class="opensource__body">
          <h2 class="opensource__title">
            {{ pick(site.copy.openSource.title) }}
          </h2>
          <p class="opensource__subtitle">
            {{ pick(site.copy.openSource.subtitle) }}
          </p>
          <p class="opensource__text">
            {{ pick(site.copy.openSource.body) }}
          </p>
        </div>

        <a
          :href="site.github"
          class="opensource__cta"
          target="_blank"
          rel="noopener"
        >
          {{ pick(site.copy.openSource.cta) }}
          <icon-mdi-arrow-top-right />
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: 32px 0;
}

.opensource {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
  border: 1px solid var(--border-brand);
  border-radius: var(--radius-lg);
  background: var(--grad-brand-soft);
}

.opensource__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--grad-brand);
  color: #fff;
  font-size: 28px;
  box-shadow: var(--shadow-brand);
}

.opensource__body {
  flex: 1;
  min-width: 0;
}

.opensource__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.opensource__subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--brand-blue);
}

.opensource__text {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.opensource__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 44px;
  padding: 0 20px;
  border-radius: var(--radius-pill);
  background: var(--grad-brand);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--shadow-brand);
  transition: transform var(--dur-base) var(--ease-out);
}

.opensource__cta:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .opensource {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
  }
}
</style>
