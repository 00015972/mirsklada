/**
 * @file Language Switcher Component
 * @description Dropdown component for switching between supported languages.
 * Uses i18next for internationalization with persistent language preference.
 *
 * @module apps/web/src/components/ui/LanguageSwitcher
 *
 * @connections
 * - Exported via: ./index.ts → ../index.ts
 * - Uses: @/lib/i18n (language constants and types)
 * - Uses: react-i18next (translation hook)
 * - Uses: @headlessui/react (accessible listbox)
 * - Used by: @/layouts/AppLayout.tsx (header)
 *
 * @supported_languages
 * - English (en) - 🇺🇸
 * - Russian (ru) - 🇷🇺
 * - Uzbek (uz) - 🇺🇿
 *
 * @variants
 * - full: Shows flag and language name (default)
 * - compact: Shows only globe icon (for narrow screens)
 */
import { useTranslation } from "react-i18next";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { Check, Globe } from "lucide-react";
import { clsx } from "clsx";
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_FLAGS,
  type SupportedLanguage,
} from "@/lib/i18n";

/**
 * Language Switcher Props
 */
interface LanguageSwitcherProps {
  /** Display variant: "compact" shows only icon, "full" shows flag + label */
  variant?: "compact" | "full";
  /** Additional CSS classes */
  className?: string;
}

/**
 * LanguageSwitcher Component
 * @description Accessible dropdown for language selection using HeadlessUI Listbox.
 * Changes language via i18next and persists to localStorage.
 *
 * @example
 * // Full variant in header
 * <LanguageSwitcher variant="full" />
 *
 * // Compact variant for mobile
 * <LanguageSwitcher variant="compact" className="md:hidden" />
 */
export function LanguageSwitcher({
  variant = "full",
  className,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  // Ensure current language is valid, fall back to English
  const current = (
    SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
      ? i18n.language
      : "en"
  ) as SupportedLanguage;

  /**
   * Handle language change
   * @description Updates i18next language (automatically persisted to localStorage)
   */
  const handleChange = (lang: SupportedLanguage) => {
    void i18n.changeLanguage(lang);
  };

  return (
    <Listbox value={current} onChange={handleChange}>
      <div className={clsx("relative", className)}>
        {/* Trigger button - shows current language */}
        <ListboxButton
          className={clsx(
            "flex items-center gap-2 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-700 dark:text-surface-200 hover:border-primary-500 focus:outline-none transition-colors",
            variant === "compact" && "px-2",
          )}
          title={LANGUAGE_LABELS[current]}
        >
          {variant === "compact" ? (
            // Compact: show globe icon only
            <Globe className="h-4 w-4" />
          ) : (
            // Full: show flag emoji and language name
            <>
              <span className="text-base leading-none">
                {LANGUAGE_FLAGS[current]}
              </span>
              <span className="hidden sm:inline">
                {LANGUAGE_LABELS[current]}
              </span>
            </>
          )}
        </ListboxButton>

        {/* Dropdown options - list of available languages */}
        <ListboxOptions className="absolute right-0 z-50 mt-1 w-40 max-h-60 overflow-auto rounded-lg bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 py-1 shadow-xl focus:outline-none">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <ListboxOption
              key={lang}
              value={lang}
              className={({ focus }) =>
                clsx(
                  "relative cursor-pointer select-none px-3 py-2 text-sm",
                  focus
                    ? "bg-primary-600/20 text-primary-600 dark:text-primary-300"
                    : "text-surface-700 dark:text-surface-200",
                )
              }
            >
              {({ selected }) => (
                <div className="flex items-center justify-between gap-2">
                  {/* Language flag and name */}
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">
                      {LANGUAGE_FLAGS[lang]}
                    </span>
                    <span
                      className={clsx(
                        selected &&
                          "font-medium text-primary-600 dark:text-primary-400",
                      )}
                    >
                      {LANGUAGE_LABELS[lang]}
                    </span>
                  </span>
                  {/* Checkmark for selected language */}
                  {selected && (
                    <Check className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  )}
                </div>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
