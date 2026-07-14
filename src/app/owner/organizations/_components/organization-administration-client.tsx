"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { AuthError, fetchWithAuth } from "@/lib/auth-api";
import { ORGANIZATION_COUNTRY_OPTIONS, ORGANIZATION_CURRENCY_OPTIONS, type SelectOption } from "@/lib/organization-form-options";
import { createOrganization, type CreateOrganizationBody } from "@/lib/organizations-admin-api";
import { useOwnerOrganizations } from "@/hooks/use-owner-organizations";

const PAGE_TITLE = "Administracion de Organizaciones";

type CreateFormState = {
  name: string;
  status: string;
  organization_type: string;
  country: string;
  currency: string;
  company_legal_name: string;
  website: string;
  industry: string;
  fiscal_id: string;
};

const INITIAL_CREATE_FORM: CreateFormState = {
  name: "",
  status: "ACTIVE",
  organization_type: "",
  country: "",
  currency: "",
  company_legal_name: "",
  website: "",
  industry: "",
  fiscal_id: "",
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = normalizeText(status);
  if (normalized === "active") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (normalized === "pending") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export function OrganizationAdministrationClient() {
  const { organizations, loading, error, reload } = useOwnerOrganizations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [pendingOrgIds, setPendingOrgIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWithAuth("/api/production-requests?status=PENDING")
      .then((res: any) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data: any) => {
        if (Array.isArray(data)) {
          const ids = new Set<string>(data.map((req: any) => req.organization_id));
          setPendingOrgIds(ids);
        }
      })
      .catch((err: any) => console.error("Error cargando solicitudes pendientes para directorio", err));
  }, []);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(INITIAL_CREATE_FORM);
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [flash, setFlash] = useState("");

  const organizationTypes = useMemo(() => {
    const values = new Set<string>();
    organizations.forEach((organization) => {
      if (organization.organization_type?.trim()) values.add(organization.organization_type.trim());
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [organizations]);

  const filteredOrganizations = useMemo(() => {
    const query = normalizeText(search);
    return organizations.filter((organization) => {
      const matchesSearch =
        !query ||
        normalizeText(organization.name).includes(query) ||
        normalizeText(organization.id).includes(query) ||
        normalizeText(organization.company_legal_name).includes(query) ||
        normalizeText(organization.fiscal_id).includes(query);
      const matchesStatus =
        statusFilter === "ALL" || normalizeText(organization.status) === normalizeText(statusFilter);
      const matchesType =
        typeFilter === "ALL" || normalizeText(organization.organization_type) === normalizeText(typeFilter);
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [organizations, search, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    return {
      total: organizations.length,
      active: organizations.filter((organization) => normalizeText(organization.status) === "active").length,
      disabled: organizations.filter((organization) => normalizeText(organization.status) === "disabled").length,
      typed: organizations.filter((organization) => organization.organization_type?.trim()).length,
    };
  }, [organizations]);

  const updateForm = <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
    setCreateForm((current) => ({ ...current, [key]: value }));
  };

  const resetCreateState = () => {
    setCreateForm(INITIAL_CREATE_FORM);
    setCreateError("");
    setCreateLoading(false);
  };

  const submitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      const payload: CreateOrganizationBody = {
        name: createForm.name.trim(),
        status: createForm.status?.trim() || "ACTIVE",
        organization_type: createForm.organization_type?.trim() || undefined,
        cliente:
          createForm.organization_type?.trim() === "CLIENT" ||
          createForm.company_legal_name?.trim() ||
          createForm.currency?.trim() ||
          createForm.country?.trim() ||
          createForm.fiscal_id?.trim()
            ? {
                official_name:
                  createForm.company_legal_name?.trim() || createForm.name.trim(),
                currency: createForm.currency?.trim() || undefined,
                country_code: createForm.country?.trim() || undefined,
                fiscal_id: createForm.fiscal_id?.trim() || undefined,
              }
            : undefined,
      };
      await createOrganization(payload);
      setFlash(`La organizacion "${payload.name}" fue creada correctamente.`);
      setCreateOpen(false);
      resetCreateState();
      await reload();
    } catch (err) {
      setCreateError(
        err instanceof AuthError || err instanceof Error
          ? err.message
          : "No se pudo crear la organizacion."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <Breadcrumb pageName={PAGE_TITLE} />

      <div className="flex flex-col gap-4 rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Solo OWNER</p>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">{PAGE_TITLE}</h1>
          <p className="max-w-3xl text-sm text-dark-6 dark:text-dark-6">
            Espacio global para crear, supervisar y operar organizaciones sin mezclar esta experiencia con la administracion restringida que usa `ORG_ADMIN`.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetCreateState();
            setCreateOpen(true);
          }}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-opacity-90"
        >
          Crear organizacion
        </button>
      </div>

      {flash ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300">
          {flash}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Organizaciones" value={summary.total} helper="Directorio global" />
        <Metric title="Activas" value={summary.active} helper="Listas para operar" />
        <Metric title="Deshabilitadas" value={summary.disabled} helper="Restringidas o pausadas" />
        <Metric title="Con tipo" value={summary.typed} helper="Tipificadas en backend" />
      </div>

      <ShowcaseSection title="Directorio Global de Organizaciones" className="!p-6">
        <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_220px_220px_auto]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, ID, razon social o identificacion fiscal"
            className="rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="ALL">Todos los tipos</option>
            {organizationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setTypeFilter("ALL");
            }}
            className="rounded-lg border border-stroke px-4 py-3 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
          >
            Limpiar filtros
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-gray-2/70 dark:bg-dark-2/80">
                <tr className="border-b border-stroke dark:border-dark-3">
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Organizacion</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Tipo</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Entorno</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Pais / Moneda</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Legal / Fiscal</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Permisos</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Onboarding</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-dark-6 dark:text-dark-6">
                      Cargando directorio global...
                    </td>
                  </tr>
                ) : filteredOrganizations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-dark-6 dark:text-dark-6">
                      No hay organizaciones que coincidan con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredOrganizations.map((organization) => (
                    <tr key={organization.id} className="border-b border-stroke align-top dark:border-dark-3">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-dark dark:text-white">{organization.name}</div>
                            {pendingOrgIds.has(organization.id) && (
                              <Link
                                href="/owner/production-requests?status=PENDING"
                                className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 animate-pulse hover:bg-rose-200"
                              >
                                Solicitud Pendiente
                              </Link>
                            )}
                          </div>
                          <div className="font-mono text-xs text-dark-6 dark:text-dark-6">{organization.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-dark dark:text-white">{organization.organization_type || "Sin tipo"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(organization.status)}`}>
                          {organization.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium uppercase ${
                            organization.environment === "PRODUCTION"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                          }`}
                        >
                          {organization.environment === "PRODUCTION" ? "Producción" : "Sandbox"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-dark dark:text-white">
                        {(organization.country || "N/A") + " / " + (organization.currency || "N/A")}
                      </td>
                      <td className="px-4 py-4 text-dark dark:text-white">
                        <div>{organization.company_legal_name || "Sin razon social"}</div>
                        <div className="text-xs text-dark-6 dark:text-dark-6">{organization.fiscal_id || "Sin identificacion fiscal"}</div>
                      </td>
                      <td className="px-4 py-4 text-dark dark:text-white">{organization.scopes?.length ?? 0}</td>
                      <td className="px-4 py-4 text-dark dark:text-white">
                        {(() => {
                          let pct = 20;
                          if (organization.company_legal_name && organization.fiscal_id) pct = 40;
                          if (organization.kyb_verified) pct = 80;
                          if (organization.onboarding_verified || organization.onboarding_completed) pct = 100;

                          return (
                            <div className="w-28 space-y-1.5">
                              <div className="flex justify-between text-xs font-semibold">
                                <span>{pct === 100 ? "Verificado" : "En progreso"}</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-gray-2 dark:bg-dark-3 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    pct === 100 ? "bg-emerald-500" : "bg-primary"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <QuickAction href={`/owner/organizations/${organization.id}`}>Resumen</QuickAction>
                          <QuickAction href={`/owner/organizations/${organization.id}?tab=general`}>Editar</QuickAction>
                          <QuickAction href={`/owner/organizations/${organization.id}?tab=members`}>Miembros</QuickAction>
                          <QuickAction href={`/owner/organizations/${organization.id}?tab=branding`}>Marca</QuickAction>
                          <QuickAction href={`/owner/organizations/${organization.id}?tab=scopes`}>Permisos</QuickAction>
                          <QuickAction href={`/owner/organizations/${organization.id}?tab=api-keys`}>Claves API</QuickAction>
                          <QuickAction href={`/owner/organizations/${organization.id}?tab=onboarding`}>Onboarding</QuickAction>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ShowcaseSection>

      {createOpen ? (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
              <h2 className="text-lg font-semibold text-dark dark:text-white">Crear organizacion global</h2>
              <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                Este flujo existe solo dentro del modulo exclusivo de OWNER.
              </p>
            </div>
            <form onSubmit={submitCreate} className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Nombre de la organizacion" value={createForm.name} onChange={(value) => updateForm("name", value)} required />
                <FormSelect label="Estado" value={createForm.status || "ACTIVE"} onChange={(value) => updateForm("status", value)} options={["ACTIVE", "DISABLED"]} />
                <FormSelect label="Tipo de organizacion" value={createForm.organization_type || ""} onChange={(value) => updateForm("organization_type", value)} options={["", "CLIENT", "MERCHANT"]} />
                <FormSelect label="Pais" value={createForm.country || ""} onChange={(value) => updateForm("country", value)} options={ORGANIZATION_COUNTRY_OPTIONS} />
                <FormSelect label="Moneda" value={createForm.currency || ""} onChange={(value) => updateForm("currency", value)} options={ORGANIZATION_CURRENCY_OPTIONS} />
                <FormField label="Identificacion fiscal" value={createForm.fiscal_id || ""} onChange={(value) => updateForm("fiscal_id", value)} />
                <FormField label="Razon social" value={createForm.company_legal_name || ""} onChange={(value) => updateForm("company_legal_name", value)} />
                <FormField label="Industria" value={createForm.industry || ""} onChange={(value) => updateForm("industry", value)} />
              </div>
              <FormField label="Sitio web" value={createForm.website || ""} onChange={(value) => updateForm("website", value)} />
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
                Para organizaciones `CLIENT`, los datos legales viajan dentro del bloque `cliente` del backend. `website` e `industry` siguen siendo campos de UI hasta que backend extienda el DTO de creacion.
              </div>
              {createError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                  {createError}
                </div>
              ) : null}
              <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    resetCreateState();
                  }}
                  className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {createLoading ? "Creando..." : "Crear organizacion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ title, value, helper }: { title: string; value: number; helper: string }) {
  return (
    <div className="rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="text-sm font-medium text-dark-6 dark:text-dark-6">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-dark dark:text-white">{value}</div>
      <div className="mt-2 text-xs text-dark-6 dark:text-dark-6">{helper}</div>
    </div>
  );
}

function QuickAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-stroke px-2.5 py-1.5 text-xs font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
    >
      {children}
    </Link>
  );
}

function FormField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-dark dark:text-white">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | SelectOption>;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-dark dark:text-white">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
      >
        {options.map((option) => (
          <option
            key={typeof option === "string" ? option : option.value}
            value={typeof option === "string" ? option : option.value}
          >
            {typeof option === "string" ? option : option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
