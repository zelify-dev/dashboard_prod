"use client";

import { useState, useEffect } from "react";
import {
  CallIcon,
  EmailIcon,
  PencilSquareIcon,
  UserIcon,
} from "@/assets/icons";
import InputGroup from "@/components/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { 
  getMe, 
  updateMe, 
  initiateEmailChange, 
  verifyEmailChange, 
  initiatePhoneChange, 
  verifyPhoneChange,
  syncMe,
  type AuthUser
} from "@/lib/auth-api";
import { Button } from "@/components/ui-elements/button";
import { cn } from "@/lib/utils";

/** 
 * Mini-componente de Modal para flujos de OTP 
 * Diseñado con estética premium Zelify
 */
function OTPModal({ 
  title, 
  description, 
  isOpen, 
  onClose, 
  children 
}: { 
  title: string; 
  description: string; 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-8 shadow-2xl dark:bg-dark-2">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-dark dark:text-white">{title}</h3>
          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">{description}</p>
        </div>
        {children}
        <div className="mt-8 flex justify-end">
          <button 
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-dark-6 transition-colors hover:text-dark dark:text-dark-6 dark:hover:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function PersonalInfoForm() {
  const translations = useUiTranslations();
  const [userData, setUserData] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para flujos de OTP
  const [emailModal, setEmailModal] = useState(false);
  const [phoneModal, setPhoneModal] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1: Input nuevo valor, 2: Input OTP
  const [newVal, setNewVal] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Cargar datos al montar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMe();
        if (data.user) setUserData(data.user);
      } catch (err) {
        setError("Error al cargar perfil");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleBasicUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const full_name = formData.get("fullName") as string;
      // const username = formData.get("username") as string; // API guide says only full_name is supported for now? 
      // Actually checking guide: "full_name": "...", "username": "..."
      
      await updateMe({ full_name });
      await syncMe();
      setSuccess("Perfil actualizado con éxito");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleInitiateChange = async (type: "email" | "phone") => {
    setSecurityLoading(true);
    setSecurityError(null);
    try {
      if (type === "email") {
        await initiateEmailChange(newVal);
      } else {
        await initiatePhoneChange(newVal);
      }
      setOtpStep(2);
    } catch (err: any) {
      setSecurityError(err.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleVerifyOTP = async (type: "email" | "phone") => {
    setSecurityLoading(true);
    setSecurityError(null);
    try {
      if (type === "email") {
        await verifyEmailChange(otpCode);
      } else {
        await verifyPhoneChange(otpCode);
      }
      await syncMe();
      // Recargar datos locales
      const data = await getMe();
      if (data.user) setUserData(data.user);
      
      // Cerrar modal
      if (type === "email") setEmailModal(false);
      else setPhoneModal(false);
      
      setSuccess(`${type === "email" ? "Correo" : "Teléfono"} actualizado con éxito`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setSecurityError(err.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  const closeSecurityModal = () => {
    setEmailModal(false);
    setPhoneModal(false);
    setOtpStep(1);
    setNewVal("");
    setOtpCode("");
    setSecurityError(null);
  };

  if (loading) {
    return (
      <ShowcaseSection title={translations.settings.personalInformation} className="!p-7">
        <div className="flex animate-pulse flex-col gap-6">
          <div className="h-20 w-full rounded-lg bg-gray-2 dark:bg-dark-3"></div>
          <div className="h-14 w-full rounded-lg bg-gray-2 dark:bg-dark-3"></div>
          <div className="h-14 w-full rounded-lg bg-gray-2 dark:bg-dark-3"></div>
        </div>
      </ShowcaseSection>
    );
  }

  return (
    <>
      <ShowcaseSection 
        title={translations.settings.personalInformation} 
        rootClassName="h-full"
        className="!p-7 h-full flex flex-col"
      >
        {(error || success) && (
          <div className={cn(
            "mb-6 rounded-lg p-4 text-sm font-medium",
            error ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          )}>
            {error || success}
          </div>
        )}

        <form onSubmit={handleBasicUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup
              type="text"
              name="fullName"
              label={translations.settings.fullName}
              placeholder="Nombre Completo"
              defaultValue={userData?.full_name || ""}
              icon={<UserIcon />}
              iconPosition="left"
              height="sm"
              required
            />
            
            <InputGroup
              type="text"
              name="username"
              label={translations.settings.username}
              placeholder="usuario"
              defaultValue={(userData as any).username || ""}
              icon={<UserIcon />}
              iconPosition="left"
              height="sm"
              readOnly
              customInputClassName="bg-gray-2 dark:bg-dark-3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-dark dark:text-white">
                  {translations.settings.phoneNumber}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneModal(true);
                    setOtpStep(1);
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Cambiar
                </button>
              </div>
              <InputGroup
                label=""
                placeholder=""
                type="text"
                readOnly
                value={(userData as any)?.phone || "No proporcionado"}
                icon={<CallIcon />}
                iconPosition="left"
                height="sm"
                customInputClassName="bg-gray-2 dark:bg-dark-3"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-dark dark:text-white">
                  {translations.settings.emailAddress}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmailModal(true);
                    setOtpStep(1);
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Cambiar
                </button>
              </div>
              <InputGroup
                label=""
                placeholder=""
                type="email"
                readOnly
                value={userData?.email || ""}
                icon={<EmailIcon />}
                iconPosition="left"
                height="sm"
                customInputClassName="bg-gray-2 dark:bg-dark-3"
              />
            </div>
          </div>

          <div className="flex-grow" />

          <div className="mt-8 flex justify-end gap-3 border-t border-stroke pt-6 dark:border-dark-3">
            <button
              className="rounded-lg border border-stroke px-8 py-[9px] text-sm font-semibold text-dark hover:bg-gray-2 transition-all dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
              type="button"
              onClick={() => window.location.reload()}
            >
              {translations.settings.cancel}
            </button>

            <button
              className="flex items-center justify-center rounded-lg bg-primary px-8 py-[9px] text-sm font-semibold text-white shadow-sm transition-all hover:bg-opacity-90 disabled:opacity-50"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                translations.settings.save
              )}
            </button>
          </div>
        </form>
      </ShowcaseSection>

      {/* Modal de Cambio de Email */}
      <OTPModal
        isOpen={emailModal}
        onClose={closeSecurityModal}
        title="Cambiar Correo Electrónico"
        description={otpStep === 1 
          ? "Ingresa la nueva dirección de correo. Te enviaremos un código de verificación." 
          : "Ingresa el código OTP que te enviamos a tu nuevo correo."}
      >
        <div className="space-y-4">
          {securityError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {securityError}
            </div>
          )}
          
          {otpStep === 1 ? (
            <div className="space-y-2">
              <input
                type="email"
                placeholder="nuevo-correo@ejemplo.com"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                className="w-full rounded-lg border border-stroke px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
              <Button
                label="Enviar Código de Verificación"
                variant="primary"
                className="w-full"
                onClick={() => handleInitiateChange("email")}
                disabled={securityLoading || !newVal.includes("@")}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                maxLength={6}
                placeholder="######"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-2xl font-bold tracking-[0.5em] rounded-lg border border-stroke px-4 py-3 focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
              <Button
                label="Confirmar Cambio de Correo"
                variant="primary"
                className="w-full"
                onClick={() => handleVerifyOTP("email")}
                disabled={securityLoading || otpCode.length < 6}
              />
            </div>
          )}
        </div>
      </OTPModal>

      {/* Modal de Cambio de Teléfono */}
      <OTPModal
        isOpen={phoneModal}
        onClose={closeSecurityModal}
        title="Cambiar Teléfono"
        description={otpStep === 1 
          ? "Ingresa tu nuevo número de teléfono. Te enviaremos un código vía SMS." 
          : "Ingresa el código OTP que recibiste por SMS."}
      >
        <div className="space-y-4">
          {securityError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {securityError}
            </div>
          )}
          
          {otpStep === 1 ? (
            <div className="space-y-2">
              <input
                type="tel"
                placeholder="+593 9..."
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                className="w-full rounded-lg border border-stroke px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
              <Button
                label="Enviar SMS de Verificación"
                variant="primary"
                className="w-full"
                onClick={() => handleInitiateChange("phone")}
                disabled={securityLoading || newVal.length < 5}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                maxLength={6}
                placeholder="######"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-2xl font-bold tracking-[0.5em] rounded-lg border border-stroke px-4 py-3 focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
              <Button
                label="Confirmar Cambio de Teléfono"
                variant="primary"
                className="w-full"
                onClick={() => handleVerifyOTP("phone")}
                disabled={securityLoading || otpCode.length < 6}
              />
            </div>
          )}
        </div>
      </OTPModal>
    </>
  );
}
