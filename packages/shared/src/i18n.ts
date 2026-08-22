/**
 * Languages the UI can be switched to. Values are the `lang` query param
 * accepted by /schedule and /world-bosses. Extend as translations are added -
 * a language with no seeded translations simply falls back to English names.
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
