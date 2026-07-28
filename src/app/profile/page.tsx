"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { cn } from "@/lib/utils";
import { getStoredOrganization, getStoredUser, getOrganization } from "@/lib/auth-api";
import type { OrganizationDetails, AuthUser } from "@/lib/auth-api";
import { useLanguage } from "@/contexts/language-context";



const COUNTRY_LABELS: Record<string, string> = {
  US: "United States", EC: "Ecuador", MX: "Mexico", CO: "Colombia", CL: "Chile", VE: "Venezuela",
};
const COUNTRY_LABELS_ES: Record<string, string> = {
  US: "Estados Unidos", EC: "Ecuador", MX: "México", CO: "Colombia", CL: "Chile", VE: "Venezuela",
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
      <label className="mb-1.5 block text-[10px] font-light uppercase tracking-wider text-dark-6">
        {label}
      </label>
      <div
        className={cn(
          "min-h-[2.5rem] rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2 text-sm font-light text-dark flex items-center",
          mono && "font-mono text-xs",
          isEmpty && "text-dark-5"
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
        <p className="mb-4 text-xs font-light text-dark-6">
          {profilePage.description}
        </p>

        {/* Form Section */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Organización — solo lectura */}
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-normal text-dark border-b border-gray-100 pb-3">
                <svg className="h-4 w-4 text-dark-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {profilePage.form.organizationSection}
              </h3>
              {orgLoading ? (
                <p className="text-xs font-light text-dark-6">{profilePage.form.loading}</p>
              ) : orgError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-light text-red-600">{orgError}</p>
              ) : organization ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FieldReadOnly label={profilePage.form.businessName} value={organization.name} />
                  <FieldReadOnly label={profilePage.form.fiscalId} value={organization.fiscal_id} mono />
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
                <p className="text-xs font-light text-dark-6">—</p>
              )}
            </div>

            {/* Cuenta — solo lectura */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-normal text-dark border-b border-gray-100 pb-3">
                <svg className="h-4 w-4 text-dark-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
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
