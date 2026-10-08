export const locales = ["de", "es", "en"] as const;

export type Locale = (typeof locales)[number];

export const messages: Record<
  Locale,
  {
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
  }
> = {
  de: {
    pageTitle: "Michael Ilg — Frontend-Architekt",
    description: "Ein interaktives Feld über Systeme, Interfaces und Bewegung.",
    light: "Licht",
    dark: "Dunkelheit",
    switchToLight: "Zum hellen Modus wechseln",
    switchToDark: "Zum dunklen Modus wechseln",
    navigation: "Hauptnavigation",
    github: "GitHub",
    contact: "Kontakt",
    claim: "Interaktions-Architekt aus Instinkt",
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
    pageTitle: "Michael Ilg — Arquitecto frontend",
    description:
      "Un campo interactivo sobre sistemas, interfaces y movimiento.",
    light: "Luz",
    dark: "Oscuridad  ",
    switchToLight: "Cambiar al modo claro",
    switchToDark: "Cambiar al modo oscuro",
    navigation: "Navegación principal",
    github: "GitHub",
    contact: "Contacto",
    claim: "Arquitecto de interacción por naturaleza",
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
    pageTitle: "Michael Ilg — Frontend Architect",
    description:
      "An interactive field exploring systems, interfaces and movement.",
    light: "Light",
    dark: "Darkness",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    navigation: "Main navigation",
    github: "GitHub",
    contact: "Contact",
    claim: "Interaction Architect at Heart",
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
};

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
