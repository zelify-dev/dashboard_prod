"use client";

import { AMLValidation } from "./aml-validations-list";
import { getAMLists } from "./aml-lists-data";
import { useAMLTranslations } from "./use-aml-translations";
import { useLanguage } from "@/contexts/language-context";
import { useMemo } from "react";

// Icono global para PEPs
function GlobalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

interface AMLValidationDetailProps {
  validation: AMLValidation;
}

export function AMLValidationDetail({ validation }: AMLValidationDetailProps) {
  const translations = useAMLTranslations();
  const { language } = useLanguage();
  const isSuccess = validation.verification === "success";
  const isPending = validation.verification === "pending";
  const hasMatch = !isSuccess && !isPending;
  
  // Obtener listas dinámicas basadas en el idioma
  const amlLists = useMemo(() => getAMLists(language), [language]);
  
  // Obtener las listas que se verificaron (si hay un grupo seleccionado, solo esas; si no, todas las activas)
  const verifiedListIds = validation.verifiedListIds || amlLists.filter((l) => l.enabled).map((l) => l.id);
  const verifiedLists = amlLists.filter((list) => verifiedListIds.includes(list.id));
  
  // Agregar lista PEPs si fue incluida en la verificación
  const allVerifiedLists = [...verifiedLists];
  if (validation.includePEPs?.enabled && validation.includePEPs?.country) {
    allVerifiedLists.push({
      id: "peps",
      title: "PEPs",
      category: `Personas Expuestas Políticamente de ${validation.includePEPs.country}`,
      description: `Lista de Personas Expuestas Políticamente (PEPs) de ${validation.includePEPs.country}`,
      country: validation.includePEPs.country,
      icon: <GlobalIcon className="h-6 w-6" />,
      enabled: true,
      source: "World-Check",
    });
  }
  
  // Determinar el estado de cada lista verificada
  const getListStatus = (listId: string): "checked" | "match" | "pending" => {
    if (isPending) return "pending";
    if (hasMatch) {
      // Verificar si esta lista es donde se encontró el match
      const foundListId = validation.foundInListId || validation.foundIn;
      if (foundListId === listId || validation.verification === listId || (listId === "peps" && validation.verification === "PEP")) {
        return "match";
      }
    }
    return "checked";
  };
  return (
    <div className="mt-6 rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-dark dark:text-white">{translations.detailTitle}</h2>
      </div>
      <div className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">{translations.detail.name}</label>
            <p className="text-sm text-dark-6 dark:text-dark-6">{validation.name}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">{translations.detail.country}</label>
            <p className="text-sm text-dark-6 dark:text-dark-6">{validation.country}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">{translations.detail.documentNumber}</label>
            <p className="text-sm text-dark-6 dark:text-dark-6">{validation.documentNumber}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">{translations.detail.createdAt}</label>
            <p className="text-sm text-dark-6 dark:text-dark-6">{validation.createdAt}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">{translations.detail.status}</label>
            <div className="flex items-center gap-2">
              {isSuccess ? (
                <>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <svg className="h-3.5 w-3.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{translations.status.approved}</span>
                </>
              ) : isPending ? (
                <>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                    <svg className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{translations.status.pending}</span>
                </>
              ) : (
                <>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                    <svg className="h-3.5 w-3.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {validation.foundIn || validation.verification}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Lista de todas las listas AML verificadas */}
        <div className="rounded-lg border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">{translations.listsTitle}</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {allVerifiedLists.map((list) => {
              const status = getListStatus(list.id);
              const isMatch = status === "match";
              const isPendingStatus = status === "pending";
              
              return (
                <div
                  key={list.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    isMatch
                      ? "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10"
                      : isPendingStatus
                      ? "border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-900/10"
                      : "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-dark-3 text-primary dark:text-primary border border-stroke dark:border-dark-3">
                      {list.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-dark dark:text-white truncate">{list.title}</p>
                      <p className="text-xs text-dark-6 dark:text-dark-6 truncate">{list.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isMatch ? (
                      <>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                          <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                          {translations.matchFound}
                        </span>
                      </>
                    ) : isPendingStatus ? (
                      <>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                          <svg className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400 whitespace-nowrap">
                          {translations.status.pending}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                          <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                          {translations.status.approved}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Detalles del Match */}
        {hasMatch && validation.details && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
            <h3 className="mb-4 text-lg font-semibold text-red-800 dark:text-red-400">{translations.matchInfoTitle}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-red-700 dark:text-red-300">{translations.matchList}</label>
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  {validation.details.listName || validation.foundIn || validation.verification}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-red-700 dark:text-red-300">{translations.matchScore}</label>
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">{validation.details.matchScore || 85}%</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-red-700 dark:text-red-300">{translations.matchSource}</label>
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  {validation.details.source || (validation.verification === "PEP" ? "World-Check" : "US Treasury")}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-red-700 dark:text-red-300">{translations.matchDate}</label>
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">{validation.details.dateFound || validation.createdAt}</p>
              </div>
            </div>
          </div>
        )}
        {/* Mensaje de éxito */}
        {isSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900/30 dark:bg-green-900/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400">{translations.successTitle}</h3>
                <p className="text-sm text-green-700 dark:text-green-300">{translations.successDesc}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

