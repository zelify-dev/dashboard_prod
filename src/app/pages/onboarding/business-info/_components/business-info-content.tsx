"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Button } from "@/components/ui-elements/button";
import { useEffect, useMemo, useState } from "react";
import { AuthError } from "@/lib/auth-api";
import { cn } from "@/lib/utils";
import {
  getCurrentOrganizationId,
  getOnboardingStatus,
  notifyOnboardingStatusUpdated,
  parseBusinessPlanStatus,
  postBusinessPlanFile,
} from "@/lib/onboarding-api";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 6C10.5523 6 11 6.44772 11 7C11 7.55228 10.5523 8 10 8C9.44772 8 9 7.55228 9 7C9 6.44772 9.44772 6 10 6ZM10 10C10.5523 10 11 10.4477 11 11V14C11 14.5523 10.5523 15 10 15C9.44772 15 9 14.5523 9 14V11C9 10.4477 9.44772 10 10 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  );
}

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx + 1).toLowerCase();
}

export function BusinessInfoContent() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const acceptedLabel = useMemo(() => ".pdf, .doc, .docx (max. 25MB)", []);

  const loadStatus = async () => {
    const orgId = getCurrentOrganizationId();
    if (!orgId) {
      setLoadingStatus(false);
      setError("No hay organización en sesión.");
      return;
    }
    setLoadingStatus(true);
    try {
      const raw = await getOnboardingStatus(orgId);
      const bp = parseBusinessPlanStatus(raw);
      setUploaded(bp.uploaded);
    } catch (e) {
      const msg =
        e instanceof AuthError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo obtener el estado de onboarding";
      setError(msg);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const validateFile = (f: File): string | null => {
    const ext = fileExt(f.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Formato no permitido. Usa PDF, DOC o DOCX.";
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      return "El archivo supera el tamaño máximo permitido (25MB).";
    }
    return null;
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setSuccess(false);
    const next = e.target.files[0];
    const issue = validateFile(next);
    if (issue) {
      setFile(null);
      setError(issue);
      return;
    }
    setError(null);
    setFile(next);
  };

  const onSubmit = async () => {
    if (uploaded || uploading) return;
    const orgId = getCurrentOrganizationId();
    if (!orgId) {
      setError("No hay organización en sesión.");
      return;
    }
    if (!file) {
      setError("Selecciona un archivo antes de enviar.");
      return;
    }

    const issue = validateFile(file);
    if (issue) {
      setError(issue);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await postBusinessPlanFile(orgId, file);
      setSuccess(true);
      setFile(null);
      setUploaded(true);
      notifyOnboardingStatusUpdated();
      await loadStatus();
    } catch (e) {
      const msg =
        e instanceof AuthError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo subir el Business Plan";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName="Business Plan" />

      <div className="rounded-sm border border-stroke bg-white px-5 pb-8 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <h3 className="mb-4 text-base font-medium text-black dark:text-white">Carga de Business Plan</h3>

        <div className="mb-6 flex items-start gap-3 rounded-lg bg-[#EBF5FF] px-4 py-3 text-[#1C64F2] dark:bg-blue-900/30 dark:text-blue-400">
          <InfoIcon className="mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold block mb-0.5">Informacion importante</span>
            Sube un unico archivo de plan de negocio en formato PDF, DOC o DOCX. El archivo se registrara para tu organizacion y no se requiere volver a subirlo salvo indicacion del equipo.
          </div>
        </div>

        {loadingStatus ? (
          <p className="mb-4 text-sm text-body-color dark:text-body-color-dark">Cargando estado...</p>
        ) : null}

        {uploaded ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
            <span className="font-semibold">Business Plan ya cargado.</span>
          </div>
        ) : null}

        <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Archivo Business Plan</label>

        <div
          className={cn(
            "relative mb-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E2E8F0] py-12 dark:border-strokedark",
            uploaded ? "cursor-not-allowed bg-gray-50/80 opacity-70 dark:bg-boxdark/50" : "hover:bg-gray-50 dark:hover:bg-boxdark-2",
          )}
        >
          <input
            type="file"
            onChange={onFileChange}
            disabled={uploaded || uploading || loadingStatus}
            className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            accept=".pdf,.doc,.docx"
          />

          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-meta-4">
              <FileIcon className="text-[#9CA3AF] dark:text-body-color-dark" />
            </div>
            <div className="mb-1 text-base text-[#111928] dark:text-white">
              <span className="font-normal">Arrastra y suelta tu Business Plan aqui</span>
            </div>
            <div className="mb-4 text-xs text-[#6B7280]">o</div>
            <Button
              label={uploaded ? "Ya cargado" : file ? "Cambiar archivo" : "Seleccionar archivo"}
              variant="primary"
              size="small"
              shape="rounded"
              className="pointer-events-none mb-3 !bg-[#004196] hover:!bg-[#004196]/90"
              type="button"
            />
            {file ? <p className="text-sm text-green-500 font-medium">{file.name}</p> : <p className="text-xs text-[#6B7280]">{acceptedLabel}</p>}
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">Business Plan cargado correctamente.</p>
        ) : null}

        <div className="mt-8">
          <Button
            label={uploading ? "Enviando..." : "Enviar Business Plan"}
            variant="primary"
            onClick={onSubmit}
            className={`w-full sm:w-auto ${!file || uploading || uploaded || loadingStatus ? "bg-[#9CA3AF] hover:bg-opacity-100 cursor-not-allowed border-none text-white" : "!bg-[#004196] hover:!bg-[#004196]/90"}`}
            disabled={!file || uploading || uploaded || loadingStatus}
            shape="rounded"
          />
        </div>
      </div>
    </div>
  );
}
