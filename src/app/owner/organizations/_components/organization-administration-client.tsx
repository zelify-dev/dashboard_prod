"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { AuthError, fetchWithAuth } from "@/lib/auth-api";
import { Dropdown, DropdownContent, DropdownTrigger, DropdownClose } from "@/components/ui/dropdown";
import { ORGANIZATION_COUNTRY_OPTIONS, ORGANIZATION_CURRENCY_OPTIONS, type SelectOption } from "@/lib/organization-form-options";
import { createOrganization, type CreateOrganizationBody } from "@/lib/organizations-admin-api";
import { useOwnerOrganizations } from "@/hooks/use-owner-organizations";
import { getOnboardingStatus, parseOnboardingStatusPayload } from "@/lib/onboarding-api";

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
  if (normalized === "active") return "bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-2.5 py-0.5 text-[10px] font-light";
  if (normalized === "pending") return "bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-2.5 py-0.5 text-[10px] font-light";
  return "bg-gray-50 border border-gray-100 text-slate-600 rounded-xl px-2.5 py-0.5 text-[10px] font-light";
}

export function OrganizationAdministrationClient() {
  const { organizations, loading, error, reload } = useOwnerOrganizations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [activeDropdownOrgId, setActiveDropdownOrgId] = useState<string | null>(null);
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

  const [onboardingPercentages, setOnboardingPercentages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!organizations || organizations.length === 0) return;

    organizations.forEach((org) => {
      if (org.onboarding_verified || org.onboarding_completed) {
        setOnboardingPercentages((prev) => ({ ...prev, [org.id]: 100 }));
        return;
      }

      getOnboardingStatus(org.id)
        .then((raw: any) => {
          const percents = parseOnboardingStatusPayload(raw);
          const total = Math.round(
            ((percents.kyb || 0) +
              (percents.aml || 0) +
              (percents.technical || 0) +
              (percents.businessPlan || 0)) /
              4
          );
          setOnboardingPercentages((prev) => ({ ...prev, [org.id]: total }));
        })
        .catch((err: any) => {
          console.warn(`Error obteniendo onboarding para org ${org.id}`, err);
          let pct = 20;
          if (org.company_legal_name && org.fiscal_id) pct = 40;
          if (org.kyb_verified) pct = 80;
          setOnboardingPercentages((prev) => ({ ...prev, [org.id]: pct }));
        });
    });
  }, [organizations]);
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

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between animate-in fade-in duration-300">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-dark-6 font-light">Solo OWNER</p>
          <h1 className="text-2xl font-light text-dark">{PAGE_TITLE}</h1>
          <p className="max-w-3xl text-xs font-light text-dark-6">
            Espacio global para crear, supervisar y operar organizaciones sin mezclar esta experiencia con la administración restringida que usa `ORG_ADMIN`.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetCreateState();
            setCreateOpen(true);
          }}
          className="rounded-xl bg-zelify-midnight px-4 py-2 text-xs font-light text-white transition hover:bg-black active:scale-95"
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
            className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2 text-xs font-light text-dark outline-none transition focus:border-gray-200"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2 text-xs font-light text-dark outline-none transition focus:border-gray-200"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2 text-xs font-light text-dark outline-none transition focus:border-gray-200"
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
            className="rounded-xl border border-gray-250 bg-white px-4 py-2 text-xs font-light text-dark transition hover:bg-gray-50 active:scale-95"
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
            <table className="w-full min-w-[1120px] text-left text-xs">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-dark">
                <tr>
                  <th className="px-4 py-3 font-semibold">Organizacion</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Entorno</th>
                  <th className="px-4 py-3 font-semibold">Pais / Moneda</th>
                  <th className="px-4 py-3 font-semibold">Legal / Fiscal</th>
                  <th className="px-4 py-3 font-semibold">Permisos</th>
                  <th className="px-4 py-3 font-semibold">Onboarding</th>
                  <th className="px-4 py-3 font-semibold text-right pr-6">Acciones</th>
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
                    <tr key={organization.id} className="border-b border-gray-100/60 align-middle hover:bg-gray-50/20 transition font-light text-dark-6">
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-normal text-dark">{organization.name}</div>
                            {pendingOrgIds.has(organization.id) && (
                              <Link
                                href="/owner/production-requests?status=PENDING"
                                className="inline-flex items-center rounded-xl border border-rose-100 bg-rose-50 px-2 py-0.5 text-[9px] font-normal text-rose-700 animate-pulse hover:bg-rose-100"
                              >
                                Solicitud Pendiente
                              </Link>
                            )}
                          </div>
                          <div className="inline-block font-mono text-[10px] text-dark-6 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100/50">{organization.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-dark-6">{organization.organization_type || "Sin tipo"}</td>
                      <td className="px-4 py-3.5">
                        <span className={statusBadgeClass(organization.status)}>
                          {organization.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-xl border px-2.5 py-0.5 text-[10px] font-light uppercase ${
                            organization.environment === "PRODUCTION"
                              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                              : "bg-amber-50 border-amber-100 text-amber-700"
                          }`}
                        >
                          {organization.environment === "PRODUCTION" ? "Producción" : "Sandbox"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-dark-6">
                        {(organization.country || "N/A") + " / " + (organization.currency || "N/A")}
                      </td>
                      <td className="px-4 py-3.5 text-dark-6">
                        <div className="text-dark font-normal">{organization.company_legal_name || "Sin razon social"}</div>
                        <div className="text-[10px] text-dark-6">{organization.fiscal_id || "Sin identificacion fiscal"}</div>
                      </td>
                      <td className="px-4 py-3.5 text-dark">{organization.scopes?.length ?? 0}</td>
                      <td className="px-4 py-3.5 text-dark-6">
                        {(() => {
                          const pct = onboardingPercentages[organization.id];
                          const isLoaded = pct !== undefined;

                          return (
                            <div className="w-28 space-y-1">
                              <div className="flex justify-between text-[10px] font-light">
                                <span>{!isLoaded ? "Cargando..." : pct === 100 ? "Verificado" : "En progreso"}</span>
                                <span>{isLoaded ? `${pct}%` : "--%"}</span>
                              </div>
                              <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    !isLoaded
                                      ? "bg-gray-400 animate-pulse w-1/3"
                                      : pct === 100
                                      ? "bg-emerald-500"
                                      : "bg-zelify-midnight"
                                  }`}
                                  style={isLoaded ? { width: `${pct}%` } : undefined}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3.5 text-right pr-6">
                        <Dropdown
                          isOpen={activeDropdownOrgId === organization.id}
                          setIsOpen={(open) => setActiveDropdownOrgId(open ? organization.id : null)}
                        >
                          <DropdownTrigger className="rounded-xl p-1.5 hover:bg-gray-50 text-dark-6 hover:text-dark transition inline-flex justify-center items-center">
                            <svg
                              className="h-4 w-4 fill-current"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </DropdownTrigger>
                          <DropdownContent
                            align="end"
                            className="bg-white border border-gray-100 py-1.5 w-48 shadow-lg z-50 rounded-2xl animate-in fade-in duration-200"
                          >
                            <DropdownClose>
                              <Link
                                href={`/owner/organizations/${organization.id}`}
                                className="flex w-full items-center px-4 py-2 text-xs font-light text-dark hover:bg-gray-50"
                              >
                                Resumen General
                              </Link>
                            </DropdownClose>
                            <DropdownClose>
                              <Link
                                href={`/owner/organizations/${organization.id}?tab=general`}
                                className="flex w-full items-center px-4 py-2 text-xs font-light text-dark hover:bg-gray-50"
                              >
                                Editar Datos
                              </Link>
                            </DropdownClose>
                            <DropdownClose>
                              <Link
                                href={`/owner/organizations/${organization.id}?tab=members`}
                                className="flex w-full items-center px-4 py-2 text-xs font-light text-dark hover:bg-gray-50"
                              >
                                Miembros
                              </Link>
                            </DropdownClose>
                            <DropdownClose>
                              <Link
                                href={`/owner/organizations/${organization.id}?tab=branding`}
                                className="flex w-full items-center px-4 py-2 text-xs font-light text-dark hover:bg-gray-50"
                              >
                                Personalización y Marca
                              </Link>
                            </DropdownClose>
                            <DropdownClose>
                              <Link
                                href={`/owner/organizations/${organization.id}?tab=scopes`}
                                className="flex w-full items-center px-4 py-2 text-xs font-light text-dark hover:bg-gray-50"
                              >
                                Permisos y Scopes
                              </Link>
                            </DropdownClose>
                            <DropdownClose>
                              <Link
                                href={`/owner/organizations/${organization.id}?tab=api-keys`}
                                className="flex w-full items-center px-4 py-2 text-xs font-light text-dark hover:bg-gray-50"
                              >
                                Claves de API
                              </Link>
                            </DropdownClose>
                            <DropdownClose>
                              <Link
                                href={`/owner/organizations/${organization.id}?tab=onboarding`}
                                className="flex w-full items-center px-4 py-2 text-xs font-light text-dark hover:bg-gray-50"
                              >
                                Estado de Onboarding
                              </Link>
                            </DropdownClose>
                          </DropdownContent>
                        </Dropdown>
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
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-normal text-dark">Crear organizacion global</h2>
              <p className="mt-1 text-xs font-light text-dark-6">
                Este flujo existe solo dentro del modulo exclusivo de OWNER.
              </p>
            </div>
            <form onSubmit={submitCreate} className="space-y-4 p-6">
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
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-xs text-amber-700">
                Para organizaciones `CLIENT`, los datos legales viajan dentro del bloque `cliente` del backend. `website` e `industry` siguen siendo campos de UI hasta que backend extienda el DTO de creacion.
              </div>
              {createError ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 px-4 py-3 text-xs text-rose-700">
                  {createError}
                </div>
              ) : null}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    resetCreateState();
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-light text-dark hover:bg-gray-50 active:scale-95 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-xl bg-zelify-midnight px-5 py-2 text-xs font-light text-white hover:bg-black active:scale-95 transition disabled:opacity-50"
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
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-in fade-in duration-300">
      <div className="text-xs font-light text-dark-6">{title}</div>
      <div className="mt-1 text-2xl font-light text-dark">{value}</div>
      <div className="mt-1.5 text-[10px] font-light text-dark-6">{helper}</div>
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
    <label className="block mb-2">
      <span className="block text-[10px] uppercase tracking-wider font-light text-dark-6 mb-1">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2 text-xs font-light text-dark outline-none transition focus:border-gray-200"
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
    <label className="block mb-2">
      <span className="block text-[10px] uppercase tracking-wider font-light text-dark-6 mb-1">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2 text-xs font-light text-dark outline-none transition focus:border-gray-200"
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
