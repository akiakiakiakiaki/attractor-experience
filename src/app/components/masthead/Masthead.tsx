import { GrainTextSequence } from '../grain-text-sequence/GrainTextSequence';
import { ThemeToggle } from '../theme-toggle/ThemeToggle';
import type { ThemeToggleProps } from '../theme-toggle/ThemeToggle';
import styles from './Masthead.module.scss';

interface MastheadProps extends Omit<ThemeToggleProps, 'onToggle'> {
  name: string;
  annotationLines: string[];
  onThemeToggle: () => void;
}

export function Masthead({
  name,
  annotationLines,
  onThemeToggle,
  ...themeProps
}: MastheadProps) {
  return (
    <header className={styles.root}>
      <span className={styles.name}>{name}</span>
      <GrainTextSequence lines={annotationLines} visibleDurationSeconds={7} />
      <ThemeToggle {...themeProps} onToggle={onThemeToggle} />
    </header>
  );
}
