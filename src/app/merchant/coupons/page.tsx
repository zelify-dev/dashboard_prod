"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { MerchantPicker } from "@/app/pages/products/discounts-coupons/_components/merchant-picker";
import { CouponsList, type Coupon } from "@/app/pages/products/discounts-coupons/_components/coupons-list";
import { CouponDetail } from "@/app/pages/products/discounts-coupons/_components/coupon-detail";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { canManageMerchantActor, DASHBOARD_ROLE } from "@/lib/dashboard-routing";
import { useMerchantId } from "@/hooks/use-merchant-id";
import { useLanguage } from "@/contexts/language-context";
import {
  deactivateCoupon,
  listDiscountCoupons,
  listMerchantDiscounts,
  listNetworkDiscountMerchants,
  type DiscountMerchant,
  type MerchantCoupon,
  type MerchantDiscount,
} from "@/lib/discounts-api";

const LABELS = {
  es: {
    breadcrumb: "Comercio / Cupones",
    heroTitle: "Gestión de Cupones",
    heroSubtitle: "Administra y rastrea el uso de tus códigos promocionales activos.",
    totalCoupons: "Cupones emitidos",
    btnNew: "Emitir Cupón",
    selectDiscount: "Filtrar por Descuento",
    noCoupons: "No hay cupones emitidos para este descuento.",
    loading: "Cargando cupones...",
    errorMerchants: "Error al cargar datos del merchant.",
    errorCoupons: "No se pudieron cargar los cupones.",
    msgDeactivated: "Cupón desactivado correctamente.",
    viewOnly: "Este rol puede revisar los cupones, pero no emitir nuevos.",
    activeMerchant: "Comercio activo",
    discountDetails: "Detalles del descuento",
  },
  en: {
    breadcrumb: "Merchant / Coupons",
    heroTitle: "Coupon Management",
    heroSubtitle: "Manage and track the usage of your active promo codes.",
    totalCoupons: "Issued coupons",
    btnNew: "Issue Coupon",
    selectDiscount: "Filter by Discount",
    noCoupons: "No coupons issued for this discount.",
    loading: "Loading coupons...",
    errorMerchants: "Error loading merchant data.",
    errorCoupons: "Failed to load coupons.",
    msgDeactivated: "Coupon deactivated successfully.",
    viewOnly: "This role can view coupons but cannot issue new ones.",
    activeMerchant: "Active Merchant",
    discountDetails: "Discount details",
  }
};

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
  const now = Date.now();
  if (validUntil && new Date(validUntil).getTime() < now) return "expired";
  if (normalized === "EXPIRED") return "expired";
  if (normalized === "LIMIT_REACHED" || redemptionsCount >= maxRedemptions) return "limit_reached";
  return "active";
}

function toLocalDay(day: string): string {
  const map: Record<string, string> = {
    MONDAY: "monday", TUESDAY: "tuesday", WEDNESDAY: "wednesday",
    THURSDAY: "thursday", FRIDAY: "friday", SATURDAY: "saturday", SUNDAY: "sunday",
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
    minPurchase: discount.min_purchase != null ? Number(discount.min_purchase) : undefined,
    maxUsesTotal: discount.max_uses_total ?? undefined,
    maxUsesPerUser: discount.max_uses_per_user ?? undefined,
    availability: {
      days: Array.isArray(discount.available_days) ? discount.available_days.map((day) => toLocalDay(day)) : [],
      hours: discount.restrict_by_hours ? { start: discount.available_hours_start || "00:00", end: discount.available_hours_end || "23:59" } : null,
    },
    createdAt: coupon.created_at || discount.created_at || new Date().toISOString(),
  };
}

export default function MerchantCouponsPage() {
  const { language } = useLanguage();
  const t = LABELS[language];

  const { countryCode } = useOrganizationCountry();
  const { merchantId: resolvedMerchantId, loading: resolving } = useMerchantId();
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
      if (resolving) return;
      const roles = getStoredRoles();
      const isAdmin = roles.includes(DASHBOARD_ROLE.OWNER) || roles.includes(DASHBOARD_ROLE.ZELIFY_TEAM);
      try {
        if (isAdmin) {
          const list = await listNetworkDiscountMerchants({ countryCode: countryCode ?? "EC" });
          setMerchants(list);
          setSelectedMerchantId(resolvedMerchantId ?? list[0]?.id ?? null);
        } else if (resolvedMerchantId) {
          const list = await listNetworkDiscountMerchants({ search: resolvedMerchantId });
          setMerchants(list);
          setSelectedMerchantId(resolvedMerchantId);
        }
      } catch (err) {
        setError(t.errorMerchants);
      }
    };
    void run();
  }, [resolvedMerchantId, resolving, countryCode, t.errorMerchants]);

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
        nextDiscounts.some((discount) => discount.id === current) ? current : nextDiscounts[0]?.id ?? ""
      );
    };
    void run().catch(() => { setDiscounts([]); setSelectedDiscountId(""); });
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
        setError(t.errorCoupons);
      } finally {
        setLoadingCoupons(false);
      }
    };
    void run().catch(() => setCoupons([]));
  }, [discounts, selectedDiscountId, t.errorCoupons]);

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
      setCoupons((current) => current.map((item) => (item.id === coupon.id ? { ...item, status: nextStatus } : item)));
      setSelectedCoupon((current) => current && current.id === coupon.id ? { ...current, status: nextStatus } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deactivating coupon");
    } finally {
      setIsDeactivatingCoupon(false);
    }
  };

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
            <div className="flex items-center gap-4">
              <div className="hidden rounded-xl bg-gray-2 px-4 py-2 text-center dark:bg-dark-3 sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-dark-6">{t.totalCoupons}</p>
                <p className="text-xl font-bold text-primary">{coupons.length}</p>
              </div>
              {canManage && (
                <Link href="/merchant/coupons/create" className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
                  {t.btnNew}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Picker if Admin/Owner */}
        {(merchants.length > 1 || !resolvedMerchantId) && (
          <MerchantPicker
            merchants={merchants}
            selectedMerchantId={selectedMerchantId}
            onSelect={setSelectedMerchantId}
            countryCode={countryCode}
          />
        )}

        <ShowcaseSection title={(t.breadcrumb.split("/").pop() || "Coupons").trim()} className="!p-6">
          <div className="grid gap-6 md:grid-cols-3">
             <div className="md:col-span-1">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-dark-6">{t.selectDiscount}</label>
                <select
                  value={selectedDiscountId}
                  onChange={(event) => setSelectedDiscountId(event.target.value)}
                  className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white focus:border-primary"
                >
                  {discounts.map((discount) => (
                    <option key={discount.id} value={discount.id}>{discount.name}</option>
                  ))}
                </select>
                
                {selectedMerchant && (
                  <div className="mt-6 rounded-xl bg-gray-1 p-4 dark:bg-dark-3/30 border border-stroke dark:border-dark-3">
                     <p className="text-[10px] uppercase font-bold text-dark-6 tracking-wide">{t.activeMerchant}</p>
                     <p className="mt-1 text-sm font-bold text-dark dark:text-white">{selectedMerchant.name}</p>
                  </div>
                )}
             </div>

             <div className="md:col-span-2">
                {!canManage && <div className="mb-6 rounded-xl bg-gray-1 p-4 text-xs font-medium text-dark-6">{t.viewOnly}</div>}
                
                {selectedDiscount && (
                  <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                    <p className="text-[10px] uppercase font-bold text-primary tracking-widest mb-1">{t.discountDetails}</p>
                    <h3 className="text-lg font-black text-dark dark:text-white">{selectedDiscount.name}</h3>
                    <p className="mt-1 text-xs text-dark-6 leading-relaxed">
                      {selectedDiscount.description || "—"} • <span className="font-bold text-primary">{selectedDiscount.discount_type} {selectedDiscount.discount_value}</span>
                    </p>
                  </div>
                )}

                {loadingCoupons ? (
                  <div className="py-20 text-center text-dark-6 animate-pulse">{t.loading}</div>
                ) : coupons.length > 0 ? (
                  <CouponsList coupons={coupons} onCouponClick={setSelectedCoupon} />
                ) : (
                  <div className="py-20 text-center text-dark-6 border border-dashed border-stroke rounded-2xl">
                     <p className="text-sm font-medium">{t.noCoupons}</p>
                  </div>
                )}
             </div>
          </div>
        </ShowcaseSection>

        {selectedCoupon && (
          <CouponDetail
            coupon={selectedCoupon}
            onClose={() => setSelectedCoupon(null)}
            onDeactivate={canManage ? handleDeactivateCoupon : undefined}
            isDeactivating={canManage ? isDeactivatingCoupon : false}
          />
        )}
      </div>
    </ActorRouteGuard>
  );
}
