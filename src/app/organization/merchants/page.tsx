"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredOrganization } from "@/lib/auth-api";
import { listOrganizationVisibleMerchants, type DiscountMerchant } from "@/lib/discounts-api";
import { useEffect, useMemo, useState } from "react";

export default function OrganizationMerchantsPage() {
  const orgId = getStoredOrganization()?.id ?? "";
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!orgId) return;
      setLoading(true);
      try {
        setMerchants(await listOrganizationVisibleMerchants(orgId));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [orgId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return merchants;
    return merchants.filter((merchant) =>
      [merchant.name, merchant.country_code, merchant.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [merchants, search]);

  return (
    <ActorRouteGuard actor="organization">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Organization / Merchants" />
        <ShowcaseSection title="Merchants visibles" className="!p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar merchant visible"
              className="max-w-sm rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <p className="text-sm text-dark-6 dark:text-dark-6">{filtered.length} merchants</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80">
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Merchant</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Country</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando merchants...</td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((merchant) => (
                    <tr key={merchant.id} className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40">
                      <td className="px-4 py-3 text-dark dark:text-white">
                        <div className="flex items-center gap-3">
                          {merchant.logo_url ? (
                            <img src={merchant.logo_url} alt={merchant.name} className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              {merchant.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">{merchant.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-dark dark:text-white">{merchant.country_code}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">{merchant.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay merchants visibles.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}

