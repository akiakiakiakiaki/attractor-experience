import type { MetadataRoute } from 'next';
import { basePath, isIndexableBuild, siteUrl } from './seo-config';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    ...(isIndexableBuild
      ? { sitemap: new URL(`${basePath}/sitemap.xml`, siteUrl).toString() }
      : {}),
  };
}
