"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Button } from "@/components/ui-elements/button";
import { useState } from "react";
import { AuthError } from "@/lib/auth-api";
import { useOnboardingStatus } from "@/contexts/onboarding-status-context";
import { cn } from "@/lib/utils";
import { getCurrentOrganizationId, notifyOnboardingStatusUpdated, postKybFiles } from "@/lib/onboarding-api";

/** Subida KYB desde esta pantalla habilitada. */
const KYB_DASHBOARD_UPLOAD_ENABLED = true;

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 6C10.5523 6 11 6.44772 11 7C11 7.55228 10.5523 8 10 8C9.44772 8 9 7.55228 9 7C9 6.44772 9.44772 6 10 6ZM10 10C10.5523 10 11 10.4477 11 11V14C11 14.5523 10.5523 15 10 15C9.44772 15 9 14.5523 9 14V11C9 10.4477 9.44772 10 10 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4 8 4v14" />
      <path d="M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10H9V10z" />
    </svg>
  );
}

function CertificateIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 15c-4.4 0-8 1.8-8 4v2h16v-2c0-2.2-3.6-4-8-4Z" />
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M15 13a6 6 0 0 1 6 0" />
      <path d="M9 13a6 6 0 0 0-6 0" />
    </svg>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function KybPageContent() {
  const { flags, loading: statusLoading, percents } = useOnboardingStatus();
  const locked = !statusLoading && flags.kybLocked;

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleSubmit = async () => {
    if (!KYB_DASHBOARD_UPLOAD_ENABLED || locked) return;
    const orgId = getCurrentOrganizationId();
    if (!orgId || !file) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await postKybFiles(orgId, file);
      setSuccess(true);
      notifyOnboardingStatusUpdated();
    } catch (e) {
      const msg =
        e instanceof AuthError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo enviar el archivo";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName="KYB" />

      <div className="rounded-sm border border-stroke bg-white px-5 pb-8 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <div className="mb-6">
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-[#EBF5FF] px-4 py-3 text-[#1C64F2] dark:bg-blue-900/30 dark:text-blue-400">
            <InfoIcon className="mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold block mb-0.5">
                Información importante
              </span>
              Si no envió la documentación por carga en Docsend, proceda a
              cargar por aquí. Por favor, comprima todos los documentos
              requeridos en un archivo ZIP y súbalo a continuación. Asegúrese de
              que todos los documentos estén legibles y sean archivos válidos.
            </div>
          </div>

          {locked && (
            <div
              className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
              role="status"
            >
              <span className="font-semibold">Documentación KYB ya enviada.</span>{" "}
              {percents.kyb != null && (
                <span className="tabular-nums">Progreso: {percents.kyb}%.</span>
              )}{" "}
              No puedes subir otro archivo desde aquí salvo que el equipo te lo indique.
            </div>
          )}

          <h3 className="mb-4 text-base font-medium text-black dark:text-white">
            Documentación requerida
          </h3>

          <div className="mb-8 grid gap-4">
            {/* Datos básicos */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-strokedark dark:bg-boxdark">
              <div className="mb-2 flex items-center gap-2">
                <PageIcon className="text-blue-600" />
                <h4 className="font-semibold text-black dark:text-white text-sm">
                  Datos básicos
                </h4>
              </div>
              <ul className="list-inside list-disc text-xs text-body-color dark:text-body-color-dark pl-1 space-y-1">
                <li>Nombre legal de la empresa</li>
                <li>Identificación fiscal (EIN u otro)</li>
                <li>Tipo de entidad</li>
                <li>Dirección física</li>
                <li>Teléfono, correo y sitio web</li>
              </ul>
            </div>

            {/* Representante autorizado o UBO */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-strokedark dark:bg-boxdark">
              <div className="mb-2 flex items-center gap-2">
                <UserIcon className="text-green-500" />
                <h4 className="font-semibold text-black dark:text-white text-sm">
                  Representante autorizado o UBO
                </h4>
              </div>
              <ul className="list-inside list-disc text-xs text-body-color dark:text-body-color-dark pl-1 space-y-1">
                <li>Datos personales completos</li>
                <li>Documento de identidad oficial</li>
                <li>Comprobante de dirección</li>
              </ul>
            </div>

            {/* Propietarios y directivos */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-strokedark dark:bg-boxdark">
              <div className="mb-2 flex items-center gap-2">
                <CertificateIcon className="text-purple-500" />
                <h4 className="font-semibold text-black dark:text-white text-sm">
                  Propietarios y directivos
                </h4>
              </div>
              <ul className="list-inside list-disc text-xs text-body-color dark:text-body-color-dark pl-1 space-y-1">
                <li>Información de quienes posean ≥25% de participación</li>
                <li>Cargos de control (CEO, CFO, presidente)</li>
                <li>Documentación de identidad y participación</li>
              </ul>
            </div>

            {/* Documentos legales */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-strokedark dark:bg-boxdark">
              <div className="mb-2 flex items-center gap-2">
                <BuildingIcon className="text-orange-500" />
                <h4 className="font-semibold text-black dark:text-white text-sm">
                  Documentos legales
                </h4>
              </div>
              <ul className="list-inside list-disc text-xs text-body-color dark:text-body-color-dark pl-1 space-y-1">
                <li>Certificado de constitución</li>
                <li>Licencia comercial (si aplica)</li>
                <li>Nombre comercial registrado (DBA)</li>
                <li>Permisos de operación según el rubro</li>
              </ul>
            </div>
          </div>

          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Cargar documentación KYB (archivo ZIP)
          </label>

          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E2E8F0] py-12 dark:border-strokedark",
              locked || !KYB_DASHBOARD_UPLOAD_ENABLED
                ? "cursor-not-allowed bg-gray-50/80 opacity-70 dark:bg-boxdark/50"
                : "hover:bg-gray-50 dark:hover:bg-boxdark-2",
            )}
          >
            <input
              type="file"
              onChange={handleFileChange}
              disabled={locked || !KYB_DASHBOARD_UPLOAD_ENABLED}
              className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              accept=".zip,.rar,.7z"
            />

            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-meta-4">
                <FileTextIcon className="text-[#9CA3AF] dark:text-body-color-dark" />
              </div>

              <div className="mb-1 text-base text-[#111928] dark:text-white">
                <span className="font-normal">
                  Arrastra y suelta tu archivo ZIP aquí
                </span>
              </div>

              <div className="mb-4 text-xs text-[#6B7280]">o</div>

              <Button
                label={file ? "Cambiar archivo" : "Seleccionar archivo ZIP"}
                variant="primary"
                size="small"
                shape="rounded"
                className="pointer-events-none mb-3 !bg-[#004196] hover:!bg-[#004196]/90"
                type="button"
              />

              {file ? (
                <p className="text-sm text-green-500 font-medium">
                  {file.name}
                </p>
              ) : (
                <p className="text-xs text-[#6B7280]">
                  Archivo ZIP (max. 50MB)
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            Documentación KYB enviada correctamente.
          </p>
        )}

        <div className="mt-8">
          <Button
            label={submitting ? "Enviando…" : "Enviar documentación KYB"}
            variant="primary"
            onClick={handleSubmit}
            className={`w-full sm:w-auto ${
              !KYB_DASHBOARD_UPLOAD_ENABLED || !file || submitting
                ? "bg-[#9CA3AF] hover:bg-opacity-100 cursor-not-allowed border-none text-white"
                : "!bg-[#004196] hover:!bg-[#004196]/90"
            }`}
            disabled={
              !KYB_DASHBOARD_UPLOAD_ENABLED || locked || !file || submitting
            }
            shape="rounded"
          />
          {!KYB_DASHBOARD_UPLOAD_ENABLED && (
            <p className="mt-2 text-xs text-body-color dark:text-body-color-dark">
              La carga de KYB desde el dashboard está desactivada; usa el canal indicado por el equipo
              (p. ej. Docsend).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
