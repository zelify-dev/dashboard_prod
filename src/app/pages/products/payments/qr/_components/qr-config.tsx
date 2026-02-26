"use client";

import { useState } from "react";
import { PreviewPanel } from "./preview-panel";
import { ConfigPanel } from "./config-panel";

export type ViewMode = "mobile" | "web";

export type WebhookEvent = 
  | "payment.succeeded" 
  | "payment.failed" 
  | "payment.pending" 
  | "charge.refunded";

export interface QRConfig {
  viewMode: ViewMode;
  webhookUrl: string;
  webhookEvents: WebhookEvent[];
  branding: {
    light: { logo?: string | null; customColor?: string; confirmButtonType?: "slider" | "button" };
    dark: { logo?: string | null; customColor?: string; confirmButtonType?: "slider" | "button" };
  };
}

export function QRConfig() {
  const [config, setConfig] = useState<QRConfig>({
    viewMode: "mobile",
    webhookUrl: "",
    webhookEvents: [],
    branding: {
      light: { logo: null, customColor: "#004492", confirmButtonType: "slider" },
      dark: { logo: null, customColor: "#004492", confirmButtonType: "slider" },
    },
  });

  const updateConfig = (updates: Partial<QRConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      <div data-tour-id="tour-payments-qr-preview">
        <PreviewPanel config={config} updateConfig={updateConfig} />
      </div>
      <div data-tour-id="tour-payments-qr-config">
        <ConfigPanel config={config} updateConfig={updateConfig} />
      </div>
    </div>
  );
}

