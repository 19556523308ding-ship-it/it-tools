<script setup lang="ts">
import LogoMark from '@/assets/brand/logo-mark.svg?component';

withDefaults(defineProps<{ size?: number }>(), { size: 32 });
</script>

<template>
  <LogoMark class="site-logo" :style="{ width: `${size}px`, height: `${size}px` }" role="img" aria-label="Jinzhai Tools" />
</template>

<style scoped>
.site-logo {
  display: block;
  flex-shrink: 0;
}
</style>
