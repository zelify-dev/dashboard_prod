"use client";

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";

export type Language = "en" | "es";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Siempre iniciar en "en" para que el primer render del cliente coincida con el servidor (evita hydration error)
  const [language, setLanguage] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const stored = window.localStorage.getItem("zelify-language");
    if (stored === "es" || stored === "en") {
      setLanguage(stored);
    }
  }, [mounted]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("zelify-language", language);
    }
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", language);
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((prev) => (prev === "en" ? "es" : "en")),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
