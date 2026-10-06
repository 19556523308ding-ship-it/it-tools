<script lang="ts" setup>
import SiteHeader from '@/components/site/SiteHeader.vue';
import SiteFooter from '@/components/site/SiteFooter.vue';
</script>

<template>
  <div class="site-shell">
    <SiteHeader />

    <main class="site-main">
      <slot />
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.site-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-main {
  flex: 1 0 auto;
}
</style>
