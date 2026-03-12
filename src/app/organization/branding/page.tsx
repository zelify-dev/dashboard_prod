"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const [toast, setToast] = useState("");

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

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(id);
    }
  }, [toast]);

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
      setToast("Logo actualizado.");
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
      setToast("Branding actualizado.");
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
      <h1 className="mb-6 text-heading-4 font-semibold text-dark dark:text-white">{title}</h1>

      {loading ? (
        <p className="text-dark-6 dark:text-dark-6">Cargando…</p>
      ) : error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <>
          {toast && (
            <div className="mb-4 rounded-lg bg-emerald-100 px-4 py-2 text-sm text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
              {toast}
            </div>
          )}

          <ShowcaseSection title="Logos e ícono" className="!p-6">
            <p className="mb-4 text-sm text-dark-6 dark:text-dark-6">
              Solo archivos PNG. Cada subida reemplaza el archivo anterior.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                <p className="mb-2 text-xs font-medium uppercase text-dark-6 dark:text-dark-6">Logo principal</p>
                {branding?.url_log ? (
                  <img src={branding.url_log} alt="Logo" className="mb-2 h-16 w-auto max-w-[160px] object-contain" />
                ) : (
                  <p className="mb-2 text-sm text-dark-6 dark:text-dark-6">Sin logo</p>
                )}
                <input
                  type="file"
                  accept=".png,image/png"
                  onChange={(e) => handleLogoChange(e, "logo")}
                  disabled={logoUploading}
                  className="block w-full text-sm text-dark-6 file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-white"
                />
              </div>
              <div className="rounded-lg border border-stroke bg-gray-2/40 p-4 dark:border-dark-3 dark:bg-dark-3/40">
                <p className="mb-2 text-xs font-medium uppercase text-dark-6 dark:text-dark-6">Logo fondo oscuro</p>
                {branding?.url_log_dark ? (
                  <img src={branding.url_log_dark} alt="Logo dark" className="mb-2 h-16 w-auto max-w-[160px] object-contain" />
                ) : (
                  <p className="mb-2 text-sm text-dark-6 dark:text-dark-6">Sin logo</p>
                )}
                <input
                  type="file"
                  accept=".png,image/png"
                  onChange={(e) => handleLogoChange(e, "logoDark")}
                  disabled={logoUploading}
                  className="block w-full text-sm text-dark-6 file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-white"
                />
              </div>
              <div className="rounded-lg border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
                <p className="mb-2 text-xs font-medium uppercase text-dark-6 dark:text-dark-6">Logo fondo claro</p>
                {branding?.url_log_light ? (
                  <img src={branding.url_log_light} alt="Logo light" className="mb-2 h-16 w-auto max-w-[160px] object-contain" />
                ) : (
                  <p className="mb-2 text-sm text-dark-6 dark:text-dark-6">Sin logo</p>
                )}
                <input
                  type="file"
                  accept=".png,image/png"
                  onChange={(e) => handleLogoChange(e, "logoLight")}
                  disabled={logoUploading}
                  className="block w-full text-sm text-dark-6 file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-white"
                />
              </div>
              <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                <p className="mb-2 text-xs font-medium uppercase text-dark-6 dark:text-dark-6">Ícono</p>
                {branding?.url_icon ? (
                  <img src={branding.url_icon} alt="Icon" className="mb-2 h-12 w-12 object-contain" />
                ) : (
                  <p className="mb-2 text-sm text-dark-6 dark:text-dark-6">Sin ícono</p>
                )}
                <input
                  type="file"
                  accept=".png,image/png"
                  onChange={(e) => handleLogoChange(e, "icon")}
                  disabled={logoUploading}
                  className="block w-full text-sm text-dark-6 file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-white"
                />
              </div>
            </div>
            {logoUploading && <p className="mt-2 text-sm text-dark-6">Subiendo…</p>}
            {logoError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{logoError}</p>}
          </ShowcaseSection>

          <ShowcaseSection title="Colores" className="mt-6 !p-6">
            <form onSubmit={handleSaveBranding} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    Color A
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorA}
                      onChange={(e) => setColorA(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-stroke dark:border-dark-3"
                    />
                    <input
                      type="text"
                      value={colorA}
                      onChange={(e) => setColorA(e.target.value)}
                      placeholder="#RRGGBB"
                      className="flex-1 rounded-lg border border-stroke bg-gray-2/60 px-3 py-2 font-mono text-sm dark:border-dark-3 dark:bg-dark-2/80 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    Color B
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorB}
                      onChange={(e) => setColorB(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-stroke dark:border-dark-3"
                    />
                    <input
                      type="text"
                      value={colorB}
                      onChange={(e) => setColorB(e.target.value)}
                      placeholder="#RRGGBB"
                      className="flex-1 rounded-lg border border-stroke bg-gray-2/60 px-3 py-2 font-mono text-sm dark:border-dark-3 dark:bg-dark-2/80 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              {!isValidHex(colorA.trim()) || !isValidHex(colorB.trim()) ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Usa formato hex #RRGGBB (ej: #D6FF12).
                </p>
              ) : null}
              {brandingError && (
                <p className="text-sm text-red-600 dark:text-red-400">{brandingError}</p>
              )}
              <button
                type="submit"
                disabled={brandingSaving || !isValidHex(colorA.trim()) || !isValidHex(colorB.trim())}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
              >
                {brandingSaving ? "Guardando…" : "Guardar branding"}
              </button>
            </form>
          </ShowcaseSection>
        </>
      )}
    </div>
  );
}
