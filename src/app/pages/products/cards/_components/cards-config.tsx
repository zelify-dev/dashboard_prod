"use client";

import { useState, useEffect, type ReactNode } from "react";
import { PreviewPanel } from "./preview-panel";
import { ConfigPanel } from "./config-panel";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "./cards-translations";
import type { CardDesignConfig } from "../issuing/design/_components/card-editor";
import {
  getOrganizationBranding,
  getStoredOrganization,
  type OrganizationBranding,
} from "@/lib/auth-api";
import { cn } from "@/lib/utils";

export interface BrandingConfig {
  logo?: string;
  customColorTheme: string;
}

export interface ThemeBranding {
  light: BrandingConfig;
  dark: BrandingConfig;
}

export interface CardsConfig {
  branding: ThemeBranding;
}

const DEFAULT_ORG_ID = "9690c49e-08ce-46a8-9e1e-1d313fe6906f";

const DEFAULT_THEME_BRANDING: ThemeBranding = {
  light: { customColorTheme: "#004492" },
  dark: { customColorTheme: "#004492" },
};

function normalizeOrgHex(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  let v = value.trim();
  if (/^[0-9A-Fa-f]{6}$/.test(v)) v = `#${v}`;
  return /^#[0-9A-Fa-f]{6}$/.test(v) ? v : null;
}

/** Color y logos de marca desde GET /api/organizations/:id/branding */
function applyOrganizationBrandingToTheme(
  base: ThemeBranding,
  org: OrganizationBranding | null
): ThemeBranding {
  if (!org) return base;
  const colorA = normalizeOrgHex(org.color_a) ?? base.light.customColorTheme;
  const colorB = normalizeOrgHex(org.color_b) ?? colorA;
  return {
    light: {
      ...base.light,
      customColorTheme: colorA,
      logo: org.url_log_light || org.url_log || base.light.logo,
    },
    dark: {
      ...base.dark,
      customColorTheme: colorB,
      logo: org.url_log_dark || org.url_log || base.dark.logo,
    },
  };
}

type CardsConfigProps = {
  /** Apariencia de tarjeta (arriba); Personalización de marca queda debajo en la misma tarjeta */
  appearanceSection?: ReactNode;
  /** Mismo estado que el editor → preview SDK en tiempo real */
  cardAppearance?: CardDesignConfig;
};

export function CardsConfig({ appearanceSection, cardAppearance }: CardsConfigProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].configurator;

  const [config, setConfig] = useState<CardsConfig>({
    branding: DEFAULT_THEME_BRANDING,
  });
  const [configId, setConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    if (saveSuccess) {
      const t = setTimeout(() => setSaveSuccess(""), 4000);
      return () => clearTimeout(t);
    }
  }, [saveSuccess]);

  // Cargar configuración de tarjetas + branding de organización (color/logos en preview y panel)
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setIsLoading(true);
        const storedOrg = getStoredOrganization();
        const idOrg = storedOrg?.id ?? DEFAULT_ORG_ID;

        let orgBranding: OrganizationBranding | null = null;
        if (storedOrg?.id) {
          try {
            orgBranding = await getOrganizationBranding(storedOrg.id);
          } catch (e) {
            console.warn("[cards] No se pudo cargar branding de organización:", e);
          }
        }

        let branding: ThemeBranding = applyOrganizationBrandingToTheme(
          { ...DEFAULT_THEME_BRANDING },
          orgBranding
        );
        let loadedConfigId: string | null = null;

        const response = await fetch(
          `/api/configuration?idOrg=${encodeURIComponent(idOrg)}&service=cards`
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.id) {
            loadedConfigId = data.id;
            const apiBranding = data.branding as ThemeBranding | undefined;
            const baseFromApi: ThemeBranding = apiBranding
              ? {
                  light: {
                    customColorTheme:
                      apiBranding.light?.customColorTheme ??
                      DEFAULT_THEME_BRANDING.light.customColorTheme,
                    logo: apiBranding.light?.logo,
                  },
                  dark: {
                    customColorTheme:
                      apiBranding.dark?.customColorTheme ??
                      DEFAULT_THEME_BRANDING.dark.customColorTheme,
                    logo: apiBranding.dark?.logo,
                  },
                }
              : { ...DEFAULT_THEME_BRANDING };
            branding = applyOrganizationBrandingToTheme(baseFromApi, orgBranding);
            setHasChanges(false);
          }
        } else if (response.status === 404) {
          setHasChanges(false);
        }

        setConfigId(loadedConfigId);
        setConfig({ branding });
      } catch (error) {
        console.error("Error loading configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  const updateConfig = (updates: Partial<CardsConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const saveConfiguration = async () => {
    try {
      setIsSaving(true);
      setSaveError("");
      setSaveSuccess("");
      
      const idOrg = getStoredOrganization()?.id ?? DEFAULT_ORG_ID;
      const configToSave = {
        idOrg,
        service: "cards",
        branding: config.branding,
      };

      let response;
      if (configId) {
        response = await fetch(`/api/configuration/${configId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(configToSave),
        });
      } else {
        response = await fetch("/api/configuration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(configToSave),
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.id && !configId) {
          setConfigId(data.id);
        }
        setHasChanges(false);
        setSaveSuccess(t.alerts.saveSuccess);
      } else {
        let errorMessage = t.alerts.saveErrorDefault;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          const errorText = await response.text().catch(() => "");
          errorMessage = `${t.alerts.httpErrorPrefix} ${response.status}: ${errorText || t.alerts.unknownError}`;
        }
        setSaveError(errorMessage);
      }
    } catch (error: any) {
      console.error("Error saving configuration:", error);
      const errorMessage = error.message || t.alerts.connectionError;
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !configId) {
    return (
      <div className="mt-6 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-dark-6 dark:text-dark-6">{t.loadingConfig}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {saveSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {saveError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PreviewPanel
          config={config}
          updateConfig={updateConfig}
          cardAppearance={cardAppearance}
        />
        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-gray-3 bg-white shadow-sm dark:border-dark-3 dark:bg-dark-2"
          data-tour-id="tour-cards-design-editor"
        >
          {appearanceSection ? (
            <section className="px-5 py-6 sm:px-6 sm:py-8">
              <header className="mb-6 border-b border-stroke pb-5 dark:border-dark-3">
                <h2 className="text-lg font-semibold tracking-tight text-dark dark:text-white">
                  {t.rightPanelAppearanceTitle}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-dark-6 dark:text-dark-6">
                  {t.rightPanelAppearanceDesc}
                </p>
              </header>
              {appearanceSection}
            </section>
          ) : null}
          {appearanceSection ? (
            <div
              className="h-px shrink-0 bg-gradient-to-r from-transparent via-stroke to-transparent dark:via-dark-3"
              aria-hidden
            />
          ) : null}
          <section
            className={cn(
              "bg-gray-1/60 px-5 py-6 sm:px-6 sm:py-8 dark:bg-dark-3/35",
              !appearanceSection && "rounded-2xl p-7"
            )}
          >
            {appearanceSection ? (
              <header className="mb-6 border-b border-stroke/80 pb-5 dark:border-dark-3">
                <h2 className="text-lg font-semibold tracking-tight text-dark dark:text-white">
                  {t.rightPanelBrandingTitle}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-dark-6 dark:text-dark-6">
                  {t.rightPanelBrandingDesc}
                </p>
              </header>
            ) : null}
            <ConfigPanel
              embedded={Boolean(appearanceSection)}
              config={config}
              updateConfig={updateConfig}
              onSave={saveConfiguration}
              hasChanges={hasChanges}
              isSaving={isSaving}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
