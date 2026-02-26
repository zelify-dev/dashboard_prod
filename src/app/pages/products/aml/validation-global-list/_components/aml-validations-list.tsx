"use client";

import { Button } from "@/components/ui-elements/button";
import { useAMLTranslations } from "./use-aml-translations";

export interface AMLValidation {
  id: string;
  name: string;
  documentNumber: string;
  country: string;
  verification: "success" | "pending" | "PEP" | "OFAC" | "Sanctions" | "Watchlist" | "Adverse Media" | string;
  foundIn?: string; // Lista AML donde se encontró (nombre legible)
  foundInListId?: string; // ID de la lista AML donde se encontró
  verifiedListIds?: string[]; // IDs de las listas que se verificaron
  groupId?: string; // ID del grupo de listas usado
  includePEPs?: {
    country: string;
    enabled: boolean;
  }; // Información sobre verificación PEPs
  details?: {
    listName: string;
    matchScore?: number;
    source?: string;
    dateFound?: string;
  };
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
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <svg className="h-3.5 w-3.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-medium text-green-600 dark:text-green-400">{translations.status.approved}</span>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
          <svg 
            className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 animate-spin" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{translations.status.pending}</span>
      </div>
    );
  }

  // Para cualquier lista AML encontrada (PEP, OFAC, etc.)
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <svg className="h-3.5 w-3.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <span className="text-sm font-medium text-red-600 dark:text-red-400">{foundIn || status}</span>
    </div>
  );
}

export function AMLValidationsList({ validations, onSelectValidation, onCreateNew }: AMLValidationsListProps) {
  const translations = useAMLTranslations();
  return (
    <div className="mt-6">
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
        <div className="mb-6 flex items-center justify-between" data-tour-id="tour-aml-validations-list">
          <div>
            <h2 className="text-xl font-bold text-dark dark:text-white">{translations.validationsTitle}</h2>
            <p className="text-sm text-dark-6 dark:text-dark-6">
              {translations.validationsDesc}
            </p>
          </div>
          <Button
            onClick={onCreateNew}
            label={translations.newValidation}
            variant="primary"
            shape="rounded"
            size="small"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">{translations.validationsTable.name}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">{translations.validationsTable.verification}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">{translations.validationsTable.created}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-dark dark:text-white">{translations.validationsTable.actions}</th>
              </tr>
            </thead>
            <tbody>
              {validations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-dark-6 dark:text-dark-6">
                    {translations.validationsTable.noValidations}
                  </td>
                </tr>
              ) : (
                validations.map((validation) => (
                  <tr
                    key={validation.id}
                    className="border-b border-stroke transition hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-dark dark:text-white">{validation.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <VerificationStatus 
                        status={validation.verification} 
                        foundIn={validation.foundIn}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-dark-6 dark:text-dark-6">{validation.createdAt}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        onClick={() => onSelectValidation(validation.id)}
                        label={translations.validationsTable.view}
                        variant="outlinePrimary"
                        shape="rounded"
                        size="small"
                        className="text-xs py-1.5 px-3"
                      />
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

