"use client";

import { useState } from "react";
import { useUiTranslations } from "@/hooks/use-ui-translations";

type TemporaryPasswordModalProps = {
  temporaryPassword: string;
  onSendEmail?: (temporaryPassword: string) => Promise<void>;
  onClose: () => void;
};

export function TemporaryPasswordModal({
  temporaryPassword,
  onSendEmail,
  onClose,
}: TemporaryPasswordModalProps) {
  const t = useUiTranslations();
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<"success" | "error" | null>(null);
  const m = t.membersManagement;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSendEmail = async () => {
    if (!onSendEmail) return;
    setSendingEmail(true);
    setEmailMessage(null);
    try {
      await onSendEmail(temporaryPassword);
      setEmailMessage("success");
    } catch (presetError) {
      setEmailMessage("error");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark dark:shadow-card">
        
        {/* Encabezado con visto bueno animado sutil */}
        <div className="flex flex-col items-center text-center space-y-2 mb-5">
          <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-md font-bold text-dark dark:text-white uppercase tracking-wider">
            Contraseña Actualizada
          </h2>
          <p className="text-xs text-dark-6 max-w-xs">
            Las nuevas credenciales del miembro del equipo se configuraron de forma correcta.
          </p>
        </div>

        {/* Bloque de contraseña para copiar */}
        <div className="rounded-xl border border-stroke bg-slate-50/70 p-3.5 dark:border-dark-3 dark:bg-dark-2/40 space-y-1">
          <span className="block text-[10px] font-bold text-dark-6 uppercase tracking-wider">
            Clave generada
          </span>
          <div className="flex items-center justify-between gap-3">
            <code className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-dark dark:text-white select-all">
              {temporaryPassword}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg border border-stroke bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white transition"
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        {onSendEmail && (
          <div className="mt-4 border-t border-stroke pt-4 dark:border-dark-3">
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="w-full rounded-lg border border-stroke bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-dark transition dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              {sendingEmail ? "Enviando..." : "Enviar credenciales por correo electrónico"}
            </button>
            {emailMessage === "success" && (
              <p className="mt-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg">
                Las credenciales fueron enviadas exitosamente.
              </p>
            )}
            {emailMessage === "error" && (
              <p className="mt-2 text-center text-xs font-semibold text-red-600 dark:text-red-400 bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg">
                No se pudo enviar el correo de credenciales.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end pt-3 border-t border-stroke dark:border-dark-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#0A2540] hover:bg-[#0A2540]/90 text-white px-5 py-2.5 text-xs font-semibold transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
