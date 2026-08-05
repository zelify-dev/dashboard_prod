"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Button } from "@/components/ui-elements/button";
import { useEffect, useMemo, useState } from "react";
import { AuthError } from "@/lib/auth-api";
import { useOnboardingStatus } from "@/contexts/onboarding-status-context";
import { cn } from "@/lib/utils";
import {
  getCurrentOrganizationId,
  getOnboardingStatus,
  notifyOnboardingStatusUpdated,
  postAdditionalInfoFiles,
} from "@/lib/onboarding-api";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["zip"];

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

function DocumentPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx + 1).toLowerCase();
}

export function AdditionalInfoContent() {
  const { visibility, percents } = useOnboardingStatus();
  const additionalInfoVisible = visibility.additionalInfo;
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const acceptedLabel = useMemo(() => "Archivo ZIP (max. 50MB)", []);

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
      const addInfoStatus = (raw.additional_info ?? raw.additionalInfo) as Record<string, unknown> | undefined;
      setUploaded(addInfoStatus?.uploaded === true || percents.additionalInfo === 100);
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
      return "Formato no permitido. Por favor selecciona un archivo comprimido .ZIP";
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      return "El archivo supera el tamaño máximo permitido (50MB).";
    }
    return null;
  };

  const handleFile = (f: File) => {
    setError(null);
    setSuccess(false);
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async () => {
    const orgId = getCurrentOrganizationId();
    if (!orgId) {
      setError("No se identificó la organización activa.");
      return;
    }
    if (!file) {
      setError("Selecciona un archivo ZIP para enviar.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await postAdditionalInfoFiles(orgId, file);
      setSuccess(true);
      setUploaded(true);
      setFile(null);
      notifyOnboardingStatusUpdated();
    } catch (e) {
      const msg =
        e instanceof AuthError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Error al enviar la información adicional";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Breadcrumb pageName="Información Adicional" />

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {!additionalInfoVisible && (
          <div
            className="mb-6 rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-xs font-normal text-amber-700"
            role="status"
          >
            Esta sección está oculta para tu organización según la configuración de onboarding.
          </div>
        )}

        <div className="mb-6">
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs font-normal text-slate-700">
            <InfoIcon className="text-zelify-midnight shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-medium text-dark block mb-0.5">
                Información importante
              </span>
              Esta sección se habilita para subir documentación adicional requerida para la verificación de tu organización.
            </div>
          </div>

          {uploaded && (
            <div
              className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 text-xs font-normal text-emerald-700"
              role="status"
            >
              <span className="font-medium">Información adicional ya enviada.</span>{" "}
              {percents.additionalInfo != null && (
                <span className="tabular-nums">Progreso: {percents.additionalInfo}%.</span>
              )}{" "}
              Si requieres actualizar los archivos adjuntos, selecciona un nuevo paquete ZIP.
            </div>
          )}

          <h3 className="mb-4 text-sm font-medium text-dark">
            Documentación complementaria recomendada
          </h3>

          <div className="mb-8 grid gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
              <div className="mb-2 flex items-center gap-2">
                <DocumentPlusIcon className="text-zelify-midnight shrink-0" />
                <h4 className="font-medium text-dark text-sm">
                  Documentos Adicionales de Verificación
                </h4>
              </div>
              <ul className="list-inside list-disc text-xs font-normal text-slate-700 pl-1 space-y-1.5">
                <li>Archivos o anexos complementarios solicitados por el equipo de cumplimiento.</li>
                <li>Estados de cuenta, licencias operativas u oficios regulatorios extra.</li>
                <li>Comprime todos los documentos solicitados en un único paquete ZIP.</li>
              </ul>
            </div>
          </div>

          <p className="mb-2 text-xs font-medium text-dark">
            Cargar información adicional (archivo ZIP)
          </p>

          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={cn(
              "flex min-h-[190px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center transition",
              uploaded || !additionalInfoVisible ? "bg-gray-50/50 cursor-not-allowed opacity-70" : "hover:bg-gray-50/50"
            )}
          >
            <input
              type="file"
              accept=".zip"
              onChange={handleInputChange}
              disabled={!additionalInfoVisible || uploading || loadingStatus}
              className="hidden"
            />
            <FileIcon className="mb-3 text-dark-6" />
            <p className="text-xs font-medium text-dark">
              {file ? file.name : "Arrastra y suelta tu archivo ZIP aquí"}
            </p>
            <p className="my-1 text-[11px] font-light text-dark-6">o</p>
            <span className="rounded-xl bg-zelify-midnight px-4 py-2 text-xs font-light text-white transition hover:bg-black active:scale-95">
              Seleccionar archivo ZIP
            </span>
            <p className="mt-3 text-[11px] font-light text-dark-6">{acceptedLabel}</p>
          </label>
        </div>

        {error && (
          <p className="mb-4 text-xs font-light text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 text-xs font-light text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100" role="status">
            Información adicional enviada correctamente.
          </p>
        )}

        <div className="mt-8">
          <Button
            label={uploading ? "Enviando…" : "Enviar información adicional"}
            variant="primary"
            onClick={handleSubmit}
            className="w-full sm:w-auto bg-zelify-midnight hover:bg-black text-white rounded-xl text-xs font-light active:scale-95 transition"
            disabled={!additionalInfoVisible || !file || uploading || loadingStatus}
            shape="rounded"
          />
        </div>
      </div>
    </div>
  );
}
