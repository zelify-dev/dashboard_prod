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
      className="group rounded-xl bg-gray-100 p-[3px] text-dark outline-none"
    >
      <span className="sr-only">
        {language === "en" ? translations.languageToggle.switchToSpanish : translations.languageToggle.switchToEnglish}
      </span>

      <span aria-hidden className="relative flex gap-1.5">
        {/* Indicator */}
        <span
          className={cn(
            "absolute h-[26px] w-[26px] rounded-lg border border-gray-200 bg-white transition-all",
            language === "es" && "translate-x-[32px]"
          )}
        />

        {LANGUAGES.map(({ name, label }) => (
          <span
            key={name}
            className={cn(
              "relative grid h-[26px] w-[26px] place-items-center rounded-lg text-xs font-light text-dark",
            )}
          >
            {label}
          </span>
        ))}
      </span>
    </button>
  );
}
