<script setup lang="ts">
import { computed } from 'vue';
import { useCommandPaletteStore } from '@/modules/command-palette/command-palette.store';
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';

const commandPaletteStore = useCommandPaletteStore();
const { pick } = useLang();

const isMac = computed(() => window.navigator.userAgent.toLowerCase().includes('mac'));
</script>

<template>
  <button
    type="button"
    class="tool-search"
    :aria-label="pick(site.copy.hero.search)"
    @click="commandPaletteStore.open()"
  >
    <icon-mdi-magnify class="tool-search__icon" />

    <span class="tool-search__placeholder">
      {{ pick(site.copy.hero.searchPlaceholder) }}
    </span>

    <kbd class="tool-search__kbd">{{ isMac ? '⌘' : 'Ctrl' }} K</kbd>
  </button>
</template>

<style scoped>
.tool-search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 560px;
  height: 60px;
  padding: 0 20px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-pill);
  background-color: var(--bg-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--dur-base), box-shadow var(--dur-base), transform var(--dur-base);
}

.tool-search:hover {
  border-color: var(--border-brand);
  box-shadow: 0 12px 34px rgb(37 99 255 / 14%);
  transform: translateY(-2px);
}

.tool-search__icon {
  flex-shrink: 0;
  font-size: 22px;
  color: var(--brand-blue);
}

.tool-search__placeholder {
  flex: 1;
  font-size: 16px;
  color: var(--text-tertiary);
}

.tool-search__kbd {
  flex-shrink: 0;
  padding: 4px 10px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xs);
  background-color: var(--bg-soft);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .tool-search {
    height: 54px;
    padding: 0 16px;
  }

  .tool-search__placeholder {
    font-size: 15px;
  }
}
</style>
