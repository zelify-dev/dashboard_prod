"use client";

import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { useUiTranslations } from "@/hooks/use-ui-translations";

const LANGUAGES = [
  {
    name: "en",
    label: "En",
  },
  {
    name: "es",
    label: "Es",
  },
];

export function LanguageToggleSwitch() {
  const { language, toggleLanguage } = useLanguage();
  const translations = useUiTranslations();

  return (
    <button
      onClick={toggleLanguage}
      className="group rounded-full bg-gray-3 p-[5px] text-[#111928] outline-1 outline-primary focus-visible:outline dark:bg-[#020D1A] dark:text-current"
    >
      <span className="sr-only">
        {language === "en" ? translations.languageToggle.switchToSpanish : translations.languageToggle.switchToEnglish}
      </span>

      <span aria-hidden className="relative flex gap-2.5">
        {/* Indicator */}
        <span
          className={cn(
            "absolute size-[38px] rounded-full border border-gray-200 bg-white transition-all dark:border-none dark:bg-dark-2 dark:group-hover:bg-dark-3",
            language === "es" && "translate-x-[48px]"
          )}
        />

        {LANGUAGES.map(({ name, label }) => (
          <span
            key={name}
            className={cn(
              "relative grid size-[38px] place-items-center rounded-full text-sm font-medium",
              name === "es" && "dark:text-white"
            )}
          >
            {label}
          </span>
        ))}
      </span>
    </button>
  );
}
