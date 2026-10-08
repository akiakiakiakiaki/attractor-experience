import styles from './Navigation.module.scss';

export function Navigation({
  githubLabel,
  contactLabel,
  ariaLabel,
}: {
  githubLabel: string;
  contactLabel: string;
  ariaLabel: string;
}) {
  return (
    <nav className={styles.root} aria-label={ariaLabel}>
      <a href="https://github.com/akiakiakiakiaki" target="_blank" rel="noreferrer">
        {githubLabel} <span aria-hidden="true">↗</span>
      </a>
      <a href={`mailto:${['buenas', 'michael-lg.com'].join('@')}`}>
        {contactLabel} <span aria-hidden="true">↗</span>
      </a>
    </nav>
  );
}
