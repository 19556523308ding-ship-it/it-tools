<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import SiteLogo from './SiteLogo.vue';
import { useStyleStore } from '@/stores/style.store';
import { useCommandPaletteStore } from '@/modules/command-palette/command-palette.store';
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';

const styleStore = useStyleStore();
const { isDarkTheme } = storeToRefs(styleStore);
const commandPaletteStore = useCommandPaletteStore();
const { pick } = useLang();
const route = useRoute();

const isMenuOpen = ref(false);
const isMac = computed(() => window.navigator.userAgent.toLowerCase().includes('mac'));

// 路由变化时自动收起移动端菜单
watch(() => route.fullPath, () => {
  isMenuOpen.value = false;
});

const navLinks = computed(() => [
  { label: pick(site.copy.nav.home), to: '/' },
  { label: pick(site.copy.nav.allTools), to: '/#all-tools' },
  { label: pick(site.copy.nav.categories), to: '/#categories' },
  { label: pick(site.copy.nav.about), to: '/about' },
]);
</script>

<template>
  <header class="site-header">
    <div class="site-container site-header__inner">
      <RouterLink to="/" class="site-header__brand" aria-label="Jinzhai Tools 首页">
        <SiteLogo :size="34" />
        <span class="site-header__brand-text">
          {{ site.name }}
        </span>
      </RouterLink>

      <nav class="site-header__nav" aria-label="主导航">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="site-header__link"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="site-header__actions">
        <button
          class="site-header__search"
          type="button"
          :aria-label="pick(site.copy.hero.search)"
          @click="commandPaletteStore.open()"
        >
          <icon-mdi-magnify />
          <span class="site-header__search-label">{{ pick(site.copy.hero.search) }}</span>
          <kbd class="site-header__kbd">{{ isMac ? '⌘' : 'Ctrl' }} K</kbd>
        </button>

        <c-tooltip :tooltip="pick(site.copy.theme.toggle)">
          <c-button
            quaternary
            circle
            :aria-label="pick(site.copy.theme.toggle)"
            @click="styleStore.toggleDark()"
          >
            <icon-mdi-white-balance-sunny v-if="!isDarkTheme" />
            <icon-mdi-weather-night v-else />
          </c-button>
        </c-tooltip>

        <locale-selector class="site-header__locale" />

        <c-tooltip tooltip="GitHub">
          <c-button
            quaternary
            circle
            tag="a"
            :href="site.github"
            target="_blank"
            rel="noopener"
            aria-label="GitHub"
          >
            <icon-mdi-github />
          </c-button>
        </c-tooltip>

        <button
          class="site-header__burger"
          type="button"
          aria-label="菜单"
          :aria-expanded="isMenuOpen"
          @click="isMenuOpen = !isMenuOpen"
        >
          <icon-mdi-menu v-if="!isMenuOpen" />
          <icon-mdi-close v-else />
        </button>
      </div>
    </div>

    <transition name="jz-menu">
      <nav v-if="isMenuOpen" class="site-header__mobile" aria-label="移动端导航">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="site-header__mobile-link"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </transition>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: color-mix(in srgb, var(--bg-page) 88%, transparent);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border-soft);
}

.site-header__inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: var(--header-h);
}

.site-header__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}

.site-header__brand-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  background: var(--grad-brand);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.site-header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: auto;
}

.site-header__link {
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--dur-fast), background-color var(--dur-fast);
}

.site-header__link:hover {
  color: var(--brand-blue);
  background-color: var(--bg-soft);
}

.site-header__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.site-header__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 10px 0 14px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-pill);
  background-color: var(--bg-card);
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  transition: border-color var(--dur-fast), box-shadow var(--dur-fast);
}

.site-header__search:hover {
  border-color: var(--border-brand);
  box-shadow: 0 0 0 3px rgb(37 99 255 / 8%);
}

.site-header__search-label {
  min-width: 72px;
  text-align: left;
}

.site-header__kbd {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border: 1px solid var(--border-soft);
  border-radius: 6px;
  background-color: var(--bg-soft);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 16px;
  color: var(--text-tertiary);
}

.site-header__burger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  background-color: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
}

.site-header__mobile {
  display: none;
  flex-direction: column;
  padding: 8px 24px 16px;
  border-top: 1px solid var(--border-soft);
  background-color: var(--bg-card);
}

.site-header__mobile-link {
  padding: 12px 4px;
  border-bottom: 1px solid var(--border-soft);
  color: var(--text-primary);
  font-size: 15px;
  text-decoration: none;
}

.site-header__mobile-link:last-child {
  border-bottom: none;
}

.jz-menu-enter-active,
.jz-menu-leave-active {
  transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
}

.jz-menu-enter-from,
.jz-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 900px) {
  .site-header__nav,
  .site-header__search-label,
  .site-header__kbd,
  .site-header__locale {
    display: none;
  }

  .site-header__burger,
  .site-header__mobile {
    display: flex;
  }
}
</style>
