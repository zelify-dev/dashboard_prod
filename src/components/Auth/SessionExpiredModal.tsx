"use client";

import { useLanguage } from "@/contexts/language-context";

type SessionExpiredModalProps = {
  onContinue: () => void;
};

const COPY = {
  es: {
    title: "Sesión expirada",
    body:
      "Tu sesión ha caducado o ya no es válida (no se pudo renovar el acceso). Inicia sesión de nuevo para continuar.",
    cta: "Ir al inicio de sesión",
  },
  en: {
    title: "Session expired",
    body:
      "Your session has expired or is no longer valid. We could not refresh your access. Please sign in again to continue.",
    cta: "Go to sign in",
  },
};

export function SessionExpiredModal({ onContinue }: SessionExpiredModalProps) {
  const { language } = useLanguage();
  const t = COPY[language] ?? COPY.es;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-gray-dark dark:shadow-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        aria-describedby="session-expired-desc"
      >
        <h2
          id="session-expired-title"
          className="text-heading-5 font-bold text-dark dark:text-white"
        >
          {t.title}
        </h2>
        <p id="session-expired-desc" className="mt-3 text-sm leading-relaxed text-dark-6 dark:text-dark-6">
          {t.body}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          {t.cta}
        </button>
      </div>
    </div>
  );
}
