import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { locales } from '../../src/i18n/messages';

async function expectNoAccessibilityViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();

  expect(results.violations).toEqual([]);
}

test('meets automated accessibility checks in every supported locale', async ({ page }) => {
  for (const locale of locales) {
    await page.goto(`/${locale}/`);
    await expect(page.getByTestId('attractor-canvas')).toBeVisible();
    await expectNoAccessibilityViolations(page);
  }
});

test('meets automated accessibility checks in light mode', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('meets automated accessibility checks on a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/de/');
  await expect(page.getByTestId('attractor-canvas')).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('keeps the canvas and theme control keyboard accessible', async ({ page }) => {
  await page.goto('/en/');
  const canvas = page.getByTestId('attractor-canvas');
  const themeToggle = page.getByRole('button', { name: 'Switch to light mode' });

  await page.keyboard.press('Tab');
  await expect(canvas).toBeFocused();
  await expect(canvas).toHaveAttribute('aria-label', /interactive/i);

  await page.keyboard.press('Tab');
  await expect(themeToggle).toBeFocused();
});
