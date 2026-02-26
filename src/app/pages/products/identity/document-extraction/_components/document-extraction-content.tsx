"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useCTAButtonAnimations } from "@/hooks/use-cta-button-animations";

interface FrontData {
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
}

interface BackData {
  address: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  bloodType?: string;
  signature?: string;
}

interface ExtractedData extends FrontData, BackData {}

// Datos frontales mockeados (basados en frontCi.jpeg)
const MOCK_FRONT_DATA: FrontData = {
  documentType: "Cédula de Identidad",
  documentNumber: "1712345678",
  firstName: "Juan",
  lastName: "Pérez",
  fullName: "Juan Carlos Pérez González",
  nationality: "Ecuatoriana",
  dateOfBirth: "15/03/1990",
  placeOfBirth: "Quito, Pichincha",
  gender: "Masculino",
};

// Datos posteriores mockeados (basados en ci.jpeg)
const MOCK_BACK_DATA: BackData = {
  address: "Av. Amazonas N12-34 y Roca, Quito",
  issueDate: "10/05/2015",
  expiryDate: "10/05/2025",
  issuingAuthority: "Registro Civil del Ecuador",
  bloodType: "O+",
  signature: "Verificado",
};

// Componente para generar la cédula mockeada
function MockCedulaCard({ data }: { data: ExtractedData }) {
  return (
    <div className="mx-auto max-w-md rounded-lg border-2 border-gray-300 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg dark:border-gray-600 dark:from-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="mb-4 border-b-2 border-blue-600 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              REPÚBLICA DEL ECUADOR
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              REGISTRO CIVIL
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              CÉDULA DE IDENTIDAD
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              No. {data.documentNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Photo placeholder */}
      <div className="mb-4 flex gap-4">
        <div className="h-24 w-20 rounded border-2 border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-700">
          <div className="flex h-full items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            FOTO
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">APELLIDOS:</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{data.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">NOMBRES:</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{data.firstName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">NACIONALIDAD:</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.nationality}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between border-b border-gray-300 pb-1 dark:border-gray-600">
          <span className="font-semibold text-gray-600 dark:text-gray-400">FECHA DE NACIMIENTO:</span>
          <span className="text-gray-900 dark:text-white">{data.dateOfBirth}</span>
        </div>
        <div className="flex justify-between border-b border-gray-300 pb-1 dark:border-gray-600">
          <span className="font-semibold text-gray-600 dark:text-gray-400">LUGAR DE NACIMIENTO:</span>
          <span className="text-gray-900 dark:text-white">{data.placeOfBirth}</span>
        </div>
        <div className="flex justify-between border-b border-gray-300 pb-1 dark:border-gray-600">
          <span className="font-semibold text-gray-600 dark:text-gray-400">SEXO:</span>
          <span className="text-gray-900 dark:text-white">{data.gender}</span>
        </div>
        <div className="flex justify-between border-b border-gray-300 pb-1 dark:border-gray-600">
          <span className="font-semibold text-gray-600 dark:text-gray-400">DOMICILIO:</span>
          <span className="text-right text-gray-900 dark:text-white">{data.address}</span>
        </div>
        <div className="flex justify-between border-b border-gray-300 pb-1 dark:border-gray-600">
          <span className="font-semibold text-gray-600 dark:text-gray-400">FECHA DE EXPEDICIÓN:</span>
          <span className="text-gray-900 dark:text-white">{data.issueDate}</span>
        </div>
        <div className="flex justify-between pb-1">
          <span className="font-semibold text-gray-600 dark:text-gray-400">VÁLIDA HASTA:</span>
          <span className="text-gray-900 dark:text-white">{data.expiryDate}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 border-t-2 border-blue-600 pt-2 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {data.issuingAuthority}
        </p>
      </div>
    </div>
  );
}

type ProcessStep = "front" | "back" | "complete";

export function DocumentExtractionContent() {
  // Inicializar animaciones CTA con color primario
  const themeColor = "#3b82f6"; // Color primario por defecto
  useCTAButtonAnimations(themeColor);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("front");
  const [isProcessing, setIsProcessing] = useState(false);
  const [frontData, setFrontData] = useState<FrontData | null>(null);
  const [backData, setBackData] = useState<BackData | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona una imagen válida");
      return;
    }

    // Simular procesamiento OCR
    setIsProcessing(true);
    setProcessingStep("Cargando imagen...");

    // Simular pasos del procesamiento
    const steps = [
      "Analizando imagen...",
      "Detectando tipo de documento...",
      "Extrayendo texto con OCR...",
      "Validando campos...",
      "Verificando con bases de datos...",
      "Procesamiento completado",
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingStep(steps[i]);
    }

    // Mostrar datos según el paso actual
    setTimeout(() => {
      if (currentStep === "front") {
        setFrontData(MOCK_FRONT_DATA);
        setIsProcessing(false);
        setProcessingStep("");
      } else if (currentStep === "back") {
        setBackData(MOCK_BACK_DATA);
        setCurrentStep("complete");
        setIsProcessing(false);
        setProcessingStep("");
      }
    }, 500);
  }, [currentStep]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleContinue = () => {
    setCurrentStep("back");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    setCurrentStep("front");
    setFrontData(null);
    setBackData(null);
    setIsProcessing(false);
    setProcessingStep("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const extractedData: ExtractedData | null = frontData && backData ? { ...frontData, ...backData } : null;

  return (
    <div className="mt-6 space-y-6">
      {/* Upload Section */}
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
        <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
          {currentStep === "front" 
            ? "Subir Parte Frontal del Documento" 
            : currentStep === "back"
            ? "Subir Parte Posterior del Documento"
            : "Documento Completo"}
        </h2>
        <p className="mb-6 text-sm text-dark-6 dark:text-dark-6">
          {currentStep === "front"
            ? "Arrastra la imagen de la parte frontal de tu cédula o haz clic para seleccionar"
            : currentStep === "back"
            ? "Arrastra la imagen de la parte posterior de tu cédula o haz clic para seleccionar"
            : "Procesamiento completado"}
        </p>

        {currentStep !== "complete" && !isProcessing && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-stroke hover:border-primary dark:border-dark-3"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-4">
              <svg
                className="h-16 w-16 text-dark-6 dark:text-dark-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div>
                <p className="text-lg font-medium text-dark dark:text-white">
                  Arrastra y suelta tu documento aquí
                </p>
                <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
                  o haz clic para seleccionar un archivo
                </p>
                <p className="mt-1 text-xs text-dark-6 dark:text-dark-6">
                  Formatos soportados: JPG, PNG, PDF (máx. 10MB)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-6 rounded-lg border border-stroke bg-gray-2 p-6 dark:border-dark-3 dark:bg-dark-3">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <div>
                <p className="font-medium text-dark dark:text-white">
                  Procesando documento...
                </p>
                <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                  {processingStep}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Front Data Preview */}
        {frontData && currentStep === "front" && !isProcessing && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-stroke bg-gray-2 p-6 dark:border-dark-3 dark:bg-dark-3">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">
                  Parte Frontal Procesada
                </h3>
                <div className="relative h-64 w-full rounded-lg overflow-hidden border border-stroke dark:border-dark-3">
                  <Image
                    src="/images/identity/frontCi.jpeg"
                    alt="Parte frontal de la cédula"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Front Data Display */}
            <div className="rounded-lg border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
              <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                Datos Extraídos (Parte Frontal)
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DataField label="Tipo de Documento" value={frontData.documentType} />
                <DataField label="Número de Documento" value={frontData.documentNumber} />
                <DataField label="Nombres" value={frontData.firstName} />
                <DataField label="Apellidos" value={frontData.lastName} />
                <DataField label="Nombre Completo" value={frontData.fullName} />
                <DataField label="Nacionalidad" value={frontData.nationality} />
                <DataField label="Fecha de Nacimiento" value={frontData.dateOfBirth} />
                <DataField label="Lugar de Nacimiento" value={frontData.placeOfBirth} />
                <DataField label="Género" value={frontData.gender} />
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                className="group relative overflow-hidden rounded-lg border px-6 py-2 text-sm font-semibold text-white transition-all active:scale-[0.98]"
                style={{
                  background: `linear-gradient(to right, ${themeColor} 0%, rgb(29, 78, 216) 40%, rgb(15, 23, 42) 70%, #000000 100%)`,
                  borderColor: themeColor,
                  boxShadow: `0 4px 14px 0 ${themeColor}40`,
                  animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                }}
              >
                <span className="absolute inset-0 rounded-lg opacity-60 blur-md -z-10" style={{ background: themeColor, animation: 'cta-pulse-ring 2s ease-in-out infinite' }}></span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10" style={{ animation: 'cta-shine-sweep 2.5s linear infinite' }}></span>
                <span className="absolute inset-0 rounded-lg -z-10" style={{ background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`, animation: 'cta-glow-pulse 2s ease-in-out infinite' }}></span>
                <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  Continuar Proceso
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
              </button>
            </div>
          </div>
        )}

        {/* Complete Document Preview */}
        {currentStep === "complete" && extractedData && (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark dark:text-white">
                Documento Completo Procesado
              </h3>
              <button
                onClick={handleReset}
                className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
              >
                Procesar otro documento
              </button>
            </div>
            
            {/* Both Images Side by Side */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-stroke bg-gray-2 p-4 dark:border-dark-3 dark:bg-dark-3">
                <h4 className="mb-2 text-sm font-semibold text-dark dark:text-white">
                  Parte Frontal
                </h4>
                <div className="relative h-64 w-full rounded-lg overflow-hidden border border-stroke dark:border-dark-3">
                  <Image
                    src="/images/identity/frontCi.jpeg"
                    alt="Parte frontal de la cédula"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-stroke bg-gray-2 p-4 dark:border-dark-3 dark:bg-dark-3">
                <h4 className="mb-2 text-sm font-semibold text-dark dark:text-white">
                  Parte Posterior
                </h4>
                <div className="relative h-64 w-full rounded-lg overflow-hidden border border-stroke dark:border-dark-3">
                  <Image
                    src="/images/identity/ci.jpeg"
                    alt="Parte posterior de la cédula"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Data Section */}
      {extractedData && (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-dark dark:text-white">
                Datos Extraídos
              </h2>
              <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                Información extraída del documento mediante OCR
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                ✓ Verificado
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dark dark:text-white">
                Información Personal
              </h3>
              <div className="space-y-3">
                <DataField label="Tipo de Documento" value={extractedData.documentType} />
                <DataField label="Número de Documento" value={extractedData.documentNumber} />
                <DataField label="Nombres" value={extractedData.firstName} />
                <DataField label="Apellidos" value={extractedData.lastName} />
                <DataField label="Nombre Completo" value={extractedData.fullName} />
                <DataField label="Nacionalidad" value={extractedData.nationality} />
                <DataField label="Fecha de Nacimiento" value={extractedData.dateOfBirth} />
                <DataField label="Lugar de Nacimiento" value={extractedData.placeOfBirth} />
                <DataField label="Género" value={extractedData.gender} />
              </div>
            </div>

            {/* Información del Documento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dark dark:text-white">
                Información del Documento
              </h3>
              <div className="space-y-3">
                <DataField label="Dirección" value={extractedData.address} />
                <DataField label="Fecha de Emisión" value={extractedData.issueDate} />
                <DataField label="Fecha de Expiración" value={extractedData.expiryDate} />
                <DataField label="Autoridad Emisora" value={extractedData.issuingAuthority} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4 border-t border-stroke pt-6 dark:border-dark-3">
            <button className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition hover:opacity-90">
              Validar con Base de Datos
            </button>
            <button className="rounded-lg border border-stroke bg-white px-6 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3">
              Exportar Datos
            </button>
            <button className="rounded-lg border border-stroke bg-white px-6 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3">
              Ver JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar campos de datos
function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stroke bg-gray-2 p-3 dark:border-dark-3 dark:bg-dark-3">
      <p className="text-xs font-medium uppercase tracking-wide text-dark-6 dark:text-dark-6">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-dark dark:text-white">
        {value}
      </p>
    </div>
  );
}

