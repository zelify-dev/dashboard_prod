"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { getStoredOrganization, getStoredRoles } from "@/lib/auth-api";
import { getOrganizationBranding, uploadOrganizationLogo, updateOrganizationBranding, AuthError } from "@/lib/auth-api";
import type { OrganizationBranding } from "@/lib/auth-api";
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

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org?.id) return;
    e.target.value = "";
    setLogoError("");
    const allowedTypes = ["image/png", "image/svg+xml"];
    const allowedExt = /\.(png|svg)$/i;
    if (!allowedTypes.includes(file.type) || !allowedExt.test(file.name)) {
      setLogoError("Solo se permiten archivos PNG o SVG.");
      return;
    }
    setLogoUploading(true);
    try {
      const { url_log } = await uploadOrganizationLogo(org.id, file);
      setBranding((prev) => (prev ? { ...prev, url_log } : { id: org.id, url_log, color_a: null, color_b: null }));
      setToast("Logo actualizado.");
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.statusCode === 401) router.push("/login");
        else if (err.statusCode === 403) setLogoError("No tienes permisos.");
        else if (err.statusCode === 404) setLogoError("Organización no encontrada.");
        else if (err.statusCode === 400) setLogoError("Falta el archivo o el formato no es válido.");
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
      setBranding((prev) =>
        prev
          ? { ...prev, url_log: updated.url_log ?? prev.url_log, color_a: a, color_b: b }
          : { id: org.id, url_log: updated.url_log ?? null, color_a: a, color_b: b }
      );
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

          <ShowcaseSection title="Logo" className="!p-6">
            <div className="space-y-4">
              {branding?.url_log ? (
                <div className="flex items-center gap-4">
                  <img
                    src={branding.url_log}
                    alt="Logo"
                    className="h-20 w-auto max-w-[200px] object-contain"
                  />
                </div>
              ) : (
                <p className="text-sm text-dark-6 dark:text-dark-6">No hay logo cargado.</p>
              )}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Subir logo (PNG o SVG)
                </label>
                <input
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={handleLogoChange}
                  disabled={logoUploading}
                  className="block w-full text-sm text-dark-6 file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-white file:hover:bg-opacity-90"
                />
                {logoUploading && <p className="mt-1 text-sm text-dark-6">Subiendo…</p>}
                {logoError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{logoError}</p>}
              </div>
            </div>
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
