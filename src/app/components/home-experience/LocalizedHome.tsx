"use client";

import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useColorScheme } from '@mui/material/styles';
import { StageHost } from '@/experience/stages/StageHost';
import { locales, messages, type Locale } from '@/i18n/messages';
import { basePath, isIndexableBuild, siteUrl } from '../../seo-config';
import { CopyrightFooter } from '../copyright-footer/CopyrightFooter';
import { LanguageSwitcher } from '../language-switcher/LanguageSwitcher';
import { Masthead } from '../masthead/Masthead';
import { Navigation } from '../navigation/Navigation';
import styles from './ExperienceFrame.module.scss';

function updateMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

function updateLanguageAlternates(locale: Locale) {
  const canonicalPath = `${isIndexableBuild ? basePath : ''}/${locale}/`;
  const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }
  canonical.href = canonicalUrl;

  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((link) => link.remove());
  for (const availableLocale of locales) {
    const alternate = document.createElement('link');
    alternate.rel = 'alternate';
    alternate.hreflang = availableLocale;
    alternate.href = new URL(
      `${isIndexableBuild ? basePath : ''}/${availableLocale}/`,
      siteUrl,
    ).toString();
    document.head.append(alternate);
  }
  const defaultLanguage = document.createElement('link');
  defaultLanguage.rel = 'alternate';
  defaultLanguage.hreflang = 'x-default';
  defaultLanguage.href = new URL(isIndexableBuild ? `${basePath}/` : '/', siteUrl).toString();
  document.head.append(defaultLanguage);

  document.head
    .querySelectorAll('meta[property="og:locale:alternate"]')
    .forEach((meta) => meta.remove());
  for (const availableLocale of locales) {
    if (availableLocale === locale) continue;
    const alternateLocale = document.createElement('meta');
    alternateLocale.setAttribute('property', 'og:locale:alternate');
    alternateLocale.content = messages[availableLocale].openGraphLocale;
    document.head.append(alternateLocale);
  }
}

export function LocalizedHome({ locale }: { locale: Locale }) {
  const [activeLocale, setActiveLocale] = useState(locale);
  const { mode, systemMode, setMode } = useColorScheme();
  const currentMode = mode === 'system' ? (systemMode ?? 'dark') : (mode ?? 'dark');
  const copy = messages[activeLocale];
  const rotatingLines = useMemo(() => copy.grainAnnotations, [copy]);

  useEffect(() => {
    document.documentElement.lang = activeLocale;
    document.title = copy.pageTitle;
    updateMeta('name', 'description', copy.description);
    updateMeta('property', 'og:title', copy.pageTitle);
    updateMeta('property', 'og:description', copy.description);
    updateMeta(
      'property',
      'og:locale',
      messages[activeLocale].openGraphLocale,
    );
    updateMeta(
      'property',
      'og:url',
      new URL(
        `${isIndexableBuild ? basePath : ''}/${activeLocale}/`,
        siteUrl,
      ).toString(),
    );
    updateMeta('name', 'twitter:title', copy.pageTitle);
    updateMeta('name', 'twitter:description', copy.description);
    updateLanguageAlternates(activeLocale);
  }, [activeLocale, copy.description, copy.pageTitle]);

  const changeLocale = (_event: MouseEvent<HTMLElement>, nextLocale: Locale | null) => {
    if (nextLocale && nextLocale !== activeLocale) {
      setActiveLocale(nextLocale);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
      window.history.replaceState(null, '', `${basePath}/${nextLocale}/`);
    }
  };

  return (
    <main className={styles.experience}>
      <StageHost claim={copy.claim} canvasLabel={copy.canvasLabel} />
      <Masthead
        name="Michael Ilg"
        annotationLines={rotatingLines}
        mode={currentMode === 'light' ? 'light' : 'dark'}
        lightLabel={copy.light}
        darkLabel={copy.dark}
        switchToLightLabel={copy.switchToLight}
        switchToDarkLabel={copy.switchToDark}
        onThemeToggle={() => setMode(currentMode === 'dark' ? 'light' : 'dark')}
      />
      <Navigation
        ariaLabel={copy.navigation}
        githubLabel={copy.github}
        contactLabel={copy.contact}
      />
      <LanguageSwitcher
        locale={activeLocale}
        label={copy.languageLabel}
        onChange={changeLocale}
      />
      <CopyrightFooter />
    </main>
  );
}
