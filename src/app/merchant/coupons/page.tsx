"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { MerchantPicker } from "@/app/pages/products/discounts-coupons/_components/merchant-picker";
import { CouponsList, type Coupon } from "@/app/pages/products/discounts-coupons/_components/coupons-list";
import { CouponDetail } from "@/app/pages/products/discounts-coupons/_components/coupon-detail";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import {
  deactivateCoupon,
  listDiscountCoupons,
  listMerchantDiscounts,
  listNetworkDiscountMerchants,
  type DiscountMerchant,
  type MerchantCoupon,
  type MerchantDiscount,
} from "@/lib/discounts-api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function mapApiCouponToUiCoupon(discount: MerchantDiscount, coupon: MerchantCoupon): Coupon {
  return {
    id: coupon.id,
    couponId: coupon.id,
    discountId: discount.id,
    merchantId: discount.merchant_id,
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
    minPurchase:
      discount.min_purchase !== undefined && discount.min_purchase !== null
        ? Number(discount.min_purchase)
        : undefined,
    maxUsesTotal: discount.max_uses_total ?? undefined,
    maxUsesPerUser: discount.max_uses_per_user ?? undefined,
    availability: {
      days: Array.isArray(discount.available_days)
        ? discount.available_days.map((day) => toLocalDay(day))
        : [],
      hours: discount.restrict_by_hours
        ? {
            start: discount.available_hours_start || "00:00",
            end: discount.available_hours_end || "23:59",
          }
        : null,
    },
    createdAt: coupon.created_at || discount.created_at || new Date().toISOString(),
  };
}

export default function MerchantCouponsPage() {
  const { countryCode } = useOrganizationCountry();
  const sessionMerchantId = getStoredUser()?.merchant_id ?? null;
  const canManage = canManageMerchantActor(getStoredRoles());
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [discounts, setDiscounts] = useState<MerchantDiscount[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeactivatingCoupon, setIsDeactivatingCoupon] = useState(false);

  useEffect(() => {
    const run = async () => {
      const list = await listNetworkDiscountMerchants(
        sessionMerchantId ? undefined : { countryCode: countryCode ?? "EC" }
      );
      setMerchants(list);
      setSelectedMerchantId(sessionMerchantId ?? list[0]?.id ?? null);
    };

    void run().catch(() => {
      setMerchants([]);
      setSelectedMerchantId(null);
    });
  }, [countryCode, sessionMerchantId]);

  useEffect(() => {
    const run = async () => {
      if (!selectedMerchantId) {
        setDiscounts([]);
        setSelectedDiscountId("");
        return;
      }

      const nextDiscounts = await listMerchantDiscounts(selectedMerchantId);
      setDiscounts(nextDiscounts);
      setSelectedDiscountId((current) =>
        nextDiscounts.some((discount) => discount.id === current)
          ? current
          : nextDiscounts[0]?.id ?? ""
      );
    };

    void run().catch(() => {
      setDiscounts([]);
      setSelectedDiscountId("");
    });
  }, [selectedMerchantId]);

  useEffect(() => {
    const run = async () => {
      if (!selectedDiscountId) {
        setCoupons([]);
        return;
      }

      setLoadingCoupons(true);
      try {
        const selectedDiscount = discounts.find((discount) => discount.id === selectedDiscountId);
        if (!selectedDiscount) {
          setCoupons([]);
          return;
        }

        const rows = await listDiscountCoupons(selectedDiscountId);
        setCoupons(rows.map((coupon) => mapApiCouponToUiCoupon(selectedDiscount, coupon)));
      } catch (err) {
        setCoupons([]);
        setError(err instanceof Error ? err.message : "No se pudieron cargar los coupons");
      } finally {
        setLoadingCoupons(false);
      }
    };

    void run().catch(() => setCoupons([]));
  }, [discounts, selectedDiscountId]);

  const selectedDiscount = useMemo(
    () => discounts.find((discount) => discount.id === selectedDiscountId) ?? null,
    [discounts, selectedDiscountId]
  );

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId]
  );

  const handleDeactivateCoupon = async (coupon: Coupon) => {
    setIsDeactivatingCoupon(true);
    setError(null);
    try {
      const updated = await deactivateCoupon(coupon.couponId || coupon.id);
      const nextStatus = updated.status?.toUpperCase() === "INACTIVE" ? "inactive" : coupon.status;
      setCoupons((current) =>
        current.map((item) => (item.id === coupon.id ? { ...item, status: nextStatus } : item))
      );
      setSelectedCoupon((current) =>
        current && current.id === coupon.id ? { ...current, status: nextStatus } : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar el coupon");
    } finally {
      setIsDeactivatingCoupon(false);
    }
  };

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Merchant / Coupons" />

        {sessionMerchantId ? null : (
          <MerchantPicker
            merchants={merchants}
            selectedMerchantId={selectedMerchantId}
            onSelect={setSelectedMerchantId}
            countryCode={countryCode}
          />
        )}

        <ShowcaseSection title="Coupons por discount" className="!p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-dark-6 dark:text-dark-6">
                {selectedMerchant ? `Merchant activo: ${selectedMerchant.name}` : "Selecciona un merchant y un discount para operar cupones."}
              </p>
              {error ? <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p> : null}
            </div>
            {canManage ? (
              <Link
                href="/merchant/coupons/create"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                Crear coupon
              </Link>
            ) : null}
          </div>

          <div className="mb-4 max-w-sm">
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Discount</label>
            <select
              value={selectedDiscountId}
              onChange={(event) => setSelectedDiscountId(event.target.value)}
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              {discounts.map((discount) => (
                <option key={discount.id} value={discount.id}>
                  {discount.name}
                </option>
              ))}
            </select>
          </div>

          {selectedDiscount ? (
            <div className="mb-4 rounded-xl border border-stroke bg-gray-1/60 p-4 dark:border-dark-3 dark:bg-dark-3/30">
              <p className="text-sm font-semibold text-dark dark:text-white">{selectedDiscount.name}</p>
              <p className="mt-1 text-xs text-dark-6 dark:text-dark-6">
                {selectedDiscount.description || "Sin descripción"} • {selectedDiscount.discount_type} • {selectedDiscount.discount_value}
              </p>
            </div>
          ) : null}

          {loadingCoupons ? (
            <div className="rounded-xl border border-stroke px-4 py-10 text-center text-sm text-dark-6 dark:border-dark-3 dark:text-dark-6">
              Cargando coupons...
            </div>
          ) : coupons.length > 0 ? (
            <CouponsList coupons={coupons} onCouponClick={setSelectedCoupon} />
          ) : (
            <div className="rounded-xl border border-stroke px-4 py-10 text-center text-sm text-dark-6 dark:border-dark-3 dark:text-dark-6">
              No hay coupons para este discount.
            </div>
          )}
        </ShowcaseSection>

        {selectedCoupon ? (
          <CouponDetail
            coupon={selectedCoupon}
            onClose={() => setSelectedCoupon(null)}
            onDeactivate={canManage ? handleDeactivateCoupon : undefined}
            isDeactivating={canManage ? isDeactivatingCoupon : false}
          />
        ) : null}
      </div>
    </ActorRouteGuard>
  );
}
