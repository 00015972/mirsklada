/**
 * @file i18n Configuration
 * @description Sets up i18next for internationalization with English, Russian, and Uzbek.
 * Auto-detects browser language and persists preference to localStorage.
 *
 * @module apps/web/src/lib/i18n
 *
 * @connections
 * - Imported by: @/main.tsx (initializes i18n before React renders)
 * - Uses: ./locales/en.json, ./locales/ru.json, ./locales/uz.json
 * - Used by: All components via useTranslation() hook
 * - Used by: @/components/ui/LanguageSwitcher (language constants)
 *
 * @detection_order
 * 1. localStorage (key: "mirsklada-language")
 * 2. Browser navigator.language
 * 3. HTML lang attribute
 *
 * @fallback
 * Falls back to English ("en") if detected language is not supported.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation JSON files
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";

/**
 * Supported Languages Array
 * @description Tuple of language codes supported by the application.
 * Used for type safety and iteration.
 */
export const SUPPORTED_LANGUAGES = ["en", "ru", "uz"] as const;

/** Type for supported language codes */
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Language Labels
 * @description Human-readable names for each language in their native form.
 * Used in the LanguageSwitcher dropdown.
 */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  ru: "Русский",
  uz: "O'zbekcha",
};

/**
 * Language Flags
 * @description Emoji flags for each language.
 * Used in the LanguageSwitcher for visual identification.
 */
export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: "🇬🇧",
  ru: "🇷🇺",
  uz: "🇺🇿",
};

/**
 * i18n Initialization
 * @description Configures i18next with:
 * - Language detection (localStorage → browser → HTML)
 * - React integration via initReactI18next
 * - Translation resources for all supported languages
 * - English as fallback language
 */
void i18n
  .use(LanguageDetector) // Auto-detect user's language
  .use(initReactI18next) // React integration hooks
  .init({
    // Translation resources organized by language code
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      uz: { translation: uz },
    },
    // Default to English if detected language is unsupported
    fallbackLng: "en",
    // Only allow these languages
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      // React already escapes values, so disable double-escaping
      escapeValue: false,
    },
    detection: {
      // Check localStorage first, then browser, then HTML tag
      order: ["localStorage", "navigator", "htmlTag"],
      // Persist language choice to localStorage
      caches: ["localStorage"],
      // localStorage key for persistence
      lookupLocalStorage: "mirsklada-language",
    },
  });

export default i18n;
