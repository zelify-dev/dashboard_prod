"use client";

import { useState, useCallback } from "react";
import { saveAlaizaContextAnswers, type AlaizaContextAnswers } from "@/lib/alaiza-api";

interface OrgContextOnboardingModalProps {
  orgId: string;
  apiKey: string;
  apiSecret: string;
  /** true si el usuario tiene permiso para enviar (lógica de roles, actualmente siempre true) */
  canSubmit: boolean;
  /** Callback cuando el formulario se guarda correctamente */
  onSuccess: () => void;
}

const MAX_WORDS = 20;

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function WordCounter({ text, max }: { text: string; max: number }) {
  const count = countWords(text);
  const over = count > max;
  return (
    <span
      className={`text-xs font-medium tabular-nums ${
        over ? "text-red-500 dark:text-red-400" : "text-dark-6 dark:text-dark-6"
      }`}
    >
      {count}/{max} palabras
    </span>
  );
}

const QUESTIONS = [
  {
    id: "company_info" as keyof AlaizaContextAnswers,
    label: "¿Qué es tu empresa?",
    placeholder:
      "Ej: Somos una cooperativa de ahorro y crédito que sirve a comunidades rurales del Ecuador.",
    helper: "Cuéntanos en máximo 20 palabras la información de tu empresa.",
  },
  {
    id: "services_offered" as keyof AlaizaContextAnswers,
    label: "¿Qué servicios ofrecen?",
    placeholder:
      "Ej: Ofrecemos créditos, ahorros, transferencias, pagos de servicios básicos y tarjetas.",
    helper: "Cuéntanos en máximo 20 palabras los servicios que ofrecen.",
  },
  {
    id: "goals" as keyof AlaizaContextAnswers,
    label: "¿Qué esperan alcanzar?",
    placeholder:
      "Ej: Queremos digitalizar las finanzas de nuestros socios y reducir las visitas a oficinas.",
    helper: "Cuéntanos en máximo 20 palabras lo que esperan alcanzar.",
  },
];

export function OrgContextOnboardingModal({
  orgId,
  apiKey,
  apiSecret,
  canSubmit,
  onSuccess,
}: OrgContextOnboardingModalProps) {
  const [answers, setAnswers] = useState<AlaizaContextAnswers>({
    company_info: "",
    services_offered: "",
    goals: "",
  });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const updateAnswer = useCallback((field: keyof AlaizaContextAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }, []);

  const hasWordErrors = QUESTIONS.some((q) => countWords(answers[q.id]) > MAX_WORDS);
  const hasEmptyFields = QUESTIONS.some((q) => answers[q.id].trim() === "");
  const isDisabled = hasWordErrors || hasEmptyFields || !canSubmit || loading;

  const handleSubmit = async () => {
    if (isDisabled) return;
    setLoading(true);
    setServerError(null);
    try {
      await saveAlaizaContextAnswers(orgId, apiKey, apiSecret, answers);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar el contexto. Intenta de nuevo.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alaiza-onboarding-title"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div className="w-full max-w-xl animate-fade-in rounded-2xl bg-white shadow-2xl dark:bg-dark-2">
          {/* Header */}
          <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#1a3c6e] to-[#2563eb] px-8 py-7">
            {/* Decoración */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />

            <div className="relative flex items-center gap-4">
              {/* Ícono Alaiza */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur-sm">
                🤖
              </div>
              <div>
                <h2
                  id="alaiza-onboarding-title"
                  className="text-xl font-bold text-white"
                >
                  Configura a Alaiza para tu organización
                </h2>
                <p className="mt-0.5 text-sm text-blue-100">
                  Necesitamos conocerte para personalizar el asistente de IA.
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-5">
            {/* Banner de roles (preparado, actualmente comentado) */}
            {/* {!canSubmit && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-300">
                <strong>Acceso restringido.</strong> Solo los administradores de la organización pueden configurar el contexto de Alaiza.
              </div>
            )} */}

            <p className="text-sm text-dark-6 dark:text-dark-6">
              Responde las siguientes 3 preguntas en{" "}
              <span className="font-semibold text-primary">máximo 20 palabras</span>{" "}
              cada una. Con esta información Alaiza generará un asistente personalizado para tu empresa.
            </p>

            {QUESTIONS.map((q) => {
              const wordCount = countWords(answers[q.id]);
              const isOver = wordCount > MAX_WORDS;
              return (
                <div key={q.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <label
                      htmlFor={`alaiza-field-${q.id}`}
                      className="block text-sm font-semibold text-dark dark:text-white"
                    >
                      {q.label}
                    </label>
                    <WordCounter text={answers[q.id]} max={MAX_WORDS} />
                  </div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{q.helper}</p>
                  <textarea
                    id={`alaiza-field-${q.id}`}
                    rows={2}
                    value={answers[q.id]}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    disabled={loading || !canSubmit}
                    className={`block w-full resize-none rounded-lg border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 dark:bg-dark-3 dark:text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                      isOver
                        ? "border-red-400 bg-red-50 text-dark focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:bg-red-900/10"
                        : "border-stroke bg-white text-dark focus:border-primary focus:ring-primary/20 dark:border-dark-3"
                    }`}
                  />
                  {isOver && (
                    <p className="text-xs font-medium text-red-500 dark:text-red-400">
                      Máximo {MAX_WORDS} palabras. Actualmente tienes {wordCount}.
                    </p>
                  )}
                </div>
              );
            })}

            {/* Error del servidor */}
            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
                {serverError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="rounded-b-2xl border-t border-stroke bg-gray-50 px-8 py-4 dark:border-dark-3 dark:bg-dark-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-dark-6 dark:text-dark-6">
                Esta información se usará para generar el contexto de Alaiza.
              </p>
              <button
                type="button"
                id="alaiza-onboarding-submit"
                onClick={handleSubmit}
                disabled={isDisabled}
                className="flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Generando contexto…
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar y continuar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
