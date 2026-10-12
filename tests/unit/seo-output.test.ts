import { afterEach, describe, expect, it, vi } from 'vitest';
import { locales } from '@/i18n/messages';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('SEO build output', () => {
  it('keeps prototype pages out of search results and omits their sitemap', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test');
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/prototype');
    vi.stubEnv('NEXT_PUBLIC_ROBOTS_INDEX', 'false');
    vi.resetModules();

    const [{ baseMetadata }, { default: robots }, { default: sitemap }] = await Promise.all([
      import('@/app/seo'),
      import('@/app/robots'),
      import('@/app/sitemap'),
    ]);

    const robotsMetadata = baseMetadata.robots;
    expect(typeof robotsMetadata).toBe('object');
    if (!robotsMetadata || typeof robotsMetadata === 'string') {
      throw new Error('Expected structured robots metadata.');
    }
    expect(robotsMetadata).toMatchObject({ index: false, follow: true });
    expect(robotsMetadata.googleBot).toMatchObject({ index: false, follow: true });
    expect(robots().sitemap).toBeUndefined();
    expect(sitemap()).toEqual([]);
  });

  it('generates production sitemap URLs from configured locales and base path', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test');
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/prototype');
    vi.stubEnv('NEXT_PUBLIC_ROBOTS_INDEX', 'true');
    vi.resetModules();

    const [{ default: robots }, { default: sitemap }] = await Promise.all([
      import('@/app/robots'),
      import('@/app/sitemap'),
    ]);
    const entries = sitemap();
    const urls = locales.map((locale) => `https://example.test/prototype/${locale}/`);

    expect(entries.map(({ url }) => url)).toEqual(urls);
    expect(entries.every(({ alternates }) =>
      locales.every((locale) => alternates?.languages?.[locale] === `https://example.test/prototype/${locale}/`),
    )).toBe(true);
    expect(robots().sitemap).toBe('https://example.test/prototype/sitemap.xml');
  });
});
