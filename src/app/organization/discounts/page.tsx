"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredOrganization } from "@/lib/auth-api";
import { listOrganizationVisibleDiscounts, type MerchantDiscount } from "@/lib/discounts-api";
import { useEffect, useMemo, useState } from "react";

export default function OrganizationDiscountsPage() {
  const orgId = getStoredOrganization()?.id ?? "";
  const [discounts, setDiscounts] = useState<MerchantDiscount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!orgId) return;
      setLoading(true);
      try {
        setDiscounts(await listOrganizationVisibleDiscounts(orgId));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [orgId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return discounts;
    return discounts.filter((discount) =>
      [discount.name, discount.description, discount.discount_type, discount.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [discounts, search]);

  return (
    <ActorRouteGuard actor="organization">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Organization / Discounts" />
        <ShowcaseSection title="Discounts visibles" className="!p-6">
          <div className="mb-4">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar discount visible"
              className="max-w-sm rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80">
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Discount</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Tipo</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Valor</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando discounts...</td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((discount) => (
                    <tr key={discount.id} className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40">
                      <td className="px-4 py-3 text-dark dark:text-white">
                        <p className="font-medium">{discount.name}</p>
                        <p className="text-xs text-dark-6 dark:text-dark-6">{discount.description ?? "Sin descripción"}</p>
                      </td>
                      <td className="px-4 py-3 text-dark dark:text-white">{discount.discount_type}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">{discount.discount_value}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">{discount.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay discounts visibles.</td>
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

