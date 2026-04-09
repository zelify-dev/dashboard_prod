"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CouponsList, Coupon, getMockCoupons } from "./coupons-list";
import { CouponDetail } from "./coupon-detail";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";
import { useLanguage } from "@/contexts/language-context";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { MerchantPicker } from "./merchant-picker";
import {
  deactivateCoupon,
  DiscountMerchant,
  listDiscountCoupons,
  listDiscountMerchants,
  listMerchantDiscounts,
  MerchantCoupon,
  MerchantDiscount,
} from "@/lib/discounts-api";

function toLocalDiscountType(discountType: string): "percentage" | "fixed" {
  return discountType?.toUpperCase() === "FIXED_AMOUNT" ? "fixed" : "percentage";
}

function toLocalStatus(
  status: string,
  maxRedemptions: number,
  redemptionsCount: number,
  validUntil?: string | null
): Coupon["status"] {
  const normalized = status?.toUpperCase();
  if (normalized === "INACTIVE") return "inactive";
  if (validUntil && new Date(validUntil).getTime() < Date.now()) return "expired";
  if (normalized === "EXPIRED") return "expired";
  if (normalized === "LIMIT_REACHED" || redemptionsCount >= maxRedemptions) return "limit_reached";
  return "active";
}

function toLocalDay(day: string): string {
  const map: Record<string, string> = {
    MONDAY: "monday",
    TUESDAY: "tuesday",
    WEDNESDAY: "wednesday",
    THURSDAY: "thursday",
    FRIDAY: "friday",
    SATURDAY: "saturday",
    SUNDAY: "sunday",
  };
  return map[day] || day.toLowerCase();
}

function mapApiCouponToUiCoupon(
  merchant: DiscountMerchant,
  discount: MerchantDiscount,
  coupon: MerchantCoupon
): Coupon {
  return {
    id: coupon.id,
    couponId: coupon.id,
    discountId: discount.id,
    merchantId: merchant.id,
    merchantName: merchant.name,
    code: coupon.code,
    name: discount.name,
    description: discount.description ?? "",
    discountType: toLocalDiscountType(discount.discount_type),
    discountValue: Number(discount.discount_value) || 0,
    status: toLocalStatus(coupon.status, coupon.max_redemptions, coupon.redemptions_count, discount.valid_until),
    usageLimit: coupon.max_redemptions,
    usedCount: coupon.redemptions_count,
    validFrom: discount.valid_from || coupon.created_at || new Date().toISOString(),
    validUntil: discount.valid_until || coupon.updated_at || coupon.created_at || new Date().toISOString(),
    minPurchase: discount.min_purchase !== undefined && discount.min_purchase !== null ? Number(discount.min_purchase) : undefined,
    maxUsesTotal: discount.max_uses_total ?? undefined,
    maxUsesPerUser: discount.max_uses_per_user ?? undefined,
    availability: {
      days: Array.isArray((discount as any).available_days)
        ? (discount as any).available_days.map((day: string) => toLocalDay(day))
        : [],
      hours: (discount as any).restrict_by_hours
        ? {
            start: (discount as any).available_hours_start || "00:00",
            end: (discount as any).available_hours_end || "23:59",
          }
        : null,
    },
    createdAt: coupon.created_at || discount.created_at || new Date().toISOString(),
  };
}

export function DiscountsCouponsPageContent() {
  const translations = useDiscountsCouponsTranslations();
  const { language } = useLanguage();
  const { countryCode, loading: orgLoading, countryName } = useOrganizationCountry();
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>(() => getMockCoupons(language));
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeactivatingCoupon, setIsDeactivatingCoupon] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId]
  );

  useEffect(() => {
    setSelectedCoupon(null);
  }, [selectedMerchantId]);

  useEffect(() => {
    if (orgLoading) return;

    let isCancelled = false;
    const code = countryCode || "EC";

    const loadMerchants = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const merchantList = await listDiscountMerchants({ countryCode: code });
        if (isCancelled) return;
        setMerchants(merchantList);
        setSelectedMerchantId((current) => {
          if (current && merchantList.some((merchant) => merchant.id === current)) return current;
          return merchantList[0]?.id ?? null;
        });

        if (merchantList.length === 0) {
          setCoupons(getMockCoupons(language));
        }
      } catch (err) {
        if (isCancelled) return;
        setMerchants([]);
        setSelectedMerchantId(null);
        setCoupons(getMockCoupons(language));
        setError(err instanceof Error ? err.message : "Error al cargar merchants");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMerchants();

    return () => {
      isCancelled = true;
    };
  }, [countryCode, language, orgLoading]);

  useEffect(() => {
    if (!selectedMerchantId || merchants.length === 0 || !selectedMerchant) return;

    let isCancelled = false;

    const loadCoupons = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const discounts = await listMerchantDiscounts(selectedMerchantId);
        const flattenedCoupons = await Promise.all(
          discounts.map(async (discount) => {
            try {
              const couponRows = await listDiscountCoupons(discount.id);
              return couponRows.map((coupon) =>
                mapApiCouponToUiCoupon(selectedMerchant, discount, coupon)
              );
            } catch {
              return [] as Coupon[];
            }
          })
        );

        if (isCancelled) return;

        const flattened = flattenedCoupons.flat();
        setCoupons(flattened.length > 0 ? flattened : []);
      } catch (err) {
        if (isCancelled) return;
        setCoupons(getMockCoupons(language));
        setError(err instanceof Error ? err.message : "Error al cargar cupones");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCoupons();

    return () => {
      isCancelled = true;
    };
  }, [language, merchants, selectedMerchant, selectedMerchantId]);

  const merchantLabel = selectedMerchant?.name || countryName || countryCode || "EC";

  const handleDeactivateCoupon = async (coupon: Coupon) => {
    if (!coupon.couponId && !coupon.id) return;

    setIsDeactivatingCoupon(true);
    setError(null);

    try {
      const updated = await deactivateCoupon(coupon.couponId || coupon.id);

      setCoupons((current) =>
        current.map((item) => {
          if (item.id !== coupon.id) return item;
          return {
            ...item,
            status: updated.status?.toUpperCase() === "INACTIVE" ? "inactive" : item.status,
          };
        })
      );

      setSelectedCoupon((current) => {
        if (!current || current.id !== coupon.id) return current;
        return {
          ...current,
          status: updated.status?.toUpperCase() === "INACTIVE" ? "inactive" : current.status,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar el cupón");
    } finally {
      setIsDeactivatingCoupon(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={translations.breadcrumb.coupons} />
      <div className="mt-6">
        <div className="mb-6" data-tour-id="tour-discounts-coupons">
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            {translations.coupons.pageTitle}
          </h2>
          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
            {translations.coupons.description}
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-dark dark:text-white">Merchant: {merchantLabel}</p>
            <MerchantPicker
              merchants={merchants}
              selectedMerchantId={selectedMerchantId}
              onSelect={(merchantId) => setSelectedMerchantId(merchantId)}
              loading={orgLoading}
              countryCode={countryCode}
            />
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-300">
            {error}. {merchants.length > 0 ? "Se usa la data disponible." : "Se usaron datos mock como fallback."}
          </div>
        )}
        <div>
          {isLoading && coupons.length === 0 ? (
            <div className="rounded-lg border border-stroke bg-white p-6 text-sm text-dark-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
              Cargando cupones...
            </div>
          ) : (
            <CouponsList coupons={coupons} onCouponClick={setSelectedCoupon} />
          )}
        </div>
      </div>
      {selectedCoupon && (
        <CouponDetail
          coupon={selectedCoupon}
          onDeactivate={handleDeactivateCoupon}
          isDeactivating={isDeactivatingCoupon}
          onClose={() => setSelectedCoupon(null)}
        />
      )}
    </div>
  );
}
