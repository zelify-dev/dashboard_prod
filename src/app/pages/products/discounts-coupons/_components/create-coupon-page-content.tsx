"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CreateCouponForm } from "./create-coupon-form";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { MerchantPicker } from "./merchant-picker";
import { DiscountPicker } from "./discount-picker";
import { DiscountEditor } from "./discount-editor";
import { omitUnchangedDiscountDates } from "@/lib/omit-unchanged-discount-dates";
import {
  createDiscountCoupon,
  createMerchantDiscount,
  DiscountMerchant,
  listMerchantDiscounts,
  type MerchantDiscount,
  listDiscountMerchants,
  updateDiscount,
} from "@/lib/discounts-api";
import { useRouter } from "next/navigation";

export function CreateCouponPageContent() {
  const translations = useDiscountsCouponsTranslations();
  const router = useRouter();
  const { countryCode, loading: orgLoading, countryName } = useOrganizationCountry();
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<"new" | "existing">("new");
  const [existingDiscounts, setExistingDiscounts] = useState<MerchantDiscount[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
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
    if (orgLoading) return;

    let isCancelled = false;

    const loadMerchants = async () => {
      try {
        const merchantList = await listDiscountMerchants({ countryCode: countryCode || "EC" });
        if (isCancelled) return;
        setMerchants(merchantList);
        setSelectedMerchantId((current) => {
          if (current && merchantList.some((merchant) => merchant.id === current)) return current;
          return merchantList[0]?.id ?? null;
        });
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : "Error al cargar merchants");
      }
    };

    loadMerchants();

    return () => {
      isCancelled = true;
    };
  }, [countryCode, orgLoading]);

  useEffect(() => {
    if (!selectedMerchantId) {
      setExistingDiscounts([]);
      setSelectedDiscountId(null);
      setIsEditingDiscount(false);
      setDiscountEditMessage(null);
      return;
    }

    let isCancelled = false;
    const loadDiscounts = async () => {
      try {
        setLoadingDiscounts(true);
        const discounts = await listMerchantDiscounts(selectedMerchantId);
        if (isCancelled) return;
        setExistingDiscounts(discounts);
        setSelectedDiscountId((current) => {
          if (current && discounts.some((d) => d.id === current)) return current;
          return discounts[0]?.id ?? null;
        });
      } catch (err) {
        if (isCancelled) return;
        setExistingDiscounts([]);
        setSelectedDiscountId(null);
      } finally {
        if (!isCancelled) {
          setLoadingDiscounts(false);
        }
      }
    };

    loadDiscounts();
    return () => {
      isCancelled = true;
    };
  }, [selectedMerchantId]);

  const handleSave = async (couponData: any) => {
    if (!selectedMerchantId) {
      throw new Error("Selecciona un merchant antes de crear el cupón");
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
      ? couponData.days.map((d: string) => dayMap[d]).filter(Boolean)
      : [];

    const restrictByHours = Boolean(couponData.hoursEnabled);

    const discountId = createMode === "existing"
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
      throw new Error("No hay descuento seleccionado para crear el cupón");
    }

    await createDiscountCoupon(discountId, {
      ...(couponData.code?.trim() ? { code: couponData.code.trim() } : {}),
      max_redemptions: Number(couponData.usageLimit) || 1,
    });

    router.push("/pages/products/discounts-coupons");
  };

  const handleEditDiscount = async (payload: Parameters<typeof updateDiscount>[1]) => {
    if (!selectedDiscountId || !selectedDiscount) return;

    setIsSavingDiscount(true);
    setError(null);
    setDiscountEditMessage(null);

    try {
      const body = omitUnchangedDiscountDates(payload, selectedDiscount);
      const updatedDiscount = await updateDiscount(selectedDiscountId, body);
      setExistingDiscounts((current) =>
        current.map((discount) => (discount.id === updatedDiscount.id ? { ...discount, ...updatedDiscount } : discount))
      );
      setDiscountEditMessage("Descuento actualizado correctamente.");
      setIsEditingDiscount(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el descuento");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const merchantLabel = selectedMerchant?.name || countryName || countryCode || "EC";
  const existingModeWithoutDiscount = createMode === "existing" && !selectedDiscountId;

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={translations.breadcrumb.create} />
      <div className="mt-6">
        <div className="mb-6" data-tour-id="tour-discounts-create">
          <h2 className="text-2xl font-bold text-dark dark:text-white">{translations.create.pageTitle}</h2>
          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
            {translations.create.pageDescription}
          </p>
        </div>
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold text-dark dark:text-white">Merchant: {merchantLabel}</p>
          <MerchantPicker
            merchants={merchants}
            selectedMerchantId={selectedMerchantId}
            onSelect={(merchantId) => setSelectedMerchantId(merchantId)}
            loading={orgLoading}
            countryCode={countryCode}
          />
          <div className="mt-2">
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
          <p className="mb-1 text-sm font-semibold text-dark dark:text-white">Modo de creación</p>
          <p className="mb-3 text-xs text-dark-6 dark:text-dark-6">
            Elige si crearás una oferta nueva o solo un código de cupón sobre una oferta ya existente.
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
              Crear nuevo descuento y cupón
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
              Reutilizar descuento existente
            </button>
          </div>

          {createMode === "existing" && (
            <div className="mt-4">
              <DiscountPicker
                discounts={existingDiscounts}
                selectedDiscountId={selectedDiscountId}
                onSelect={setSelectedDiscountId}
                loading={loadingDiscounts}
              />
              <p className="mt-2 text-xs text-dark-6 dark:text-dark-6">
                Este modo crea solo el código del cupón sobre una oferta ya configurada.
              </p>
              {selectedDiscount ? (
                <div className="mt-3 rounded-lg border border-stroke bg-gray-1/60 p-3 dark:border-dark-3 dark:bg-dark-3/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-dark-6 dark:text-dark-6">
                      Descuento seleccionado: <span className="font-semibold text-dark dark:text-white">{selectedDiscount.name}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditingDiscount((current) => !current)}
                      className="rounded-lg border border-stroke bg-white px-3 py-1.5 text-xs font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    >
                      {isEditingDiscount ? "Ocultar editor" : "Editar descuento"}
                    </button>
                  </div>
                  {discountEditMessage ? (
                    <p className="mt-2 text-xs text-green-700 dark:text-green-400">{discountEditMessage}</p>
                  ) : null}
                </div>
              ) : null}
              {existingModeWithoutDiscount ? (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Selecciona un descuento para habilitar la creación del cupón.
                </p>
              ) : null}

              {isEditingDiscount && selectedDiscount ? (
                <DiscountEditor
                  key={selectedDiscount.id}
                  discount={selectedDiscount}
                  isSaving={isSavingDiscount}
                  onCancel={() => setIsEditingDiscount(false)}
                  onSave={handleEditDiscount}
                />
              ) : null}
            </div>
          )}
        </div>
        <div>
          <CreateCouponForm
            onSave={handleSave}
            mode={createMode}
            submitDisabled={existingModeWithoutDiscount}
          />
        </div>
      </div>
    </div>
  );
}

