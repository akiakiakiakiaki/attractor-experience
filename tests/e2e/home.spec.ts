import { expect, test } from '@playwright/test';
import { messages } from '../../src/i18n/messages';

test('serves the experience and keeps the canvas mounted when changing language', async ({ page }) => {
  const runtimeErrors: string[] = [];
  const hydrationWarnings: string[] = [];

  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error') runtimeErrors.push(text);
    if (message.type() === 'warning' && /hydration|didn't match/i.test(text)) {
      hydrationWarnings.push(text);
    }
  });

  await page.goto('/en/');
  const canvas = page.getByTestId('attractor-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('aria-label', /interactive/i);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  const canvasHasArea = await canvas.evaluate((element) => {
    const { width, height } = element.getBoundingClientRect();
    return width > 0 && height > 0;
  });
  expect(canvasHasArea).toBe(true);

  await page.evaluate(() => {
    (window as Window & { __initialCanvas?: HTMLCanvasElement }).__initialCanvas =
      document.querySelector('[data-testid="attractor-canvas"]') ?? undefined;
  });

  await page.getByRole('button', { name: 'Español' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByTestId('attractor-claim')).toContainText(messages.es.claim);
  await expect(page).toHaveURL(/\/es\/$/);

  const canvasWasPreserved = await page.evaluate(() =>
    document.querySelector('[data-testid="attractor-canvas"]') ===
      (window as Window & { __initialCanvas?: HTMLCanvasElement }).__initialCanvas,
  );
  expect(canvasWasPreserved).toBe(true);

  await page.getByRole('button', { name: 'Cambiar al modo claro' }).click();
  await expect(page.getByRole('button', { name: 'Cambiar al modo oscuro' })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
  expect(hydrationWarnings).toEqual([]);
});

test('keeps the canvas inside a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/de/');

  const canvas = page.getByTestId('attractor-canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('reveals the wordmark when the desktop pointer moves without a click', async ({ page }) => {
  await page.goto('/en/');

  const canvas = page.getByTestId('attractor-canvas');
  const claim = page.getByTestId('attractor-claim');
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();

  await page.mouse.move(bounds!.x + 40, bounds!.y + 40);
  await page.mouse.move(bounds!.x + bounds!.width * 0.55, bounds!.y + bounds!.height * 0.55, {
    steps: 8,
  });

  await expect.poll(async () => Number(await claim.evaluate((element) => element.style.opacity)))
    .toBeGreaterThan(0.01);
});

test('keeps mobile landscape controls inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/de/');

  const canvas = page.getByTestId('attractor-canvas');
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
  const languageSwitcher = page.getByRole('group', { name: 'Sprache' });
  await expect(canvas).toBeVisible();
  await expect(navigation).toBeVisible();
  await expect(languageSwitcher).toBeVisible();

  const viewportHeight = 390;
  for (const control of [navigation, languageSwitcher]) {
    const bounds = await control.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewportHeight);
  }

  const pageCanScroll = await page.evaluate(
    () => document.documentElement.scrollHeight > window.innerHeight,
  );
  expect(pageCanScroll).toBe(false);
});
