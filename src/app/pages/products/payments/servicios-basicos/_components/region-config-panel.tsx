"use client";

import { cn } from "@/lib/utils";
import { ServiceRegion } from "./basic-services-config";
import { useBasicServicesTranslations } from "./use-basic-services-translations";
import type { ServiceProvider } from "./basic-services-preview-panel";

interface RegionConfigPanelProps {
  selectedRegion: ServiceRegion;
  onRegionChange: (region: ServiceRegion) => void;
  availableProviders: ServiceProvider[];
  selectedProviders: string[];
  onProviderToggle: (providerId: string) => void;
}

function EcuadorFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14" fill="none" {...props}>
      <rect width="20" height="4.67" y="0" fill="#FFD700" />
      <rect width="20" height="4.67" y="4.67" fill="#0033A0" />
      <rect width="20" height="4.67" y="9.33" fill="#EF3340" />
    </svg>
  );
}

function MexicoFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14" fill="none" {...props}>
      <rect width="6.67" height="14" x="0" fill="#006847" />
      <rect width="6.67" height="14" x="6.67" fill="#FFFFFF" />
      <rect width="6.67" height="14" x="13.33" fill="#CE1126" />
    </svg>
  );
}

function ColombiaFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14" fill="none" {...props}>
      <rect width="20" height="7" y="0" fill="#FCD116" />
      <rect width="20" height="3.5" y="7" fill="#003893" />
      <rect width="20" height="3.5" y="10.5" fill="#CE1126" />
    </svg>
  );
}

function BrasilFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14" fill="none" {...props}>
      <rect width="20" height="14" fill="#009739" />
      <path
        d="M10 3.5C10 3.5 12.5 2 16 2C16 2 16 12 16 12C12.5 12 10 10.5 10 10.5C10 10.5 7.5 12 4 12C4 12 4 2 4 2C7.5 2 10 3.5 10 3.5Z"
        fill="#FEDD00"
      />
      <circle cx="10" cy="7" r="2.5" fill="#012169" />
      <path
        d="M10 5.5L10.3 6.3L11.1 6.5L10.3 6.7L10 7.5L9.7 6.7L8.9 6.5L9.7 6.3L10 5.5Z"
        fill="#FEDD00"
      />
    </svg>
  );
}

function EstadosUnidosFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14" fill="none" {...props}>
      <rect width="20" height="14" fill="#B22234" />
      <rect width="20" height="1" y="1" fill="#FFFFFF" />
      <rect width="20" height="1" y="3" fill="#FFFFFF" />
      <rect width="20" height="1" y="5" fill="#FFFFFF" />
      <rect width="20" height="1" y="7" fill="#FFFFFF" />
      <rect width="20" height="1" y="9" fill="#FFFFFF" />
      <rect width="20" height="1" y="11" fill="#FFFFFF" />
      <rect width="8.67" height="7" fill="#3C3B6E" />
      <circle cx="1.2" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="2.4" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="3.6" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="4.8" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="6" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="7.2" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="1.2" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="2.4" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="3.6" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="4.8" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="6" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="7.2" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="1.2" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="2.4" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="3.6" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="4.8" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="6" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="7.2" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="1.2" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="2.4" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="3.6" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="4.8" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="6" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="7.2" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="1.2" cy="6" r="0.3" fill="#FFFFFF" />
      <circle cx="2.4" cy="6" r="0.3" fill="#FFFFFF" />
      <circle cx="3.6" cy="6" r="0.3" fill="#FFFFFF" />
      <circle cx="4.8" cy="6" r="0.3" fill="#FFFFFF" />
      <circle cx="6" cy="6" r="0.3" fill="#FFFFFF" />
      <circle cx="7.2" cy="6" r="0.3" fill="#FFFFFF" />
    </svg>
  );
}

const countryFlagIcons: Record<ServiceRegion, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  ecuador: EcuadorFlagIcon,
  mexico: MexicoFlagIcon,
  brasil: BrasilFlagIcon,
  colombia: ColombiaFlagIcon,
  estados_unidos: EstadosUnidosFlagIcon,
};

export function RegionConfigPanel({ 
  selectedRegion, 
  onRegionChange,
  availableProviders,
  selectedProviders,
  onProviderToggle,
}: RegionConfigPanelProps) {
  const translations = useBasicServicesTranslations();
  const countryNames = translations.config.regionNames;
  const regions: ServiceRegion[] = ["mexico", "brasil", "colombia", "estados_unidos", "ecuador"];
  return (
    <div className="space-y-4">
        {/* Region Selection */}
        <div>
          <label className="mb-3 block text-sm font-semibold text-dark dark:text-white">{translations.config.countryLabel}</label>
          <div className="space-y-2">
            {regions.map((region) => {
              const FlagIcon = countryFlagIcons[region];
              const isSelected = selectedRegion === region;

              const isEcuadorSelected = region === "ecuador" && isSelected;

              return (
                <button
                  key={region}
                  onClick={() => onRegionChange(region)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-stroke bg-white hover:border-primary/50 dark:border-dark-3 dark:bg-dark-2",
                    isEcuadorSelected && "opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      isSelected ? "bg-primary/10" : "bg-gray-2 dark:bg-dark-3"
                    )}
                  >
                    <FlagIcon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-dark dark:text-white">
                    {countryNames[region]}
                  </span>
                  {region === "ecuador" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {translations.providers.comingSoonBannerTitle}
                    </span>
                  )}
                  {isSelected && (
                    <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-semibold text-dark dark:text-white">
            {translations.config.visibleCompaniesLabel}
          </label>
          {availableProviders.length === 0 ? (
            <p className="text-sm text-dark-5 dark:text-dark-6">{translations.config.noCompaniesAvailable}</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-stroke p-3 dark:border-dark-3">
              {availableProviders.map((provider) => {
                const isSelected = selectedProviders.includes(provider.id);
                return (
                  <label
                    key={provider.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm transition",
                      isSelected
                        ? "border-primary bg-primary/5 text-dark dark:border-primary/60 dark:bg-primary/10 dark:text-white"
                        : "border-stroke bg-white text-dark hover:border-primary/50 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    )}
                  >
                    <span>{provider.name}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onProviderToggle(provider.id)}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}
