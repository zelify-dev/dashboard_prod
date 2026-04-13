"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { MetricCard } from "@/components/Dashboard/metric-card";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getAdminDiscountsDashboard, listNetworkDiscountMerchants, type AdminDiscountsDashboard, type DiscountMerchant } from "@/lib/discounts-api";
import { listOrganizations, type OrganizationAdmin } from "@/lib/organizations-admin-api";
import { useEffect, useState } from "react";

function formatMetric(value: number | undefined, suffix = "") {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return `${value.toLocaleString("es-EC")}${suffix}`;
}

export default function OwnerDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDiscountsDashboard | null>(null);
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [analyticsData, merchantsData, organizationsData] = await Promise.all([
          getAdminDiscountsDashboard({
            from: from || undefined,
            to: to || undefined,
            limit: 10,
          }),
          listNetworkDiscountMerchants({ countryCode: "EC" }),
          listOrganizations(),
        ]);
        setDashboard(analyticsData);
        setMerchants(merchantsData);
        setOrganizations(organizationsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el dashboard owner.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [from, to]);

  const cards = dashboard?.overview_cards;
  const recentActivity = dashboard?.recent_activity ?? [];
  const topMerchants = dashboard?.rankings?.top_merchants ?? [];
  const topOrganizations = dashboard?.rankings?.top_organizations ?? [];
  const topDiscounts = dashboard?.rankings?.top_discounts ?? [];
  const timeSeries = dashboard?.charts?.timeseries ?? [];
  const byCountry = dashboard?.charts?.by_country ?? [];
  const byMerchantType = dashboard?.charts?.by_merchant_type ?? [];
  const merchantRows = topMerchants.length > 0
    ? topMerchants
    : merchants.slice(0, 5).map((merchant) => ({
        merchant_id: merchant.id,
        merchant_name: merchant.name,
        claims: 0,
        redemptions: 0,
      }));
  const organizationRows = topOrganizations.length > 0
    ? topOrganizations
    : organizations.slice(0, 5).map((organization) => ({
        organization_id: organization.id,
        organization_name: organization.name,
        claims: 0,
        redemptions: 0,
      }));

  return (
    <ActorRouteGuard actor="owner">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Owner Dashboard" />

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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Merchants en la red" value={cards?.total_merchants ?? merchants.length} helper={`Activos: ${formatMetric(cards?.active_merchants)}`} />
          <MetricCard label="Organizations cliente" value={cards?.total_client_organizations ?? organizations.length} helper={`Merchant orgs: ${formatMetric(cards?.total_merchant_organizations)}`} />
          <MetricCard label="Discounts" value={cards?.total_discounts ?? 0} helper={`Activos: ${formatMetric(cards?.active_discounts)} · Coupons: ${formatMetric(cards?.total_coupons)}`} />
          <MetricCard label="Claims" value={formatMetric(cards?.total_claims)} helper={`Pendientes: ${formatMetric(cards?.pending_claims)} · Redimidos: ${formatMetric(cards?.redeemed_claims)}`} />
          <MetricCard label="Conversion rate" value={formatMetric(cards?.conversion_rate, "%")} helper={`Redemptions: ${formatMetric(cards?.total_redemptions)} · Users: ${formatMetric(cards?.unique_users)}`} />
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <ShowcaseSection title="Tendencia reciente" className="!p-6">
            {loading ? (
              <p className="text-sm text-dark-6 dark:text-dark-6">Cargando analytics...</p>
            ) : timeSeries.length > 0 ? (
              <div className="space-y-3">
                {timeSeries.slice(-6).map((point, index) => (
                  <div key={`${point.date ?? point.label ?? index}`} className="rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-dark dark:text-white">{point.label ?? point.date ?? `Punto ${index + 1}`}</p>
                      <div className="flex gap-4 text-xs text-dark-6 dark:text-dark-6">
                        <span>Claims: {formatMetric(point.claims)}</span>
                        <span>Redemptions: {formatMetric(point.redemptions)}</span>
                        <span>Coupons: {formatMetric(point.coupons)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-6 dark:text-dark-6">No hay timeseries disponible todavía.</p>
            )}
          </ShowcaseSection>

          <ShowcaseSection title="Actividad reciente" className="!p-6">
            {loading ? (
              <p className="text-sm text-dark-6 dark:text-dark-6">Cargando actividad...</p>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 6).map((item, index) => (
                  <div key={item.id ?? `${item.type ?? "activity"}-${index}`} className="rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                    <p className="text-sm font-medium text-dark dark:text-white">{item.type ?? "Activity"}</p>
                    <p className="mt-1 text-xs text-dark-6 dark:text-dark-6">
                      {[item.merchant_name, item.organization_name, item.discount_name, item.coupon_code]
                        .filter(Boolean)
                        .join(" · ") || "Sin detalle adicional"}
                    </p>
                    {item.happened_at ? (
                      <p className="mt-1 text-xs text-dark-6 dark:text-dark-6">
                        {new Date(item.happened_at).toLocaleString("es-EC")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-6 dark:text-dark-6">No hay actividad reciente para mostrar.</p>
            )}
          </ShowcaseSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <ShowcaseSection title="Top merchants" className="!p-6">
            <div className="space-y-3">
              {merchantRows.map((merchant, index) => (
                <div key={merchant.merchant_id ?? `${merchant.merchant_name ?? "merchant"}-${index}`} className="flex items-center justify-between rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                  <div>
                    <p className="text-sm font-medium text-dark dark:text-white">{merchant.merchant_name ?? "Merchant"}</p>
                    <p className="text-xs text-dark-6 dark:text-dark-6">Claims: {formatMetric(merchant.claims)}</p>
                  </div>
                  <span className="text-sm font-semibold text-dark dark:text-white">{formatMetric(merchant.redemptions)}</span>
                </div>
              ))}
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="Top organizations" className="!p-6">
            <div className="space-y-3">
              {organizationRows.map((organization, index) => (
                <div key={organization.organization_id ?? `${organization.organization_name ?? "organization"}-${index}`} className="flex items-center justify-between rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                  <div>
                    <p className="text-sm font-medium text-dark dark:text-white">{organization.organization_name ?? "Organization"}</p>
                    <p className="text-xs text-dark-6 dark:text-dark-6">Claims: {formatMetric(organization.claims)}</p>
                  </div>
                  <span className="text-sm font-semibold text-dark dark:text-white">{formatMetric(organization.redemptions)}</span>
                </div>
              ))}
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="Top discounts" className="!p-6">
            {topDiscounts.length > 0 ? (
              <div className="space-y-3">
                {topDiscounts.map((discount, index) => (
                  <div key={discount.discount_id ?? `${discount.discount_name ?? "discount"}-${index}`} className="flex items-center justify-between rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                    <div>
                      <p className="text-sm font-medium text-dark dark:text-white">{discount.discount_name ?? "Discount"}</p>
                      <p className="text-xs text-dark-6 dark:text-dark-6">Claims: {formatMetric(discount.claims)}</p>
                    </div>
                    <span className="text-sm font-semibold text-dark dark:text-white">{formatMetric(discount.redemptions)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-6 dark:text-dark-6">No hay top discounts para mostrar.</p>
            )}
          </ShowcaseSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ShowcaseSection title="Uso por país" className="!p-6">
            {byCountry.length > 0 ? (
              <div className="space-y-3">
                {byCountry.map((row, index) => (
                  <div key={`${row.country_code ?? "country"}-${index}`} className="flex items-center justify-between rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                    <div>
                      <p className="text-sm font-medium text-dark dark:text-white">{row.country_code ?? "N/A"}</p>
                      <p className="text-xs text-dark-6 dark:text-dark-6">Claims: {formatMetric(row.claims)}</p>
                    </div>
                    <span className="text-sm font-semibold text-dark dark:text-white">{formatMetric(row.redemptions)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-6 dark:text-dark-6">No hay datos por país.</p>
            )}
          </ShowcaseSection>

          <ShowcaseSection title="Uso por tipo de merchant" className="!p-6">
            {byMerchantType.length > 0 ? (
              <div className="space-y-3">
                {byMerchantType.map((row, index) => (
                  <div key={`${row.merchant_type ?? "type"}-${index}`} className="flex items-center justify-between rounded-xl border border-stroke px-4 py-3 dark:border-dark-3">
                    <div>
                      <p className="text-sm font-medium text-dark dark:text-white">{row.merchant_type ?? "N/A"}</p>
                      <p className="text-xs text-dark-6 dark:text-dark-6">Claims: {formatMetric(row.claims)}</p>
                    </div>
                    <span className="text-sm font-semibold text-dark dark:text-white">{formatMetric(row.redemptions)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-6 dark:text-dark-6">No hay datos por tipo de merchant.</p>
            )}
          </ShowcaseSection>
        </div>
      </div>
    </ActorRouteGuard>
  );
}
