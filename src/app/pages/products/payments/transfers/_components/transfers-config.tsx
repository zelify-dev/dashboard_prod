"use client";

import { useState } from "react";
import { ServiceRegion } from "../../servicios-basicos/_components/basic-services-config";
import { TransfersPreviewPanel } from "./transfers-preview-panel";
import { TransfersCustomizationPanel } from "./transfers-customization-panel";

export interface TransfersBranding {
  light: { logo?: string | null; customColor?: string; confirmButtonType?: "slider" | "button" };
  dark: { logo?: string | null; customColor?: string; confirmButtonType?: "slider" | "button" };
}

export function TransfersConfig({ region: initialRegion = "mexico" }: { region?: ServiceRegion }) {
  const [selectedRegion, setSelectedRegion] = useState<ServiceRegion>(initialRegion);
  const [branding, setBranding] = useState<TransfersBranding>({
    light: { logo: null, customColor: "#004492", confirmButtonType: "slider" },
    dark: { logo: null, customColor: "#004492", confirmButtonType: "slider" },
  });

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div data-tour-id="tour-transfers-preview">
        <TransfersPreviewPanel region={selectedRegion} branding={branding} />
      </div>
      <div className="space-y-6">
        <div data-tour-id="tour-transfers-branding">
          <TransfersCustomizationPanel 
            branding={branding} 
            onBrandingChange={setBranding}
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
          />
        </div>
      </div>
    </div>
  );
}
