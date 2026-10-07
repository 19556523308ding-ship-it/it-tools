import { createRouter, createWebHistory } from 'vue-router';
import { layouts } from './layouts/index';
import HomePage from './pages/Home.page.vue';
import NotFound from './pages/404.page.vue';
import { tools } from './tools';
import { config } from './config';
import { routes as demoRoutes } from './ui/demo/demo.routes';

const toolsRoutes = tools.map(({ path, name, component, ...config }) => ({
  path,
  name,
  component,
  meta: { isTool: true, layout: layouts.toolLayout, name, ...config },
}));
const toolsRedirectRoutes = tools
  .filter(({ redirectFrom }) => redirectFrom && redirectFrom.length > 0)
  .flatMap(
    ({ path, redirectFrom }) => redirectFrom?.map(redirectSource => ({ path: redirectSource, redirect: path })) ?? [],
  );

const router = createRouter({
  history: createWebHistory(config.app.baseUrl),

  // Header 导航用的是 /#all-tools、/#categories 这类 hash 链接。
  // 没有 scrollBehavior 时，路由确实切换了、hash 也变了，但页面不会滚动，
  // 表现为「点了没反应」。这里显式处理 hash 滚动，并给 sticky Header
  // 留出高度偏移，避免目标区块被 Header 盖住。
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    if (to.hash) {
      // 同一路径 + 同一 hash、只有 query 变了（例如页脚分类链接 /
      // /#all-tools?category=security），也必须滚一次，否则点了没反应
      const sameAnchor = to.path === from.path && to.hash === from.hash;

      return new Promise((resolve) => {
        // 等一帧，确保目标区块已渲染（首页是异步组件 + 区块懒挂载）
        requestAnimationFrame(() => {
          const el = document.querySelector(to.hash);
          if (!el) {
            resolve({ top: 0 });
            return;
          }
          resolve({
            el: to.hash,
            top: 88, // Header 64px + 一点呼吸间距
            behavior: sameAnchor ? 'auto' : 'smooth',
          });
        });
      });
    }

    return { top: 0 };
  },

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('./pages/About.vue'),
    },
    ...toolsRoutes,
    ...toolsRedirectRoutes,
    ...(config.app.env === 'development' ? demoRoutes : []),
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  ],
});

export default router;
