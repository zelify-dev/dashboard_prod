"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Button } from "@/components/ui-elements/button";
import { useState } from "react";
import { AuthError } from "@/lib/auth-api";
import { useOnboardingStatus } from "@/contexts/onboarding-status-context";
import { cn } from "@/lib/utils";
import {
  getCurrentOrganizationId,
  isAmlOnboardingEnabled,
  notifyOnboardingStatusUpdated,
  postAmlFiles,
} from "@/lib/onboarding-api";

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

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function AmlPageContent() {
  const { flags, loading: statusLoading, percents } = useOnboardingStatus();
  const amlOnboardingEnabled = isAmlOnboardingEnabled();
  const locked = !statusLoading && flags.amlLocked;

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
    if (!amlOnboardingEnabled || locked) return;
    const orgId = getCurrentOrganizationId();
    if (!orgId || !file) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await postAmlFiles(orgId, file);
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
      <Breadcrumb pageName="Documentación AML" />

      <div className="mb-6">
        <p className="mt-2 text-base text-body-color dark:text-body-color-dark">
          {amlOnboardingEnabled
            ? "Cargue la documentación AML requerida"
            : "La carga de documentación AML está deshabilitada temporalmente"}
        </p>
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 pb-8 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        {!amlOnboardingEnabled && (
          <div
            className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            Esta sección está deshabilitada para todas las organizaciones por el momento.
            La lógica final de visibilidad se habilitará cuando integremos la configuración desde backend.
          </div>
        )}

        <div className="mb-6">
          <h3 className="mb-4 text-base font-medium text-blue-900 dark:text-white">
            Documentación AML
          </h3>

          {locked && (
            <div
              className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
              role="status"
            >
              <span className="font-semibold">Documentación AML ya enviada.</span>{" "}
              {percents.aml != null && (
                <span className="tabular-nums">Progreso: {percents.aml}%.</span>
              )}{" "}
              No puedes subir otro archivo desde aquí salvo que el equipo te lo indique.
            </div>
          )}

          <div className="mb-6 flex items-start gap-3 rounded-lg bg-[#EBF5FF] px-4 py-3 text-[#1C64F2] dark:bg-blue-900/30 dark:text-blue-400">
            <InfoIcon className="mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold block mb-0.5">
                Información importante
              </span>
              Cargue la documentación relacionada con medidas Anti-Lavado de
              Dinero (AML) de su empresa. Asegúrese de que todos los documentos
              estén legibles y sean archivos válidos.
            </div>
          </div>

          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Documentación AML
          </label>

          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E2E8F0] py-12 dark:border-strokedark",
              !amlOnboardingEnabled || locked
                ? "cursor-not-allowed bg-gray-50/80 opacity-70 dark:bg-boxdark/50"
                : "hover:bg-gray-50 dark:hover:bg-boxdark-2",
            )}
          >
            <input
              type="file"
              onChange={handleFileChange}
              disabled={!amlOnboardingEnabled || locked}
              className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              accept=".pdf,.doc,.docx"
            />

            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-meta-4">
                <ShieldCheckIcon className="text-[#9CA3AF] dark:text-body-color-dark" />
              </div>

              <div className="mb-1 text-base text-[#111928] dark:text-white">
                <span className="font-normal">
                  Arrastra y suelta tu documentación AML aquí
                </span>
              </div>

              <div className="mb-4 text-xs text-[#6B7280]">o</div>

              <Button
                label={file ? "Cambiar archivo" : "Seleccionar archivo"}
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
                  PDF, DOC, DOCX (max. 25MB)
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
            Documentación AML enviada correctamente.
          </p>
        )}

        <div className="mt-8">
          <Button
            label={submitting ? "Enviando…" : "Enviar documentación AML"}
            variant="primary"
            onClick={handleSubmit}
            className={`w-full sm:w-auto ${
              !amlOnboardingEnabled || !file || submitting
                ? "bg-[#9CA3AF] hover:bg-opacity-100 cursor-not-allowed border-none text-white"
                : "!bg-[#004196] hover:!bg-[#004196]/90"
            }`}
            disabled={!amlOnboardingEnabled || locked || !file || submitting}
            shape="rounded"
          />
        </div>
      </div>
    </div>
  );
}
