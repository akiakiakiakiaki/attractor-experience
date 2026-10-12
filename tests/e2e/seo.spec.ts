import { expect, test } from '@playwright/test';

test('publishes localized metadata, language alternates, sitemap, and robots directives', async ({ page }) => {
  await page.goto('/en/');

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', /\/en\/$/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/);

  const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
    links.map((link) => ({
      language: (link as HTMLLinkElement).hreflang,
      href: (link as HTMLLinkElement).href,
    })),
  );
  const localizedAlternates = alternates.filter(({ language }) => language !== 'x-default');
  const switcherCodes = await page
    .getByRole('group', { name: 'Language' })
    .getByRole('button')
    .allTextContents();

  expect(localizedAlternates.map(({ language }) => language).sort())
    .toEqual(switcherCodes.map((code) => code.toLowerCase()).sort());

  const sitemapResponse = await page.request.get('/sitemap.xml');
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  for (const { href } of localizedAlternates) {
    expect(sitemap).toContain(href);
  }

  const robotsResponse = await page.request.get('/robots.txt');
  expect(robotsResponse.ok()).toBe(true);
  expect(await robotsResponse.text()).toContain('/sitemap.xml');
});
