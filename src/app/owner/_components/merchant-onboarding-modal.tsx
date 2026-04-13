"use client";

import { useState } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";

export type MerchantOnboardingData = {
  country_code: string;
  merchant_name: string;
  merchant_slug: string;
  merchant_description?: string;
  merchant_logo_url?: string;
  merchant_type?: string;
  organization_name?: string;
  fiscal_id?: string;
  company_legal_name?: string;
  website?: string;
  industry?: string;
  admin_full_name: string;
  admin_email: string;
  admin_phone?: string;
  admin_username?: string;
  admin_password?: string;
};

type MerchantOnboardingModalProps = {
  onClose: () => void;
  onSubmit: (data: MerchantOnboardingData) => void;
  loading?: boolean;
  error?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MerchantOnboardingModal({
  onClose,
  onSubmit,
  loading = false,
  error,
}: MerchantOnboardingModalProps) {
  const modalRef = useClickOutside<HTMLDivElement>(() => !loading && onClose());
  const [form, setForm] = useState<MerchantOnboardingData>({
    country_code: "EC",
    merchant_name: "",
    merchant_slug: "",
    merchant_description: "",
    merchant_logo_url: "",
    merchant_type: "RESTAURANT",
    organization_name: "",
    fiscal_id: "",
    company_legal_name: "",
    website: "",
    industry: "",
    admin_full_name: "",
    admin_email: "",
    admin_phone: "",
    admin_username: "",
    admin_password: "",
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div ref={modalRef} className="w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3 shrink-0">
          <h2 className="text-heading-5 font-semibold text-dark dark:text-white">Onboard merchant</h2>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            Crea la organization técnica, el merchant y su admin inicial en una sola operación.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
          className="flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">Merchant</h3>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Country code</label>
                  <input
                    type="text"
                    required
                    value={form.country_code}
                    onChange={(e) => setForm((prev) => ({ ...prev, country_code: e.target.value.toUpperCase() }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Merchant name</label>
                  <input
                    type="text"
                    required
                    value={form.merchant_name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        merchant_name: e.target.value,
                        merchant_slug: prev.merchant_slug || slugify(e.target.value),
                        organization_name: prev.organization_name || `${e.target.value} Merchant Org`,
                      }))
                    }
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Merchant slug</label>
                  <input
                    type="text"
                    required
                    value={form.merchant_slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, merchant_slug: slugify(e.target.value) }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Merchant type</label>
                  <input
                    type="text"
                    value={form.merchant_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, merchant_type: e.target.value }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Description</label>
                  <textarea
                    rows={3}
                    value={form.merchant_description}
                    onChange={(e) => setForm((prev) => ({ ...prev, merchant_description: e.target.value }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Logo URL</label>
                  <input
                    type="url"
                    value={form.merchant_logo_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, merchant_logo_url: e.target.value }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Organization name</label>
                  <input
                    type="text"
                    value={form.organization_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, organization_name: e.target.value }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div className="rounded-xl border border-stroke bg-gray-1/50 p-4 dark:border-dark-3 dark:bg-dark-2/60">
                  <h4 className="mb-3 text-sm font-semibold text-dark dark:text-white">Merchant organization info</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Fiscal ID</label>
                      <input
                        type="text"
                        value={form.fiscal_id}
                        onChange={(e) => setForm((prev) => ({ ...prev, fiscal_id: e.target.value }))}
                        className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                        placeholder="Opcional"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Company legal name</label>
                      <input
                        type="text"
                        value={form.company_legal_name}
                        onChange={(e) => setForm((prev) => ({ ...prev, company_legal_name: e.target.value }))}
                        className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                        placeholder="Opcional"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Website</label>
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                        className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Industry</label>
                      <input
                        type="text"
                        value={form.industry}
                        onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
                        className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">Admin inicial</h3>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Admin full name</label>
                  <input
                    type="text"
                    required
                    value={form.admin_full_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, admin_full_name: e.target.value }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Admin email</label>
                  <input
                    type="email"
                    required
                    value={form.admin_email}
                    onChange={(e) => setForm((prev) => ({ ...prev, admin_email: e.target.value }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Admin phone</label>
                  <input
                    type="text"
                    value={form.admin_phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, admin_phone: e.target.value }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Admin username</label>
                  <input
                    type="text"
                    value={form.admin_username}
                    onChange={(e) => setForm((prev) => ({ ...prev, admin_username: e.target.value }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Admin temporary password</label>
                  <input
                    type="text"
                    value={form.admin_password}
                    onChange={(e) => setForm((prev) => ({ ...prev, admin_password: e.target.value }))}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    placeholder="Opcional"
                  />
                  <p className="mt-1.5 text-xs text-dark-6 dark:text-dark-6">
                    Si no se envía, backend puede generar una credencial temporal según su lógica.
                  </p>
                </div>
              </div>
            </div>

            {(error || loading) && (
              <div className="mt-4">
                {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
                {loading ? <p className="text-sm text-dark-6 dark:text-dark-6">Creando merchant…</p> : null}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-stroke p-5 dark:border-dark-3 bg-gray-50/50 dark:bg-dark-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-stroke px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-70 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70 transition-all shadow-sm"
            >
              Crear merchant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
