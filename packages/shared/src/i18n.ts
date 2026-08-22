/**
 * Languages the UI can be switched to. Values are the `lang` query param
 * accepted by /schedule and /world-bosses. A language with no seeded
 * translations for a given entity simply falls back to its English name.
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "fr", label: "Français" },
  { code: "tr", label: "Türkçe" },
  { code: "ru", label: "Русский" },
  { code: "pl", label: "Polski" },
  { code: "zh", label: "中文" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
