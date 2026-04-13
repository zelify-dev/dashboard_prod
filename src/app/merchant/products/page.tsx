"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import {
  activateMerchantProduct,
  createMerchantProduct,
  deactivateMerchantProduct,
  deleteMerchantProduct,
  listMerchantCategories,
  listMerchantProducts,
  updateMerchantProduct,
  type MerchantCategory,
  type MerchantProduct,
} from "@/lib/discounts-api";

export default function MerchantProductsPage() {
  const merchantId = getStoredUser()?.merchant_id ?? "";
  const canManage = canManageMerchantActor(getStoredRoles());
  const [categories, setCategories] = useState<MerchantCategory[]>([]);
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    category_id: "",
    image_url: "",
    sort_order: "0",
    status: "ACTIVE",
  });

  const loadData = async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const [nextCategories, nextProducts] = await Promise.all([
        listMerchantCategories(merchantId),
        listMerchantProducts(merchantId, { category_id: categoryFilter || undefined }),
      ]);
      setCategories(nextCategories);
      setProducts(nextProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [merchantId, categoryFilter]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      price: "",
      currency: "USD",
      category_id: "",
      image_url: "",
      sort_order: "0",
      status: "ACTIVE",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!merchantId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price) || 0,
        currency: form.currency,
        category_id: form.category_id || undefined,
        image_url: form.image_url || undefined,
        sort_order: Number(form.sort_order) || 0,
      };
      const product = editingId
        ? await updateMerchantProduct(merchantId, editingId, { ...payload, status: form.status })
        : await createMerchantProduct(merchantId, payload);
      if (editingId) {
        setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, ...product } : item)));
        setMessage("Producto actualizado correctamente.");
      } else {
        setProducts((current) => [product, ...current]);
        setMessage("Producto creado correctamente.");
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product: MerchantProduct) => {
    setEditingId(product.id);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      currency: product.currency ?? "USD",
      category_id: product.category_id ?? "",
      image_url: product.image_url ?? "",
      sort_order: String(product.sort_order ?? 0),
      status: product.status ?? "ACTIVE",
    });
  };

  const toggleStatus = async (product: MerchantProduct) => {
    if (!merchantId) return;
    try {
      const updated =
        product.status === "ACTIVE"
          ? await deactivateMerchantProduct(merchantId, product.id)
          : await activateMerchantProduct(merchantId, product.id);
      setProducts((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setMessage(`Producto ${updated.status === "ACTIVE" ? "activado" : "desactivado"} correctamente.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado del producto.");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!merchantId) return;
    const confirmed = window.confirm("¿Eliminar este producto?");
    if (!confirmed) return;
    try {
      await deleteMerchantProduct(merchantId, productId);
      setProducts((current) => current.filter((item) => item.id !== productId));
      setMessage("Producto eliminado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el producto.");
    }
  };

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Merchant / Products" />

        <ShowcaseSection title="Products" className="!p-6">
          {canManage ? (
          <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl border border-stroke p-4 dark:border-dark-3 lg:grid-cols-3">
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre del producto" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="Precio" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <input value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} placeholder="Currency" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white">
              <option value="">Sin categoría</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <input value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="Image URL" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <input value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} placeholder="Sort order" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción" className="lg:col-span-2 rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" rows={3} />
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <div className="lg:col-span-3 flex flex-wrap justify-between gap-3">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white">
                <option value="">Todas las categorías</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <div className="flex gap-3">
                {editingId ? <button type="button" onClick={resetForm} className="rounded-lg border border-stroke px-4 py-2 text-sm text-dark dark:border-dark-3 dark:text-white">Cancelar</button> : null}
                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70">{saving ? "Guardando..." : editingId ? "Guardar producto" : "Crear producto"}</button>
              </div>
            </div>
          </form>
          ) : (
            <div className="mb-6 rounded-xl border border-stroke bg-gray-1/60 p-4 text-sm text-dark-6 dark:border-dark-3 dark:bg-dark-3/30 dark:text-dark-6">
              Este rol puede revisar productos, pero no crear ni modificar catálogo.
            </div>
          )}

          {message ? <p className="mb-3 text-sm text-green-700 dark:text-green-400">{message}</p> : null}
          {error ? <p className="mb-3 text-sm text-red-700 dark:text-red-400">{error}</p> : null}

          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80"><th className="px-4 py-3 font-medium text-dark dark:text-white">Producto</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Precio</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Categoría</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th><th className="px-4 py-3 font-medium text-dark dark:text-white">Acciones</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando productos...</td></tr> : products.length > 0 ? products.map((product) => (
                  <tr key={product.id} className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40">
                    <td className="px-4 py-3 text-dark dark:text-white"><p className="font-medium">{product.name}</p><p className="text-xs text-dark-6 dark:text-dark-6">{product.description ?? "Sin descripción"}</p></td>
                    <td className="px-4 py-3 text-dark dark:text-white">{product.currency} {product.price}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{categories.find((c) => c.id === product.category_id)?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{product.status}</td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => startEdit(product)} className="rounded-lg border border-stroke px-3 py-1.5 text-xs text-dark dark:border-dark-3 dark:text-white">Editar</button><button type="button" onClick={() => toggleStatus(product)} className="rounded-lg border border-stroke px-3 py-1.5 text-xs text-dark dark:border-dark-3 dark:text-white">{product.status === "ACTIVE" ? "Desactivar" : "Activar"}</button><button type="button" onClick={() => handleDelete(product.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 dark:border-red-900/40 dark:text-red-300">Eliminar</button></div>
                      ) : (
                        <span className="text-xs text-dark-6 dark:text-dark-6">Solo lectura</span>
                      )}
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay productos todavía.</td></tr>}
              </tbody>
            </table>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
