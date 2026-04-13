"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import {
  assignDiscountToOrganization,
  assignMerchantToOrganization,
  listMerchantDiscounts,
  listNetworkDiscountMerchants,
  type DiscountMerchant,
  type MerchantDiscount,
} from "@/lib/discounts-api";
import { listOrganizations, type OrganizationAdmin } from "@/lib/organizations-admin-api";
import { useEffect, useState } from "react";

export default function OwnerVisibilityPage() {
  const [organizations, setOrganizations] = useState<OrganizationAdmin[]>([]);
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [discounts, setDiscounts] = useState<MerchantDiscount[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [orgs, networkMerchants] = await Promise.all([
          listOrganizations(),
          listNetworkDiscountMerchants({ countryCode: "EC" }),
        ]);
        setOrganizations(orgs);
        setMerchants(networkMerchants);
        if (orgs[0]?.id) setSelectedOrgId(orgs[0].id);
        if (networkMerchants[0]?.id) setSelectedMerchantId(networkMerchants[0].id);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedMerchantId) {
        setDiscounts([]);
        return;
      }

      try {
        setDiscounts(await listMerchantDiscounts(selectedMerchantId));
      } catch {
        setDiscounts([]);
      }
    };

    void run();
  }, [selectedMerchantId]);

  const handleAssignMerchant = async () => {
    if (!selectedOrgId || !selectedMerchantId) return;
    try {
      const res = await assignMerchantToOrganization(selectedOrgId, selectedMerchantId);
      setMessage(res.message ?? "Merchant asignado correctamente.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo asignar el merchant.");
    }
  };

  const handleAssignDiscount = async (discountId: string) => {
    if (!selectedOrgId) return;
    try {
      const res = await assignDiscountToOrganization(selectedOrgId, discountId);
      setMessage(res.message ?? "Discount asignado correctamente.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo asignar el discount.");
    }
  };

  return (
    <ActorRouteGuard actor="owner">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Owner / Visibility" />

        <ShowcaseSection title="Organization ↔ Merchant visibility" className="!p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Organization</label>
              <select
                value={selectedOrgId}
                onChange={(event) => setSelectedOrgId(event.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Merchant</label>
              <select
                value={selectedMerchantId}
                onChange={(event) => setSelectedMerchantId(event.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                {merchants.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>
                    {merchant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAssignMerchant}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Asignar merchant a organization
            </button>
            {message ? <p className="text-sm text-dark-6 dark:text-dark-6">{message}</p> : null}
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Discount visibility por merchant" className="!p-6">
          {loading ? (
            <p className="text-sm text-dark-6 dark:text-dark-6">Cargando descuentos...</p>
          ) : discounts.length > 0 ? (
            <div className="space-y-3">
              {discounts.map((discount) => (
                <div key={discount.id} className="flex flex-col gap-3 rounded-xl border border-stroke p-4 dark:border-dark-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-dark dark:text-white">{discount.name}</p>
                    <p className="text-xs text-dark-6 dark:text-dark-6">
                      {discount.discount_type} · {discount.discount_value}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssignDiscount(discount.id)}
                    className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                  >
                    Asignar discount
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-6 dark:text-dark-6">Selecciona un merchant con descuentos disponibles.</p>
          )}
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}

