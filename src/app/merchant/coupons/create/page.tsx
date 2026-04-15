"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { MerchantPicker } from "@/app/pages/products/discounts-coupons/_components/merchant-picker";
import { DiscountPicker } from "@/app/pages/products/discounts-coupons/_components/discount-picker";
import { DiscountEditor } from "@/app/pages/products/discounts-coupons/_components/discount-editor";
import { CreateCouponForm } from "@/app/pages/products/discounts-coupons/_components/create-coupon-form";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import { useLanguage } from "@/contexts/language-context";
import { omitUnchangedDiscountDates } from "@/lib/omit-unchanged-discount-dates";
import {
  createDiscountCoupon,
  createMerchantDiscount,
  listMerchantDiscounts,
  listNetworkDiscountMerchants,
  updateDiscount,
  type DiscountMerchant,
  type MerchantDiscount,
} from "@/lib/discounts-api";

const LABELS = {
  es: {
    breadcrumb: "Comercio / Cupones / Crear",
    heroTitle: "Emisión de Cupones",
    heroSubtitle: "Crea códigos promocionales sobre ofertas existentes o publica nuevos descuentos.",
    viewOnly: "Este rol no puede emitir cupones. Te redirigimos al listado operativo.",
    modeTitle: "Modo de emisión",
    modeDesc: "Elige si crearás una oferta nueva o un código sobre una técnica ya existente.",
    modeNew: "Nuevo descuento y cupón",
    modeExisting: "Usar descuento existente",
    selectDiscount: "Descuento seleccionado",
    editDiscount: "Editar descuento",
    hideEditor: "Ocultar editor",
    msgUpdated: "Descuento actualizado correctamente.",
    errorSelect: "Selecciona un descuento para habilitar la creación.",
    errorMerchant: "Carga de comercios fallida.",
    errorDiscounts: "Carga de descuentos fallida.",
    merchantLabel: "Comercio",
  },
  en: {
    breadcrumb: "Merchant / Coupons / Create",
    heroTitle: "Issue Coupons",
    heroSubtitle: "Create promo codes for existing offers or publish brand new discounts.",
    viewOnly: "This role cannot issue coupons. Redirecting to list view.",
    modeTitle: "Issuance Mode",
    modeDesc: "Choose between creating a new offer or a code for an existing one.",
    modeNew: "New Discount & Coupon",
    modeExisting: "Reuse Existing Discount",
    selectDiscount: "Selected Discount",
    editDiscount: "Edit discount",
    hideEditor: "Hide editor",
    msgUpdated: "Discount updated successfully.",
    errorSelect: "Select a discount to enable coupon creation.",
    errorMerchant: "Failed to load merchants.",
    errorDiscounts: "Failed to load discounts.",
    merchantLabel: "Merchant",
  }
};

export default function MerchantCreateCouponPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = LABELS[language];

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
        setError(t.errorMerchant);
      } finally {
        setLoadingMerchants(false);
      }
    };
    void loadMerchants();
  }, [countryCode, sessionMerchantId, t.errorMerchant]);

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
        setError(t.errorDiscounts);
      } finally {
        setLoadingDiscounts(false);
      }
    };
    void loadDiscounts();
  }, [selectedMerchantId, t.errorDiscounts]);

  const handleSave = async (couponData: any) => {
    if (!selectedMerchantId) throw new Error("Merchant selection missing");
    setError(null);

    const dayMap: Record<string, string> = {
      monday: "MONDAY", tuesday: "TUESDAY", wednesday: "WEDNESDAY",
      thursday: "THURSDAY", friday: "FRIDAY", saturday: "SATURDAY", sunday: "SUNDAY",
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
                ? { available_hours_start: couponData.hoursStart, available_hours_end: couponData.hoursEnd }
                : {}),
              timezone: couponData.timezone || "America/Guayaquil",
              applicable_category_ids: [],
              applicable_product_ids: [],
            })
          ).id;

    if (!discountId) throw new Error("No discount available");

    await createDiscountCoupon(discountId, {
      ...(couponData.code?.trim() ? { code: couponData.code.trim() } : {}),
      max_redemptions: Number(couponData.usageLimit) || 1,
    });

    router.push("/merchant/coupons");
  };

  const handleEditDiscount = async (payload: any) => {
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
      setDiscountEditMessage(t.msgUpdated);
      setIsEditingDiscount(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const merchantLabelName = selectedMerchant?.name || countryName || countryCode || "EC";
  const existingModeWithoutDiscount = createMode === "existing" && !selectedDiscountId;

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <Breadcrumb pageName={t.breadcrumb as string} />

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-dark dark:text-white">{t.heroTitle}</h1>
              <p className="mt-1 text-sm text-dark-6">{t.heroSubtitle}</p>
            </div>
          </div>
        </div>

        {!canManage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm font-medium text-amber-800">
            {t.viewOnly}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
             <ShowcaseSection title={t.merchantLabel} className="!p-6">
                <p className="mb-4 text-sm font-bold text-primary">{merchantLabelName}</p>
                {sessionMerchantId ? null : (
                  <MerchantPicker
                    merchants={merchants}
                    selectedMerchantId={selectedMerchantId}
                    onSelect={setSelectedMerchantId}
                    loading={loadingMerchants}
                    countryCode={countryCode}
                  />
                )}
                {error && <p className="mt-2 text-xs text-red-600 font-bold">{error}</p>}
             </ShowcaseSection>

             <ShowcaseSection title={t.modeTitle} className="!p-6">
                <p className="mb-4 text-xs text-dark-6 leading-relaxed">{t.modeDesc}</p>
                <div className="space-y-2">
                  {[
                    { id: "new", label: t.modeNew },
                    { id: "existing", label: t.modeExisting }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setCreateMode(mode.id as any)}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                        createMode === mode.id
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-gray-2 text-dark-6 hover:bg-gray-3 dark:bg-dark-3"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
             </ShowcaseSection>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {createMode === "existing" && (
              <ShowcaseSection title={t.modeExisting} className="!p-6">
                <DiscountPicker
                  discounts={existingDiscounts}
                  selectedDiscountId={selectedDiscountId}
                  onSelect={setSelectedDiscountId}
                  loading={loadingDiscounts}
                />
                
                {selectedDiscount && (
                  <div className="mt-6 rounded-2xl border border-stroke bg-gray-1/30 p-5 dark:border-dark-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-dark-6">{t.selectDiscount}</p>
                        <p className="mt-1 font-black text-dark dark:text-white">{selectedDiscount.name}</p>
                      </div>
                      <button
                        onClick={() => setIsEditingDiscount(!isEditingDiscount)}
                        className="rounded-xl border border-stroke bg-white px-4 py-2 text-xs font-bold text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                      >
                        {isEditingDiscount ? t.hideEditor : t.editDiscount}
                      </button>
                    </div>
                    {discountEditMessage && <p className="mt-3 text-xs font-bold text-green-600 animate-pulse">{discountEditMessage}</p>}
                  </div>
                )}
                
                {existingModeWithoutDiscount && (
                  <div className="mt-4 rounded-xl bg-red-50 p-4 text-xs font-bold text-red-700">{t.errorSelect}</div>
                )}

                {isEditingDiscount && selectedDiscount && (
                  <div className="mt-6 border-t border-stroke pt-6 dark:border-dark-3">
                    <DiscountEditor
                      key={selectedDiscount.id}
                      discount={selectedDiscount}
                      isSaving={isSavingDiscount}
                      onCancel={() => setIsEditingDiscount(false)}
                      onSave={handleEditDiscount}
                    />
                  </div>
                )}
              </ShowcaseSection>
            )}

            {canManage && (
              <ShowcaseSection title={createMode === 'new' ? t.modeNew : t.heroTitle} className="!p-6">
                <CreateCouponForm
                  onSave={handleSave}
                  mode={createMode}
                  submitDisabled={existingModeWithoutDiscount}
                  cancelHref="/merchant/coupons"
                />
              </ShowcaseSection>
            )}
          </div>
        </div>
      </div>
    </ActorRouteGuard>
  );
}
