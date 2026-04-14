"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { MetricCard } from "@/components/Dashboard/metric-card";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { getStoredRoles, getStoredUser } from "@/lib/auth-api";
import {
  getMerchantAnalytics,
  listNetworkDiscountMerchants,
  resolveMyMerchant,
  type DiscountMerchant,
  type MerchantAnalytics,
} from "@/lib/discounts-api";
import { DASHBOARD_ROLE } from "@/lib/dashboard-routing";
import { MerchantPicker } from "@/app/pages/products/discounts-coupons/_components/merchant-picker";
import { useLanguage } from "@/contexts/language-context";

const LABELS = {
  es: {
    breadcrumb: "Comercio / Panel General",
    heroTitle: "Bienvenido al Dashboard",
    heroSubtitle: "Monitorea el rendimiento de tus campañas, cupones y canjes en tiempo real.",
    totalActivity: "Actividad total",
    merchantPicker: "Selector de Comercio",
    activeMerchant: "Comercio activo",
    discounts: "Descuentos",
    coupons: "Cupones",
    claims: "Reclamos",
    redemptions: "Canjes",
    activePrefix: "Activos",
    pendingPrefix: "Pendientes",
    usagePrefix: "Uso",
    uniqueUsers: "Users únicos",
    topDiscounts: "Top Descuentos del Comercio",
    loading: "Cargando analytics...",
    noAnalytics: "Todavía no hay analytics suficientes para este comercio.",
    errorRelation: "Error al cargar la relación de comercios.",
    errorNoMerchant: "No tienes un comercio asignado. Contacta a soporte.",
  },
  en: {
    breadcrumb: "Merchant / General Panel",
    heroTitle: "Welcome to the Dashboard",
    heroSubtitle: "Monitor the performance of your campaigns, coupons, and redemptions in real time.",
    totalActivity: "Total activity",
    merchantPicker: "Merchant Picker",
    activeMerchant: "Active Merchant",
    discounts: "Discounts",
    coupons: "Coupons",
    claims: "Claims",
    redemptions: "Redemptions",
    activePrefix: "Active",
    pendingPrefix: "Pending",
    usagePrefix: "Usage",
    uniqueUsers: "Unique Users",
    topDiscounts: "Top Merchant Discounts",
    loading: "Loading analytics...",
    noAnalytics: "Not enough analytics yet for this merchant.",
    errorRelation: "Error loading merchant relationships.",
    errorNoMerchant: "No merchant assigned. Please contact support.",
  }
};

export default function MerchantDashboardPage() {
  const { language } = useLanguage();
  const t = LABELS[language];

  const { countryCode } = useOrganizationCountry();
  const sessionMerchantId = getStoredUser()?.merchant_id ?? null;
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      const roles = getStoredRoles();
      const isAdmin = roles.includes(DASHBOARD_ROLE.OWNER) || roles.includes(DASHBOARD_ROLE.ZELIFY_TEAM);

      try {
        if (isAdmin) {
          const list = await listNetworkDiscountMerchants({ countryCode: countryCode ?? "EC" });
          setMerchants(list);
          setSelectedMerchantId(sessionMerchantId ?? list[0]?.id ?? null);
        } else {
          let mid = sessionMerchantId;
          if (!mid) {
            const resolved = await resolveMyMerchant();
            mid = resolved.merchant_id;
          }

          if (mid) {
            const list = await listNetworkDiscountMerchants({ search: mid });
            setMerchants(list);
            setSelectedMerchantId(mid);
          } else {
            setMerchants([]);
            setSelectedMerchantId(null);
            setError(t.errorNoMerchant);
          }
        }
      } catch (err) {
        setError(t.errorRelation);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [countryCode, sessionMerchantId, t.errorNoMerchant, t.errorRelation]);

  useEffect(() => {
    const run = async () => {
      if (!selectedMerchantId) {
        setAnalytics(null);
        return;
      }
      setAnalyticsLoading(true);
      try {
        setAnalytics(
          await getMerchantAnalytics(selectedMerchantId, {
            from: from || undefined,
            to: to || undefined,
          })
        );
        setError("");
      } catch (err) {
        setAnalytics(null);
        setError(err instanceof Error ? err.message : "Error loading analytics");
      } finally {
        setAnalyticsLoading(false);
      }
    };
    void run();
  }, [from, selectedMerchantId, to]);

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId]
  );

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
              <div className="rounded-xl bg-gray-2 px-4 py-2 text-center dark:bg-dark-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-dark-6">{t.totalActivity}</p>
                <p className="text-xl font-bold text-primary">{(analytics?.total_redemptions ?? 0).toLocaleString(language === 'es' ? 'es-EC' : 'en-US')}</p>
              </div>
            </div>
          </div>
        </div>

        {merchants.length > 1 && (
          <MerchantPicker
            merchants={merchants}
            selectedMerchantId={selectedMerchantId}
            onSelect={setSelectedMerchantId}
            loading={loading}
            countryCode={countryCode}
          />
        )}

        <div className="flex flex-wrap items-center gap-4 mb-2">
           <div className="group relative">
              <label className="mb-2 block text-[10px] font-bold uppercase text-dark-6 tracking-widest leading-none">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-stroke bg-white px-4 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 font-medium" />
           </div>
           <div className="group relative">
              <label className="mb-2 block text-[10px] font-bold uppercase text-dark-6 tracking-widest leading-none">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-stroke bg-white px-4 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 font-medium" />
           </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <MetricCard 
            label={t.activeMerchant} 
            value={selectedMerchant?.name ?? "..."} 
            className="shadow-sm border-stroke dark:border-dark-3"
          />
          <MetricCard 
            label={t.discounts} 
            value={analytics?.total_discounts ?? 0} 
            helper={`${t.activePrefix}: ${analytics?.active_discounts ?? 0}`}
            className="shadow-sm border-stroke dark:border-dark-3"
          />
          <MetricCard 
            label={t.coupons} 
            value={analytics?.total_coupons ?? 0} 
            helper={`${t.activePrefix}: ${analytics?.active_coupons ?? 0}`}
            className="shadow-sm border-stroke dark:border-dark-3"
          />
          <MetricCard 
            label={t.claims} 
            value={(analytics?.total_claims ?? 0).toLocaleString()} 
            helper={`${t.pendingPrefix}: ${(analytics?.pending_claims ?? 0).toLocaleString()}`}
            className="shadow-sm border-stroke dark:border-dark-3"
          />
          <MetricCard 
            label={t.redemptions} 
            value={(analytics?.total_redemptions ?? 0).toLocaleString()} 
            helper={`${t.uniqueUsers}: ${(analytics?.unique_users ?? 0).toLocaleString()} · ${t.usagePrefix}: ${(analytics?.conversion_rate ?? analytics?.coupon_usage_rate ?? 0).toLocaleString()} %`}
            className="shadow-sm border-stroke dark:border-dark-3"
          />
        </div>

        {error ? <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100">{error}</div> : null}

        <ShowcaseSection title={t.topDiscounts} className="!p-6">
          {analyticsLoading ? (
            <div className="py-20 text-center text-dark-6 animate-pulse">{t.loading}</div>
          ) : (analytics?.top_discounts?.length ?? 0) > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {analytics?.top_discounts?.map((item) => (
                <div key={item.discount_id} className="flex items-center justify-between rounded-xl border border-stroke p-5 transition hover:shadow-md hover:border-primary/30 dark:border-dark-3 bg-gray-1/20">
                  <div>
                    <p className="text-sm font-bold text-dark dark:text-white leading-tight">{item.discount_name}</p>
                    <p className="mt-1 text-[10px] font-mono text-dark-6 opacity-60 tracking-tighter">{item.discount_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-primary">{item.total_redemptions.toLocaleString()}</p>
                    <p className="text-[10px] font-bold uppercase text-dark-6">{t.redemptions}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-dark-6 bg-gray-1/30 rounded-2xl border border-dashed border-stroke">
              <p className="text-sm font-medium">{t.noAnalytics}</p>
            </div>
          )}
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
