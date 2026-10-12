const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!configuredSiteUrl) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be set in the local .env file.');
}

export const siteUrl = new URL(configuredSiteUrl);
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
export const isIndexableBuild = process.env.NEXT_PUBLIC_ROBOTS_INDEX === 'true';
