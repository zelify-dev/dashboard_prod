"use client";

import { useState } from "react";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import type { OrgUserListItem, SetOrgUserPasswordPayload, SetOrgUserPasswordResponse } from "@/lib/organization-users-api";
import { TemporaryPasswordModal } from "./temporary-password-modal";

type ResetPasswordModalProps = {
  user: OrgUserListItem;
  onClose: () => void;
  onReset: (userId: string, payload: SetOrgUserPasswordPayload) => Promise<SetOrgUserPasswordResponse>;
  onSendEmail?: (userId: string, temporaryPassword: string) => Promise<void>;
};

export function ResetPasswordModal({ user, onClose, onReset, onSendEmail }: ResetPasswordModalProps) {
  const t = useUiTranslations();
  const m = t.membersManagement;
  
  const [step, setStep] = useState<"confirm" | "password">("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [emailSentDirectly, setEmailSentDirectly] = useState(false);

  // Estados del flujo Google Workspace
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      const payload: SetOrgUserPasswordPayload = {
        mode,
        must_change_password: mustChangePassword,
        send_email: sendEmail,
      };

      if (mode === "manual") {
        if (!newPassword.trim()) {
          throw new Error("Debes escribir una contraseña manual.");
        }
        if (newPassword.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }
        payload.new_password = newPassword;
      }

      const result = await onReset(user.id, payload);
      setTempPassword(result.password ?? result.temporary_password ?? newPassword);
      setEmailSentDirectly(!!result.email_sent);
      setStep("password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al restablecer contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (step === "password") {
    return (
      <TemporaryPasswordModal
        temporaryPassword={tempPassword}
        onSendEmail={
          onSendEmail && !emailSentDirectly
            ? (temporaryPassword) => onSendEmail(user.id, temporaryPassword)
            : undefined
        }
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark dark:shadow-card">
        <h2 className="text-heading-5 font-semibold text-dark dark:text-white">
          Restablecer contraseña
        </h2>
        <p className="mt-1.5 text-xs text-dark-6">
          Define los parámetros de la nueva clave de acceso para el miembro de tu equipo.
        </p>
        
        <div className="mt-4 p-3 bg-slate-50 dark:bg-dark-2 rounded-lg border border-stroke dark:border-dark-3">
          <div className="text-xs text-dark-6">Usuario:</div>
          <div className="text-xs font-bold text-dark dark:text-white truncate">{user.full_name}</div>
          <div className="text-xs text-dark-6 font-mono mt-0.5 truncate">{user.email}</div>
        </div>

        {/* Opciones de Contraseña */}
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-dark dark:text-white">
              <input
                type="radio"
                name="password_mode"
                checked={mode === "auto"}
                onChange={() => setMode("auto")}
                className="h-4 w-4 accent-primary"
              />
              Generar contraseña automáticamente
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-dark dark:text-white">
              <input
                type="radio"
                name="password_mode"
                checked={mode === "manual"}
                onChange={() => setMode("manual")}
                className="h-4 w-4 accent-primary"
              />
              Crear contraseña manualmente
            </label>
          </div>

          {mode === "manual" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-dark dark:text-white uppercase tracking-wider">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Escribe la contraseña segura"
                  className="h-10 w-full rounded-lg border border-stroke bg-white pl-3 pr-10 text-xs text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-dark-6 hover:text-dark dark:hover:text-white"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Checkboxes de Opciones */}
          <div className="space-y-2 border-t border-stroke pt-3 dark:border-dark-3">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-dark-6 select-none">
              <input
                type="checkbox"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stroke accent-primary"
              />
              <div>
                <span className="font-semibold text-dark dark:text-white block">Exigir cambio de contraseña al próximo inicio</span>
                El usuario deberá crear una contraseña nueva la próxima vez que acceda.
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-dark-6 select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stroke accent-primary"
              />
              <div>
                <span className="font-semibold text-dark dark:text-white block">Enviar contraseña por correo electrónico</span>
                Se enviarán las credenciales al correo del usuario.
              </div>
            </label>
          </div>
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg">{error}</p>}
        
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stroke bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white transition"
          >
            {t.organizationTeams.actions.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-primary hover:bg-opacity-90 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-70"
          >
            {loading ? "Procesando..." : "Restablecer contraseña"}
          </button>
        </div>
      </div>
    </div>
  );
}
