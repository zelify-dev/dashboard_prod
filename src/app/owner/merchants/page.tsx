"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { TemporaryPasswordModal } from "@/app/organization/teams/_components/temporary-password-modal";
import {
  MerchantOnboardingModal,
  type MerchantOnboardingData,
} from "@/app/owner/_components/merchant-onboarding-modal";
import {
  listNetworkDiscountMerchants,
  onboardDiscountMerchant,
  type DiscountMerchant,
} from "@/lib/discounts-api";
import { useEffect, useMemo, useState } from "react";

export default function OwnerMerchantsPage() {
  const [merchants, setMerchants] = useState<DiscountMerchant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [creatingMerchant, setCreatingMerchant] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    temporaryPassword: string;
  } | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        setMerchants(await listNetworkDiscountMerchants({ countryCode: "EC" }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la red de merchants.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return merchants;
    return merchants.filter((merchant) =>
      [merchant.name, merchant.slug, merchant.country_code, merchant.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [merchants, search]);

  const buildOnboardingPayload = (data: MerchantOnboardingData): Parameters<typeof onboardDiscountMerchant>[0] => {
    const optionalEntries = Object.entries({
      merchant_description: data.merchant_description,
      merchant_logo_url: data.merchant_logo_url,
      merchant_type: data.merchant_type,
      organization_name: data.organization_name,
      fiscal_id: data.fiscal_id,
      company_legal_name: data.company_legal_name,
      website: data.website,
      industry: data.industry,
      admin_phone: data.admin_phone,
      admin_username: data.admin_username,
      admin_password: data.admin_password,
    }).filter(([, value]) => typeof value === "string" && value.trim().length > 0);

    return {
      country_code: data.country_code.trim().toUpperCase(),
      merchant_name: data.merchant_name.trim(),
      merchant_slug: data.merchant_slug.trim(),
      admin_full_name: data.admin_full_name.trim(),
      admin_email: data.admin_email.trim(),
      ...Object.fromEntries(optionalEntries.map(([key, value]) => [key, value?.trim()])),
    };
  };

  const handleOnboardMerchant = async (data: MerchantOnboardingData) => {
    setCreatingMerchant(true);
    setOnboardingError("");
    setSuccessMessage("");
    try {
      const response = await onboardDiscountMerchant(buildOnboardingPayload(data));
      if (response.merchant) {
        setMerchants((current) => [response.merchant as DiscountMerchant, ...current]);
      }
      setOnboardingOpen(false);
      setSuccessMessage(response.message ?? "Merchant creado correctamente.");
      const temporaryPassword = response.temporary_password ?? response.admin_password;
      if (temporaryPassword) {
        setTempPasswordModal({ temporaryPassword });
      }
    } catch (err) {
      setOnboardingError(err instanceof Error ? err.message : "No se pudo crear el merchant.");
    } finally {
      setCreatingMerchant(false);
    }
  };

  return (
    <ActorRouteGuard actor="owner">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Owner / Merchants" />
        <ShowcaseSection title="Network merchants" className="!p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar merchant por nombre, país o estado"
                className="max-w-sm rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  setOnboardingOpen(true);
                  setOnboardingError("");
                }}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                Onboard merchant
              </button>
            </div>
            <p className="text-sm text-dark-6 dark:text-dark-6">{filtered.length} merchants</p>
          </div>

          {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
          {successMessage ? <p className="mb-4 text-sm text-green-700 dark:text-green-400">{successMessage}</p> : null}

          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80">
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Merchant</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Country</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Status</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Slug</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando merchants...</td>
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
                          <div>
                            <p className="font-medium">{merchant.name}</p>
                            <p className="text-xs text-dark-6 dark:text-dark-6">{merchant.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-dark dark:text-white">{merchant.country_code}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">{merchant.status}</td>
                      <td className="px-4 py-3 text-dark dark:text-white">{merchant.slug ?? "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay merchants para mostrar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ShowcaseSection>

        {onboardingOpen ? (
          <MerchantOnboardingModal
            onClose={() => setOnboardingOpen(false)}
            onSubmit={handleOnboardMerchant}
            loading={creatingMerchant}
            error={onboardingError}
          />
        ) : null}

        {tempPasswordModal ? (
          <TemporaryPasswordModal
            temporaryPassword={tempPasswordModal.temporaryPassword}
            onClose={() => setTempPasswordModal(null)}
          />
        ) : null}
      </div>
    </ActorRouteGuard>
  );
}
