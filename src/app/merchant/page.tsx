"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { MetricCard } from "@/components/Dashboard/metric-card";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { getStoredUser } from "@/lib/auth-api";
import {
  getMerchantAnalytics,
  listNetworkDiscountMerchants,
  type DiscountMerchant,
  type MerchantAnalytics,
} from "@/lib/discounts-api";
import { MerchantPicker } from "@/app/pages/products/discounts-coupons/_components/merchant-picker";
import { useEffect, useMemo, useState } from "react";

export default function MerchantDashboardPage() {
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
      try {
        const list = await listNetworkDiscountMerchants(
          sessionMerchantId ? undefined : { countryCode: countryCode ?? "EC" }
        );
        setMerchants(list);
        setSelectedMerchantId(sessionMerchantId ?? list[0]?.id ?? null);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [countryCode, sessionMerchantId]);

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
        setError(err instanceof Error ? err.message : "No se pudieron cargar los analytics del merchant.");
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
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Merchant Dashboard" />

        {sessionMerchantId ? null : (
          <MerchantPicker
            merchants={merchants}
            selectedMerchantId={selectedMerchantId}
            onSelect={setSelectedMerchantId}
            loading={loading}
            countryCode={countryCode}
          />
        )}

        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-5">
          <MetricCard label="Merchant activo" value={selectedMerchant?.name ?? "Sin selección"} />
          <MetricCard label="Discounts" value={analytics?.total_discounts ?? 0} helper={`Activos: ${analytics?.active_discounts ?? 0}`} />
          <MetricCard label="Coupons" value={analytics?.total_coupons ?? 0} helper={`Activos: ${analytics?.active_coupons ?? 0}`} />
          <MetricCard label="Claims" value={(analytics?.total_claims ?? 0).toLocaleString("es-EC")} helper={`Pendientes: ${(analytics?.pending_claims ?? 0).toLocaleString("es-EC")}`} />
          <MetricCard label="Redemptions" value={(analytics?.total_redemptions ?? 0).toLocaleString("es-EC")} helper={`Users únicos: ${(analytics?.unique_users ?? 0).toLocaleString("es-EC")} · Usage: ${(analytics?.coupon_usage_rate ?? 0).toLocaleString("es-EC")} %`} />
        </div>

        {error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}

        <ShowcaseSection title="Top discounts del merchant" className="!p-6">
          {analyticsLoading ? (
            <p className="text-sm text-dark-6 dark:text-dark-6">Cargando analytics...</p>
          ) : (analytics?.top_discounts?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {analytics?.top_discounts?.map((item) => (
                <div key={item.discount_id} className="flex items-center justify-between rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                  <div>
                    <p className="text-sm font-medium text-dark dark:text-white">{item.discount_name}</p>
                    <p className="text-xs text-dark-6 dark:text-dark-6">{item.discount_id}</p>
                  </div>
                  <span className="text-sm font-semibold text-dark dark:text-white">
                    {item.total_redemptions.toLocaleString("es-EC")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-6 dark:text-dark-6">
              Todavía no hay analytics suficientes para este merchant.
            </p>
          )}
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
