"use client";

import { useLanguageTranslations } from "@/hooks/use-language-translations";
import { type Language } from "@/contexts/language-context";

interface ScoreSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScoreSystemModalTranslations = {
  title: string;
  description: string;
  criteria: Array<{ name: string; description: string }>;
  close: string;
};

const translations: Record<Language, ScoreSystemModalTranslations> = {
  en: {
    title: "Zelify Score Criteria",
    description: "Your Zelify Score is calculated based on the following criteria:",
    criteria: [
      {
        name: "Stability Intelligence",
        description: "Measures how consistently you manage your finances and make informed decisions based on your spending patterns.",
      },
      {
        name: "Intelligence",
        description: "Evaluates your ability to analyze financial data and make smart decisions that lead to better outcomes.",
      },
      {
        name: "Discipline",
        description: "Assesses your consistency in managing finances and following through with your financial goals.",
      },
    ],
    close: "Close",
  },
  es: {
    title: "Criterios del Zelify Score",
    description: "Tu Zelify Score se calcula basándose en los siguientes criterios:",
    criteria: [
      {
        name: "Inteligencia de Estabilidad",
        description: "Mide qué tan consistentemente gestionas tus finanzas y tomas decisiones informadas basadas en tus patrones de gasto.",
      },
      {
        name: "Inteligencia",
        description: "Evalúa tu capacidad para analizar datos financieros y tomar decisiones inteligentes que conduzcan a mejores resultados.",
      },
      {
        name: "Disciplina",
        description: "Evalúa tu consistencia en la gestión de finanzas y el seguimiento de tus objetivos financieros.",
      },
    ],
    close: "Cerrar",
  },
};

export function ScoreSystemModal({ isOpen, onClose }: ScoreSystemModalProps) {
  const t = useLanguageTranslations(translations);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[320px] rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
          {t.title}
        </h2>

        {/* Description */}
        <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">
          {t.description}
        </p>

        {/* Criteria List */}
        <div className="space-y-3">
          {t.criteria.map((criterion, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
            >
              <h3 className="mb-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                {criterion.name}
              </h3>
              <p className="text-[10px] leading-relaxed text-gray-600 dark:text-gray-400">
                {criterion.description}
              </p>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "#004492" }}
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
