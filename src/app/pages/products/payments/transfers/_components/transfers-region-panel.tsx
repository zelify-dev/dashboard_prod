"use client";

import { cn } from "@/lib/utils";
import { ServiceRegion } from "../../servicios-basicos/_components/basic-services-config";
import { useTransfersTranslations } from "./use-transfers-translations";

const currencyByRegion: Record<ServiceRegion, string> = {
  mexico: "MXN",
  brasil: "BRL",
  colombia: "COP",
  estados_unidos: "USD",
  ecuador: "USD",
};

const regions: ServiceRegion[] = ["mexico", "brasil", "colombia", "estados_unidos", "ecuador"];

export function TransfersRegionPanel({
  selectedRegion,
  onRegionChange,
}: {
  selectedRegion: ServiceRegion;
  onRegionChange: (region: ServiceRegion) => void;
}) {
  const translations = useTransfersTranslations();
  const countryNames = translations.config.regionNames;
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-dark dark:text-white">{translations.config.title}</h2>
        <p className="text-sm text-dark-6 dark:text-dark-6">{translations.config.description}</p>
      </div>
      <div className="space-y-2">
        {regions.map((region) => {
          const isSelected = selectedRegion === region;
          return (
            <button
              key={region}
              onClick={() => onRegionChange(region)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border-2 p-3 text-left transition",
                isSelected
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-stroke bg-white hover:border-primary/50 dark:border-dark-3 dark:bg-dark-2"
              )}
            >
              <div>
                <p className="text-sm font-semibold text-dark dark:text-white">{countryNames[region]}</p>
                <p className="text-xs text-dark-6 dark:text-dark-6">{translations.config.currencyLabel} {currencyByRegion[region]}</p>
              </div>
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
  );
}
