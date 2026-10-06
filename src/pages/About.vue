<script setup lang="ts">
import { computed } from 'vue';
import { useHead } from '@vueuse/head';
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';
import SiteLogo from '@/components/site/SiteLogo.vue';

const { pick } = useLang();

useHead(computed(() => ({
  title: `${pick(site.copy.nav.about)} - ${site.name}`,
})));
</script>

<template>
  <div class="about-page">
    <div class="site-container about-page__container">
      <div class="about-page__head">
        <SiteLogo :size="56" class="about-page__logo" />
        <h1 class="about-page__title">
          {{ site.name }}
        </h1>
        <p class="about-page__tagline">
          {{ site.tagline }}
        </p>
      </div>

      <c-markdown :markdown="pick(site.about.content)" class="about-page__body" />
    </div>
  </div>
</template>

<style scoped>
.about-page {
  padding: 48px 0 24px;
}

.about-page__container {
  max-width: 760px;
}

.about-page__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 40px;
}

.about-page__logo {
  margin-bottom: 16px;
}

.about-page__title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.about-page__tagline {
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--text-tertiary);
}

.about-page__body {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-secondary);
}
</style>
