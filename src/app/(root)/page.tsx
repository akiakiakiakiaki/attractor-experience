'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { defaultLocale, locales, messages, type Locale } from '@/i18n/messages';
import { basePath } from '../seo-config';
import styles from './page.module.scss';

function browserLocale(): Locale {
  const preferredLanguages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  for (const language of preferredLanguages) {
    const languageCode = language.toLowerCase().split('-')[0];
    if (locales.some((locale) => locale === languageCode)) return languageCode as Locale;
  }
  return defaultLocale;
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${browserLocale()}/`);
  }, [router]);

  return (
    <main className={styles.fallback} aria-busy="true">
      <nav className={styles.languages} aria-label={messages[defaultLocale].languageLabel}>
        {locales.map((locale) => (
          <a
            key={locale}
            href={`${basePath}/${locale}/`}
            aria-label={messages[locale].languageName}
          >
            {locale.toUpperCase()}
          </a>
        ))}
      </nav>
    </main>
  );
}
