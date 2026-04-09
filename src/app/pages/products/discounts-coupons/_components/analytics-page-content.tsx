"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CouponAnalytics } from "./coupon-analytics";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";
import { useLanguage } from "@/contexts/language-context";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { getMockCoupons, type Coupon } from "./coupons-list";
import { MerchantPicker } from "./merchant-picker";
import {
  DiscountMerchant,
  listDiscountCoupons,
  listDiscountMerchants,
  listMerchantDiscounts,
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
  discount: Awaited<ReturnType<typeof listMerchantDiscounts>>[number],
  coupon: Awaited<ReturnType<typeof listDiscountCoupons>>[number]
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

export function AnalyticsPageContent() {
  const translations = useDiscountsCouponsTranslations();
  const { language } = useLanguage();
  const { countryCode, loading: orgLoading, countryName } = useOrganizationCountry();
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>(() => getMockCoupons(language));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId]
  );

  const merchantLabel = selectedMerchant?.name || countryName || countryCode || "EC";

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
        const perDiscountCoupons = await Promise.all(
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
        const flattened = perDiscountCoupons.flat();
        setCoupons(flattened.length > 0 ? flattened : []);
      } catch (err) {
        if (isCancelled) return;
        setCoupons(getMockCoupons(language));
        setError(err instanceof Error ? err.message : "Error al cargar analítica");
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

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={translations.breadcrumb.analytics} />
      <div className="mt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-white">{translations.analytics.pageTitle}</h2>
          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
            {translations.analytics.description}
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
            {error}. Se usa data mock como fallback si la API no responde.
          </div>
        )}
        <div>
          <CouponAnalytics coupons={coupons} merchantLabel={merchantLabel} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

