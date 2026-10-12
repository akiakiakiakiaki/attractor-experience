import type { MetadataRoute } from 'next';
import { basePath, isIndexableBuild, siteUrl } from './seo-config';
import { locales } from '@/i18n/messages';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexableBuild) return [];

  const localizedUrls = Object.fromEntries(
    locales.map((locale) => [locale, new URL(`${basePath}/${locale}/`, siteUrl).toString()]),
  );

  return locales.map((locale) => ({
    url: localizedUrls[locale],
    changeFrequency: 'yearly',
    priority: 1,
    alternates: { languages: localizedUrls },
  }));
}
