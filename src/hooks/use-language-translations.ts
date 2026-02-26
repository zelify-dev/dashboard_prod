"use client";

import { useLanguage, type Language } from "@/contexts/language-context";

export function useLanguageTranslations<T>(dictionary: Record<Language, T>): T {
  const { language } = useLanguage();
  return dictionary[language];
}
