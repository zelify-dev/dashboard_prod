"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ZelifyTransfersApiError, zelifyPostForm } from "@/lib/zelify-transfers-dashboard-api";
import { useMemo, useRef, useState } from "react";

type UploadedBatch = {
  id: string;
  fileName: string;
  fileSize: number;
  rows: number;
  saved: number;
  failed: number;
  uploadedAt: string;
  errors: DispersionCsvUploadError[];
};

type DispersionCsvUploadError = {
  row: number;
  external_account_id?: string;
  message: string;
};

type DispersionCsvUploadResponse = {
  ok: boolean;
  file: {
    name: string;
    rows: number;
  };
  saved: number;
  failed: number;
  errors: DispersionCsvUploadError[];
};

const MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || file.type === "text/csv";
}

function countCsvRows(csvText: string): number {
  const rows = csvText
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
  return Math.max(rows.length - 1, 0);
}

export default function PaymentDisbursementPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRows, setSelectedRows] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [batches, setBatches] = useState<UploadedBatch[]>([]);

  const metrics = useMemo(
    () => [
      {
        label: "Lotes procesados",
        value: String(batches.length),
        helper: batches.length === 0 ? "Sin dispersiones creadas" : "Cargados desde CSV",
      },
      {
        label: "Pagos enviados",
        value: String(batches.reduce((total, batch) => total + batch.saved, 0)),
        helper: "Cuentas guardadas",
      },
      {
        label: "Fallidos",
        value: String(batches.reduce((total, batch) => total + batch.failed, 0)),
        helper: "Registros con error",
      },
    ],
    [batches]
  );

  const handleCsvFile = async (file: File | null) => {
    setUploadError("");
    if (!file) return;

    if (!isCsvFile(file)) {
      setSelectedFile(null);
      setSelectedRows(0);
      setUploadError("El archivo debe estar en formato CSV.");
      return;
    }

    if (file.size > MAX_CSV_SIZE_BYTES) {
      setSelectedFile(null);
      setSelectedRows(0);
      setUploadError("El archivo no puede superar 10 MB.");
      return;
    }

    try {
      const text = await file.text();
      const rows = countCsvRows(text);
      if (rows === 0) {
        setSelectedFile(null);
        setSelectedRows(0);
        setUploadError("El CSV debe tener encabezados y al menos una fila de pagos.");
        return;
      }
      setSelectedFile(file);
      setSelectedRows(rows);
    } catch {
      setSelectedFile(null);
      setSelectedRows(0);
      setUploadError("No se pudo leer el archivo CSV.");
    }
  };

  const createBatch = async () => {
    if (!selectedFile) {
      setUploadError("Selecciona un archivo CSV antes de crear el lote.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const result = await zelifyPostForm<DispersionCsvUploadResponse>(
        "/dispersion-accounts/upload-csv",
        formData
      );

      setBatches((current) => [
        {
          id: `${result.file.name}-${Date.now()}`,
          fileName: result.file.name,
          fileSize: selectedFile.size,
          rows: result.file.rows,
          saved: result.saved,
          failed: result.failed,
          errors: result.errors ?? [],
          uploadedAt: new Date().toLocaleString("es-EC"),
        },
        ...current,
      ]);
      setSelectedFile(null);
      setSelectedRows(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      const message =
        error instanceof ZelifyTransfersApiError
          ? error.message
          : "No se pudo procesar el CSV.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Breadcrumb pageName="Dispersión de pagos" />

      <div className="mb-6">
        <h1 className="text-2xl font-light text-dark dark:text-white">
          Dispersión de pagos
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-light text-dark-6 dark:text-dark-6">
          Administra envíos masivos de pagos a cuentas bancarias, billeteras o
          beneficiarios configurados por la organización.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-dark-3 dark:bg-dark-2"
          >
            <p className="text-xs font-light uppercase text-dark-6 dark:text-dark-6">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-light text-dark dark:text-white">
              {metric.value}
            </p>
            <p className="mt-2 text-xs font-light text-dark-6 dark:text-dark-6">
              {metric.helper}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-light text-dark dark:text-white">
              Cargar archivo CSV
            </h2>
            <p className="mt-1 text-sm font-light text-dark-6 dark:text-dark-6">
              Sube un archivo con los beneficiarios y pagos que harán parte del
              lote de dispersión.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void createBatch()}
            disabled={!selectedFile || isUploading}
            className="rounded-xl bg-zelify-midnight px-4 py-2 text-xs font-light text-white transition-all hover:bg-zelify-midnight/90 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
          >
            {isUploading ? "Procesando..." : "Procesar CSV"}
          </button>
        </div>

        <label
          className={`mt-6 flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center transition ${
            isDragging
              ? "border-zelify-midnight bg-blue-50"
              : "border-gray-200 bg-gray-1 hover:bg-gray-50 dark:border-dark-3 dark:bg-dark"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void handleCsvFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => void handleCsvFile(event.target.files?.[0] ?? null)}
          />
          <span className="rounded-full bg-white px-4 py-2 text-xs font-light text-zelify-midnight shadow-sm dark:bg-dark-2 dark:text-white">
            Seleccionar CSV
          </span>
          <p className="mt-4 max-w-md text-sm font-light text-dark-6 dark:text-dark-6">
            Arrastra el archivo aquí o selecciónalo desde tu equipo. Máximo 10
            MB.
          </p>
          <p className="mt-2 text-xs font-light text-dark-6 dark:text-dark-6">
            Formato permitido: .csv
          </p>
        </label>

        {uploadError && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-light text-red-600">
            {uploadError}
          </p>
        )}

        {selectedFile && (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-light text-emerald-800">
            <p className="font-medium">Archivo listo para crear lote</p>
            <p className="mt-1">
              {selectedFile.name} · {formatFileSize(selectedFile.size)} ·{" "}
              {selectedRows} registros detectados
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
        <h2 className="text-lg font-light text-dark dark:text-white">
          Lotes de dispersión
        </h2>
        <p className="mt-1 text-sm font-light text-dark-6 dark:text-dark-6">
          Aquí se listarán los archivos, estados y aprobaciones de cada
          dispersión.
        </p>

        <div className="mt-5 overflow-hidden rounded-xl border border-gray-100 dark:border-dark-3">
          {batches.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-dark-3">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white p-4 text-sm font-light text-dark dark:bg-dark-2 dark:text-white"
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_110px_110px_120px_160px]">
                    <span>{batch.fileName}</span>
                    <span>{batch.rows} filas</span>
                    <span className="text-emerald-700">{batch.saved} guardadas</span>
                    <span className={batch.failed > 0 ? "text-red-600" : "text-dark-6 dark:text-dark-6"}>
                      {batch.failed} fallidas
                    </span>
                    <span className="text-dark-6 dark:text-dark-6">
                      {batch.uploadedAt}
                    </span>
                  </div>
                  {batch.errors.length > 0 && (
                    <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                      {batch.errors.slice(0, 5).map((item) => (
                        <p key={`${batch.id}-${item.row}-${item.external_account_id ?? ""}`}>
                          Fila {item.row}
                          {item.external_account_id ? ` · ${item.external_account_id}` : ""}:{" "}
                          {item.message}
                        </p>
                      ))}
                      {batch.errors.length > 5 && (
                        <p className="mt-1">+{batch.errors.length - 5} errores más</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[150px] items-center justify-center bg-gray-1 px-4 text-center dark:bg-dark">
              <p className="max-w-md text-sm font-light text-dark-6 dark:text-dark-6">
                No hay lotes de dispersión todavía. Carga un CSV para preparar
                el primer lote.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
