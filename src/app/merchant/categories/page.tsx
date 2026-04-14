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
  createMerchantCategory,
  listMerchantCategories,
  updateMerchantCategory,
  type MerchantCategory,
} from "@/lib/discounts-api";

const LABELS = {
  es: {
    breadcrumb: "Comercio / Categorías",
    heroTitle: "Categorías de Productos",
    heroSubtitle: "Organiza tus productos en grupos para facilitar la navegación de tus clientes.",
    totalCategories: "Categorías totales",
    btnNew: "Nueva Categoría",
    btnCancel: "Cancelar",
    btnSave: "Guardar categoría",
    btnCreate: "Crear categoría",
    btnEdit: "Editar",
    tableCategory: "Categoría",
    tableSlug: "Slug",
    tableOrder: "Orden",
    tableStatus: "Estado",
    tableActions: "Acciones",
    statusActive: "ACTIVO",
    statusInactive: "INACTIVE",
    loading: "Cargando categorías...",
    noCategories: "No hay categorías todavía.",
    msgCreated: "Categoría creada correctamente.",
    msgUpdated: "Categoría actualizada correctamente.",
    formName: "Nombre de la categoría",
    formSlug: "Slug (Identificador único)",
    formOrder: "Orden de visualización",
    viewOnly: "Este rol puede revisar categorías, pero no administrarlas.",
    saving: "Guardando...",
  },
  en: {
    breadcrumb: "Merchant / Categories",
    heroTitle: "Product Categories",
    heroSubtitle: "Organize your products into groups to make navigation easier for your customers.",
    totalCategories: "Total categories",
    btnNew: "New Category",
    btnCancel: "Cancel",
    btnSave: "Save category",
    btnCreate: "Create category",
    btnEdit: "Edit",
    tableCategory: "Category",
    tableSlug: "Slug",
    tableOrder: "Order",
    tableStatus: "Status",
    tableActions: "Actions",
    statusActive: "ACTIVE",
    statusInactive: "INACTIVE",
    loading: "Loading categories...",
    noCategories: "No categories yet.",
    msgCreated: "Category created successfully.",
    msgUpdated: "Category updated successfully.",
    formName: "Category Name",
    formSlug: "Slug (Unique identifier)",
    formOrder: "Sort Order",
    viewOnly: "This role can view categories but cannot manage them.",
    saving: "Saving...",
  }
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

export default function MerchantCategoriesPage() {
  const { language } = useLanguage();
  const t = LABELS[language];

  const { merchantId, loading: resolving, error: resolveError } = useMerchantId();
  const canManage = canManageMerchantActor(getStoredRoles());
  
  const [categories, setCategories] = useState<MerchantCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", sort_order: "0", status: "ACTIVE" });

  const loadCategories = async () => {
    if (!merchantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setCategories(await listMerchantCategories(merchantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, [merchantId]);

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm({ name: "", slug: "", sort_order: "0", status: "ACTIVE" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!merchantId) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = { 
        name: form.name, 
        slug: form.slug, 
        sort_order: Number(form.sort_order) || 0 
      };
      
      const category = editingId
        ? await updateMerchantCategory(merchantId, editingId, { ...payload, status: form.status })
        : await createMerchantCategory(merchantId, payload);
        
      if (editingId) {
        setCategories((current) => current.map((item) => (item.id === category.id ? { ...item, ...category } : item)));
        setMessage(t.msgUpdated);
      } else {
        setCategories((current) => [category, ...current]);
        setMessage(t.msgCreated);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category: MerchantCategory) => {
    setEditingId(category.id);
    setShowForm(true);
    setForm({
      name: category.name,
      slug: category.slug,
      sort_order: String(category.sort_order ?? 0),
      status: category.status,
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1000px] space-y-6">
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-dark-6">{t.totalCategories}</p>
                <p className="text-xl font-bold text-primary">{categories.length}</p>
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
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formName}</label>
                <input 
                  required 
                  value={form.name} 
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: p.slug === slugify(p.name) ? slugify(e.target.value) : p.slug }))} 
                  className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" 
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formSlug}</label>
                <input 
                  required 
                  value={form.slug} 
                  onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} 
                  className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" 
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formOrder}</label>
                <input 
                  type="number" 
                  value={form.sort_order} 
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} 
                  className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" 
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.tableStatus}</label>
                <select 
                  value={form.status} 
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} 
                  className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-3"
                >
                  <option value="ACTIVE">{t.statusActive}</option>
                  <option value="INACTIVE">{t.statusInactive}</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-stroke dark:border-dark-3">
                <button type="button" onClick={resetForm} className="rounded-xl border border-stroke px-6 py-3 text-sm font-semibold hover:bg-gray-1 dark:border-dark-3">{t.btnCancel}</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-70">
                   {saving ? t.saving : editingId ? t.btnSave : t.btnCreate}
                </button>
              </div>
            </form>
          </ShowcaseSection>
        )}

        <ShowcaseSection title={(t.breadcrumb as string).split("/").pop()?.trim() || "Categories"} className="!p-6">
          {message && (
             <div className="mb-4 rounded-xl bg-green-50 p-4 text-xs font-semibold text-green-600 dark:bg-green-950/20">{message}</div>
          )}
          {resolveError || error ? (
             <div className="mb-4 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 dark:bg-red-950/20">{resolveError || error}</div>
          ) : null}

          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-5 border-b border-stroke pb-3 text-xs font-bold uppercase tracking-widest text-dark-6 dark:border-dark-3">
                <div className="col-span-2 px-4">{t.tableCategory}</div>
                <div className="px-4 text-center">{t.tableOrder}</div>
                <div className="px-4">{t.tableStatus}</div>
                <div className="px-4 text-right">{t.tableActions}</div>
              </div>
              
              <div className="divide-y divide-stroke dark:divide-dark-3">
                {resolving || loading ? (
                  <div className="py-20 text-center text-dark-6">{t.loading}</div>
                ) : categories.length > 0 ? categories.map((category) => {
                  const isActive = category.status === "ACTIVE";
                  return (
                    <div key={category.id} className="grid grid-cols-5 items-center py-4 text-sm transition hover:bg-gray-1/30 dark:hover:bg-dark-3/10">
                      <div className="col-span-2 px-4">
                        <p className="font-bold text-dark dark:text-white">{category.name}</p>
                        <p className="mt-1 text-[10px] font-mono text-dark-6 opacity-60">slug: {category.slug}</p>
                      </div>
                      <div className="px-4 text-center text-dark-6 font-mono bg-gray-2/50 dark:bg-dark-3/50 rounded-lg py-1 mx-auto min-w-[30px]">
                        {category.sort_order ?? 0}
                      </div>
                      <div className="px-4">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-red-100 text-red-700 dark:bg-red-900/30"}`}>
                           {isActive ? t.statusActive : t.statusInactive}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 px-4">
                        {canManage ? (
                          <button onClick={() => startEdit(category)} className="rounded-lg border border-stroke p-2 text-dark-6 transition hover:border-primary hover:text-primary dark:border-dark-3">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-dark-6 opacity-30">View Only</span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-20 text-center text-dark-6">{t.noCategories}</div>
                )}
              </div>
            </div>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
