"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import {
  createMerchantCategory,
  listMerchantCategories,
  updateMerchantCategory,
  type MerchantCategory,
} from "@/lib/discounts-api";

function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function MerchantCategoriesPage() {
  const merchantId = getStoredUser()?.merchant_id ?? "";
  const canManage = canManageMerchantActor(getStoredRoles());
  const [categories, setCategories] = useState<MerchantCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", sort_order: "0", status: "ACTIVE" });

  useEffect(() => {
    const run = async () => {
      if (!merchantId) return;
      setLoading(true);
      try {
        setCategories(await listMerchantCategories(merchantId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las categorías.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [merchantId]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", sort_order: "0", status: "ACTIVE" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!merchantId) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = { name: form.name, slug: form.slug, sort_order: Number(form.sort_order) || 0 };
      const category = editingId
        ? await updateMerchantCategory(merchantId, editingId, { ...payload, status: form.status })
        : await createMerchantCategory(merchantId, payload);
      if (editingId) {
        setCategories((current) => current.map((item) => (item.id === category.id ? { ...item, ...category } : item)));
        setMessage("Categoría actualizada correctamente.");
      } else {
        setCategories((current) => [category, ...current]);
        setMessage("Categoría creada correctamente.");
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category: MerchantCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      sort_order: String(category.sort_order ?? 0),
      status: category.status,
    });
  };

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        <Breadcrumb pageName="Merchant / Categories" />

        <ShowcaseSection title="Categories" className="!p-6">
          {canManage ? (
          <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl border border-stroke p-4 dark:border-dark-3 md:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))} placeholder="Nombre de categoría" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} placeholder="Slug" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <input value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} placeholder="Sort order" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <div className="md:col-span-2 flex justify-end gap-3">
              {editingId ? <button type="button" onClick={resetForm} className="rounded-lg border border-stroke px-4 py-2 text-sm text-dark dark:border-dark-3 dark:text-white">Cancelar</button> : null}
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70">{saving ? "Guardando..." : editingId ? "Guardar categoría" : "Crear categoría"}</button>
            </div>
          </form>
          ) : (
            <div className="mb-6 rounded-xl border border-stroke bg-gray-1/60 p-4 text-sm text-dark-6 dark:border-dark-3 dark:bg-dark-3/30 dark:text-dark-6">
              Este rol puede revisar categorías, pero no administrarlas.
            </div>
          )}

          {message ? <p className="mb-3 text-sm text-green-700 dark:text-green-400">{message}</p> : null}
          {error ? <p className="mb-3 text-sm text-red-700 dark:text-red-400">{error}</p> : null}

          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80"><th className="px-4 py-3 font-medium text-dark dark:text-white">Categoría</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Slug</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Order</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Acciones</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando categorías...</td></tr> : categories.length > 0 ? categories.map((category) => (
                  <tr key={category.id} className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40">
                    <td className="px-4 py-3 text-dark dark:text-white">{category.name}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{category.slug}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{category.sort_order ?? 0}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{category.status}</td>
                    <td className="px-4 py-3">{canManage ? <button type="button" onClick={() => startEdit(category)} className="rounded-lg border border-stroke px-3 py-1.5 text-xs text-dark dark:border-dark-3 dark:text-white">Editar</button> : <span className="text-xs text-dark-6 dark:text-dark-6">Solo lectura</span>}</td>
                  </tr>
                )) : <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay categorías todavía.</td></tr>}
              </tbody>
            </table>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
