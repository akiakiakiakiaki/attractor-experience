import type { MouseEvent } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { locales, messages, type Locale } from '@/i18n/messages';
import styles from './LanguageSwitcher.module.scss';

interface LanguageSwitcherProps {
  locale: Locale;
  label: string;
  onChange: (event: MouseEvent<HTMLElement>, locale: Locale | null) => void;
}

export function LanguageSwitcher({ locale, label, onChange }: LanguageSwitcherProps) {
  return (
    <div className={styles.dock}>
      <ToggleButtonGroup
        className={styles.group}
        value={locale}
        exclusive
        onChange={onChange}
        aria-label={label}
        size="small"
      >
        {locales.map((availableLocale) => (
          <ToggleButton
            key={availableLocale}
            value={availableLocale}
            aria-label={messages[availableLocale].languageName}
          >
            {availableLocale.toUpperCase()}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
