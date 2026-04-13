"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { MerchantPicker } from "@/app/pages/products/discounts-coupons/_components/merchant-picker";
import { DiscountPicker } from "@/app/pages/products/discounts-coupons/_components/discount-picker";
import { DiscountEditor } from "@/app/pages/products/discounts-coupons/_components/discount-editor";
import { CreateCouponForm } from "@/app/pages/products/discounts-coupons/_components/create-coupon-form";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import {
  createDiscountCoupon,
  createMerchantDiscount,
  listMerchantDiscounts,
  listNetworkDiscountMerchants,
  updateDiscount,
  type DiscountMerchant,
  type MerchantDiscount,
} from "@/lib/discounts-api";

export default function MerchantCreateCouponPage() {
  const router = useRouter();
  const { countryCode, countryName } = useOrganizationCountry();
  const sessionMerchantId = getStoredUser()?.merchant_id ?? null;
  const canManage = canManageMerchantActor(getStoredRoles());
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<"new" | "existing">("new");
  const [existingDiscounts, setExistingDiscounts] = useState<MerchantDiscount[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  const [discountEditMessage, setDiscountEditMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId]
  );

  const selectedDiscount = useMemo(
    () => existingDiscounts.find((discount) => discount.id === selectedDiscountId) ?? null,
    [existingDiscounts, selectedDiscountId]
  );

  useEffect(() => {
    const loadMerchants = async () => {
      setLoadingMerchants(true);
      try {
        const merchantList = await listNetworkDiscountMerchants(
          sessionMerchantId ? undefined : { countryCode: countryCode ?? "EC" }
        );
        setMerchants(merchantList);
        setSelectedMerchantId(sessionMerchantId ?? merchantList[0]?.id ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar merchants");
      } finally {
        setLoadingMerchants(false);
      }
    };

    void loadMerchants();
  }, [countryCode, sessionMerchantId]);

  useEffect(() => {
    const loadDiscounts = async () => {
      if (!selectedMerchantId) {
        setExistingDiscounts([]);
        setSelectedDiscountId(null);
        return;
      }

      setLoadingDiscounts(true);
      try {
        const discounts = await listMerchantDiscounts(selectedMerchantId);
        setExistingDiscounts(discounts);
        setSelectedDiscountId((current) => {
          if (current && discounts.some((discount) => discount.id === current)) return current;
          return discounts[0]?.id ?? null;
        });
      } catch (err) {
        setExistingDiscounts([]);
        setSelectedDiscountId(null);
        setError(err instanceof Error ? err.message : "No se pudieron cargar los discounts");
      } finally {
        setLoadingDiscounts(false);
      }
    };

    void loadDiscounts();
  }, [selectedMerchantId]);

  const handleSave = async (couponData: any) => {
    if (!selectedMerchantId) {
      throw new Error("Selecciona un merchant antes de crear el coupon");
    }

    setError(null);

    const dayMap: Record<string, string> = {
      monday: "MONDAY",
      tuesday: "TUESDAY",
      wednesday: "WEDNESDAY",
      thursday: "THURSDAY",
      friday: "FRIDAY",
      saturday: "SATURDAY",
      sunday: "SUNDAY",
    };

    const availableDays = Array.isArray(couponData.days)
      ? couponData.days.map((day: string) => dayMap[day]).filter(Boolean)
      : [];

    const restrictByHours = Boolean(couponData.hoursEnabled);

    const discountId =
      createMode === "existing"
        ? selectedDiscountId
        : (
            await createMerchantDiscount(selectedMerchantId, {
              name: couponData.name,
              description: couponData.description,
              discount_type: couponData.discountType === "fixed" ? "FIXED_AMOUNT" : "PERCENTAGE",
              discount_value: Number(couponData.discountValue) || 0,
              min_purchase: Number(couponData.minPurchase) || 0,
              max_uses_total: Number(couponData.usageLimit) || 1,
              max_uses_per_user: Number(couponData.maxUsesPerUser) || 1,
              valid_from: new Date(couponData.validFrom).toISOString(),
              valid_until: new Date(couponData.validUntil).toISOString(),
              available_days: availableDays,
              restrict_by_hours: restrictByHours,
              ...(restrictByHours
                ? {
                    available_hours_start: couponData.hoursStart,
                    available_hours_end: couponData.hoursEnd,
                  }
                : {}),
              timezone: couponData.timezone || "America/Guayaquil",
              applicable_category_ids: [],
              applicable_product_ids: [],
            })
          ).id;

    if (!discountId) {
      throw new Error("No hay discount seleccionado para crear el coupon");
    }

    await createDiscountCoupon(discountId, {
      ...(couponData.code?.trim() ? { code: couponData.code.trim() } : {}),
      max_redemptions: Number(couponData.usageLimit) || 1,
    });

    router.push("/merchant/coupons");
  };

  const handleEditDiscount = async (payload: Parameters<typeof updateDiscount>[1]) => {
    if (!selectedDiscountId) return;

    setIsSavingDiscount(true);
    setError(null);
    setDiscountEditMessage(null);

    try {
      const updatedDiscount = await updateDiscount(selectedDiscountId, payload);
      setExistingDiscounts((current) =>
        current.map((discount) => (discount.id === updatedDiscount.id ? { ...discount, ...updatedDiscount } : discount))
      );
      setDiscountEditMessage("Discount actualizado correctamente.");
      setIsEditingDiscount(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el discount");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const merchantLabel = selectedMerchant?.name || countryName || countryCode || "EC";
  const existingModeWithoutDiscount = createMode === "existing" && !selectedDiscountId;

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1400px]">
        <Breadcrumb pageName="Merchant / Coupons / Create" />

        <div className="mt-6 space-y-6">
          {!canManage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-300">
              Este rol no puede crear ni editar coupons. Te redirigimos al listado operativo.
            </div>
          ) : null}
          <div>
            <h2 className="text-2xl font-bold text-dark dark:text-white">Crear coupon</h2>
            <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
              Crea un nuevo código sobre una oferta existente o publica un discount nuevo junto con su coupon.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-dark dark:text-white">Merchant: {merchantLabel}</p>
            {sessionMerchantId ? null : (
              <MerchantPicker
                merchants={merchants}
                selectedMerchantId={selectedMerchantId}
                onSelect={setSelectedMerchantId}
                loading={loadingMerchants}
                countryCode={countryCode}
              />
            )}
            {error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}
          </div>

          <div className="rounded-lg border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
            <p className="mb-1 text-sm font-semibold text-dark dark:text-white">Modo de creación</p>
            <p className="mb-3 text-xs text-dark-6 dark:text-dark-6">
              Elige si crearás una oferta nueva o solo un código de coupon sobre una oferta ya existente.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCreateMode("new")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  createMode === "new"
                    ? "bg-primary text-white"
                    : "border border-stroke bg-white text-dark hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                }`}
              >
                Crear nuevo discount y coupon
              </button>
              <button
                type="button"
                onClick={() => setCreateMode("existing")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  createMode === "existing"
                    ? "bg-primary text-white"
                    : "border border-stroke bg-white text-dark hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                }`}
              >
                Reutilizar discount existente
              </button>
            </div>

            {createMode === "existing" ? (
              <div className="mt-4">
                <DiscountPicker
                  discounts={existingDiscounts}
                  selectedDiscountId={selectedDiscountId}
                  onSelect={setSelectedDiscountId}
                  loading={loadingDiscounts}
                />
                <p className="mt-2 text-xs text-dark-6 dark:text-dark-6">
                  Este modo crea solo el código del coupon sobre una oferta ya configurada.
                </p>
                {selectedDiscount ? (
                  <div className="mt-3 rounded-lg border border-stroke bg-gray-1/60 p-3 dark:border-dark-3 dark:bg-dark-3/30">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-dark-6 dark:text-dark-6">
                        Discount seleccionado:{" "}
                        <span className="font-semibold text-dark dark:text-white">{selectedDiscount.name}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsEditingDiscount((current) => !current)}
                        className="rounded-lg border border-stroke bg-white px-3 py-1.5 text-xs font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      >
                        {isEditingDiscount ? "Ocultar editor" : "Editar discount"}
                      </button>
                    </div>
                    {discountEditMessage ? (
                      <p className="mt-2 text-xs text-green-700 dark:text-green-400">{discountEditMessage}</p>
                    ) : null}
                  </div>
                ) : null}
                {existingModeWithoutDiscount ? (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                    Selecciona un discount para habilitar la creación del coupon.
                  </p>
                ) : null}

                {isEditingDiscount && selectedDiscount ? (
                  <DiscountEditor
                    discount={selectedDiscount}
                    isSaving={isSavingDiscount}
                    onCancel={() => setIsEditingDiscount(false)}
                    onSave={handleEditDiscount}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          {canManage ? (
            <CreateCouponForm
              onSave={handleSave}
              mode={createMode}
              submitDisabled={existingModeWithoutDiscount}
              cancelHref="/merchant/coupons"
            />
          ) : null}
        </div>
      </div>
    </ActorRouteGuard>
  );
}
