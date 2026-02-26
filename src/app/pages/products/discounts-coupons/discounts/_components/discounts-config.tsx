"use client";

import { useState } from "react";
import { DiscountsPreviewPanel } from "./preview-panel";
import { DiscountsConfigPanel } from "./config-panel";
import {
  AuthConfig,
  RegistrationField,
} from "../../../auth/authentication/_components/authentication-config";

export interface Plan {
  id: string;
  title: string;
  price: string;
  features: string[];
}

export interface DiscountsConfigState extends AuthConfig {
  plans: Plan[];
  promoCount: number;
  showHourField: boolean;
}

const defaultPlans: Plan[] = [
  {
    id: "free",
    title: "Free",
    price: "$0.00",
    features: [
      "$500 Transactional Limit",
      "Up to 20 Monthly Transactions",
      "Business Geo-Location",
      "Customer Support",
    ],
  },
  {
    id: "premium",
    title: "Premium",
    price: "$9.99",
    features: [
      "$10,000 Transactional Limit",
      "Monthly Unlimited Transactions",
      "Preferential Geo-Location",
      "Customized Cards Options",
      "Unlimited Discounts & Coupons",
      "Special Customer Support",
    ],
  },
];

const defaultRegistrationFields: RegistrationField[] = [
  { id: "username", enabled: true, required: false },
  { id: "fullName", enabled: true, required: true },
  { id: "idNumber", enabled: false, required: false },
  { id: "birthDate", enabled: false, required: false },
  { id: "address", enabled: false, required: false },
];

export function DiscountsConfig() {
  const [config, setConfig] = useState<DiscountsConfigState>({
    viewMode: "mobile",
    serviceType: "login",
    loginMethod: "email",
    oauthProviders: [],
    registrationFields: defaultRegistrationFields,
    customRegistrationFields: [],
    branding: {
      light: {
        customColorTheme: "#004492",
      },
      dark: {
        customColorTheme: "#004492",
      },
    },
    plans: defaultPlans,
    promoCount: 3,
    showHourField: true,
  });

  const updateConfig = (updates: Partial<DiscountsConfigState>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="mt-6 space-y-6" data-tour-id="tour-discounts-list">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DiscountsPreviewPanel config={config} updateConfig={updateConfig} />
        <DiscountsConfigPanel config={config} updateConfig={updateConfig} />
      </div>
    </div>
  );
}
