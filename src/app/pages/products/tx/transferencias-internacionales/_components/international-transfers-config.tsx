"use client";

import { useState } from "react";
import { ServiceRegion } from "../../../payments/servicios-basicos/_components/basic-services-config";
import { InternationalTransfersPreviewPanel } from "./international-transfers-preview-panel";
import { TransfersRegionPanel } from "../../../payments/transfers/_components/transfers-region-panel";

export function InternationalTransfersConfig({ region: initialRegion = "mexico" }: { region?: ServiceRegion }) {
  const [selectedRegion, setSelectedRegion] = useState<ServiceRegion>(initialRegion);

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div data-tour-id="tour-tx-preview">
        <InternationalTransfersPreviewPanel region={selectedRegion} />
      </div>
      <div data-tour-id="tour-tx-config">
        <TransfersRegionPanel selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />
      </div>
    </div>
  );
}
