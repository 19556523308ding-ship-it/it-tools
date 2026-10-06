import { expect, test } from '@playwright/test';

/**
 * Jinzhai Tools 响应式回归测试
 *
 * 对应改版方案「二十四、响应式必须按四种尺寸验收」：
 * 375 / 768 / 1024 / 1440 四个断点下，首页与工具页都不得出现横向滚动，
 * 且核心区块必须存在。
 */

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test.describe(`viewport ${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('homepage has no horizontal scroll', async ({ page }) => {
      await page.goto('/');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );

      // 允许 1px 的取整误差
      expect(overflow).toBeLessThanOrEqual(1);
    });

    test('homepage renders all sections', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('header.site-header')).toBeVisible();
      await expect(page.locator('section#categories')).toBeVisible();
      await expect(page.locator('section#all-tools')).toBeVisible();
      await expect(page.locator('footer.site-footer')).toBeVisible();
    });

    test('all tools section lists every tool', async ({ page }) => {
      await page.goto('/#all-tools');

      const cards = page.locator('#all-tools .featured-card');
      await expect(cards.first()).toBeVisible();

      const count = await cards.count();
      expect(count).toBeGreaterThan(80);
    });

    test('tool page has no horizontal scroll and shows breadcrumb', async ({ page }) => {
      await page.goto('/json-prettify');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);

      await expect(page.locator('.tool-breadcrumb')).toBeVisible();
      await expect(page.locator('.tool-header__title')).toBeVisible();
    });

    test('about page loads', async ({ page }) => {
      await page.goto('/about');

      await expect(page.locator('.about-page__title')).toBeVisible();
    });
  });
}

test('command palette opens with Ctrl+K', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Control+k');

  await expect(page.locator('.palette-modal')).toBeVisible();
});

test('header search button opens command palette', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  await page.locator('.site-header__search').click();

  await expect(page.locator('.palette-modal')).toBeVisible();
});

test('category card filters the all-tools section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const totalBefore = await page.locator('#all-tools .featured-card').count();

  await page.locator('#categories .category-card').first().click();

  // 筛选是响应式的，用 toPass 自动重试而不是硬等待
  await expect(async () => {
    const totalAfter = await page.locator('#all-tools .featured-card').count();
    expect(totalAfter).toBeGreaterThan(0);
    expect(totalAfter).toBeLessThan(totalBefore);
  }).toPass();
});

test('canonical and og url point to tools.jinzhai.icu', async ({ page }) => {
  await page.goto('/json-prettify');

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBe('https://tools.jinzhai.icu/json-prettify');

  const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
  expect(ogUrl).toBe('https://tools.jinzhai.icu/json-prettify');
});
