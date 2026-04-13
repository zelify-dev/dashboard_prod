"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { MetricCard } from "@/components/Dashboard/metric-card";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import {
  getOrganizationReportsSummary,
  listOrganizationVisibleDiscounts,
  listOrganizationVisibleMerchants,
  type DiscountMerchant,
  type MerchantDiscount,
  type OrganizationDiscountSummary,
} from "@/lib/discounts-api";
import { getStoredOrganization } from "@/lib/auth-api";
import { useEffect, useMemo, useState } from "react";

export default function OrganizationDashboardPage() {
  const orgId = getStoredOrganization()?.id ?? "";
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [discounts, setDiscounts] = useState<MerchantDiscount[]>([]);
  const [summary, setSummary] = useState<OrganizationDiscountSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!orgId) return;
      setLoading(true);
      try {
        const [visibleMerchants, visibleDiscounts, reportSummary] = await Promise.all([
          listOrganizationVisibleMerchants(orgId),
          listOrganizationVisibleDiscounts(orgId),
          getOrganizationReportsSummary(orgId),
        ]);
        setMerchants(visibleMerchants);
        setDiscounts(visibleDiscounts);
        setSummary(reportSummary);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [orgId]);

  const totalRedemptions = useMemo(
    () => summary.reduce((acc, item) => acc + item.total_redemptions, 0),
    [summary]
  );

  return (
    <ActorRouteGuard actor="organization">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Organization Dashboard" />

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Merchants visibles" value={merchants.length} helper="Comercios publicados para esta organization" />
          <MetricCard label="Discounts visibles" value={discounts.length} helper="Promociones accesibles para los usuarios" />
          <MetricCard label="Redemptions" value={totalRedemptions.toLocaleString("es-EC")} helper="Resumen agregado del programa" />
        </div>

        <ShowcaseSection title="Resumen del programa" className="!p-6">
          {loading ? (
            <p className="text-sm text-dark-6 dark:text-dark-6">Cargando resumen...</p>
          ) : summary.length > 0 ? (
            <div className="space-y-3">
              {summary.map((item) => (
                <div key={item.merchant_id} className="flex items-center justify-between rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                  <div>
                    <p className="text-sm font-medium text-dark dark:text-white">{item.merchant_name}</p>
                    <p className="text-xs text-dark-6 dark:text-dark-6">{item.merchant_id}</p>
                  </div>
                  <span className="text-sm font-semibold text-dark dark:text-white">
                    {item.total_redemptions.toLocaleString("es-EC")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-6 dark:text-dark-6">Aún no hay actividad suficiente para este programa.</p>
          )}
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}

