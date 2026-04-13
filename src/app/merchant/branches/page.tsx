"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import {
  createMerchantBranch,
  deactivateMerchantBranch,
  listMerchantBranches,
  updateMerchantBranch,
  updateMerchantBranchGeolocation,
  type MerchantBranch,
} from "@/lib/discounts-api";

export default function MerchantBranchesPage() {
  const merchantId = getStoredUser()?.merchant_id ?? "";
  const canManage = canManageMerchantActor(getStoredRoles());
  const [branches, setBranches] = useState<MerchantBranch[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    city: "",
    address: "",
    lat: "",
    lng: "",
    name: "",
    status: "ACTIVE",
  });

  const loadBranches = async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      setBranches(await listMerchantBranches(merchantId, { city: cityFilter || undefined, status: statusFilter || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las sucursales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBranches();
  }, [merchantId, cityFilter, statusFilter]);

  const resetForm = () => {
    setEditingId(null);
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
          const geolocated = await updateMerchantBranchGeolocation(merchantId, editingId, {
            address: form.address,
            lat: Number(form.lat),
            lng: Number(form.lng),
          });
          setBranches((current) => current.map((item) => (item.id === geolocated.id ? { ...item, ...geolocated } : item)));
        }
        setMessage("Sucursal actualizada correctamente.");
      } else {
        setBranches((current) => [branch, ...current]);
        setMessage("Sucursal creada correctamente.");
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la sucursal.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (branch: MerchantBranch) => {
    setEditingId(branch.id);
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
  };

  const handleDeactivate = async (branchId: string) => {
    if (!merchantId) return;
    const confirmed = window.confirm("¿Desactivar esta sucursal?");
    if (!confirmed) return;
    try {
      const updated = await deactivateMerchantBranch(merchantId, branchId);
      setBranches((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setMessage("Sucursal desactivada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar la sucursal.");
    }
  };

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <Breadcrumb pageName="Merchant / Branches" />

        <ShowcaseSection title="Branches" className="!p-6">
          {canManage ? (
          <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl border border-stroke p-4 dark:border-dark-3 lg:grid-cols-3">
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre de sucursal" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Ciudad" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Dirección" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <input value={form.lat} onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))} placeholder="Latitud" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <input value={form.lng} onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))} placeholder="Longitud" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <div className="lg:col-span-3 flex flex-wrap justify-end gap-3">
              {editingId ? <button type="button" onClick={resetForm} className="rounded-lg border border-stroke px-4 py-2 text-sm text-dark hover:bg-gray-50 dark:border-dark-3 dark:text-white">Cancelar edición</button> : null}
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70">{saving ? "Guardando..." : editingId ? "Guardar sucursal" : "Crear sucursal"}</button>
            </div>
          </form>
          ) : (
            <div className="mb-6 rounded-xl border border-stroke bg-gray-1/60 p-4 text-sm text-dark-6 dark:border-dark-3 dark:bg-dark-3/30 dark:text-dark-6">
              Este rol puede revisar sucursales y su estado, pero no crear ni editar estructura del merchant.
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-3">
            <input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="Filtrar por ciudad" className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white">
              <option value="">Todos los estados</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {message ? <p className="mb-3 text-sm text-green-700 dark:text-green-400">{message}</p> : null}
          {error ? <p className="mb-3 text-sm text-red-700 dark:text-red-400">{error}</p> : null}

          <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80">
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Branch</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Ciudad</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Dirección</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando sucursales...</td></tr>
                ) : branches.length > 0 ? branches.map((branch) => (
                  <tr key={branch.id} className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40">
                    <td className="px-4 py-3 text-dark dark:text-white"><p className="font-medium">{branch.name}</p><p className="text-xs text-dark-6 dark:text-dark-6">{branch.id}</p></td>
                    <td className="px-4 py-3 text-dark dark:text-white">{branch.city}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{branch.address}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">{branch.status}</td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <div className="flex gap-2"><button type="button" onClick={() => startEdit(branch)} className="rounded-lg border border-stroke px-3 py-1.5 text-xs text-dark dark:border-dark-3 dark:text-white">Editar</button><button type="button" onClick={() => handleDeactivate(branch.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 dark:border-red-900/40 dark:text-red-300">Desactivar</button></div>
                      ) : (
                        <span className="text-xs text-dark-6 dark:text-dark-6">Solo lectura</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay sucursales todavía.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </ShowcaseSection>
      </div>
    </ActorRouteGuard>
  );
}
