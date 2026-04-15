"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredRoles } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import { useMerchantId } from "@/hooks/use-merchant-id";
import { useLanguage } from "@/contexts/language-context";
import {
  COMMERCE_MAX_MONETARY_AMOUNT,
  COMMERCE_MAX_PRODUCT_DESCRIPTION_LENGTH,
} from "@/lib/commerce-input-limits";
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

const LABELS = {
  es: {
    breadcrumb: "Comercio / Productos",
    heroTitle: "Catálogo de Productos",
    heroSubtitle: "Gestiona los artículos de tu comercio, sus precios y categorías vinculadas.",
    totalProducts: "Productos totales",
    btnNew: "Nuevo Producto",
    btnCancel: "Cancelar",
    btnSave: "Guardar producto",
    btnCreate: "Crear producto",
    btnEdit: "Editar",
    btnDelete: "Eliminar",
    btnActivate: "Activar",
    btnDeactivate: "Desactivar",
    tableProduct: "Producto",
    tablePrice: "Precio",
    tableCategory: "Categoría",
    tableStatus: "Estado",
    tableActions: "Acciones",
    filterCategory: "Todas las categorías",
    statusActive: "ACTIVO",
    statusInactive: "INACTIVO",
    loading: "Cargando productos...",
    noProducts: "No hay productos todavía.",
    noCategory: "Sin categoría",
    msgCreated: "Producto creado correctamente.",
    msgUpdated: "Producto actualizado correctamente.",
    msgDeleted: "Producto eliminado correctamente.",
    msgActivated: "Producto activado.",
    msgDeactivated: "Producto desactivado.",
    confirmDelete: "¿Estás seguro de que deseas eliminar este producto?",
    formName: "Nombre del producto",
    formPrice: "Precio (Float)",
    formCurrency: "Moneda (ISO)",
    formCategory: "Categoría",
    formImage: "URL de la imagen",
    formOrder: "Orden",
    formDescription: "Descripción corta",
    viewOnly: "Este rol puede revisar productos, pero no modificar el catálogo.",
    saving: "Guardando...",
    validationPricePositive: "El precio debe ser mayor que 0 para poder vender el producto.",
    validationPriceTooHigh: `El precio no puede superar ${COMMERCE_MAX_MONETARY_AMOUNT.toLocaleString("es-EC")}.`,
    validationDescriptionTooLong: `La descripción admite como máximo ${COMMERCE_MAX_PRODUCT_DESCRIPTION_LENGTH} caracteres.`,
  },
  en: {
    breadcrumb: "Merchant / Products",
    heroTitle: "Product Catalog",
    heroSubtitle: "Manage your merchant items, prices, and linked categories.",
    totalProducts: "Total products",
    btnNew: "New Product",
    btnCancel: "Cancel",
    btnSave: "Save product",
    btnCreate: "Create product",
    btnEdit: "Edit",
    btnDelete: "Delete",
    btnActivate: "Activate",
    btnDeactivate: "Deactivate",
    tableProduct: "Product",
    tablePrice: "Price",
    tableCategory: "Category",
    tableStatus: "Status",
    tableActions: "Actions",
    filterCategory: "All categories",
    statusActive: "ACTIVE",
    statusInactive: "INACTIVE",
    loading: "Loading products...",
    noProducts: "No products yet.",
    noCategory: "No category",
    msgCreated: "Product created successfully.",
    msgUpdated: "Product updated successfully.",
    msgDeleted: "Product deleted successfully.",
    msgActivated: "Product activated.",
    msgDeactivated: "Product deactivated.",
    confirmDelete: "Are you sure you want to delete this product?",
    formName: "Product Name",
    formPrice: "Price (Float)",
    formCurrency: "Currency (ISO)",
    formCategory: "Category",
    formImage: "Image URL",
    formOrder: "Sort Order",
    formDescription: "Short description",
    viewOnly: "This role can view products but cannot modify the catalog.",
    saving: "Saving...",
    validationPricePositive: "Price must be greater than 0 to sell the product.",
    validationPriceTooHigh: `Price cannot exceed ${COMMERCE_MAX_MONETARY_AMOUNT.toLocaleString("en-US")}.`,
    validationDescriptionTooLong: `Description may be at most ${COMMERCE_MAX_PRODUCT_DESCRIPTION_LENGTH} characters.`,
  }
};

export default function MerchantProductsPage() {
  const { language } = useLanguage();
  const t = LABELS[language];

  const { merchantId, loading: resolving, error: resolveError } = useMerchantId();
  const canManage = canManageMerchantActor(getStoredRoles());
  
  const [categories, setCategories] = useState<MerchantCategory[]>([]);
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

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
    if (!merchantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [nextCategories, nextProducts] = await Promise.all([
        listMerchantCategories(merchantId),
        listMerchantProducts(merchantId, { category_id: categoryFilter || undefined }),
      ]);
      setCategories(nextCategories);
      setProducts(nextProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [merchantId, categoryFilter]);

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
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
      const priceNum = parseFloat(String(form.price).replace(",", "."));
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        setError(t.validationPricePositive);
        setSaving(false);
        return;
      }
      if (priceNum > COMMERCE_MAX_MONETARY_AMOUNT) {
        setError(t.validationPriceTooHigh);
        setSaving(false);
        return;
      }
      if (form.description.length > COMMERCE_MAX_PRODUCT_DESCRIPTION_LENGTH) {
        setError(t.validationDescriptionTooLong);
        setSaving(false);
        return;
      }
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: priceNum,
        currency: form.currency,
        category_id: form.category_id || undefined,
        image_url: form.image_url || undefined,
      };
      const product = editingId
        ? await updateMerchantProduct(merchantId, editingId, { ...payload, sort_order: Number(form.sort_order) || 0, status: form.status })
        : await createMerchantProduct(merchantId, payload);
        
      if (editingId) {
        setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, ...product } : item)));
        setMessage(t.msgUpdated);
      } else {
        setProducts((current) => [product, ...current]);
        setMessage(t.msgCreated);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product: MerchantProduct) => {
    setEditingId(product.id);
    setShowForm(true);
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
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (product: MerchantProduct) => {
    if (!merchantId) return;
    try {
      const updated =
        product.status === "ACTIVE"
          ? await deactivateMerchantProduct(merchantId, product.id)
          : await activateMerchantProduct(merchantId, product.id);
      setProducts((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setMessage(updated.status === "ACTIVE" ? t.msgActivated : t.msgDeactivated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status change failed");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!merchantId) return;
    const confirmed = window.confirm(t.confirmDelete);
    if (!confirmed) return;
    try {
      await deleteMerchantProduct(merchantId, productId);
      setProducts((current) => current.filter((item) => item.id !== productId));
      setMessage(t.msgDeleted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <Breadcrumb pageName={t.breadcrumb as string} />

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-dark dark:text-white">{t.heroTitle}</h1>
              <p className="mt-1 text-sm text-dark-6">{t.heroSubtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden rounded-xl bg-gray-2 px-4 py-2 text-center dark:bg-dark-3 sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-dark-6">{t.totalProducts}</p>
                <p className="text-xl font-bold text-primary">{products.length}</p>
              </div>
              {canManage && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                >
                  {showForm ? t.btnCancel : t.btnNew}
                </button>
              )}
            </div>
          </div>
        </div>

        {canManage && showForm && (
          <ShowcaseSection title={editingId ? t.btnSave : t.btnCreate} className="!p-6">
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formName}</label>
                <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formCategory}</label>
                <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm dark:border-dark-3 dark:bg-dark-3">
                  <option value="">{t.noCategory}</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formPrice}</label>
                <input required type="number" step="any" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formCurrency}</label>
                <input required value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.tableStatus}</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm dark:border-dark-3 dark:bg-dark-3">
                  <option value="ACTIVE">{t.statusActive}</option>
                  <option value="INACTIVE">{t.statusInactive}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formImage}</label>
                <input value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formOrder}</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" />
              </div>
              <div className="md:col-span-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formDescription}</label>
                <textarea
                  value={form.description}
                  maxLength={COMMERCE_MAX_PRODUCT_DESCRIPTION_LENGTH}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      description: e.target.value.slice(0, COMMERCE_MAX_PRODUCT_DESCRIPTION_LENGTH),
                    }))
                  }
                  className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-4 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3"
                  rows={3}
                />
                <p className="mt-1 text-[10px] text-dark-6">
                  {form.description.length}/{COMMERCE_MAX_PRODUCT_DESCRIPTION_LENGTH}
                </p>
              </div>
              <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-stroke dark:border-dark-3">
                <button type="button" onClick={resetForm} className="rounded-xl border border-stroke px-6 py-3 text-sm font-semibold hover:bg-gray-1 dark:border-dark-3">{t.btnCancel}</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-70">
                   {saving ? t.saving : editingId ? t.btnSave : t.btnCreate}
                </button>
              </div>
            </form>
          </ShowcaseSection>
        )}

        <ShowcaseSection title={(t.breadcrumb.split("/").pop() || "Products").trim()} className="!p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
             <div className="flex-grow max-w-xs">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2">
                  <option value="">{t.filterCategory}</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
             </div>
             {message && <div className="text-xs font-bold text-green-600 animate-pulse">{message}</div>}
             {error && <div className="text-xs font-bold text-red-600">{error}</div>}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-6 border-b border-stroke pb-3 text-xs font-bold uppercase tracking-widest text-dark-6 dark:border-dark-3">
                <div className="col-span-2 px-4">{t.tableProduct}</div>
                <div className="px-4 text-center">{t.tablePrice}</div>
                <div className="px-4 text-center">{t.tableCategory}</div>
                <div className="px-4 text-center">{t.tableStatus}</div>
                <div className="px-4 text-right">{t.tableActions}</div>
              </div>
              
              <div className="divide-y divide-stroke dark:divide-dark-3">
                {resolving || loading ? (
                  <div className="py-20 text-center text-dark-6">{t.loading}</div>
                ) : products.length > 0 ? products.map((product) => {
                  const isActive = product.status === "ACTIVE";
                  return (
                    <div key={product.id} className="grid grid-cols-6 items-center py-4 text-sm transition hover:bg-gray-1/30 dark:hover:bg-dark-3/10">
                      <div className="col-span-2 flex items-center gap-4 px-4">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-dark-6">
                               <svg className="h-6 w-6 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-dark dark:text-white">{product.name}</p>
                          <p className="mt-0.5 text-[10px] text-dark-6 line-clamp-1 opacity-70">{product.description || "—"}</p>
                        </div>
                      </div>
                      <div className="px-4 text-center font-bold text-dark dark:text-white">
                        <span className="text-[10px] opacity-60 mr-1">{product.currency}</span>
                        {product.price}
                      </div>
                      <div className="px-4 text-center">
                        <span className="rounded-lg bg-gray-2 px-2 py-1 text-[10px] text-dark-6 dark:bg-dark-3">
                           {categories.find((c) => c.id === product.category_id)?.name || t.noCategory}
                        </span>
                      </div>
                      <div className="px-4 text-center">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-red-100 text-red-700 dark:bg-red-900/30"}`}>
                           {isActive ? t.statusActive : t.statusInactive}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 px-4">
                        {canManage ? (
                          <>
                            <button onClick={() => startEdit(product)} className="rounded-lg border border-stroke p-2 text-dark-6 transition hover:border-primary hover:text-primary dark:border-dark-3">
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => toggleStatus(product)} className={`rounded-lg border p-2 transition ${isActive ? "border-orange-200 text-orange-400 hover:bg-orange-50" : "border-green-200 text-green-400 hover:bg-green-50"}`}>
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="rounded-lg border border-red-200 p-2 text-red-400 transition hover:bg-red-50 dark:border-red-900/40">
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-dark-6 opacity-30">View Only</span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-20 text-center text-dark-6">{t.noProducts}</div>
                )}
              </div>
            </div>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
