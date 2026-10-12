import Tungsten from "@mui/icons-material/Tungsten";
import DarkMode from "@mui/icons-material/DarkMode";
import styles from "./ThemeToggle.module.scss";

export interface ThemeToggleProps {
  mode: "dark" | "light";
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
  const isDark = mode === "dark";

  return (
    <button
      className={styles.root}
      type="button"
      onClick={onToggle}
      aria-label={isDark ? switchToLightLabel : switchToDarkLabel}
    >
      {isDark ? lightLabel : darkLabel}
      {isDark ? (
        <Tungsten
          className={styles.icon}
          aria-hidden="true"
        />
      ) : (
        <DarkMode
          className={styles.icon}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
