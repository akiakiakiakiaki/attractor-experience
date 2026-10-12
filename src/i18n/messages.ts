type LocaleMessages = {
  languageName: string;
  openGraphLocale: string;
  pageTitle: string;
  description: string;
  light: string;
  dark: string;
  switchToLight: string;
  switchToDark: string;
  navigation: string;
  github: string;
  contact: string;
  claim: string;
  grainAnnotations: string[];
  canvasLabel: string;
  languageLabel: string;
};

export const messages = {
  de: {
    languageName: "Deutsch",
    openGraphLocale: "de_DE",
    pageTitle: "Michael Ilg — Interaction Engineer & Frontend-Entwickler",
    description:
      "Michael Ilg ist unabhängiger Entwickler für interaktive Systeme, Frontend-Entwicklung und barrierefreie Oberflächen.",
    light: "Licht",
    dark: "Dunkelheit",
    switchToLight: "Zum hellen Modus wechseln",
    switchToDark: "Zum dunklen Modus wechseln",
    navigation: "Hauptnavigation",
    github: "GitHub",
    contact: "Kontakt",
    claim: "Interaction Engineer at Heart",
    grainAnnotations: [
      "Selbständiger Entwickler",
      "Entwicklung von Systemen & Interfaces",
      "Frontend-Entwicklung",
      "Barrierefreie Oberflächen",
      "Content-Management-Systeme",
      "Synästhetische Erfahrungen",
      "Ein Feld im ständigen Wandel",
    ],
    canvasLabel:
      "Interaktives organisches Feld. Bewege den Cursor oder berühre das Feld, um es zu beeinflussen und die Wortmarke einzublenden.",
    languageLabel: "Sprache",
  },
  es: {
    languageName: "Español",
    openGraphLocale: "es_ES",
    pageTitle: "Michael Ilg — Ingeniero de interacción y desarrollador frontend",
    description:
      "Michael Ilg es desarrollador independiente especializado en sistemas interactivos, frontend e interfaces accesibles.",
    light: "Luz",
    dark: "Oscuridad  ",
    switchToLight: "Cambiar al modo claro",
    switchToDark: "Cambiar al modo oscuro",
    navigation: "Navegación principal",
    github: "GitHub",
    contact: "Contacto",
    claim: "Interaction Engineer at Heart",
    grainAnnotations: [
      "Desarrollador independiente",
      "Desarrollo de sistemas e interfaces",
      "Desarrollo frontend",
      "Interfaces accesibles",
      "Sistemas de gestión de contenido",
      "Experiencias sinestésicas",
      "Un campo en constante transformación",
    ],
    canvasLabel:
      "Campo orgánico interactivo. Mueve el cursor o toca el campo para influir en él y revelar la marca.",
    languageLabel: "Idioma",
  },
  en: {
    languageName: "English",
    openGraphLocale: "en_US",
    pageTitle: "Michael Ilg — Interaction Engineer & Frontend Developer",
    description:
      "Michael Ilg is an independent developer working on interactive systems, frontend development and accessible interfaces.",
    light: "Light",
    dark: "Darkness",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    navigation: "Main navigation",
    github: "GitHub",
    contact: "Contact",
    claim: "Interaction Engineer at Heart",
    grainAnnotations: [
      "Independent developer",
      "Developing systems & interfaces",
      "Frontend development",
      "Accessible interfaces",
      "Content management systems",
      "Synesthetic experiences",
      "A field in continuous becoming",
    ],
    canvasLabel:
      "Interactive organic field. Move or touch to influence the field and reveal the wordmark.",
    languageLabel: "Language",
  },
} satisfies Record<string, LocaleMessages>;

export type Locale = keyof typeof messages;
export const locales = Object.keys(messages) as Locale[];
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
