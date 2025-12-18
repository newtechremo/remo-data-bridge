export const locales = ["ko", "en", "th"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  th: "ไทย",
};
