<script setup lang="ts">
import { useHead } from '@vueuse/head';

useHead({
  title: '页面不存在 - Jinzhai Tools',
  meta: [
    // 404 页不该被搜索引擎收录，避免稀释正常页面的权重
    { name: 'robots', content: 'noindex, follow' },
    { name: 'description', content: '该页面不存在。返回 Jinzhai Tools 首页继续使用在线开发者工具。' },
  ],
});
</script>

<template>
  <div mt-20 flex flex-col items-center>
    <span text-90px lh-1 op-50>
      <icon-mdi:kettle-steam-outline />
    </span>

    <h1 m-0 mt-3>
      {{ $t('404.notFound') }}
    </h1>
    <div mt-4 op-60>
      {{ $t('404.sorry') }}
    </div>
    <div mb-8 op-60>
      {{ $t('404.maybe') }}
    </div>

    <c-button to="/">
      {{ $t('404.backHome') }}
    </c-button>
  </div>
</template>
