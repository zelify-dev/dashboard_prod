"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useIdentityWorkflowTranslations } from "./use-identity-translations";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { getStoredOrganization, getStoredRoles } from "@/lib/auth-api";
import { listOrgUsers } from "@/lib/organization-users-api";
import { isOwner, userHasRole, TEAM_ROLE } from "@/app/organization/teams/_constants/team-roles";

interface Workflow {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "inactive" | "draft";
  verification: {
    approved: number;
    rejected: number;
    pending: number;
  };
}

// Normalizar país de la API (nombre o código) a código para filtrar — reexportamos lógica del hook
function toCountryCode(country: string | undefined): string | null {
  if (!country || typeof country !== "string") return null;
  const n = country.trim().toLowerCase();
  if (n === "ec" || n === "ecuador") return "EC";
  if (n === "mx" || n === "mexico" || n === "méxico") return "MX";
  if (n === "co" || n === "colombia") return "CO";
  if (n === "cl" || n === "chile") return "CL";
  if (n === "pe" || n === "peru" || n === "perú") return "PE";
  return null;
}

// Un solo workflow de ejemplo por país
const COUNTRY_WORKFLOWS: Workflow[] = [
  {
    id: "ec-1",
    name: "Ecuador Identity Verification",
    country: "Ecuador",
    countryCode: "EC",
    createdAt: "2025-01-15",
    updatedAt: "2025-03-01",
    status: "active",
    verification: { approved: 0, rejected: 0, pending: 0 },
  },
  {
    id: "mx-1",
    name: "Mexico KYC Workflow",
    country: "Mexico",
    countryCode: "MX",
    createdAt: "2025-01-15",
    updatedAt: "2025-03-01",
    status: "active",
    verification: { approved: 0, rejected: 0, pending: 0 },
  },
  {
    id: "co-1",
    name: "Colombia Onboarding",
    country: "Colombia",
    countryCode: "CO",
    createdAt: "2025-01-15",
    updatedAt: "2025-03-01",
    status: "draft",
    verification: { approved: 0, rejected: 0, pending: 0 },
  },
  {
    id: "cl-1",
    name: "Chile Identity Verification",
    country: "Chile",
    countryCode: "CL",
    createdAt: "2025-01-15",
    updatedAt: "2025-03-01",
    status: "active",
    verification: { approved: 0, rejected: 0, pending: 0 },
  },
  {
    id: "pe-1",
    name: "Peru Onboarding",
    country: "Peru",
    countryCode: "PE",
    createdAt: "2025-01-15",
    updatedAt: "2025-03-01",
    status: "draft",
    verification: { approved: 0, rejected: 0, pending: 0 },
  },
];

interface WorkflowsListProps {
  onSelectWorkflow: (workflowId: string) => void;
  onCreateNew: () => void;
}

function VerificationIcons({ verification }: { verification: Workflow["verification"] }) {
  return (
    <div className="flex items-center gap-4">
      {/* Approved - Green */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <svg className="h-3.5 w-3.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-xs font-medium text-green-600 dark:text-green-400">{verification.approved}</span>
      </div>
      
      {/* Pending - Orange */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
          <svg className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{verification.pending}</span>
      </div>
      
      {/* Rejected - Red */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <svg className="h-3.5 w-3.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <span className="text-xs font-medium text-red-600 dark:text-red-400">{verification.rejected}</span>
      </div>
    </div>
  );
}

export function WorkflowsList({ onSelectWorkflow, onCreateNew }: WorkflowsListProps) {
  const { workflowsList: listTexts } = useIdentityWorkflowTranslations();
  const { countryCode: orgCountryCode, loading: orgLoading } = useOrganizationCountry();
  const org = getStoredOrganization();
  const roles = getStoredRoles();
  const canSeeUsers = isOwner(roles) || userHasRole(roles, TEAM_ROLE.ORG_ADMIN) || userHasRole(roles, TEAM_ROLE.ZELIFY_TEAM);

  const [verificationCounts, setVerificationCounts] = useState({ approved: 0, pending: 0, rejected: 0 });

  const fetchVerificationCounts = useCallback(async () => {
    if (!org?.id || !canSeeUsers) return;
    try {
      let approved = 0;
      let pending = 0;
      let page = 1;
      const limit = 100;
      let total = 0;
      do {
        const res = await listOrgUsers(org.id, { role_code: "USER_APP", page, limit });
        const items = res.items ?? [];
        total = res.total ?? 0;
        approved += items.filter((u) => u.identity_verified === true).length;
        pending += items.filter((u) => !u.identity_verified).length;
        page++;
      } while (page * limit < total);
      setVerificationCounts({ approved, pending, rejected: 0 });
    } catch {
      setVerificationCounts({ approved: 0, pending: 0, rejected: 0 });
    }
  }, [org?.id, canSeeUsers]);

  useEffect(() => {
    fetchVerificationCounts();
  }, [fetchVerificationCounts]);

  const workflows = useMemo(() => {
    if (!orgCountryCode) return [];
    return COUNTRY_WORKFLOWS.filter((w) => w.countryCode === orgCountryCode).map((w) => ({
      ...w,
      verification: {
        approved: verificationCounts.approved,
        pending: verificationCounts.pending,
        rejected: verificationCounts.rejected,
      },
    }));
  }, [orgCountryCode, verificationCounts]);

  const getStatusBadge = (status: Workflow["status"]) => {
    const styles = {
      active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
      draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {listTexts.statusLabels[status]}
      </span>
    );
  };

  return (
    <div className="mt-6">
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-dark dark:text-white">{listTexts.title}</h2>
            <p className="text-sm text-dark-6 dark:text-dark-6">{listTexts.subtitle}</p>
          </div>
          <button
            onClick={onCreateNew}
            data-tour-id="tour-identity-new-workflow-button"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {listTexts.newButton}
          </button>
        </div>

        <div className="overflow-x-auto">
          {orgLoading ? (
            <p className="px-4 py-8 text-center text-sm text-dark-6 dark:text-dark-6">
              Loading…
            </p>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                  {listTexts.tableHeaders.name}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                  {listTexts.tableHeaders.country}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                  {listTexts.tableHeaders.status}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                  {listTexts.tableHeaders.verification}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                  {listTexts.tableHeaders.created}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">
                  {listTexts.tableHeaders.updated}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-dark dark:text-white">
                  {listTexts.tableHeaders.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {workflows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-dark-6 dark:text-dark-6">
                    {listTexts.emptyState}
                  </td>
                </tr>
              ) : (
                workflows.map((workflow) => (
                  <tr
                    key={workflow.id}
                    onClick={() => onSelectWorkflow(workflow.id)}
                    className="cursor-pointer border-b border-stroke transition hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-dark dark:text-white">{workflow.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-dark-6 dark:text-dark-6">{workflow.country}</p>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(workflow.status)}</td>
                    <td className="px-4 py-3">
                      <VerificationIcons verification={workflow.verification} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-dark-6 dark:text-dark-6">{workflow.createdAt}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-dark-6 dark:text-dark-6">{workflow.updatedAt}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorkflow(workflow.id);
                        }}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}
