'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { locales, type Locale } from '@/i18n/messages';
import styles from './components/home-experience/ExperienceFrame.module.scss';

function browserLocale(): Locale {
  const preferredLanguages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  for (const language of preferredLanguages) {
    const languageCode = language.toLowerCase().split('-')[0];
    if (locales.some((locale) => locale === languageCode)) return languageCode as Locale;
  }
  return 'en';
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${browserLocale()}/`);
  }, [router]);

  return <main className={styles.experience} aria-busy="true" />;
}
