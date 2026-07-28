"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { getStoredOrganization, getStoredRoles } from "@/lib/auth-api";
import { getOrganizationBranding, uploadOrganizationLogo, updateOrganizationBranding, AuthError } from "@/lib/auth-api";
import type { OrganizationBranding, BrandingLogoType } from "@/lib/auth-api";
import { isOwner, userHasRole, TEAM_ROLE } from "@/app/organization/teams/_constants/team-roles";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

function isValidHex(value: string): boolean {
  return HEX_REGEX.test(value.trim());
}

function withCacheBust(url: string | null | undefined, version: number): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("v", String(version));
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${version}`;
  }
}

export default function OrganizationBrandingPage() {
  const t = useUiTranslations();
  const router = useRouter();
  const roles = getStoredRoles();
  const canSeeBranding =
    isOwner(roles) ||
    userHasRole(roles, TEAM_ROLE.ORG_ADMIN) ||
    userHasRole(roles, TEAM_ROLE.ZELIFY_TEAM);

  const org = getStoredOrganization();
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [colorA, setColorA] = useState("#000000");
  const [colorB, setColorB] = useState("#000000");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingError, setBrandingError] = useState("");
  const [assetVersion, setAssetVersion] = useState(() => Date.now());

  const fetchBranding = useCallback(async () => {
    if (!org?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await getOrganizationBranding(org.id);
      setBranding(data);
      if (data.color_a) setColorA(data.color_a);
      if (data.color_b) setColorB(data.color_b);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.statusCode === 404) setError("Organización no encontrada.");
        else setError(err.message);
      } else {
        setError("Error al cargar el branding.");
      }
      setBranding(null);
    } finally {
      setLoading(false);
    }
  }, [org?.id]);

  useEffect(() => {
    if (!canSeeBranding) {
      router.replace("/organization/teams");
      return;
    }
    fetchBranding();
  }, [canSeeBranding, fetchBranding, router]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>, type: BrandingLogoType) => {
    const file = e.target.files?.[0];
    if (!file || !org?.id) return;
    e.target.value = "";
    setLogoError("");
    if (file.type !== "image/png") {
      setLogoError("Solo se permiten archivos PNG para los logos de branding.");
      return;
    }
    setLogoUploading(true);
    try {
      const updated = await uploadOrganizationLogo(org.id, file, type);
      setBranding(updated);
      setAssetVersion(Date.now());
      toast.success("Logo actualizado.");
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.statusCode === 401) router.push("/login");
        else if (err.statusCode === 403) setLogoError("No tienes permisos.");
        else if (err.statusCode === 404) setLogoError("Organización no encontrada.");
        else if (err.statusCode === 400) setLogoError(err.message);
        else if (err.statusCode === 500) setLogoError("Error subiendo logo, intenta de nuevo.");
        else setLogoError(err.message);
      } else {
        setLogoError("Error al subir el logo.");
      }
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id) return;
    const a = colorA.trim();
    const b = colorB.trim();
    if (!isValidHex(a) || !isValidHex(b)) {
      setBrandingError("Los colores deben ser en formato hex #RRGGBB.");
      return;
    }
    setBrandingError("");
    setBrandingSaving(true);
    try {
      const updated = await updateOrganizationBranding(org.id, { color_a: a, color_b: b });
      setBranding(updated);
      toast.success("Branding actualizado.");
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.statusCode === 401) router.push("/login");
        else if (err.statusCode === 403) setBrandingError("No tienes permisos.");
        else if (err.statusCode === 400) setBrandingError(err.message);
        else if (err.statusCode === 404) setBrandingError("Organización no encontrada.");
        else setBrandingError(err.message);
      } else {
        setBrandingError("Error al guardar.");
      }
    } finally {
      setBrandingSaving(false);
    }
  };

  if (!canSeeBranding) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No tienes permiso.</p>
      </div>
    );
  }

  const title = t.sidebar?.menuItems?.subItems?.branding ?? "Branding";

  return (
    <div className="mx-auto w-full max-w-[800px]">
      <Breadcrumb pageName={title} />

      {loading ? (
        <p className="text-xs font-light text-dark-6">Cargando…</p>
      ) : error ? (
        <p className="text-xs font-light text-red-600">{error}</p>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 mb-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-normal text-dark border-b border-gray-100 pb-3">
              <svg className="h-4 w-4 text-dark-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Logos e ícono
            </h3>
            <p className="mb-4 text-xs font-light text-dark-6">
              Solo archivos PNG. Cada vista previa usa un fondo oscuro de referencia para que puedas distinguir mejor logos claros, blancos o con transparencia.
            </p>

            {/* Logo principal — solo arriba */}
            <div className="mb-8">
              <p className="mb-1 text-[10px] font-light uppercase tracking-wider text-dark-6">Logo principal</p>
              <p className="mb-3 text-xs font-light leading-5 text-dark-6">
                Acepta PNG. El fondo de vista previa es referencial y ayuda a validar la legibilidad del logo cargado.
              </p>
              <div className="rounded-xl border border-gray-100 p-4 bg-white">
                {branding?.url_log ? (
                  <div className="mb-3 rounded-xl border border-slate-700/60 bg-slate-900 px-4 py-5 shadow-sm">
                    <img
                      src={withCacheBust(branding.url_log, assetVersion)}
                      alt="Logo principal"
                      className="h-20 w-auto max-w-[200px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-3 rounded-xl border border-slate-700/60 bg-slate-900 px-4 py-5 text-xs font-light text-slate-300 shadow-sm">
                    Sin logo
                  </div>
                )}
                <input
                  type="file"
                  accept=".png,image/png"
                  onChange={(e) => handleLogoChange(e, "logo")}
                  disabled={logoUploading}
                  className="block w-full text-xs text-dark-6 file:mr-2 file:rounded-xl file:border file:border-gray-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-light file:text-dark file:hover:bg-gray-50 file:transition-all file:cursor-pointer"
                />
              </div>
            </div>

            {/* Logos fondo claro y oscuro — dos columnas */}
            <p className="mb-3 text-[10px] font-light uppercase tracking-wider text-dark-6">
              Logos para fondos claro y oscuro (formato cuadrado recomendado)
            </p>
            <div className="mb-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="mb-1 text-[10px] font-light uppercase tracking-wider text-dark-6">Logo fondo claro</p>
                <p className="mb-3 text-xs font-light leading-5 text-dark-6">
                  Acepta PNG. La vista previa usa un fondo gris neutro de referencia para comprobar que el archivo se vea con claridad.
                </p>
                {branding?.url_log_light ? (
                  <div className="mb-3 inline-flex rounded-xl border border-slate-300 bg-slate-400/70 px-4 py-5 shadow-sm">
                    <img
                      src={withCacheBust(branding.url_log_light, assetVersion)}
                      alt="Logo light"
                      className="h-20 w-20 object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-3 rounded-xl border border-slate-300 bg-slate-400/70 px-4 py-5 text-xs font-light text-slate-700 shadow-sm">
                    Sin logo
                  </div>
                )}
                <input
                  type="file"
                  accept=".png,image/png"
                  onChange={(e) => handleLogoChange(e, "logoLight")}
                  disabled={logoUploading}
                  className="block w-full text-xs text-dark-6 file:mr-2 file:rounded-xl file:border file:border-gray-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-light file:text-dark file:hover:bg-gray-50 file:transition-all file:cursor-pointer"
                />
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="mb-1 text-[10px] font-light uppercase tracking-wider text-dark-6">Logo fondo oscuro</p>
                <p className="mb-3 text-xs font-light leading-5 text-dark-6">
                  Acepta PNG. El fondo oscuro es referencial y sirve para verificar contraste si el logo es blanco o tiene transparencia.
                </p>
                {branding?.url_log_dark ? (
                  <div className="mb-3 inline-flex rounded-xl border border-slate-700/60 bg-slate-900 px-4 py-5 shadow-sm">
                    <img
                      src={withCacheBust(branding.url_log_dark, assetVersion)}
                      alt="Logo dark"
                      className="h-20 w-20 object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-3 rounded-xl border border-slate-700/60 bg-slate-900 px-4 py-5 text-xs font-light text-slate-300 shadow-sm">
                    Sin logo
                  </div>
                )}
                <input
                  type="file"
                  accept=".png,image/png"
                  onChange={(e) => handleLogoChange(e, "logoDark")}
                  disabled={logoUploading}
                  className="block w-full text-xs text-dark-6 file:mr-2 file:rounded-xl file:border file:border-gray-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-light file:text-dark file:hover:bg-gray-50 file:transition-all file:cursor-pointer"
                />
              </div>
            </div>

            {/* Ícono */}
            <div>
              <p className="mb-1 text-[10px] font-light uppercase tracking-wider text-dark-6">Ícono</p>
              <p className="mb-3 text-xs font-light leading-5 text-dark-6">
                Se usa para las notificaciones push y representación de la app en dispositivos. Acepta PNG.
              </p>
              <div className="rounded-xl border border-gray-100 p-4 bg-white">
                {branding?.url_icon ? (
                  <div className="mb-3 inline-flex rounded-xl border border-slate-700/60 bg-slate-900 px-4 py-5 shadow-sm">
                    <img
                      src={withCacheBust(branding.url_icon, assetVersion)}
                      alt="Icono"
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-3 rounded-xl border border-slate-700/60 bg-slate-900 px-4 py-5 text-xs font-light text-slate-300 shadow-sm">
                    Sin ícono
                  </div>
                )}
                <input
                  type="file"
                  accept=".png,image/png"
                  onChange={(e) => handleLogoChange(e, "icon")}
                  disabled={logoUploading}
                  className="block w-full text-xs text-dark-6 file:mr-2 file:rounded-xl file:border file:border-gray-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-light file:text-dark file:hover:bg-gray-50 file:transition-all file:cursor-pointer"
                />
              </div>
            </div>

            {logoUploading && <p className="mt-4 text-xs font-light text-dark-6">Subiendo…</p>}
            {logoError && <p className="mt-4 text-xs font-light text-red-600">{logoError}</p>}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-normal text-dark border-b border-gray-100 pb-3">
              <svg className="h-4 w-4 text-dark-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.344l2.122-2.122a2 2 0 012.828 0l2.828 2.828a2 2 0 010 2.828l-2.122 2.122M11 7.344L9.879 8.464M14.828 11.172l-1.121 1.121M13.707 12.293l-4.243 4.243a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 010-1.414l4.243-4.243" />
              </svg>
              Colores
            </h3>
            <form onSubmit={handleSaveBranding} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-light uppercase tracking-wider text-dark-6">
                    Color primario
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorA}
                      onChange={(e) => setColorA(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-xl border border-gray-100 bg-transparent"
                    />
                    <input
                      type="text"
                      value={colorA}
                      onChange={(e) => setColorA(e.target.value)}
                      placeholder="#RRGGBB"
                      className="flex-1 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2 font-mono text-xs font-light text-dark focus:outline-none focus:border-gray-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-light uppercase tracking-wider text-dark-6">
                    Color secundario
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorB}
                      onChange={(e) => setColorB(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-xl border border-gray-100 bg-transparent"
                    />
                    <input
                      type="text"
                      value={colorB}
                      onChange={(e) => setColorB(e.target.value)}
                      placeholder="#RRGGBB"
                      className="flex-1 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2 font-mono text-xs font-light text-dark focus:outline-none focus:border-gray-200"
                    />
                  </div>
                </div>
              </div>
              {!isValidHex(colorA.trim()) || !isValidHex(colorB.trim()) ? (
                <p className="text-xs font-light text-amber-600">
                  Usa formato hex #RRGGBB (ej: #D6FF12).
                </p>
              ) : null}
              {brandingError && (
                <p className="text-xs font-light text-red-600">{brandingError}</p>
              )}
              <button
                type="submit"
                disabled={brandingSaving || !isValidHex(colorA.trim()) || !isValidHex(colorB.trim())}
                className="flex items-center gap-2 rounded-xl bg-zelify-midnight px-4 py-2 text-xs font-light text-white transition-all hover:bg-zelify-midnight/90 active:scale-95 disabled:opacity-50"
              >
                {brandingSaving ? "Guardando…" : "Guardar branding"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
