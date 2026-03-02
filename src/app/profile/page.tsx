"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useRef, useEffect } from "react";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";
import { getStoredOrganization, getStoredUser, getOrganization } from "@/lib/auth-api";
import type { OrganizationDetails, AuthUser } from "@/lib/auth-api";
import { useLanguage } from "@/contexts/language-context";

function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const COUNTRY_LABELS: Record<string, string> = {
  US: "United States", EC: "Ecuador", MX: "Mexico", CO: "Colombia", CL: "Chile",
};
const COUNTRY_LABELS_ES: Record<string, string> = {
  US: "Estados Unidos", EC: "Ecuador", MX: "México", CO: "Colombia", CL: "Chile",
};
const INDUSTRY_LABELS: Record<string, string> = {
  fintech: "Fintech", banking: "Banking", neobank: "Neobank", cooperative: "Cooperative", other: "Other",
};
const INDUSTRY_LABELS_ES: Record<string, string> = {
  fintech: "Fintech", banking: "Banca", neobank: "Neobanco", cooperative: "Cooperativa", other: "Otro",
};

function FieldReadOnly({
  label,
  value,
  mono,
  emptyLabel = "—",
}: {
  label: string;
  value: string | undefined;
  mono?: boolean;
  emptyLabel?: string;
}) {
  const isEmpty = value === undefined || value === "";
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-dark-6 dark:text-dark-6">
        {label}
      </label>
      <div
        className={cn(
          "min-h-[2.75rem] rounded-lg border border-stroke bg-gray-2/60 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2/80 flex items-center",
          mono && "font-mono text-xs",
          isEmpty && "text-dark-5 dark:text-dark-6"
        )}
      >
        {isEmpty ? emptyLabel : value}
      </div>
    </div>
  );
}

export default function Page() {
  const { profilePage } = useUiTranslations();
  const { language } = useLanguage();
  const locale = language === "es" ? "es-ES" : "en-US";
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    const stored = getStoredOrganization();
    if (!stored?.id) {
      setOrgLoading(false);
      return;
    }
    setOrgLoading(true);
    setOrgError(null);
    getOrganization(stored.id)
      .then(setOrganization)
      .catch((e) => setOrgError(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setOrgLoading(false));
  }, []);

  const [data, setData] = useState({
    branding: {
      logo: "",
      color: "#004492", // Default brand color
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPlacement, setColorPickerPlacement] = useState<"top" | "bottom">("bottom");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isTriggerButton = !!target.closest('[data-color-picker-trigger="true"]');
      const isColorButton = target.closest('button[type="button"]') &&
        target.closest('button[type="button"]')?.getAttribute('style')?.includes('backgroundColor');

      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(target) &&
        !isTriggerButton &&
        !isColorButton
      ) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  const toggleColorPicker = () => {
    setShowColorPicker((prev) => {
      const next = !prev;
      if (next) {
        const trigger = colorPickerTriggerRef.current;
        if (trigger) {
          const rect = trigger.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          const estimatedHeight = 360;
          if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
            setColorPickerPlacement("top");
          } else {
            setColorPickerPlacement("bottom");
          }
        } else {
          setColorPickerPlacement("bottom");
        }
      }
      return next;
    });
  };

  const handleColorChange = (newColor: string) => {
    setData({
      ...data,
      branding: {
        ...data.branding,
        color: newColor
      }
    });
  };

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result); // Using simple base64 for now as per simplified requirement
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }

    try {
      const optimizedBase64 = await optimizeImage(file);
      setData({
        ...data,
        branding: {
          ...data.branding,
          logo: optimizedBase64
        }
      });
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) handleFileUpload(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving custom branding:", data);
  };

  return (
    <div className="mx-auto w-full max-w-[970px]">
      <Breadcrumb pageName={profilePage.title} />

      <div className="w-full">
        {/* Solo descripción; el título ya va en el breadcrumb */}
        <p className="mb-6 text-sm text-body">
          {profilePage.description}
        </p>

        {/* Form Section */}
        <div className="rounded-[10px] bg-white p-8 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <form onSubmit={handleSubmit}>
            {/* Organización — solo lectura, datos de GET /api/organizations/:id */}
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-dark dark:text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                {profilePage.form.organizationSection}
              </h3>
              {orgLoading ? (
                <p className="text-sm text-dark-6 dark:text-dark-6">{profilePage.form.loading}</p>
              ) : orgError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{orgError}</p>
              ) : organization ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FieldReadOnly label={profilePage.form.businessName} value={organization.name} />
                  <FieldReadOnly label={profilePage.form.organizationId} value={organization.id} mono />
                  <FieldReadOnly label={profilePage.form.companyLegalName} value={organization.company_legal_name} />
                  <FieldReadOnly
                    label={profilePage.form.country}
                    value={organization.country ? (language === "es" ? COUNTRY_LABELS_ES[organization.country] : COUNTRY_LABELS[organization.country]) || organization.country : undefined}
                  />
                  <FieldReadOnly label={profilePage.form.website} value={organization.website} />
                  <FieldReadOnly
                    label={profilePage.form.industry}
                    value={organization.industry ? (language === "es" ? INDUSTRY_LABELS_ES[organization.industry] : INDUSTRY_LABELS[organization.industry]) || organization.industry : undefined}
                  />
                </div>
              ) : (
                <p className="text-sm text-dark-6 dark:text-dark-6">—</p>
              )}
            </div>

              {/* Cuenta — solo lectura */}
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-dark dark:text-white">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  {profilePage.form.accountSection}
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FieldReadOnly label={profilePage.form.fullName} value={user?.full_name ?? undefined} />
                  <FieldReadOnly label={profilePage.form.email} value={user?.email ?? undefined} />
                </div>
              </div>

            {/* Línea divisoria: arriba = organización y perfil, abajo = Custom Branding */}
            <hr className="my-8 border-0 border-t-2 border-stroke dark:border-dark-3" />

            {/* Branding Section */}
            <div className="mb-8 pt-2">
              <h3 className="mb-6 text-lg font-semibold text-primary dark:text-white">
                {profilePage.form.branding.title}
              </h3>

              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {profilePage.form.branding.logoLabel}
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border-2 border-dashed p-4 transition",
                      isDragging
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-stroke dark:border-dark-3"
                    )}
                  >
                    {data.branding.logo ? (
                      <div className="relative">
                        <img
                          src={data.branding.logo}
                          alt="Logo"
                          className="h-16 w-16 rounded-lg object-contain border border-stroke dark:border-dark-3"
                        />
                        <button
                          type="button"
                          onClick={() => setData({ ...data, branding: { ...data.branding, logo: "" } })}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-3">
                        <svg className="h-8 w-8 text-dark-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="mb-2 text-sm text-dark dark:text-white">
                        {profilePage.form.branding.logoHelper}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      >
                        {profilePage.form.branding.uploadButton}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {profilePage.form.branding.colorLabel}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      data-color-picker-trigger="true"
                      ref={colorPickerTriggerRef}
                      onClick={toggleColorPicker}
                      className="flex w-full items-center gap-3 rounded-lg border border-stroke bg-white p-2 text-left transition hover:border-primary dark:border-dark-3 dark:bg-dark-2"
                    >
                      <div
                        className="h-6 w-6 rounded border border-stroke shadow-sm dark:border-dark-3"
                        style={{ backgroundColor: data.branding.color }}
                      />
                      <span className="text-sm text-dark dark:text-white">
                        {data.branding.color.toUpperCase()}
                      </span>
                    </button>
                    {showColorPicker && (
                      <div
                        ref={colorPickerRef}
                        className={cn(
                          "absolute left-0 z-50 rounded-lg border border-stroke bg-white p-3 shadow-xl dark:border-dark-3 dark:bg-dark-2",
                          "max-h-[70vh] overflow-auto",
                          colorPickerPlacement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
                        )}
                      >
                        <HexColorPicker
                          color={data.branding.color}
                          onChange={handleColorChange}
                        />
                        <div className="mt-3 grid grid-cols-5 gap-2">
                          {[
                            "#004492", // Brand Blue
                            "#0FADCF", // Cyan
                            "#10B981", // Emerald
                            "#F0950C", // Orange
                            "#E11D48", // Rose
                            "#8B5CF6", // Violet
                            "#FF5722", // Deep Orange
                            "#212121", // Dark Gray
                            "#607D8B", // Blue Gray
                            "#000000", // Black
                          ].map((presetColor) => (
                            <button
                              key={presetColor}
                              type="button"
                              className="h-6 w-6 rounded border border-stroke dark:border-dark-3"
                              style={{ backgroundColor: presetColor }}
                              onClick={() => handleColorChange(presetColor)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 font-medium text-white hover:bg-opacity-90 transition-all text-base"
            >
              ✓ {profilePage.form.saveButton}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
