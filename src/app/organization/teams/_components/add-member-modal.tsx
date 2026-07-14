"use client";

import InputGroup from "@/components/FormElements/InputGroup";
import { EmailIcon, UserIcon } from "@/assets/icons";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { useState } from "react";

export type RoleOption = { value: string; label: string };

type AddMemberModalProps = {
  onClose: () => void;
  onAdd: (data: {
    fullName: string;
    email: string;
    role: string;
    password?: string;
    mustChangePassword?: boolean;
  }) => void;
  roleOptions: RoleOption[];
  initialRole?: string;
  loading?: boolean;
  error?: string;
};

export function AddMemberModal({
  onClose,
  onAdd,
  roleOptions,
  initialRole,
  loading = false,
  error: externalError,
}: AddMemberModalProps) {
  const t = useUiTranslations();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const defaultRole = initialRole ?? roleOptions[0]?.value ?? "";
  const [role, setRole] = useState(defaultRole);
  
  // Flujo Google Workspace para la contraseña del nuevo miembro
  const [passwordMode, setPasswordMode] = useState<"auto" | "manual">("auto");
  const [customPassword, setCustomPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [localError, setLocalError] = useState("");

  const modalRef = useClickOutside<HTMLDivElement>(() => !loading && onClose());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (passwordMode === "manual") {
      if (!customPassword.trim()) {
        setLocalError("Debes escribir una contraseña manual.");
        return;
      }
      if (customPassword.length < 6) {
        setLocalError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
    }

    onAdd({
      fullName,
      email,
      role,
      password: passwordMode === "manual" ? customPassword : undefined,
      mustChangePassword,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        className="w-full max-w-xl rounded-xl bg-white shadow-xl dark:bg-gray-dark dark:shadow-card max-h-[90vh] overflow-y-auto"
      >
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h2 className="text-heading-5 font-semibold text-dark dark:text-white">
            {t.organizationTeams.addMemberModal.title}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputGroup
              label={t.organizationTeams.addMemberModal.fullNameLabel}
              type="text"
              name="fullName"
              placeholder={t.organizationTeams.addMemberModal.fullNamePlaceholder}
              value={fullName}
              handleChange={(e) => setFullName(e.target.value)}
              icon={<UserIcon />}
              iconPosition="left"
              required
            />
            <InputGroup
              label={t.organizationTeams.addMemberModal.emailLabel}
              type="email"
              name="email"
              placeholder={t.organizationTeams.addMemberModal.emailPlaceholder}
              value={email}
              handleChange={(e) => setEmail(e.target.value)}
              icon={<EmailIcon />}
              iconPosition="left"
              required
            />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-dark dark:text-white uppercase tracking-wider">
                {t.membersManagement.roleLabel}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 w-full rounded-lg border border-stroke bg-white px-4 text-xs dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Configuración de Contraseña (Google Workspace Style) */}
          <div className="border-t border-stroke pt-4 dark:border-dark-3 space-y-3">
            <h3 className="text-xs font-bold text-dark dark:text-white uppercase tracking-wider">
              Contraseña de Acceso
            </h3>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-dark dark:text-white">
                <input
                  type="radio"
                  name="add_password_mode"
                  checked={passwordMode === "auto"}
                  onChange={() => setPasswordMode("auto")}
                  className="h-4 w-4 accent-primary"
                />
                Generar contraseña automáticamente
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-dark dark:text-white">
                <input
                  type="radio"
                  name="add_password_mode"
                  checked={passwordMode === "manual"}
                  onChange={() => setPasswordMode("manual")}
                  className="h-4 w-4 accent-primary"
                />
                Crear contraseña manualmente
              </label>
            </div>

            {passwordMode === "manual" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-dark dark:text-white uppercase tracking-wider">
                  Contraseña Inicial
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Escribe la contraseña inicial"
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

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-dark-6 select-none mt-2">
              <input
                type="checkbox"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stroke accent-primary"
              />
              <div>
                <span className="font-semibold text-dark dark:text-white block">Exigir cambio de contraseña al próximo inicio</span>
                El miembro deberá cambiar esta clave la primera vez que inicie sesión.
              </div>
            </label>
          </div>

          {(externalError || localError || loading) && (
            <div className="mt-3">
              {(externalError || localError) && (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg">
                  {externalError || localError}
                </p>
              )}
              {loading && (
                <p className="text-sm text-dark-6 dark:text-dark-6">Creando miembro...</p>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3 border-t border-stroke pt-5 dark:border-dark-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-stroke px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-70"
            >
              {t.organizationTeams.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
            >
              {t.organizationTeams.addMemberModal.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
