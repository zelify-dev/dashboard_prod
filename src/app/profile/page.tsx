"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { cn } from "@/lib/utils";
import { getStoredOrganization, getStoredUser, getOrganization } from "@/lib/auth-api";
import type { OrganizationDetails, AuthUser } from "@/lib/auth-api";
import { useLanguage } from "@/contexts/language-context";



const COUNTRY_LABELS: Record<string, string> = {
  US: "United States", EC: "Ecuador", MX: "Mexico", CO: "Colombia", CL: "Chile",
};
const COUNTRY_LABELS_ES: Record<string, string> = {
  US: "Estados Unidos", EC: "Ecuador", MX: "México", CO: "Colombia", CL: "Chile",
};
const INDUSTRY_LABELS: Record<string, string> = {
  fintech: "Fintech", banking: "Banking", neobank: "Neobank", cooperative: "Cooperative", other: "Other",
};
const INDUSTRY_LABELS_ES: Record<string, string> = {
  fintech: "Fintech", banking: "Banca", neobank: "Neobanco", cooperative: "Cooperativa", other: "Otro",
};

function FieldReadOnly({
  label,
  value,
  mono,
  emptyLabel = "—",
}: {
  label: string;
  value: string | undefined;
  mono?: boolean;
  emptyLabel?: string;
}) {
  const isEmpty = value === undefined || value === "";
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-dark-6 dark:text-dark-6">
        {label}
      </label>
      <div
        className={cn(
          "min-h-[2.75rem] rounded-lg border border-stroke bg-gray-2/60 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2/80 flex items-center",
          mono && "font-mono text-xs",
          isEmpty && "text-dark-5 dark:text-dark-6"
        )}
      >
        {isEmpty ? emptyLabel : value}
      </div>
    </div>
  );
}

export default function Page() {
  const { profilePage } = useUiTranslations();
  const { language } = useLanguage();
  const locale = language === "es" ? "es-ES" : "en-US";
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    const stored = getStoredOrganization();
    if (!stored?.id) {
      setOrgLoading(false);
      return;
    }
    setOrgLoading(true);
    setOrgError(null);
    getOrganization(stored.id)
      .then(setOrganization)
      .catch((e) => setOrgError(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setOrgLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-[970px]">
      <Breadcrumb pageName={profilePage.title} />

      <div className="w-full">
        {/* Solo descripción; el título ya va en el breadcrumb */}
        <p className="mb-6 text-sm text-body">
          {profilePage.description}
        </p>

        {/* Form Section */}
        <div className="rounded-[10px] bg-white p-8 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Organización — solo lectura, datos de GET /api/organizations/:id */}
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-dark dark:text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                {profilePage.form.organizationSection}
              </h3>
              {orgLoading ? (
                <p className="text-sm text-dark-6 dark:text-dark-6">{profilePage.form.loading}</p>
              ) : orgError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{orgError}</p>
              ) : organization ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FieldReadOnly label={profilePage.form.businessName} value={organization.name} />
                  <FieldReadOnly label={profilePage.form.organizationId} value={organization.id} mono />
                  <FieldReadOnly label={profilePage.form.companyLegalName} value={organization.company_legal_name} />
                  <FieldReadOnly
                    label={profilePage.form.country}
                    value={organization.country ? (language === "es" ? COUNTRY_LABELS_ES[organization.country] : COUNTRY_LABELS[organization.country]) || organization.country : undefined}
                  />
                  <FieldReadOnly label={profilePage.form.website} value={organization.website} />
                  <FieldReadOnly
                    label={profilePage.form.industry}
                    value={organization.industry ? (language === "es" ? INDUSTRY_LABELS_ES[organization.industry] : INDUSTRY_LABELS[organization.industry]) || organization.industry : undefined}
                  />
                </div>
              ) : (
                <p className="text-sm text-dark-6 dark:text-dark-6">—</p>
              )}
            </div>

            {/* Cuenta — solo lectura */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-dark dark:text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                {profilePage.form.accountSection}
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldReadOnly label={profilePage.form.fullName} value={user?.full_name ?? undefined} />
                <FieldReadOnly label={profilePage.form.email} value={user?.email ?? undefined} />
              </div>
            </div>

            </form>
        </div>
      </div>
    </div>
  );
}
