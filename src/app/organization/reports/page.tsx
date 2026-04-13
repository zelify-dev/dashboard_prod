"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { MetricCard } from "@/components/Dashboard/metric-card";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredOrganization } from "@/lib/auth-api";
import {
  getOrganizationReportsSummary,
  listOrganizationRedemptions,
  listOrganizationVisibleDiscounts,
  listOrganizationVisibleMerchants,
  type OrganizationRedemption,
  type OrganizationDiscountSummary,
} from "@/lib/discounts-api";
import { useEffect, useMemo, useState } from "react";

export default function OrganizationReportsPage() {
  const orgId = getStoredOrganization()?.id ?? "";
  const [summary, setSummary] = useState<OrganizationDiscountSummary[]>([]);
  const [redemptions, setRedemptions] = useState<OrganizationRedemption[]>([]);
  const [merchantCount, setMerchantCount] = useState(0);
  const [discountCount, setDiscountCount] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [discountId, setDiscountId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [merchants, setMerchants] = useState<Array<{ id: string; name: string }>>([]);
  const [discounts, setDiscounts] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const run = async () => {
      if (!orgId) return;
      setLoading(true);
      try {
        const [reportSummary, merchantRows, discountRows, redemptionRows] = await Promise.all([
          getOrganizationReportsSummary(orgId),
          listOrganizationVisibleMerchants(orgId),
          listOrganizationVisibleDiscounts(orgId),
          listOrganizationRedemptions(orgId, {
            merchant_id: merchantId || undefined,
            discount_id: discountId || undefined,
            from: from || undefined,
            to: to || undefined,
          }),
        ]);
        setSummary(reportSummary);
        setMerchantCount(merchantRows.length);
        setDiscountCount(discountRows.length);
        setMerchants(merchantRows.map((merchant) => ({ id: merchant.id, name: merchant.name })));
        setDiscounts(discountRows.map((discount) => ({ id: discount.id, name: discount.name })));
        setRedemptions(redemptionRows);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los reportes.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [discountId, from, merchantId, orgId, to]);

  const totalRedemptions = useMemo(
    () => summary.reduce((acc, item) => acc + item.total_redemptions, 0),
    [summary]
  );

  const topMerchant = summary[0] ?? null;
  const avgRedemptions =
    summary.length > 0 ? Math.round(totalRedemptions / summary.length) : 0;

  return (
    <ActorRouteGuard actor="organization">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Organization / Reports" />

        <div className="flex flex-wrap gap-3">
          <select
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="">Todos los merchants</option>
            {merchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>{merchant.name}</option>
            ))}
          </select>
          <select
            value={discountId}
            onChange={(e) => setDiscountId(e.target.value)}
            className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="">Todos los discounts</option>
            {discounts.map((discount) => (
              <option key={discount.id} value={discount.id}>{discount.name}</option>
            ))}
          </select>
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

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Merchants visibles" value={merchantCount} />
          <MetricCard label="Discounts visibles" value={discountCount} />
          <MetricCard label="Redemptions" value={totalRedemptions.toLocaleString("es-EC")} />
          <MetricCard label="Promedio por merchant" value={avgRedemptions.toLocaleString("es-EC")} />
        </div>

        {error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <ShowcaseSection title="Uso por merchant" className="!p-6">
            {loading ? (
              <p className="text-sm text-dark-6 dark:text-dark-6">Cargando reportes...</p>
            ) : summary.length > 0 ? (
              <div className="space-y-3">
                {summary.map((item) => (
                  <div
                    key={item.merchant_id}
                    className="flex items-center justify-between rounded-xl border border-stroke px-4 py-3 dark:border-dark-3"
                  >
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
              <p className="text-sm text-dark-6 dark:text-dark-6">
                Aún no hay redenciones registradas para esta organization.
              </p>
            )}
          </ShowcaseSection>

          <ShowcaseSection title="Resumen ejecutivo" className="!p-6">
            <div className="space-y-4">
              <div className="rounded-xl border border-stroke bg-gray-1/60 p-4 dark:border-dark-3 dark:bg-dark-3/30">
                <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">Merchant con mejor uso</p>
                <p className="mt-2 text-lg font-semibold text-dark dark:text-white">
                  {topMerchant?.merchant_name ?? "Sin actividad"}
                </p>
                <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                  {topMerchant
                    ? `${topMerchant.total_redemptions.toLocaleString("es-EC")} redemptions`
                    : "Todavía no hay suficiente actividad para destacar un merchant."}
                </p>
              </div>

              <div className="rounded-xl border border-stroke bg-gray-1/60 p-4 dark:border-dark-3 dark:bg-dark-3/30">
                <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">Lectura rápida</p>
                <ul className="mt-3 space-y-2 text-sm text-dark dark:text-white">
                  <li>{merchantCount} merchants publicados para tus usuarios.</li>
                  <li>{discountCount} discounts visibles dentro del programa.</li>
                  <li>{summary.length} merchants con actividad registrada en reportes.</li>
                </ul>
              </div>
            </div>
          </ShowcaseSection>
        </div>

        <ShowcaseSection title="Redemptions report" className="!p-6">
          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80">
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Fecha</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Merchant</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Discount</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Coupon</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">User</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando redemptions...</td></tr>
                ) : redemptions.length > 0 ? (
                  redemptions.map((item) => (
                    <tr key={item.id} className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40">
                      <td className="px-4 py-3 text-dark dark:text-white">{new Date(item.redeemed_at).toLocaleString("es-EC")}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">{item.coupon?.discount?.merchant?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">{item.coupon?.discount?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">{item.coupon?.code ?? "—"}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">{item.user_id}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay redemptions para los filtros seleccionados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
