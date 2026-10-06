<script lang="ts" setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useHead } from '@vueuse/head';
import type { HeadObject } from '@vueuse/head';

import BaseLayout from './base.layout.vue';
import FavoriteButton from '@/components/FavoriteButton.vue';
import RelatedTools from '@/components/site/RelatedTools.vue';
import { categories, categoryIdByToolPath } from '@/config/categories';
import { isWideTool } from '@/config/tool-layout';
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';
import type { Tool } from '@/tools/tools.types';

const route = useRoute();
const { t } = useI18n();
const { pick } = useLang();

const i18nKey = computed<string>(() => route.path.trim().replace('/', ''));
const toolTitle = computed<string>(() => t(`tools.${i18nKey.value}.title`, String(route.meta.name)));
const toolDescription = computed<string>(() => t(`tools.${i18nKey.value}.description`, String(route.meta.description)));

const categoryId = computed<string | undefined>(() => categoryIdByToolPath[route.path]);
const categoryName = computed<string | undefined>(() => categories.find(c => c.id === categoryId.value)?.name);

const isWide = computed(() => isWideTool(route.path));

const canonical = computed<string>(() => `${site.url}${route.path}`);

// 工具页 SEO：品牌化为 Jinzhai Tools，canonical 指向自己的域名
const head = computed<HeadObject>(() => ({
  title: `${toolTitle.value} - ${site.name}`,
  link: [
    { rel: 'canonical', href: canonical.value },
  ],
  meta: [
    {
      name: 'description',
      content: toolDescription.value,
    },
    {
      name: 'keywords',
      content: ((route.meta.keywords ?? []) as string[]).join(','),
    },
    {
      property: 'og:title',
      content: `${toolTitle.value} - ${site.name}`,
    },
    {
      property: 'og:description',
      content: toolDescription.value,
    },
    {
      property: 'og:url',
      content: canonical.value,
    },
  ],
}));
useHead(head);
</script>

<template>
  <BaseLayout>
    <div class="tool-page" :class="isWide ? 'tool-page--wide' : 'tool-page--normal'">
      <div class="site-container">
        <nav class="tool-breadcrumb" aria-label="面包屑">
          <RouterLink to="/" class="tool-breadcrumb__link">
            {{ pick(site.copy.nav.home) }}
          </RouterLink>
          <icon-mdi-chevron-right class="tool-breadcrumb__sep" />
          <span class="tool-breadcrumb__current">{{ categoryName ?? toolTitle }}</span>
          <template v-if="categoryName">
            <icon-mdi-chevron-right class="tool-breadcrumb__sep" />
            <span class="tool-breadcrumb__current">{{ toolTitle }}</span>
          </template>
        </nav>

        <div class="tool-header">
          <div class="tool-header__row">
            <h1 class="tool-header__title">
              {{ toolTitle }}
            </h1>

            <FavoriteButton :tool="{ name: route.meta.name, path: route.path } as Tool" />
          </div>

          <p class="tool-header__desc">
            {{ toolDescription }}
          </p>
        </div>

        <div class="tool-content">
          <div class="tool-content__inner">
            <slot />
          </div>
        </div>
      </div>

      <RelatedTools :current-path="route.path" />
    </div>
  </BaseLayout>
</template>

<style lang="less" scoped>
.tool-page {
  padding-top: 32px;
}

.tool-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.tool-breadcrumb__link {
  color: var(--text-tertiary);
  text-decoration: none;

  &:hover {
    color: var(--brand-blue);
  }
}

.tool-breadcrumb__sep {
  font-size: 16px;
  opacity: 0.6;
}

.tool-breadcrumb__current {
  color: var(--text-secondary);
}

.tool-header {
  margin: 20px 0 24px;
}

.tool-header__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.tool-header__title {
  margin: 0;
  font-size: clamp(26px, 3.4vw, 36px);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--text-primary);
}

.tool-header__desc {
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.tool-content__inner {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  /* 编辑器类工具有固有最小宽度，让它在卡片内横向滚动，
     而不是把整页撑出横向滚动条（375px 下尤其明显） */
  overflow-x: auto;

  ::v-deep(& > *) {
    flex: 1 1 100%;
    min-width: 0;
    max-width: 100%;
  }
}

.tool-page--normal .tool-content__inner {
  ::v-deep(& > *) {
    flex: 0 1 var(--content-width-normal);
  }
}

.tool-page--wide .tool-content__inner {
  ::v-deep(& > *) {
    flex: 0 1 var(--content-width-wide);
  }
}
</style>
