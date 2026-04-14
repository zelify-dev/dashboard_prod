"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getStoredRoles } from "@/lib/auth-api";
import { canManageMerchantActor } from "@/lib/dashboard-routing";
import { useMerchantId } from "@/hooks/use-merchant-id";
import { SimpleSelect } from "@/components/FormElements/simple-select";
import { useLanguage } from "@/contexts/language-context";
import {
  deactivateDiscountMerchant,
  getDiscountMerchant,
  updateDiscountMerchant,
  uploadMerchantLogo,
  type DiscountMerchant,
} from "@/lib/discounts-api";

const LABELS = {
  es: {
    breadcrumb: "Comercio / Perfil",
    infoGeneral: "Información General",
    nombre: "Nombre del Comercio",
    tipo: "Tipo de Negocio",
    descripcion: "Descripción",
    guardar: "Guardar cambios",
    guardando: "Guardando...",
    desactivar: "Desactivar comercio",
    identidadSistema: "Identidad del Sistema",
    loading: "Cargando perfil...",
    noMerchant: "No se pudo resolver el perfil del comercio actual.",
    msgExito: "Información general actualizada correctamente.",
    msgExitoLogo: "Logo actualizado correctamente.",
    msgErrorLogo: "Error al subir el logo.",
    msgErrorTalla: "La imagen es demasiado pesada (máximo 5MB).",
    msgErrorCarga: "No se pudo cargar el merchant.",
    msgErrorUpdate: "No se pudo actualizar el merchant.",
    msgErrorDeactivate: "No se pudo desactivar el merchant.",
    confirmDeactivate: "¿Seguro que quieres desactivar este merchant?",
    viewOnly: "Estás viendo el perfil en modo consulta. Para editar, necesitas permisos de Administrador de Comercio.",
    country: "País de origen",
    slug: "Slug para URL",
    placeholderSelect: "Selecciona el tipo...",
    merchant: "Comercio"
  },
  en: {
    breadcrumb: "Merchant / Profile",
    infoGeneral: "General Information",
    nombre: "Merchant Name",
    tipo: "Business Type",
    descripcion: "Description",
    guardar: "Save changes",
    guardando: "Saving...",
    desactivar: "Deactivate merchant",
    identidadSistema: "System Identity",
    loading: "Loading profile...",
    noMerchant: "Could not resolve the current merchant profile.",
    msgExito: "General information updated successfully.",
    msgExitoLogo: "Logo updated successfully.",
    msgErrorLogo: "Error uploading logo.",
    msgErrorTalla: "The image is too large (max 5MB).",
    msgErrorCarga: "Failed to load merchant.",
    msgErrorUpdate: "Failed to update merchant.",
    msgErrorDeactivate: "Failed to deactivate merchant.",
    confirmDeactivate: "Are you sure you want to deactivate this merchant?",
    viewOnly: "You are viewing the profile in read-only mode. To edit, you need Merchant Administrator permissions.",
    country: "Country of origin",
    slug: "Slug for URL",
    placeholderSelect: "Select type...",
    merchant: "Merchant"
  }
};

const getMerchantTypes = (lang: "en" | "es") => [
  { value: "RESTAURANT", label: lang === "es" ? "RESTAURANT (Comida, Bebida, Cafeterías)" : "RESTAURANT (Food, Beverage, Coffee)" },
  { value: "RETAIL", label: lang === "es" ? "RETAIL (Ropa, Calzado, Electrónica, Hogar)" : "RETAIL (Clothing, Footwear, Electronics, Home)" },
  { value: "GROCERY", label: lang === "es" ? "GROCERY (Supermercados, Minimarkets, Licorerías)" : "GROCERY (Supermarkets, Minimarts, Liquor Stores)" },
  { value: "HEALTH", label: lang === "es" ? "HEALTH (Farmacias, Clínicas, Bienestar)" : "HEALTH (Pharmacies, Clinics, Wellness)" },
  { value: "ENTERTAINMENT", label: lang === "es" ? "ENTERTAINMENT (Cine, Parques, Eventos)" : "ENTERTAINMENT (Cinema, Parks, Events)" },
  { value: "SERVICES", label: lang === "es" ? "SERVICES (Peluquerías, Lavanderías, Educación)" : "SERVICES (Hairdressers, Laundry, Education)" },
  { value: "GAS_STATION", label: lang === "es" ? "GAS_STATION (Combustible y Tiendas)" : "GAS_STATION (Fuel and Stores)" },
];

export default function MerchantProfilePage() {
  const { language } = useLanguage();
  const t = LABELS[language];
  const merchantTypes = useMemo(() => getMerchantTypes(language), [language]);

  const { merchantId, loading: resolving, error: resolveError } = useMerchantId();
  const canManage = canManageMerchantActor(getStoredRoles());
  const [merchant, setMerchant] = useState<DiscountMerchant | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    logo_url: "",
    merchant_type: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const run = async () => {
      if (!merchantId) return;
      setLoading(true);
      setError("");
      try {
        const data = await getDiscountMerchant(merchantId);
        setMerchant(data);
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          logo_url: data.logo_url ?? "",
          merchant_type: (data as DiscountMerchant & { merchant_type?: string | null }).merchant_type ?? "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t.msgErrorCarga);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [merchantId, t.msgErrorCarga]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!merchantId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateDiscountMerchant(merchantId, {
        name: form.name,
        description: form.description || undefined,
        merchant_type: form.merchant_type || null,
      });
      setMerchant(updated);
      setMessage(t.msgExito);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.msgErrorUpdate);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !merchantId) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t.msgErrorTalla);
      return;
    }

    setUploadingLogo(true);
    setError("");
    setMessage("");
    try {
      const result = await uploadMerchantLogo(merchantId, file);
      if (result.logo_url) {
        setMerchant(prev => prev ? { ...prev, logo_url: result.logo_url } : null);
        setForm(prev => ({ ...prev, logo_url: result.logo_url! }));
        setMessage(t.msgExitoLogo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.msgErrorLogo);
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeactivate = async () => {
    if (!merchantId) return;
    const confirmed = window.confirm(t.confirmDeactivate);
    if (!confirmed) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await deactivateDiscountMerchant(merchantId);
      setMerchant(updated);
      setMessage(t.msgExito);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.msgErrorDeactivate);
    } finally {
      setSaving(false);
    }
  };

  const statusColor = merchant?.status === "ACTIVE" 
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1000px] space-y-6">
        <Breadcrumb pageName={t.breadcrumb} />

        {resolving || loading ? (
          <div className="flex justify-center py-20">
             <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : resolveError || error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {resolveError || error}
          </div>
        ) : merchant ? (
          <div className="grid gap-6">
            {/* Header / Hero Section */}
            <div className="relative overflow-hidden rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-end">
                <div 
                  className={`relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-3xl border-2 border-primary/10 bg-gray-1 dark:border-primary/20 ${canManage ? "cursor-pointer group" : ""}`}
                  onClick={() => canManage && fileInputRef.current?.click()}
                >
                  {form.logo_url ? (
                    <img 
                      src={form.logo_url} 
                      alt={merchant.name} 
                      className={`h-full w-full object-cover transition duration-300 ${uploadingLogo ? "opacity-30" : "group-hover:opacity-75"}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/logo/logo-icon.svg";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-dark-6">
                      {merchant.name?.[0]}
                    </div>
                  )}

                  {canManage && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
                      <div className="rounded-full bg-white/80 p-2 shadow-sm dark:bg-dark-2/80">
                        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {uploadingLogo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-dark-2/40">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  )}

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleLogoUpload} 
                    hidden 
                    accept="image/*" 
                  />
                </div>
                <div className="flex-grow text-center md:text-left">
                  <div className="mb-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <h1 className="text-2xl font-bold text-dark dark:text-white">
                      {merchant.name}
                    </h1>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                      {merchant.status}
                    </span>
                  </div>
                  <p className="text-sm text-dark-6">
                    {(merchant as any).merchant_type || t.merchant} · {merchant.country_code}
                  </p>
                </div>
                {canManage && (
                  <button
                    onClick={handleDeactivate}
                    disabled={saving || merchant.status === "INACTIVE"}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
                  >
                    {t.desactivar}
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Main Form Section */}
              <div className="md:col-span-2">
                <ShowcaseSection title={t.infoGeneral} className="h-full !p-6">
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">{t.nombre}</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          disabled={!canManage}
                          className="w-full rounded-xl border border-stroke bg-gray-1/30 px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-3/30 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">{t.tipo}</label>
                        {canManage ? (
                          <SimpleSelect
                            options={merchantTypes}
                            value={form.merchant_type}
                            onChange={(val) => setForm((prev) => ({ ...prev, merchant_type: val }))}
                            placeholder={t.placeholderSelect}
                            className="text-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={form.merchant_type}
                            disabled
                            className="w-full rounded-xl border border-stroke bg-gray-1/30 px-4 py-3 text-sm dark:border-dark-3 dark:bg-dark-3/30 dark:text-white"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">{t.descripcion}</label>
                      <textarea
                        rows={4}
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        disabled={!canManage}
                        className="w-full rounded-xl border border-stroke bg-gray-1/30 px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-3/30 dark:text-white"
                      />
                    </div>

                    {message ? <p className="text-sm font-medium text-green-600">{message}</p> : null}
                    
                    {canManage && (
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-70 sm:w-auto sm:px-10"
                        >
                          {saving ? t.guardando : t.guardar}
                        </button>
                      </div>
                    )}
                  </form>
                </ShowcaseSection>
              </div>

              {/* Sidebar: Metadata & Technical Info */}
              <div className="space-y-6">
                <ShowcaseSection title={t.identidadSistema} className="!p-6">
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-dark-6">Merchant ID</p>
                      <div className="group mt-1 flex items-center justify-between rounded-lg bg-gray-2 px-3 py-2 dark:bg-dark-3">
                        <p className="truncate text-xs font-mono text-dark dark:text-white">{merchant.id}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-dark-6">Organization ID</p>
                      <div className="mt-1 flex items-center justify-between rounded-lg bg-gray-2 px-3 py-2 dark:bg-dark-3">
                        <p className="truncate text-xs font-mono text-dark dark:text-white">
                          {(merchant as any).organization_id || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-dark-6">{t.slug}</p>
                      <p className="mt-1 text-sm font-semibold text-primary">{merchant.slug || "—"}</p>
                    </div>
                    <div className="border-t border-stroke pt-4 dark:border-dark-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-dark-6">{t.country}</span>
                        <span className="rounded-md bg-dark-2 px-2 py-1 text-[10px] font-bold text-white">{merchant.country_code}</span>
                      </div>
                    </div>
                  </div>
                </ShowcaseSection>

                {!canManage && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs leading-relaxed text-primary">
                      {t.viewOnly}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-stroke bg-white p-20 text-center dark:border-dark-3 dark:bg-dark-2">
            <p className="text-dark-6">{t.noMerchant}</p>
          </div>
        )}
      </div>
    </ActorRouteGuard>
  );
}
