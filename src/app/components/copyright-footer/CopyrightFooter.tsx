import styles from './CopyrightFooter.module.scss';

export function CopyrightFooter() {
  return (
    <footer className={styles.root}>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  );
}
