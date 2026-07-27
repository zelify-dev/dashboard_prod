"use client";

import { Button } from "@/components/ui-elements/button";
import { useAMLTranslations } from "./use-aml-translations";

export interface AMLValidation {
  id: string;
  name: string;
  documentNumber?: string;
  country?: string;
  verification: "success" | "pending" | "Hit" | string;
  matchCount?: number;
  hasMatches?: boolean;
  foundIn?: string;
  foundInListId?: string;
  verifiedListIds?: string[];
  groupId?: string;
  includePEPs?: {
    country: string;
    enabled: boolean;
  };
  details?: {
    listName: string;
    matchScore?: number;
    source?: string;
    dateFound?: string;
  };
  rawDetail?: any; // To store the full API response for the Radiography view
  createdAt: string;
}

// Mock data - in production this would come from an API
export const mockValidations: AMLValidation[] = [
  {
    id: "1",
    name: "John Doe",
    documentNumber: "1234567890",
    country: "Ecuador",
    verification: "success",
    createdAt: "2024-01-15",
  },
 
  {
    id: "2",
    name: "Robert Johnson",
    documentNumber: "1122334455",
    country: "United States",
    verification: "PEP",
    foundIn: "PEP",
    details: {
      listName: "PEP",
      matchScore: 95,
      source: "World-Check",
      dateFound: "2024-01-13",
    },
    createdAt: "2024-01-13",
  },
  {
    id: "3",
    name: "Maria Garcia",
    documentNumber: "5566778899",
    country: "Colombia",
    verification: "OFAC",
    foundIn: "OFAC",
    details: {
      listName: "OFAC",
      matchScore: 98,
      source: "US Treasury",
      dateFound: "2024-01-12",
    },
    createdAt: "2024-01-12",
  },
];

interface AMLValidationsListProps {
  validations: AMLValidation[];
  onSelectValidation: (validationId: string) => void;
  onCreateNew: () => void;
  loading?: boolean;
}

function VerificationStatus({ 
  status, 
  foundIn
}: { 
  status: AMLValidation["verification"]; 
  foundIn?: string;
}) {
  const translations = useAMLTranslations();
  if (status === "success") {
    return (
      <div className="flex items-center gap-1.5 w-fit rounded-lg bg-zelify-midnight px-2.5 py-1 text-[10px] font-light uppercase text-zelify-green border border-zelify-black/30">
        <svg className="h-3 w-3 text-zelify-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
        <span>{translations.status.approved}</span>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-1.5 w-fit rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-light uppercase text-amber-600 border border-amber-100">
        <svg 
          className="h-3 w-3 text-amber-600 animate-spin" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="3"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>{translations.status.pending}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 w-fit rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-light uppercase text-red-600 border border-red-100">
      <svg className="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span>
        {status === "Hit" ? "Hit Detectado" : (foundIn || status)}
      </span>
    </div>
  );
}

export function AMLValidationsList({ validations, onSelectValidation, onCreateNew, loading = false }: AMLValidationsListProps) {
  const translations = useAMLTranslations();
  return (
    <div className="mt-6">
      <div className="rounded-2xl bg-white p-8 border border-gray-100 dark:bg-dark-2">
        <div className="mb-6 flex items-center justify-between" data-tour-id="tour-aml-validations-list">
          <div>
            <h2 className="text-xl font-light text-dark dark:text-white">{translations.validationsTitle}</h2>
            <p className="text-sm font-light text-dark-6">
              {translations.validationsDesc}
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 rounded-xl bg-zelify-midnight px-4 py-2 text-xs font-light uppercase text-white transition-all hover:bg-zelify-midnight/90 active:scale-95"
          >
            <svg className="h-4 w-4 text-zelify-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {translations.newValidation}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-light uppercase tracking-wider text-dark-6">{translations.validationsTable.name}</th>
                <th className="px-4 py-3 text-left text-xs font-light uppercase tracking-wider text-dark-6">{translations.validationsTable.verification}</th>
                <th className="px-4 py-3 text-left text-xs font-light uppercase tracking-wider text-dark-6">{translations.validationsTable.created}</th>
                <th className="px-4 py-3 text-right text-xs font-light uppercase tracking-wider text-dark-6">{translations.validationsTable.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-gray-200 dark:bg-dark-3"></div></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-dark-3"></div></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-dark-3"></div></td>
                    <td className="px-4 py-3 text-right"><div className="ml-auto h-8 w-16 rounded bg-gray-200 dark:bg-dark-3"></div></td>
                  </tr>
                ))
              ) : validations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm font-light text-dark-6">
                    {translations.validationsTable.noValidations}
                  </td>
                </tr>
              ) : (
                validations.map((validation) => (
                  <tr
                    key={validation.id}
                    className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-normal text-dark dark:text-white">{validation.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <VerificationStatus 
                        status={validation.verification} 
                        foundIn={validation.foundIn}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-light text-dark-6">{validation.createdAt}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectValidation(validation.id)}
                        className="rounded-lg bg-gray-100 text-dark-6 border border-gray-200 hover:bg-zelify-midnight hover:text-white hover:border-transparent py-1 px-4 text-xs font-light transition-all"
                      >
                        {translations.validationsTable.view}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

