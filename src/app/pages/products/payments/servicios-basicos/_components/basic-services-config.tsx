"use client";

import { useMemo, useState } from "react";
import { BasicServicesPreviewPanel, PROVIDERS_BY_REGION, ServiceProvider } from "./basic-services-preview-panel";
import { RegionConfigPanel } from "./region-config-panel";
import { cn } from "@/lib/utils";
import { CustomBrandingPanel } from "@/components/custom-branding/custom-branding-panel";
import { useBasicServicesTranslations } from "./use-basic-services-translations";

export type ServiceRegion = "ecuador" | "mexico" | "brasil" | "colombia" | "estados_unidos";

interface BasicServicesConfig {
  logo?: string | null;
  customColorTheme: string;
}

interface BasicServicesConfigProps {
  region?: ServiceRegion;
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export function BasicServicesConfig({ region: initialRegion = "mexico" }: BasicServicesConfigProps) {
  const translations = useBasicServicesTranslations();
  const [selectedRegion, setSelectedRegion] = useState<ServiceRegion>(initialRegion);
  const [visibleProvidersByRegion, setVisibleProvidersByRegion] = useState<Record<ServiceRegion, string[]>>(() => {
    const map = {} as Record<ServiceRegion, string[]>;
    (Object.keys(PROVIDERS_BY_REGION) as ServiceRegion[]).forEach((region) => {
      const data = PROVIDERS_BY_REGION[region];
      map[region] = data === "coming_soon" ? [] : data.map((provider) => provider.id);
    });
    return map;
  });
  const [config, setConfig] = useState<BasicServicesConfig>({
    logo: null,
    customColorTheme: "#004492",
  });
  type OpenSection = "config" | "personalization";
  const [openSection, setOpenSection] = useState<OpenSection>("config");
  const toggleSection = (section: OpenSection) => {
    setOpenSection((prev) => (prev === section ? (section === "config" ? "personalization" : "config") : section));
  };

  const handleRegionChange = (region: ServiceRegion) => {
    setSelectedRegion(region);
  };

  const handleProviderToggle = (providerId: string) => {
    setVisibleProvidersByRegion((prev) => {
      const current = prev[selectedRegion] ?? [];
      const exists = current.includes(providerId);
      const updated = exists ? current.filter((id) => id !== providerId) : [...current, providerId];
      return { ...prev, [selectedRegion]: updated };
    });
  };

  const availableProviders = useMemo<ServiceProvider[]>(() => {
    const data = PROVIDERS_BY_REGION[selectedRegion];
    return data === "coming_soon" ? [] : data;
  }, [selectedRegion]);

  const visibleProviders = visibleProvidersByRegion[selectedRegion] ?? [];

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <BasicServicesPreviewPanel 
        region={selectedRegion} 
        config={config}
        visibleProviderIds={visibleProviders}
      />
      
      {/* Configuration Panel */}
      <div className="space-y-6" data-tour-id="tour-payments-basic-services">
        {/* Configuración Section */}
        <div className="rounded-lg bg-white shadow-sm dark:bg-dark-2">
          <button
            onClick={() => toggleSection("config")}
            className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
          >
            <h3 className="text-lg font-semibold text-dark dark:text-white">
              {translations.config.title}
            </h3>
            <ChevronDownIcon
              className={cn(
                "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
                openSection === "config" && "rotate-180"
              )}
            />
          </button>

          {openSection === "config" && (
            <div className="border-t border-stroke px-6 py-4 dark:border-dark-3">
              <RegionConfigPanel
                selectedRegion={selectedRegion}
                onRegionChange={handleRegionChange}
                availableProviders={availableProviders}
                selectedProviders={visibleProviders}
                onProviderToggle={handleProviderToggle}
              />
            </div>
          )}
        </div>

        <CustomBrandingPanel
          title={translations.personalization.title}
          isOpen={openSection === "personalization"}
          onToggle={() => toggleSection("personalization")}
          themeLabel={translations.personalization.themeLabel}
          themeButtonLabel={translations.personalization.lightMode}
          logoLabel={translations.personalization.logoLabel}
          changeLogoLabel={translations.personalization.changeLogo}
          uploadLogoLabel={translations.personalization.uploadLogo}
          logoHint={translations.personalization.logoHint}
          colorPaletteLabel={translations.personalization.colorPaletteLabel}
          customColorThemeLabel={translations.personalization.customColorTheme}
          branding={{
            logo: config.logo || undefined,
            customColorTheme: config.customColorTheme,
          }}
          onBrandingChange={(updates) => {
            setConfig((prev) => ({
              ...prev,
              ...(updates.customColorTheme ? { customColorTheme: updates.customColorTheme } : {}),
              ...(Object.prototype.hasOwnProperty.call(updates, "logo")
                ? { logo: updates.logo ?? null }
                : {}),
            }));
          }}
          invalidFileTypeMessage={translations.personalization.invalidFileTypeMessage}
          fileTooLargeMessage={translations.personalization.fileTooLargeMessage}
          imageProcessingErrorMessage={translations.personalization.imageProcessingErrorMessage}
        />
      </div>
    </div>
  );
}
