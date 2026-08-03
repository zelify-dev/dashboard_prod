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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div
        className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        aria-describedby="session-expired-desc"
      >
        <h2
          id="session-expired-title"
          className="text-sm font-normal text-dark"
        >
          {t.title}
        </h2>
        <p id="session-expired-desc" className="mt-3 text-xs font-light leading-relaxed text-dark-6">
          {t.body}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-xl bg-zelify-midnight px-4 py-2 text-xs font-light text-white transition hover:bg-black active:scale-95"
        >
          {t.cta}
        </button>
      </div>
    </div>
  );
}
