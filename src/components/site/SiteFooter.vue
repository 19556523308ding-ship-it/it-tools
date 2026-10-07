<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import SiteLogo from './SiteLogo.vue';
import { categories } from '@/config/categories';
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';

const { pick, fill, lang } = useLang();

const year = new Date().getFullYear();

// 分类链接带上 category 参数，点进去直接落到已筛选的列表，
// 而不是全部指回 /#categories（那样 8 个链接点了没区别）。
// ⚠️ 对象式导航的 hash 必须单独写进 `hash` 字段，写成 path: '/#all-tools' 会被丢弃。
const categoryLinks = computed(() => categories.map(category => ({
  id: category.id,
  name: category.name[lang.value] ?? category.name.en,
  path: '/',
  hash: '#all-tools',
  query: { category: category.id },
})));

const resourceLinks = computed(() => [
  { name: pick(site.copy.nav.allTools), to: '/#all-tools' },
  { name: pick(site.copy.nav.about), to: '/about' },
  { name: 'GitHub', href: site.github, external: true },
]);
</script>

<template>
  <footer class="site-footer">
    <div class="site-container">
      <div class="site-footer__top">
        <div class="site-footer__brand">
          <RouterLink to="/" class="site-footer__logo">
            <SiteLogo :size="34" />
            <span class="site-footer__name">{{ site.name }}</span>
          </RouterLink>
          <p class="site-footer__slogan">
            {{ pick(site.copy.footer.slogan) }}
          </p>
          <p class="site-footer__desc">
            {{ site.description }}
          </p>
        </div>

        <div class="site-footer__cols">
          <div class="site-footer__col">
            <h3 class="site-footer__col-title">
              {{ pick(site.copy.nav.categories) }}
            </h3>
            <RouterLink
              v-for="link in categoryLinks"
              :key="link.id"
              :to="{ path: link.path, hash: link.hash, query: link.query }"
              class="site-footer__link"
            >
              {{ link.name }}
            </RouterLink>
          </div>

          <div class="site-footer__col">
            <h3 class="site-footer__col-title">
              {{ pick(site.copy.footer.resourcesTitle) }}
            </h3>
            <template v-for="link in resourceLinks" :key="link.name">
              <a
                v-if="link.external"
                :href="link.href"
                class="site-footer__link"
                target="_blank"
                rel="noopener"
              >{{ link.name }}</a>
              <RouterLink v-else :to="link.to" class="site-footer__link">
                {{ link.name }}
              </RouterLink>
            </template>
          </div>

          <div class="site-footer__col">
            <h3 class="site-footer__col-title">
              {{ pick(site.copy.footer.openSourceTitle) }}
            </h3>
            <a :href="site.licenseUrl" class="site-footer__link" target="_blank" rel="noopener">{{ site.license }}</a>
            <a :href="site.upstream" class="site-footer__link" target="_blank" rel="noopener">IT-Tools (Upstream)</a>
          </div>
        </div>
      </div>

      <div class="site-footer__bottom">
        <span>{{ fill(pick(site.copy.footer.copyright), { year }) }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 80px;
  padding: 48px 0 24px;
  border-top: 1px solid var(--border-soft);
  background: var(--grad-brand-soft);
}

.site-footer__top {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  justify-content: space-between;
}

.site-footer__brand {
  max-width: 360px;
}

.site-footer__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.site-footer__name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.site-footer__slogan {
  margin: 16px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--brand-blue);
}

.site-footer__desc {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.site-footer__cols {
  display: flex;
  flex-wrap: wrap;
  gap: 48px;
}

.site-footer__col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 130px;
}

.site-footer__col-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

.site-footer__link {
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--dur-fast);
}

.site-footer__link:hover {
  color: var(--brand-blue);
}

.site-footer__bottom {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--border-soft);
  font-size: 13px;
  color: var(--text-tertiary);
  text-align: center;
}

@media (max-width: 768px) {
  .site-footer__cols {
    gap: 32px;
  }
}
</style>
