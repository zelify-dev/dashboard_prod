"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import {
  deactivateDiscountMerchant,
  getDiscountMerchant,
  updateDiscountMerchant,
  type DiscountMerchant,
} from "@/lib/discounts-api";

export default function MerchantProfilePage() {
  const merchantId = getStoredUser()?.merchant_id ?? "";
  const canManage = canManageMerchantActor(getStoredRoles());
  const [merchant, setMerchant] = useState<DiscountMerchant | null>(null);
  const [form, setForm] = useState({
    organization_id: "",
    name: "",
    description: "",
    logo_url: "",
    merchant_type: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!merchantId) return;
      setLoading(true);
      setError("");
      try {
        const data = await getDiscountMerchant(merchantId);
        setMerchant(data);
        setForm({
          organization_id: (data as DiscountMerchant & { organization_id?: string | null }).organization_id ?? "",
          name: data.name ?? "",
          description: data.description ?? "",
          logo_url: data.logo_url ?? "",
          merchant_type: (data as DiscountMerchant & { merchant_type?: string | null }).merchant_type ?? "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el merchant.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [merchantId]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!merchantId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateDiscountMerchant(merchantId, {
        organization_id: form.organization_id || null,
        name: form.name,
        description: form.description || undefined,
        logo_url: form.logo_url || undefined,
        merchant_type: form.merchant_type || null,
      });
      setMerchant(updated);
      setMessage("Perfil del merchant actualizado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el merchant.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!merchantId) return;
    const confirmed = window.confirm("¿Seguro que quieres desactivar este merchant?");
    if (!confirmed) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await deactivateDiscountMerchant(merchantId);
      setMerchant(updated);
      setMessage("Merchant desactivado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar el merchant.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        <Breadcrumb pageName="Merchant / Profile" />

        <ShowcaseSection title="Merchant profile" className="!p-6">
          {loading ? (
            <p className="text-sm text-dark-6 dark:text-dark-6">Cargando perfil...</p>
          ) : merchant ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={!canManage}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Merchant type</label>
                  <input
                    type="text"
                    value={form.merchant_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, merchant_type: e.target.value }))}
                    disabled={!canManage}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    disabled={!canManage}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Logo URL</label>
                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                    disabled={!canManage}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Organization ID</label>
                  <input
                    type="text"
                    value={form.organization_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, organization_id: e.target.value }))}
                    disabled={!canManage}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
              </div>

              {!canManage ? (
                <p className="text-sm text-dark-6 dark:text-dark-6">
                  Este rol puede ver el perfil del merchant, pero no editar su configuración estructural.
                </p>
              ) : null}

              <div className="rounded-xl border border-stroke bg-gray-1/60 p-4 dark:border-dark-3 dark:bg-dark-3/30">
                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-dark-6 dark:text-dark-6">Slug</p>
                    <p className="mt-1 text-sm font-medium text-dark dark:text-white">{merchant.slug ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-6 dark:text-dark-6">Country</p>
                    <p className="mt-1 text-sm font-medium text-dark dark:text-white">{merchant.country_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-6 dark:text-dark-6">Status</p>
                    <p className="mt-1 text-sm font-medium text-dark dark:text-white">{merchant.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-6 dark:text-dark-6">Merchant ID</p>
                    <p className="mt-1 truncate text-sm font-medium text-dark dark:text-white">{merchant.id}</p>
                  </div>
                </div>
              </div>

              {message ? <p className="text-sm text-green-700 dark:text-green-400">{message}</p> : null}
              {error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}

              {canManage ? (
                <div className="flex flex-wrap justify-between gap-3 border-t border-stroke pt-5 dark:border-dark-3">
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={saving || merchant.status === "INACTIVE"}
                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                  >
                    Desactivar merchant
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70"
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              ) : null}
            </form>
          ) : (
            <p className="text-sm text-dark-6 dark:text-dark-6">No se pudo resolver el merchant actual.</p>
          )}
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
