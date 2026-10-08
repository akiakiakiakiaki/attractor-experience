"use client";

import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useColorScheme } from '@mui/material/styles';
import { StageHost } from '@/experience/stages/StageHost';
import { messages, type Locale } from '@/i18n/messages';
import { CopyrightFooter } from '../copyright-footer/CopyrightFooter';
import { LanguageSwitcher } from '../language-switcher/LanguageSwitcher';
import { Masthead } from '../masthead/Masthead';
import { Navigation } from '../navigation/Navigation';
import styles from './ExperienceFrame.module.scss';

export function LocalizedHome({ locale }: { locale: Locale }) {
  const [activeLocale, setActiveLocale] = useState(locale);
  const { mode, systemMode, setMode } = useColorScheme();
  const currentMode = mode === 'system' ? (systemMode ?? 'dark') : (mode ?? 'dark');
  const copy = messages[activeLocale];
  const rotatingLines = useMemo(() => copy.grainAnnotations, [copy]);

  useEffect(() => {
    document.documentElement.lang = activeLocale;
    document.title = copy.pageTitle;
  }, [activeLocale, copy.pageTitle]);

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
