"use client";

import { useState } from "react";
import { PreviewPanel } from "./preview-panel";
import { ConfigPanel } from "./config-panel";

export type ViewMode = "mobile" | "web";
export type CustomKeyType = "cedula" | "telefono" | "correo";
export type ThemeMode = "light" | "dark" | "auto";

export interface Contact {
  id: string;
  name: string;
  customKey: string;
  keyType: CustomKeyType;
  avatar?: string;
}

export interface CustomKeysConfig {
  viewMode: ViewMode;
  currentCustomKey: string;
  currentKeyType: CustomKeyType;
  availableKeyTypes: CustomKeyType[];
  contacts: Contact[];
  paymentNotifications: boolean;
  contactAlerts: boolean;
  themeMode: ThemeMode;
  twoFactorAuth: boolean;
  autoLogout: boolean;
  autoLogoutMinutes: number;
  branding: {
    light: { logo?: string | null; customColor?: string };
    dark: { logo?: string | null; customColor?: string };
  };
}

export function CustomKeysConfig() {
  const [config, setConfig] = useState<CustomKeysConfig>({
    viewMode: "mobile",
    currentCustomKey: "1234567890",
    currentKeyType: "cedula",
    availableKeyTypes: ["cedula", "telefono", "correo"],
    contacts: [
      { id: "1", name: "Juan", customKey: "0987654321", keyType: "telefono" },
      { id: "2", name: "María", customKey: "maria@email.com", keyType: "correo" },
      { id: "3", name: "Carlos", customKey: "1723456789", keyType: "cedula" },
      { id: "4", name: "Ana", customKey: "0999888777", keyType: "telefono" },
      { id: "5", name: "Luis", customKey: "luis@email.com", keyType: "correo" },
    ],
    paymentNotifications: true,
    contactAlerts: true,
    themeMode: "auto",
    twoFactorAuth: false,
    autoLogout: false,
    autoLogoutMinutes: 15,
    branding: {
      light: { logo: null, customColor: "#004492" },
      dark: { logo: null, customColor: "#004492" },
    },
  });

  const updateConfig = (updates: Partial<CustomKeysConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      <div data-tour-id="tour-payments-custom-keys-preview">
        <PreviewPanel config={config} updateConfig={updateConfig} />
      </div>
      <div data-tour-id="tour-payments-custom-keys-config">
        <ConfigPanel config={config} updateConfig={updateConfig} />
      </div>
    </div>
  );
}

