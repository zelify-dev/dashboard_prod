"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Button } from "@/components/ui-elements/button";
import { useState } from "react";
import { AuthError } from "@/lib/auth-api";
import {
  getCurrentOrganizationId,
  notifyOnboardingStatusUpdated,
  postTechnicalDocumentation,
  putDevelopmentEnvironments,
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

function MapIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      {/* Custom simplified map/diagram look */}
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </svg>
  );
}

// Better Map Icon for "Diagrama de flujo"
function FlowChartIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <path d="M10 6.5h4" />
      <path d="M6.5 10v4" />
      <path d="M17.5 10v4" />
      <path d="M10 17.5h4" />
    </svg>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ClipboardIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

interface FileUploadAreaProps {
  label: string;
  subLabel?: string;
  accept: string;
  icon: React.ReactNode;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

function FileUploadArea({
  label,
  subLabel,
  accept,
  icon,
  file,
  onFileChange,
}: FileUploadAreaProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div className="mb-6">
      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
        {label}
      </label>
      <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E2E8F0] py-12 hover:bg-gray-50 dark:border-strokedark dark:hover:bg-boxdark-2">
        <input
          type="file"
          onChange={handleChange}
          className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
          accept={accept}
        />
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-meta-4">
            {icon}
          </div>
          <div className="mb-1 text-base text-[#111928] dark:text-white">
            <span className="font-normal">
              Arrastra y suelta tu documento {subLabel ? "o " + subLabel : ""}
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
            <p className="text-sm text-green-500 font-medium">{file.name}</p>
          ) : (
            <p className="text-xs text-[#6B7280] uppercase">
              {accept.replace(/\./g, "").replace(/,/g, ", ")} (max{" "}
              {accept.includes("zip") ? "30MB" : "25MB"})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TechnicalDocumentationPageContent() {
  const [diagramFile, setDiagramFile] = useState<File | null>(null);
  const [securityFile, setSecurityFile] = useState<File | null>(null);
  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const [processFile, setProcessFile] = useState<File | null>(null);

  const [sandboxUrls, setSandboxUrls] = useState("");
  const [apiKeys, setApiKeys] = useState("");

  const [savingDev, setSavingDev] = useState(false);
  const [submittingDocs, setSubmittingDocs] = useState(false);
  const [errorDev, setErrorDev] = useState<string | null>(null);
  const [errorDocs, setErrorDocs] = useState<string | null>(null);
  const [successDev, setSuccessDev] = useState(false);
  const [successDocs, setSuccessDocs] = useState(false);

  const handleSaveSandbox = async () => {
    const orgId = getCurrentOrganizationId();
    if (!orgId) {
      setErrorDev("No hay organización en sesión.");
      return;
    }
    const urls = sandboxUrls.trim();
    const keys = apiKeys.trim();
    if (!urls && !keys) {
      setErrorDev("Indica al menos URLs de desarrollo o API keys.");
      return;
    }
    setSavingDev(true);
    setErrorDev(null);
    setSuccessDev(false);
    try {
      await putDevelopmentEnvironments(orgId, {
        development_urls: urls,
        api_keys: keys,
      });
      setSuccessDev(true);
      notifyOnboardingStatusUpdated();
    } catch (e) {
      const msg =
        e instanceof AuthError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo guardar";
      setErrorDev(msg);
    } finally {
      setSavingDev(false);
    }
  };

  const handleSubmitTechnical = async () => {
    const orgId = getCurrentOrganizationId();
    if (!orgId) {
      setErrorDocs("No hay organización en sesión.");
      return;
    }
    if (!canSubmit) return;
    setSubmittingDocs(true);
    setErrorDocs(null);
    setSuccessDocs(false);
    try {
      await postTechnicalDocumentation(orgId, {
        diagram: diagramFile,
        securityPolicy: securityFile,
        certifications: certificationFile,
        processDocumentation: processFile,
      });
      setSuccessDocs(true);
      notifyOnboardingStatusUpdated();
    } catch (e) {
      const msg =
        e instanceof AuthError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo enviar la documentación";
      setErrorDocs(msg);
    } finally {
      setSubmittingDocs(false);
    }
  };

  const canSubmit =
    Boolean(diagramFile || securityFile || certificationFile || processFile);

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName="Documentación técnica" />

      <div className="mb-6">
        <p className="mt-2 text-base text-body-color dark:text-body-color-dark">
          Cargue la documentación técnica requerida
        </p>
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 pb-8 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        {/* Info Box */}
        <h2 className="text-xl font-bold leading-[30px] text-blue-700 dark:text-white">
          Documentación técnica
        </h2>
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-[#EBF5FF] px-4 py-3 text-[#1C64F2] dark:bg-blue-900/30 dark:text-blue-400">
          <InfoIcon className="mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold block mb-0.5">
              Información importante
            </span>
            Cargue la documentación técnica requerida para la integración.
            Asegúrese de que todos los documentos estén completos y
            actualizados.
          </div>
        </div>

        <h3 className="mb-4 text-base font-medium text-black dark:text-white">
          Documentos requeridos
        </h3>

        {/* Diagrama de flujo */}
        <FileUploadArea
          label="Diagrama de flujo de datos"
          subLabel="ZIP"
          accept=".pdf,.doc,.docx,.zip"
          icon={
            <FlowChartIcon className="text-[#9CA3AF] dark:text-body-color-dark" />
          }
          file={diagramFile}
          onFileChange={setDiagramFile}
        />

        {/* Politica de seguridad */}
        <FileUploadArea
          label="Política de seguridad"
          accept=".pdf,.doc,.docx" // Image says max 20MB
          icon={
            <LockIcon className="text-[#9CA3AF] dark:text-body-color-dark" />
          }
          file={securityFile}
          onFileChange={setSecurityFile}
        />

        <div className="my-8 border-t border-stroke dark:border-strokedark"></div>

        <h3 className="mb-4 text-base font-medium text-black dark:text-white">
          Ambientes de desarrollo
        </h3>

        <div className="mb-4">
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
            URLs de desarrollo
          </label>
          <textarea
            rows={3}
            placeholder="Ingrese las URLs de los ambientes de desarrollo..."
            value={sandboxUrls}
            onChange={(e) => setSandboxUrls(e.target.value)}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          ></textarea>
        </div>

        <div className="mb-6">
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
            API Keys
          </label>
          <textarea
            rows={3}
            placeholder="Ingrese las API Keys de desarrollo..."
            value={apiKeys}
            onChange={(e) => setApiKeys(e.target.value)}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          ></textarea>
        </div>

        {errorDev && (
          <p className="mb-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {errorDev}
          </p>
        )}
        {successDev && (
          <p className="mb-2 text-sm text-green-600 dark:text-green-400">
            Información de desarrollo guardada.
          </p>
        )}

        <div className="mb-8">
          <Button
            label={savingDev ? "Guardando…" : "Guardar información de desarrollo"}
            variant="primary"
            onClick={handleSaveSandbox}
            disabled={savingDev}
            className="w-full sm:w-auto !bg-[#004196] hover:!bg-[#004196]/90 disabled:opacity-60"
            shape="rounded"
          />
        </div>

        <div className="my-8 border-t border-stroke dark:border-strokedark"></div>

        {/* Certificaciones */}
        <div className="mb-6">
          <h3 className="mb-4 text-base font-medium text-black dark:text-white">
            Certificaciones
          </h3>
          <FileUploadArea
            label="" // Empty label as header is above
            accept=".pdf,.doc,.docx"
            icon={
              <CheckCircleIcon className="text-[#9CA3AF] dark:text-body-color-dark" />
            }
            file={certificationFile}
            onFileChange={setCertificationFile}
          />
          <p className="text-sm text-[#6B7280] -mt-4 mb-4">
            Adjuntar certificaciones (Ejemplo: PCI DSS, etc.)
          </p>
        </div>

        {/* Documentacion de procesos */}
        <div className="mb-6">
          <h3 className="mb-4 text-base font-medium text-black dark:text-white">
            Documentación de procesos
          </h3>
          <FileUploadArea
            label=""
            accept=".pdf,.doc,.docx"
            icon={
              <ClipboardIcon className="text-[#9CA3AF] dark:text-body-color-dark" />
            }
            file={processFile}
            onFileChange={setProcessFile}
          />
        </div>

        {errorDocs && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {errorDocs}
          </p>
        )}
        {successDocs && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            Documentación técnica enviada correctamente.
          </p>
        )}

        {/* Bottom Button */}
        <div className="mt-8">
          <Button
            label={submittingDocs ? "Enviando…" : "Enviar documentación técnica"}
            variant="primary"
            onClick={handleSubmitTechnical}
            className={`w-full sm:w-auto ${
              !canSubmit || submittingDocs
                ? "bg-[#9CA3AF] hover:bg-opacity-100 cursor-not-allowed border-none text-white"
                : "!bg-[#004196] hover:!bg-[#004196]/90"
            }`}
            disabled={!canSubmit || submittingDocs}
            shape="rounded"
          />
        </div>
      </div>
    </div>
  );
}
