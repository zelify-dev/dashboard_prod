"use client";

import { useEffect, useState, useMemo } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredRoles } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import { useMerchantId } from "@/hooks/use-merchant-id";
import { useLanguage } from "@/contexts/language-context";
import {
  createMerchantBranch,
  deactivateMerchantBranch,
  listMerchantBranches,
  updateMerchantBranch,
  updateMerchantBranchGeolocation,
  type MerchantBranch,
} from "@/lib/discounts-api";

const LABELS = {
  es: {
    breadcrumb: "Comercio / Sucursales",
    heroTitle: "Gestión de Sucursales",
    heroSubtitle: "Administra los puntos de venta y su geolocalización.",
    totalBranches: "Sucursales totales",
    btnNew: "Nueva Sucursal",
    btnCancel: "Cancelar edición",
    btnSave: "Guardar sucursal",
    btnCreate: "Crear sucursal",
    btnEdit: "Editar",
    btnDeactivate: "Desactivar",
    tableBranch: "Sucursal",
    tableCity: "Ciudad",
    tableAddress: "Dirección",
    tableStatus: "Estado",
    tableActions: "Acciones",
    filterCity: "Filtrar por ciudad",
    filterStatus: "Todos los estados",
    statusActive: "ACTIVO",
    statusInactive: "INACTIVO",
    loading: "Cargando sucursales...",
    noBranches: "No hay sucursales todavía.",
    errorNoMerchant: "No tienes un comercio asignado. Contacta a soporte.",
    msgCreated: "Sucursal creada correctamente.",
    msgUpdated: "Sucursal actualizada correctamente.",
    msgDeactivated: "Sucursal desactivada correctamente.",
    confirmDeactivate: "¿Estás seguro de que deseas desactivar esta sucursal?",
    formName: "Nombre de la sucursal",
    formCity: "Ciudad",
    formAddress: "Dirección",
    formLat: "Latitud",
    formLng: "Longitud",
    viewOnly: "Este rol puede revisar sucursales, pero no crear ni editar la estructura.",
    saving: "Guardando...",
    metadataId: "ID Técnico"
  },
  en: {
    breadcrumb: "Merchant / Branches",
    heroTitle: "Branch Management",
    heroSubtitle: "Manage point of sale and geolocations.",
    totalBranches: "Total branches",
    btnNew: "New Branch",
    btnCancel: "Cancel edit",
    btnSave: "Save branch",
    btnCreate: "Create branch",
    btnEdit: "Edit",
    btnDeactivate: "Deactivate",
    tableBranch: "Branch",
    tableCity: "City",
    tableAddress: "Address",
    tableStatus: "Status",
    tableActions: "Actions",
    filterCity: "Filter by city",
    filterStatus: "All statuses",
    statusActive: "ACTIVE",
    statusInactive: "INACTIVE",
    loading: "Loading branches...",
    noBranches: "No branches yet.",
    errorNoMerchant: "No merchant assigned. Contact support.",
    msgCreated: "Branch created successfully.",
    msgUpdated: "Branch updated successfully.",
    msgDeactivated: "Branch deactivated successfully.",
    confirmDeactivate: "Are you sure you want to deactivate this branch?",
    formName: "Branch Name",
    formCity: "City",
    formAddress: "Address",
    formLat: "Latitude",
    formLng: "Longitude",
    viewOnly: "This role can view branches but cannot create or edit the structure.",
    saving: "Saving...",
    metadataId: "Technical ID"
  }
};

export default function MerchantBranchesPage() {
  const { language } = useLanguage();
  const t = LABELS[language];

  const { merchantId, loading: resolving, error: resolveError } = useMerchantId();
  const canManage = canManageMerchantActor(getStoredRoles());
  
  const [branches, setBranches] = useState<MerchantBranch[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    city: "",
    address: "",
    lat: "",
    lng: "",
    name: "",
    status: "ACTIVE",
  });

  const loadBranches = async () => {
    if (!merchantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await listMerchantBranches(merchantId, { 
        city: cityFilter || undefined, 
        status: statusFilter || undefined 
      });
      setBranches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBranches();
  }, [merchantId, cityFilter, statusFilter]);

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm({ city: "", address: "", lat: "", lng: "", name: "", status: "ACTIVE" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!merchantId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        city: form.city,
        address: form.address,
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
        name: form.name,
      };
      
      const branch = editingId
        ? await updateMerchantBranch(merchantId, editingId, { ...payload, status: form.status })
        : await createMerchantBranch(merchantId, payload);

      if (editingId) {
        setBranches((current) => current.map((item) => (item.id === branch.id ? { ...item, ...branch } : item)));
        if (form.lat && form.lng) {
          try {
             const geolocated = await updateMerchantBranchGeolocation(merchantId, editingId, {
              address: form.address,
              lat: Number(form.lat),
              lng: Number(form.lng),
            });
            setBranches((current) => current.map((item) => (item.id === geolocated.id ? { ...item, ...geolocated } : item)));
          } catch (e) {
            console.warn("Geolocation update failed", e);
          }
        }
        setMessage(t.msgUpdated);
      } else {
        setBranches((current) => [branch, ...current]);
        setMessage(t.msgCreated);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (branch: MerchantBranch) => {
    setEditingId(branch.id);
    setShowForm(true);
    setForm({
      city: branch.city ?? "",
      address: branch.address ?? "",
      lat: branch.lat != null ? String(branch.lat) : "",
      lng: branch.lng != null ? String(branch.lng) : "",
      name: branch.name ?? "",
      status: branch.status ?? "ACTIVE",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeactivate = async (branchId: string) => {
    if (!merchantId) return;
    const confirmed = window.confirm(t.confirmDeactivate);
    if (!confirmed) return;
    try {
      const updated = await deactivateMerchantBranch(merchantId, branchId);
      setBranches((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setMessage(t.msgDeactivated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deactivation failed");
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-dark-6">{t.totalBranches}</p>
                <p className="text-xl font-bold text-primary">{branches.length}</p>
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
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formCity}</label>
                <input required value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" />
              </div>
              <div className="md:col-span-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formAddress}</label>
                <input required value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formLat}</label>
                <input type="number" step="any" value={form.lat} onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formLng}</label>
                <input type="number" step="any" value={form.lng} onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.tableStatus}</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-3">
                  <option value="ACTIVE">{t.statusActive}</option>
                  <option value="INACTIVE">{t.statusInactive}</option>
                </select>
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

        <ShowcaseSection title={(t.breadcrumb as string).split("/").pop()?.trim() || "Branches"} className="!p-6">
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex-grow max-w-sm">
               <input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder={t.filterCity} className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2">
              <option value="">{t.filterStatus}</option>
              <option value="ACTIVE">{t.statusActive}</option>
              <option value="INACTIVE">{t.statusInactive}</option>
            </select>
          </div>

          {resolveError || error ? (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 dark:bg-red-950/20">{resolveError || error}</div>
          ) : message ? (
            <div className="mb-4 rounded-xl bg-green-50 p-4 text-xs font-semibold text-green-600 dark:bg-green-950/20">{message}</div>
          ) : null}

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-5 border-b border-stroke pb-3 text-xs font-bold uppercase tracking-widest text-dark-6 dark:border-dark-3">
                <div className="px-4">{t.tableBranch}</div>
                <div className="px-4">{t.tableCity}</div>
                <div className="px-4">{t.tableAddress}</div>
                <div className="px-4">{t.tableStatus}</div>
                <div className="px-4 text-right">{t.tableActions}</div>
              </div>
              
              <div className="divide-y divide-stroke dark:divide-dark-3">
                {resolving || loading ? (
                  <div className="py-20 text-center text-dark-6">{t.loading}</div>
                ) : branches.length > 0 ? branches.map((branch) => {
                  const isActive = branch.status === "ACTIVE";
                  return (
                    <div key={branch.id} className="grid grid-cols-5 items-center py-4 text-sm transition hover:bg-gray-1/30 dark:hover:bg-dark-3/10">
                      <div className="px-4">
                        <p className="font-bold text-dark dark:text-white">{branch.name}</p>
                        <p className="mt-1 text-[10px] font-mono text-dark-6 opacity-60">ID: {branch.id}</p>
                      </div>
                      <div className="px-4 text-dark-6">{branch.city}</div>
                      <div className="px-4 text-dark-6 line-clamp-1" title={branch.address}>{branch.address}</div>
                      <div className="px-4">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-red-100 text-red-700 dark:bg-red-900/30"}`}>
                           {isActive ? t.statusActive : t.statusInactive}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 px-4">
                        {canManage ? (
                          <>
                            <button onClick={() => startEdit(branch)} className="rounded-lg border border-stroke p-2 text-dark-6 transition hover:border-primary hover:text-primary dark:border-dark-3">
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDeactivate(branch.id)} className="rounded-lg border border-red-200 p-2 text-red-400 transition hover:bg-red-50 dark:border-red-900/40">
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
                  <div className="py-20 text-center text-dark-6">{t.noBranches}</div>
                )}
              </div>
            </div>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
