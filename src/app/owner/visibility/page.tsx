"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import {
  assignDiscountToOrganization,
  assignMerchantToOrganization,
  listDiscountVisibilityOrganizations,
  listMerchantDiscounts,
  listMerchantVisibilityOrganizations,
  listNetworkDiscountMerchants,
  removeDiscountVisibility,
  removeMerchantVisibility,
  updateDiscountVisibility,
  updateMerchantVisibility,
  type DiscountMerchant,
  type MerchantDiscount,
  type VisibilityOrganizationRelation,
} from "@/lib/discounts-api";
import { listOrganizations, type OrganizationAdmin } from "@/lib/organizations-admin-api";
import { useEffect, useMemo, useState } from "react";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-EC");
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? "").toUpperCase();
  const classes =
    normalized === "ACTIVE"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      : normalized === "INACTIVE"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      {normalized || "UNKNOWN"}
    </span>
  );
}

function MerchantAvatar({ merchant }: { merchant: DiscountMerchant }) {
  if (merchant.logo_url) {
    return (
      <img
        src={merchant.logo_url}
        alt={merchant.name}
        className="h-11 w-11 rounded-2xl border border-stroke object-cover dark:border-dark-3"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
      {merchant.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function OwnerVisibilityPage() {
  const [organizations, setOrganizations] = useState<OrganizationAdmin[]>([]);
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [merchantSearch, setMerchantSearch] = useState("");
  const [discountSearch, setDiscountSearch] = useState("");
  const [discounts, setDiscounts] = useState<MerchantDiscount[]>([]);
  const [merchantRelations, setMerchantRelations] = useState<VisibilityOrganizationRelation[]>([]);
  const [discountRelations, setDiscountRelations] = useState<VisibilityOrganizationRelation[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [merchantRelationsLoading, setMerchantRelationsLoading] = useState(false);
  const [discountRelationsLoading, setDiscountRelationsLoading] = useState(false);
  const [workingKey, setWorkingKey] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [orgs, networkMerchants] = await Promise.all([
          listOrganizations(),
          listNetworkDiscountMerchants({ countryCode: "EC" }),
        ]);
        const clientOrganizations = orgs.filter(
          (organization) => organization.status?.toUpperCase() === "ACTIVE"
        );
        setOrganizations(clientOrganizations);
        setMerchants(networkMerchants);
        if (clientOrganizations[0]?.id) setSelectedOrgId(clientOrganizations[0].id);
        if (networkMerchants[0]?.id) setSelectedMerchantId(networkMerchants[0].id);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedMerchantId) {
        setDiscounts([]);
        setMerchantRelations([]);
        setDiscountRelations([]);
        setSelectedDiscountId("");
        return;
      }

      setMerchantRelationsLoading(true);
      try {
        const [merchantDiscountRows, merchantVisibilityRows] = await Promise.all([
          listMerchantDiscounts(selectedMerchantId).catch(() => []),
          listMerchantVisibilityOrganizations(selectedMerchantId).catch(() => []),
        ]);
        setDiscounts(merchantDiscountRows);
        setMerchantRelations(merchantVisibilityRows);
        setSelectedDiscountId((current) =>
          current && merchantDiscountRows.some((discount) => discount.id === current)
            ? current
            : merchantDiscountRows[0]?.id ?? ""
        );
      } finally {
        setMerchantRelationsLoading(false);
      }
    };

    void run();
  }, [selectedMerchantId]);

  useEffect(() => {
    const run = async () => {
      if (!selectedDiscountId) {
        setDiscountRelations([]);
        return;
      }

      setDiscountRelationsLoading(true);
      try {
        const rows = await listDiscountVisibilityOrganizations(selectedDiscountId).catch(() => []);
        setDiscountRelations(rows);
      } finally {
        setDiscountRelationsLoading(false);
      }
    };

    void run();
  }, [selectedDiscountId]);

  const filteredMerchants = useMemo(() => {
    const term = merchantSearch.trim().toLowerCase();
    if (!term) return merchants;
    return merchants.filter((merchant) =>
      [merchant.name, merchant.slug, merchant.country_code, merchant.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [merchantSearch, merchants]);

  const filteredDiscounts = useMemo(() => {
    const term = discountSearch.trim().toLowerCase();
    if (!term) return discounts;
    return discounts.filter((discount) =>
      [discount.name, discount.description, discount.discount_type, discount.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [discountSearch, discounts]);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId]
  );

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId]
  );

  const selectedDiscount = useMemo(
    () => discounts.find((discount) => discount.id === selectedDiscountId) ?? null,
    [discounts, selectedDiscountId]
  );

  const selectedMerchantRelation = useMemo(
    () => merchantRelations.find((relation) => relation.organization.id === selectedOrgId) ?? null,
    [merchantRelations, selectedOrgId]
  );

  const selectedDiscountRelation = useMemo(
    () => discountRelations.find((relation) => relation.organization.id === selectedOrgId) ?? null,
    [discountRelations, selectedOrgId]
  );

  const merchantVisibleOrgIds = useMemo(
    () => new Set(merchantRelations.map((relation) => relation.organization.id)),
    [merchantRelations]
  );

  const currentVisibilitySummary = useMemo(() => {
    if (!selectedOrganization) {
      return {
        merchant: "Selecciona una organization para revisar visibilidad.",
        discount: "Selecciona una organization para revisar visibilidad.",
      };
    }

    const merchantText = selectedMerchantRelation
      ? selectedMerchantRelation.status === "ACTIVE"
        ? `${selectedMerchant?.name ?? "El merchant"} ya está visible activamente para ${selectedOrganization.name}.`
        : `${selectedMerchant?.name ?? "El merchant"} tiene relación creada con ${selectedOrganization.name}, pero hoy está inactivo.`
      : `${selectedMerchant?.name ?? "El merchant"} todavía no está visible para ${selectedOrganization.name}.`;

    const discountText = !selectedDiscount
      ? "Selecciona un discount del merchant para revisar su publicación."
      : selectedDiscountRelation
        ? selectedDiscountRelation.status === "ACTIVE"
          ? `${selectedDiscount.name} ya está visible activamente para ${selectedOrganization.name}.`
          : `${selectedDiscount.name} tiene relación creada con ${selectedOrganization.name}, pero hoy está inactivo.`
        : `${selectedDiscount.name} todavía no está visible para ${selectedOrganization.name}.`;

    return { merchant: merchantText, discount: discountText };
  }, [
    selectedOrganization,
    selectedMerchantRelation,
    selectedDiscountRelation,
    selectedMerchant,
    selectedDiscount,
  ]);

  const refreshMerchantRelations = async () => {
    if (!selectedMerchantId) return;
    const rows = await listMerchantVisibilityOrganizations(selectedMerchantId).catch(() => []);
    setMerchantRelations(rows);
  };

  const refreshDiscountRelations = async () => {
    if (!selectedDiscountId) return;
    const rows = await listDiscountVisibilityOrganizations(selectedDiscountId).catch(() => []);
    setDiscountRelations(rows);
  };

  const handleAssignMerchant = async () => {
    if (!selectedOrgId || !selectedMerchantId) return;
    setWorkingKey(`assign-merchant-${selectedOrgId}-${selectedMerchantId}`);
    setMessage("");
    try {
      await assignMerchantToOrganization(selectedOrgId, selectedMerchantId);
      await refreshMerchantRelations();
      setMessage("Merchant visible para la organization.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo asignar el merchant.");
    } finally {
      setWorkingKey("");
    }
  };

  const handleAssignDiscount = async () => {
    if (!selectedOrgId || !selectedDiscountId) return;
    setWorkingKey(`assign-discount-${selectedOrgId}-${selectedDiscountId}`);
    setMessage("");
    try {
      await assignDiscountToOrganization(selectedOrgId, selectedDiscountId);
      await refreshDiscountRelations();
      setMessage("Discount visible para la organization.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo asignar el discount.");
    } finally {
      setWorkingKey("");
    }
  };

  const handleMerchantVisibilityStatus = async (
    orgId: string,
    status: "ACTIVE" | "INACTIVE"
  ) => {
    if (!selectedMerchantId) return;
    setWorkingKey(`merchant-status-${orgId}-${status}`);
    setMessage("");
    try {
      await updateMerchantVisibility(orgId, selectedMerchantId, status);
      await refreshMerchantRelations();
      setMessage(`Merchant ${status === "ACTIVE" ? "activado" : "desactivado"} para la organization.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo actualizar la visibilidad del merchant.");
    } finally {
      setWorkingKey("");
    }
  };

  const handleMerchantVisibilityDelete = async (orgId: string) => {
    if (!selectedMerchantId) return;
    setWorkingKey(`merchant-delete-${orgId}`);
    setMessage("");
    try {
      await removeMerchantVisibility(orgId, selectedMerchantId);
      await refreshMerchantRelations();
      setMessage("Visibilidad del merchant eliminada.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo eliminar la visibilidad del merchant.");
    } finally {
      setWorkingKey("");
    }
  };

  const handleDiscountVisibilityStatus = async (
    orgId: string,
    status: "ACTIVE" | "INACTIVE"
  ) => {
    if (!selectedDiscountId) return;
    setWorkingKey(`discount-status-${orgId}-${status}`);
    setMessage("");
    try {
      await updateDiscountVisibility(orgId, selectedDiscountId, status);
      await refreshDiscountRelations();
      setMessage(`Discount ${status === "ACTIVE" ? "activado" : "desactivado"} para la organization.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo actualizar la visibilidad del discount.");
    } finally {
      setWorkingKey("");
    }
  };

  const handleDiscountVisibilityDelete = async (orgId: string) => {
    if (!selectedDiscountId) return;
    setWorkingKey(`discount-delete-${orgId}`);
    setMessage("");
    try {
      await removeDiscountVisibility(orgId, selectedDiscountId);
      await refreshDiscountRelations();
      setMessage("Visibilidad del discount eliminada.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo eliminar la visibilidad del discount.");
    } finally {
      setWorkingKey("");
    }
  };

  return (
    <ActorRouteGuard actor="owner">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <Breadcrumb pageName="Owner / Visibility" />

        <ShowcaseSection title="Workspace de visibilidad" className="!p-0">
          <div className="grid gap-0 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="border-b border-stroke p-5 xl:border-b-0 xl:border-r dark:border-dark-3">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">
                    1. Elige un merchant
                  </p>
                  <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                    Revisa rápidamente dónde ya está visible y qué discounts tiene disponibles.
                  </p>
                </div>

                <input
                  type="search"
                  value={merchantSearch}
                  onChange={(event) => setMerchantSearch(event.target.value)}
                  placeholder="Buscar merchant"
                  className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />

                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {filteredMerchants.map((merchant) => {
                    const isSelected = merchant.id === selectedMerchantId;
                    const visibilityCount = merchant.id === selectedMerchantId ? merchantRelations.length : undefined;

                    return (
                      <button
                        key={merchant.id}
                        type="button"
                        onClick={() => setSelectedMerchantId(merchant.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm dark:border-primary dark:bg-primary/10"
                            : "border-stroke hover:border-primary/40 hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <MerchantAvatar merchant={merchant} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-dark dark:text-white">{merchant.name}</p>
                              <p className="mt-1 truncate text-xs text-dark-6 dark:text-dark-6">{merchant.slug ?? merchant.id}</p>
                              {merchant.description ? (
                                <p className="mt-1 line-clamp-2 text-xs text-dark-6 dark:text-dark-6">
                                  {merchant.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <StatusBadge status={merchant.status} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-dark-6 dark:text-dark-6">
                          <span>{merchant.country_code}</span>
                          {merchant.slug ? <span>{merchant.slug}</span> : null}
                          {typeof visibilityCount === "number" ? (
                            <span>{visibilityCount} orgs visibles</span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}

                  {!loading && filteredMerchants.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-stroke p-4 text-sm text-dark-6 dark:border-dark-3 dark:text-dark-6">
                      No hay merchants que coincidan con la búsqueda.
                    </p>
                  ) : null}
                </div>
              </div>
            </aside>

            <div className="p-5">
              <div className="grid gap-6">
                <div className="rounded-2xl border border-stroke p-5 dark:border-dark-3">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">
                          2. Selecciona una organization cliente
                        </p>
                        <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                          El panel te muestra al instante si el merchant y el discount ya están visibles para esa organization.
                        </p>
                      </div>

                      <select
                        value={selectedOrgId}
                        onChange={(event) => setSelectedOrgId(event.target.value)}
                        className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      >
                        {organizations.map((organization) => (
                          <option key={organization.id} value={organization.id}>
                            {organization.name}
                          </option>
                        ))}
                      </select>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl bg-gray-1 p-4 dark:bg-dark-2/70">
                          <p className="text-xs font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">
                            Estado del merchant
                          </p>
                          <div className="mt-3 flex items-center gap-3">
                            {selectedMerchantRelation ? (
                              <>
                                <StatusBadge status={selectedMerchantRelation.status} />
                                <span className="text-sm text-dark-6 dark:text-dark-6">
                                  {selectedMerchant?.name} ya está relacionado con {selectedOrganization?.name}.
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-amber-700 dark:text-amber-300">
                                Aún no visible para esta organization.
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-sm text-dark-6 dark:text-dark-6">
                            {currentVisibilitySummary.merchant}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-1 p-4 dark:bg-dark-2/70">
                          <p className="text-xs font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">
                            Estado del discount
                          </p>
                          <div className="mt-3 flex items-center gap-3">
                            {selectedDiscountRelation ? (
                              <>
                                <StatusBadge status={selectedDiscountRelation.status} />
                                <span className="text-sm text-dark-6 dark:text-dark-6">
                                  {selectedDiscount?.name} ya está visible para {selectedOrganization?.name}.
                                </span>
                              </>
                            ) : selectedDiscountId ? (
                              <span className="text-sm text-amber-700 dark:text-amber-300">
                                Este discount todavía no está visible para la organization.
                              </span>
                            ) : (
                              <span className="text-sm text-dark-6 dark:text-dark-6">
                                Selecciona un discount.
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-sm text-dark-6 dark:text-dark-6">
                            {currentVisibilitySummary.discount}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleAssignMerchant}
                          disabled={!selectedOrgId || !selectedMerchantId || workingKey.startsWith("assign-merchant")}
                          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                        >
                          Hacer visible merchant
                        </button>
                        <button
                          type="button"
                          onClick={handleAssignDiscount}
                          disabled={
                            !selectedOrgId ||
                            !selectedDiscountId ||
                            !merchantVisibleOrgIds.has(selectedOrgId) ||
                            workingKey.startsWith("assign-discount")
                          }
                          className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-60"
                        >
                          Hacer visible discount
                        </button>
                      </div>

                      {selectedOrgId && !merchantVisibleOrgIds.has(selectedOrgId) && selectedDiscountId ? (
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Primero activa la visibilidad del merchant para esta organization. Después podrás publicar el discount.
                        </p>
                      ) : null}

                      {message ? (
                        <p className="text-sm text-dark-6 dark:text-dark-6">{message}</p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-stroke bg-gray-1/60 p-4 dark:border-dark-3 dark:bg-dark-2/70">
                      <p className="text-xs font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        Contexto actual
                      </p>
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-xs text-dark-6 dark:text-dark-6">Organization elegida</p>
                          <p className="text-sm font-semibold text-dark dark:text-white">
                            {selectedOrganization?.name ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-6 dark:text-dark-6">Merchant activo</p>
                          {selectedMerchant ? (
                            <div className="mt-1 flex items-center gap-3">
                              <MerchantAvatar merchant={selectedMerchant} />
                              <div>
                                <p className="text-sm font-semibold text-dark dark:text-white">
                                  {selectedMerchant.name}
                                </p>
                                <p className="text-xs text-dark-6 dark:text-dark-6">
                                  {selectedMerchant.country_code} · {selectedMerchant.slug ?? "Sin slug"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-dark dark:text-white">—</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-dark-6 dark:text-dark-6">Discount activo</p>
                          <p className="text-sm font-semibold text-dark dark:text-white">
                            {selectedDiscount?.name ?? "Sin seleccionar"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-white p-3 text-center dark:bg-dark">
                            <p className="text-xs text-dark-6 dark:text-dark-6">Orgs con merchant visible</p>
                            <p className="mt-1 text-xl font-bold text-dark dark:text-white">{merchantRelations.length}</p>
                          </div>
                          <div className="rounded-xl bg-white p-3 text-center dark:bg-dark">
                            <p className="text-xs text-dark-6 dark:text-dark-6">Orgs con discount visible</p>
                            <p className="mt-1 text-xl font-bold text-dark dark:text-white">{discountRelations.length}</p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-dashed border-stroke p-3 dark:border-dark-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">
                            Cómo leer esta pantalla
                          </p>
                          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
                            `Merchant visible` significa que la organization ya puede ver ese comercio. `Discount visible`
                            significa que, además, esa organization ya puede consumir una promo específica de ese merchant.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-stroke p-5 dark:border-dark-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        3. Discounts del merchant
                      </p>
                      <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                        Elige visualmente qué discount quieres inspeccionar o publicar.
                      </p>
                    </div>
                    <input
                      type="search"
                      value={discountSearch}
                      onChange={(event) => setDiscountSearch(event.target.value)}
                      placeholder="Buscar discount"
                      className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm lg:max-w-xs dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredDiscounts.map((discount) => {
                      const isSelected = discount.id === selectedDiscountId;
                      return (
                        <button
                          key={discount.id}
                          type="button"
                          onClick={() => setSelectedDiscountId(discount.id)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm dark:border-primary dark:bg-primary/10"
                              : "border-stroke hover:border-primary/40 hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2/70"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-dark dark:text-white">{discount.name}</p>
                            <StatusBadge status={discount.status} />
                          </div>
                          <p className="mt-2 text-xs text-dark-6 dark:text-dark-6">
                            {discount.discount_type} · {discount.discount_value}
                          </p>
                          {discount.description ? (
                            <p className="mt-2 line-clamp-2 text-xs text-dark-6 dark:text-dark-6">
                              {discount.description}
                            </p>
                          ) : null}
                        </button>
                      );
                    })}

                    {!loading && filteredDiscounts.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-stroke p-4 text-sm text-dark-6 dark:border-dark-3 dark:text-dark-6">
                        Este merchant no tiene discounts que coincidan con la búsqueda.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <ShowcaseSection
                    title={`Visibilidad actual del merchant${selectedMerchant ? ` · ${selectedMerchant.name}` : ""}`}
                    className="!p-6"
                  >
                    {loading || merchantRelationsLoading ? (
                      <p className="text-sm text-dark-6 dark:text-dark-6">Cargando relaciones del merchant...</p>
                    ) : merchantRelations.length > 0 ? (
                      <div className="space-y-3">
                        {merchantRelations.map((relation) => {
                          const isCurrentOrg = relation.organization.id === selectedOrgId;
                          return (
                            <div
                              key={relation.id}
                              className={`rounded-xl border p-4 dark:border-dark-3 ${
                                isCurrentOrg ? "border-primary bg-primary/5 dark:border-primary dark:bg-primary/10" : "border-stroke"
                              }`}
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-dark dark:text-white">
                                    {relation.organization.name}
                                  </p>
                                  <p className="text-xs text-dark-6 dark:text-dark-6">
                                    {relation.organization.id}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <StatusBadge status={relation.status} />
                                    <StatusBadge status={relation.organization.status} />
                                    {isCurrentOrg ? (
                                      <span className="inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                                        Organization seleccionada
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-dark-6 dark:text-dark-6">
                                    Tipo: {relation.organization.organization_type ?? "—"} · Creado: {formatDate(relation.created_at)}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleMerchantVisibilityStatus(relation.organization.id, "ACTIVE")}
                                    disabled={workingKey === `merchant-status-${relation.organization.id}-ACTIVE`}
                                    className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-300 disabled:opacity-60"
                                  >
                                    Activar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMerchantVisibilityStatus(relation.organization.id, "INACTIVE")}
                                    disabled={workingKey === `merchant-status-${relation.organization.id}-INACTIVE`}
                                    className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-300 disabled:opacity-60"
                                  >
                                    Desactivar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMerchantVisibilityDelete(relation.organization.id)}
                                    disabled={workingKey === `merchant-delete-${relation.organization.id}`}
                                    className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-300 disabled:opacity-60"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-dark-6 dark:text-dark-6">
                        Este merchant todavía no tiene organizations visibles.
                      </p>
                    )}
                  </ShowcaseSection>

                  <ShowcaseSection
                    title={`Visibilidad actual del discount${selectedDiscount ? ` · ${selectedDiscount.name}` : ""}`}
                    className="!p-6"
                  >
                    {discountRelationsLoading ? (
                      <p className="text-sm text-dark-6 dark:text-dark-6">Cargando relaciones del discount...</p>
                    ) : selectedDiscountId ? (
                      discountRelations.length > 0 ? (
                        <div className="space-y-3">
                          {discountRelations.map((relation) => {
                            const isCurrentOrg = relation.organization.id === selectedOrgId;
                            return (
                              <div
                                key={relation.id}
                                className={`rounded-xl border p-4 dark:border-dark-3 ${
                                  isCurrentOrg ? "border-primary bg-primary/5 dark:border-primary dark:bg-primary/10" : "border-stroke"
                                }`}
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-dark dark:text-white">
                                      {relation.organization.name}
                                    </p>
                                    <p className="text-xs text-dark-6 dark:text-dark-6">
                                      {relation.organization.id}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <StatusBadge status={relation.status} />
                                      <StatusBadge status={relation.organization.status} />
                                      {isCurrentOrg ? (
                                        <span className="inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                                          Organization seleccionada
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="text-xs text-dark-6 dark:text-dark-6">
                                      Tipo: {relation.organization.organization_type ?? "—"} · Creado: {formatDate(relation.created_at)}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleDiscountVisibilityStatus(relation.organization.id, "ACTIVE")}
                                      disabled={workingKey === `discount-status-${relation.organization.id}-ACTIVE`}
                                      className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-300 disabled:opacity-60"
                                    >
                                      Activar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDiscountVisibilityStatus(relation.organization.id, "INACTIVE")}
                                      disabled={workingKey === `discount-status-${relation.organization.id}-INACTIVE`}
                                      className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-300 disabled:opacity-60"
                                    >
                                      Desactivar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDiscountVisibilityDelete(relation.organization.id)}
                                      disabled={workingKey === `discount-delete-${relation.organization.id}`}
                                      className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-300 disabled:opacity-60"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-dark-6 dark:text-dark-6">
                          Este discount todavía no tiene organizations visibles.
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-dark-6 dark:text-dark-6">
                        Selecciona primero un discount del merchant.
                      </p>
                    )}
                  </ShowcaseSection>
                </div>
              </div>
            </div>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
