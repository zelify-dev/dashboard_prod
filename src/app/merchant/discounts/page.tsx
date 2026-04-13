"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { MerchantPicker } from "@/app/pages/products/discounts-coupons/_components/merchant-picker";
import { DiscountEditor } from "@/app/pages/products/discounts-coupons/_components/discount-editor";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import {
  createMerchantDiscount,
  getDiscountAnalytics,
  listMerchantDiscounts,
  listNetworkDiscountMerchants,
  updateDiscount,
  type DiscountAnalytics,
  type DiscountMerchant,
  type MerchantDiscount,
} from "@/lib/discounts-api";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const EMPTY_DISCOUNT: MerchantDiscount = {
  id: "new",
  merchant_id: "",
  name: "",
  description: "",
  discount_type: "PERCENTAGE",
  discount_value: 0,
  min_purchase: 0,
  max_uses_total: 1,
  max_uses_per_user: 1,
  valid_from: null,
  valid_until: null,
  available_days: [],
  restrict_by_hours: false,
  available_hours_start: "08:00",
  available_hours_end: "18:00",
  timezone: "America/Guayaquil",
  status: "ACTIVE",
};

export default function MerchantDiscountsPage() {
  const { countryCode } = useOrganizationCountry();
  const sessionMerchantId = getStoredUser()?.merchant_id ?? null;
  const canManage = canManageMerchantActor(getStoredRoles());
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [discounts, setDiscounts] = useState<MerchantDiscount[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyticsFrom, setAnalyticsFrom] = useState("");
  const [analyticsTo, setAnalyticsTo] = useState("");
  const [discountAnalytics, setDiscountAnalytics] = useState<DiscountAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoadingMerchants(true);
      try {
        const list = await listNetworkDiscountMerchants(
          sessionMerchantId ? undefined : { countryCode: countryCode ?? "EC" }
        );
        setMerchants(list);
        setSelectedMerchantId(sessionMerchantId ?? list[0]?.id ?? null);
      } finally {
        setLoadingMerchants(false);
      }
    };

    void run();
  }, [countryCode, sessionMerchantId]);

  useEffect(() => {
    const run = async () => {
      if (!selectedMerchantId) {
        setDiscounts([]);
        return;
      }
      setLoadingDiscounts(true);
      try {
        setDiscounts(await listMerchantDiscounts(selectedMerchantId));
      } finally {
        setLoadingDiscounts(false);
      }
    };

    void run();
  }, [selectedMerchantId]);

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId]
  );

  const editingDiscount = useMemo(
    () => discounts.find((discount) => discount.id === editingDiscountId) ?? null,
    [discounts, editingDiscountId]
  );

  const createDiscountTemplate = useMemo<MerchantDiscount>(
    () => ({
      ...EMPTY_DISCOUNT,
      merchant_id: selectedMerchantId ?? "",
    }),
    [selectedMerchantId]
  );

  useEffect(() => {
    const run = async () => {
      if (!editingDiscountId) {
        setDiscountAnalytics(null);
        return;
      }
      setAnalyticsLoading(true);
      try {
        setDiscountAnalytics(
          await getDiscountAnalytics(editingDiscountId, {
            from: analyticsFrom || undefined,
            to: analyticsTo || undefined,
          })
        );
      } catch {
        setDiscountAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    void run();
  }, [analyticsFrom, analyticsTo, editingDiscountId]);

  const handleCreateDiscount = async (payload: Parameters<typeof updateDiscount>[1]) => {
    if (!selectedMerchantId) return;
    setIsSavingDiscount(true);
    setError(null);
    setMessage(null);
    try {
      const created = await createMerchantDiscount(selectedMerchantId, {
        name: payload.name ?? "",
        description: payload.description,
        discount_type: payload.discount_type ?? "PERCENTAGE",
        discount_value: payload.discount_value ?? 0,
        min_purchase: payload.min_purchase,
        max_uses_total: payload.max_uses_total,
        max_uses_per_user: payload.max_uses_per_user,
        valid_from: payload.valid_from ?? new Date().toISOString(),
        valid_until:
          payload.valid_until ??
          new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        available_days: payload.available_days,
        restrict_by_hours: payload.restrict_by_hours,
        available_hours_start: payload.available_hours_start ?? undefined,
        available_hours_end: payload.available_hours_end ?? undefined,
        timezone: payload.timezone ?? "America/Guayaquil",
        applicable_category_ids: [],
        applicable_product_ids: [],
      });
      setDiscounts((current) => [created, ...current]);
      setIsCreating(false);
      setMessage("Discount creado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el discount");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const handleUpdateDiscount = async (payload: Parameters<typeof updateDiscount>[1]) => {
    if (!editingDiscountId) return;
    setIsSavingDiscount(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateDiscount(editingDiscountId, payload);
      setDiscounts((current) =>
        current.map((discount) => (discount.id === updated.id ? { ...discount, ...updated } : discount))
      );
      setEditingDiscountId(null);
      setMessage("Discount actualizado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el discount");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Merchant / Discounts" />

        {sessionMerchantId ? null : (
          <MerchantPicker
            merchants={merchants}
            selectedMerchantId={selectedMerchantId}
            onSelect={setSelectedMerchantId}
            loading={loadingMerchants}
            countryCode={countryCode}
          />
        )}

        <ShowcaseSection title={`Discounts ${selectedMerchant ? `de ${selectedMerchant.name}` : ""}`} className="!p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-dark-6 dark:text-dark-6">
                Gestiona las reglas comerciales del merchant desde esta vista.
              </p>
              {message ? <p className="mt-2 text-sm text-green-700 dark:text-green-400">{message}</p> : null}
              {error ? <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p> : null}
            </div>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating((current) => !current);
                    setEditingDiscountId(null);
                    setError(null);
                    setMessage(null);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  {isCreating ? "Ocultar formulario" : "Nuevo discount"}
                </button>
                <Link
                  href="/merchant/coupons/create"
                  className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  Crear coupon
                </Link>
              </div>
            ) : (
              <p className="text-sm text-dark-6 dark:text-dark-6">
                Este rol puede revisar analytics y estado de discounts, pero no administrarlos.
              </p>
            )}
          </div>

          {canManage && isCreating ? (
            <div className="mb-6">
              <DiscountEditor
                discount={createDiscountTemplate}
                isSaving={isSavingDiscount}
                onCancel={() => setIsCreating(false)}
                onSave={handleCreateDiscount}
                title="Crear nuevo discount"
                descriptionText="Configura una nueva oferta comercial para este merchant."
                submitLabel="Crear discount"
              />
            </div>
          ) : null}

          {editingDiscount ? (
            <div className="mb-6">
              <DiscountEditor
                discount={editingDiscount}
                isSaving={isSavingDiscount}
                onCancel={() => setEditingDiscountId(null)}
                onSave={handleUpdateDiscount}
              />
              <div className="mt-4 rounded-lg border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
                <div className="mb-4 flex flex-wrap gap-3">
                  <input
                    type="date"
                    value={analyticsFrom}
                    onChange={(e) => setAnalyticsFrom(e.target.value)}
                    className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  />
                  <input
                    type="date"
                    value={analyticsTo}
                    onChange={(e) => setAnalyticsTo(e.target.value)}
                    className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  />
                </div>

                {analyticsLoading ? (
                  <p className="text-sm text-dark-6 dark:text-dark-6">Cargando analytics del discount...</p>
                ) : discountAnalytics ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                      <div className="rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                        <p className="text-xs text-dark-6 dark:text-dark-6">Coupons</p>
                        <p className="mt-1 text-lg font-semibold text-dark dark:text-white">{discountAnalytics.total_coupons}</p>
                        <p className="text-xs text-dark-6 dark:text-dark-6">Activos: {discountAnalytics.active_coupons}</p>
                      </div>
                      <div className="rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                        <p className="text-xs text-dark-6 dark:text-dark-6">Claims</p>
                        <p className="mt-1 text-lg font-semibold text-dark dark:text-white">{discountAnalytics.total_claims}</p>
                        <p className="text-xs text-dark-6 dark:text-dark-6">Pendientes: {discountAnalytics.pending_claims}</p>
                      </div>
                      <div className="rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                        <p className="text-xs text-dark-6 dark:text-dark-6">Redemptions</p>
                        <p className="mt-1 text-lg font-semibold text-dark dark:text-white">{discountAnalytics.total_redemptions}</p>
                        <p className="text-xs text-dark-6 dark:text-dark-6">Users únicos: {discountAnalytics.unique_users}</p>
                      </div>
                      <div className="rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                        <p className="text-xs text-dark-6 dark:text-dark-6">Usage rate</p>
                        <p className="mt-1 text-lg font-semibold text-dark dark:text-white">{discountAnalytics.coupon_usage_rate.toLocaleString("es-EC")} %</p>
                        <p className="text-xs text-dark-6 dark:text-dark-6">Estado: {discountAnalytics.status}</p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-semibold text-dark dark:text-white">Top organizations</p>
                      {discountAnalytics.top_organizations?.length ? (
                        <div className="space-y-2">
                          {discountAnalytics.top_organizations.map((org) => (
                            <div key={org.organization_id} className="flex items-center justify-between rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                              <div>
                                <p className="text-sm font-medium text-dark dark:text-white">{org.organization_name}</p>
                                <p className="text-xs text-dark-6 dark:text-dark-6">{org.organization_id}</p>
                              </div>
                              <span className="text-sm font-semibold text-dark dark:text-white">{org.total_redemptions.toLocaleString("es-EC")}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-dark-6 dark:text-dark-6">No hay organizations destacadas para este discount.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-dark-6 dark:text-dark-6">No hay analytics disponibles para este discount.</p>
                )}
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80">
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Discount</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Tipo</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Valor</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Vigencia</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingDiscounts ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando discounts...</td>
                  </tr>
                ) : discounts.length > 0 ? (
                  discounts.map((discount) => (
                    <tr key={discount.id} className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40">
                      <td className="px-4 py-3 text-dark dark:text-white">
                        <p className="font-medium">{discount.name}</p>
                        <p className="text-xs text-dark-6 dark:text-dark-6">{discount.description ?? "Sin descripción"}</p>
                      </td>
                      <td className="px-4 py-3 text-dark dark:text-white">{discount.discount_type}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">{discount.discount_value}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">
                        {discount.valid_from ?? "—"} → {discount.valid_until ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-dark dark:text-white">{discount.status}</td>
                      <td className="px-4 py-3">
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDiscountId(discount.id);
                              setIsCreating(false);
                              setError(null);
                              setMessage(null);
                            }}
                            className="rounded-lg border border-stroke bg-white px-3 py-1.5 text-xs font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                          >
                            Editar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDiscountId(discount.id);
                              setError(null);
                              setMessage(null);
                            }}
                            className="rounded-lg border border-stroke bg-white px-3 py-1.5 text-xs font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                          >
                            Ver analytics
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">
                      No hay discounts para este merchant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
