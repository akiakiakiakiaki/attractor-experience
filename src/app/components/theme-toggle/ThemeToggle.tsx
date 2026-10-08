import { SvgIcon } from '@mui/material';
import styles from './ThemeToggle.module.scss';

export interface ThemeToggleProps {
  mode: 'dark' | 'light';
  lightLabel: string;
  darkLabel: string;
  switchToLightLabel: string;
  switchToDarkLabel: string;
  onToggle: () => void;
}

export function ThemeToggle({
  mode,
  lightLabel,
  darkLabel,
  switchToLightLabel,
  switchToDarkLabel,
  onToggle,
}: ThemeToggleProps) {
  const isDark = mode === 'dark';

  return (
    <button
      className={styles.root}
      type="button"
      onClick={onToggle}
      aria-label={isDark ? switchToLightLabel : switchToDarkLabel}
    >
      {isDark ? lightLabel : darkLabel}
      <SvgIcon className={styles.icon} aria-hidden="true" viewBox="0 0 24 24">
        {isDark ? (
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1Zm0 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1ZM4.93 3.51l.71.71a1 1 0 0 1-1.42 1.42l-.71-.71a1 1 0 0 1 1.42-1.42Zm12.02 12.02.71.71a1 1 0 0 1-1.42 1.42l-.71-.71a1 1 0 0 1 1.42-1.42ZM2 12a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2H3a1 1 0 0 1-1-1Zm17 0a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1-1ZM4.22 18.07l.71-.71a1 1 0 0 1 1.42 1.42l-.71.71a1 1 0 0 1-1.42-1.42ZM16.24 6.05l.71-.71a1 1 0 0 1 1.42 1.42l-.71.71a1 1 0 0 1-1.42-1.42Z" />
        ) : (
          <path d="M9.37 5.51a7.35 7.35 0 0 0-.77 3.35c0 4.08 3.31 7.39 7.39 7.39 1.21 0 2.35-.29 3.35-.81A8.1 8.1 0 0 1 12 21.1 8.1 8.1 0 0 1 3.9 13a8.1 8.1 0 0 1 5.47-7.49ZM12 2a10 10 0 1 0 10 10c0-.46-.03-.92-.09-1.36A7 7 0 0 1 12 2Z" />
        )}
      </SvgIcon>
    </button>
  );
}
