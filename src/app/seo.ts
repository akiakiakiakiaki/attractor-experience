import type { Metadata } from 'next';
import { defaultLocale, locales, messages, type Locale } from '@/i18n/messages';
import { basePath, isIndexableBuild, siteUrl } from './seo-config';

const faviconPath = `${basePath}/favicon.png` || '/favicon.png';
const localizedPath = (locale: Locale) =>
  `${isIndexableBuild ? basePath : ''}/${locale}/`;
export const baseMetadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: messages[defaultLocale].pageTitle,
    template: '%s',
  },
  description: messages[defaultLocale].description,
  applicationName: 'Michael Ilg',
  creator: 'Michael Ilg',
  publisher: 'Michael Ilg',
  icons: {
    icon: { url: faviconPath, type: 'image/png', sizes: '850x850' },
    shortcut: faviconPath,
    apple: faviconPath,
  },
  robots: {
    index: isIndexableBuild,
    follow: true,
    googleBot: {
      index: isIndexableBuild,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Michael Ilg',
    images: [{ url: '/favicon.png', width: 850, height: 850, alt: 'Michael Ilg' }],
  },
  twitter: {
    card: 'summary',
    images: ['/favicon.png'],
  },
};

export function localizedMetadata(locale: Locale): Metadata {
  const canonical = localizedPath(locale);
  const languages = Object.fromEntries(
    locales.map((availableLocale) => [availableLocale, localizedPath(availableLocale)]),
  );

  return {
    title: messages[locale].pageTitle,
    description: messages[locale].description,
    alternates: {
      canonical,
      languages: {
        ...languages,
        'x-default': isIndexableBuild ? `${basePath}/` : '/',
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Michael Ilg',
      title: messages[locale].pageTitle,
      description: messages[locale].description,
      url: canonical,
      locale: messages[locale].openGraphLocale,
      alternateLocale: locales
        .filter((availableLocale) => availableLocale !== locale)
        .map((availableLocale) => messages[availableLocale].openGraphLocale),
      images: [{ url: '/favicon.png', width: 850, height: 850, alt: 'Michael Ilg' }],
    },
    twitter: {
      card: 'summary',
      title: messages[locale].pageTitle,
      description: messages[locale].description,
      images: ['/favicon.png'],
    },
  };
}
