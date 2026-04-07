"use client";

import { AMLValidation } from "./aml-validations-list";
import { useAMLTranslations } from "./use-aml-translations";
import { useLanguage } from "@/contexts/language-context";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface AMLValidationDetailProps {
  validation: AMLValidation;
}

/**
 * Utility to provide professional icons for global jurisdictions.
 * Returns technical SVG for international/EU and flag emojis for specific countries.
 */
const getJurisdictionIcon = (countryCode: string) => {
  if (!countryCode || countryCode === "ND") return "📍";
  if (countryCode === "INT" || countryCode === "GL") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (countryCode === "EU") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L13.09 5.36H16.62L13.76 7.44L14.85 10.8L12 8.72L9.15 10.8L10.24 7.44L7.38 5.36H10.91L12 2Z" />
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    );
  }

  // Convert ISO code to regional indicator symbols (Flag Emoji)
  try {
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
  } catch (e) {
    return "📍";
  }
};

export function AMLValidationDetail({ validation }: AMLValidationDetailProps) {
  const translations = useAMLTranslations();
  const { language } = useLanguage();
  
  const isSuccess = validation.verification === "success";
  const isPending = validation.verification === "pending";
  const hasMatch = !isSuccess && !isPending;
  
  // Destructuring deep data from rawDetail (Real API Response)
  const results = validation.rawDetail?.response?.results || [];
  const matchCount = validation.rawDetail?.response?.count || 0;

  return (
    <div className="mt-6 space-y-8 pb-10">
      <div className="flex items-center justify-between border-b border-stroke pb-4 dark:border-dark-3">
        <h2 className="text-2xl font-bold text-dark dark:text-white">
          {translations.detailTitle}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-dark-6">ID de Screening:</span>
          <code className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-dark dark:bg-dark-3 dark:text-white">
            {validation.id}
          </code>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna Izquierda: Información de la Búsqueda */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-dark-6">
              Sujeto de Auditoría
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-dark-6">Nombre Completo</p>
                <p className="text-lg font-bold text-dark dark:text-white">{validation.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-dark-6">Jurisdicción</p>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-dark dark:text-white">
                    <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10 text-primary">
                      {getJurisdictionIcon(validation.country || "ND")}
                    </span>
                    {validation.country || "ND"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-dark-6">Documento</p>
                  <p className="text-sm font-bold text-dark dark:text-white">{validation.documentNumber || "No proporcionado"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-dark-6">Fecha de Consulta</p>
                <p className="text-sm font-bold text-dark dark:text-white">{validation.createdAt}</p>
              </div>
              <div className="pt-2">
                <p className="text-xs font-medium text-dark-6">Estado Global</p>
                <div className="mt-1">
                  {isSuccess ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      {translations.status.approved}
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4h16M4 12h16M4 20h16" />
                      </svg>
                      {translations.status.pending}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {translations.status.hit || "Hit Detectado"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!isSuccess && !isPending && (
            <div className="rounded-xl bg-primary/5 p-6 border border-primary/10">
              <h4 className="text-sm font-bold text-primary mb-2 uppercase tracking-wide">Nota del Analista</h4>
              <p className="text-xs leading-relaxed text-dark-6">
                Se han detectado {matchCount} hallazgos en la lista global de sanciones y PEPs. 
                Los resultados con score de 1.0 (100%) se consideran <b>Matches Definitivos</b>. 
                Resultados menores son similitudes fonéticas que deben ser descartadas manualmente por el oficial de cumplimiento.
              </p>
            </div>
          )}
        </div>

        {/* Columna Derecha: Explorador de Hallazgos */}
        <div className="lg:col-span-2 space-y-6">
          {hasMatch && results.length > 0 ? (
            <>
              <h3 className="text-xl font-bold text-dark dark:text-white flex items-center gap-2">
                Hallazgos Técnicos 
                <span className="rounded-md bg-dark px-2 py-0.5 text-xs text-white">
                  {matchCount}
                </span>
              </h3>
              
              <div className="space-y-4">
                {results.map((result: any, idx: number) => {
                  const isHighRisk = result.confidence_score >= 0.95;
                  
                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "rounded-xl border bg-white shadow-sm transition-all dark:bg-dark-2 overflow-hidden",
                        isHighRisk ? "border-red-500/30" : "border-stroke dark:border-dark-3"
                      )}
                    >
                      {/* Header de la Card */}
                      <div className={cn(
                        "flex items-center justify-between px-6 py-4 border-b",
                        isHighRisk ? "bg-red-50/50 border-red-500/10 dark:bg-red-900/5" : "bg-gray-50/50 border-stroke dark:bg-dark-3 dark:border-dark-3"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-inset ring-gray-300 dark:bg-dark-4 dark:ring-dark-5">
                            {getJurisdictionIcon(result.program?.[0] || "GL")}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-dark dark:text-white">
                                {result.name}
                              </h4>
                              {isHighRisk && (
                                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-tighter">
                                  Alerta Crítica
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wider text-dark-6">
                              {result.data_source?.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "inline-flex flex-col items-center justify-center rounded-lg p-2 min-w-[80px]",
                            isHighRisk ? "bg-red-600 text-white" : "bg-orange-500 text-white"
                          )}>
                            <span className="text-lg font-black leading-none">{Math.round(result.confidence_score * 100)}%</span>
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Confianza</span>
                          </div>
                        </div>
                      </div>

                      {/* Cuerpo de la Card */}
                      <div className="p-6 space-y-5">
                        {/* Etiquetas de Estado */}
                        <div className="flex flex-wrap gap-2">
                          {isHighRisk && (
                            <span className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white uppercase">
                              Match Definitivo
                            </span>
                          )}
                          <span className="rounded bg-dark/10 px-2 py-1 text-[10px] font-bold text-dark-6 uppercase dark:bg-white/10 dark:text-white/70">
                            ID: {result.si_identifier}
                          </span>
                          <span className="rounded bg-dark/10 px-2 py-1 text-[10px] font-bold text-dark-6 uppercase dark:bg-white/10 dark:text-white/70">
                            {result.entity_type}
                          </span>
                        </div>

                        {/* Cargos y Trayectoria */}
                        {result.position && result.position.length > 0 && (
                          <div>
                            <p className="text-xs font-bold uppercase text-dark-6 mb-2">Trayectoria y Cargos Públicos</p>
                            <div className="space-y-2">
                              {result.position.map((pos: any, pIdx: number) => (
                                <div key={pIdx} className="flex items-start gap-2 text-sm">
                                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                  <div>
                                    <p className="font-bold text-dark dark:text-white">{pos.title}</p>
                                    <p className="text-xs text-dark-6">
                                      {pos.organization} {pos.start_date && `(${pos.start_date.split('-')[0]} - ${pos.end_date?.split('-')[0] || 'Actualidad'})`}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Alias y Nombres Alternativos */}
                        {result.alt_names && result.alt_names.length > 0 && (
                          <div>
                            <p className="text-xs font-bold uppercase text-dark-6 mb-2">Alias / Variantes de Nombre</p>
                            <div className="flex flex-wrap gap-2">
                              {result.alt_names.map((alt: string, aIdx: number) => (
                                <span key={aIdx} className="rounded border border-stroke bg-gray-50 px-2 py-1 text-xs text-dark-6 dark:border-dark-3 dark:bg-dark-3">
                                  {alt}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer de la Card con Enlaces */}
                        <div className="pt-4 flex items-center justify-between border-t border-stroke dark:border-dark-3">
                           <div className="text-xs text-dark-6">
                             Actualizado: {result.last_update ? new Date(result.last_update).toLocaleDateString() : 'Desconocido'}
                           </div>
                           
                           <div className="flex gap-2">
                             {(result.additional_information?.web_source || result.source_information_url) && (
                               <a 
                                 href={result.additional_information?.web_source || result.source_information_url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-dark-3 dark:text-primary dark:ring-dark-4 transition-colors"
                               >
                                 Explorar Evidencia
                                 <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                 </svg>
                               </a>
                             )}
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : isSuccess ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-green-500/30 bg-green-50/20 text-center p-10">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">{translations.successTitle}</h3>
              <p className="text-green-700 max-w-md mx-auto">{translations.successDesc}</p>
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-stroke bg-gray-50/30 text-center p-10 dark:border-dark-3 dark:bg-dark-2">
               <div className="h-12 w-12 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
               <p className="text-dark-6 font-medium">Analizando fuentes globales...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
