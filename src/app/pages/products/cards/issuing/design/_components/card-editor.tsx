"use client";

import { useState } from "react";
import { CardCustomizationPanel } from "./card-customization-panel";

export type CardColorType = "solid" | "gradient";
export type CardFinishType = "standard" | "embossed" | "metallic";

export type CardDesignConfig = {
  cardholderName: string;
  nickname: string;
  cardType: "credit" | "debit";
  cardForm: "virtual" | "physical";
  expirationDate: string;
  spendingLimit: string;
  limitInterval: "daily" | "weekly" | "monthly";
  colorType: CardColorType;
  solidColor: string;
  gradientColors: string[];
  finishType: CardFinishType;
  cardNetwork: "visa" | "mastercard";
};

export const DEFAULT_CARD_DESIGN_CONFIG: CardDesignConfig = {
  cardholderName: "Carlos Mendoza",
  nickname: "Personal Card",
  cardType: "credit",
  cardForm: "virtual",
  expirationDate: "2032-01-21",
  spendingLimit: "1000",
  limitInterval: "weekly",
  colorType: "solid",
  solidColor: "#1e3a8a",
  gradientColors: ["#1e3a8a", "#1e40af", "#2563eb"],
  finishType: "standard",
  cardNetwork: "visa",
};

export function createDefaultCardDesignConfig(
  overrides?: Partial<CardDesignConfig>
): CardDesignConfig {
  return { ...DEFAULT_CARD_DESIGN_CONFIG, ...overrides };
}

type CardEditorProps = {
  onClose: () => void;
  onSave: (config: CardDesignConfig) => void;
  defaultUserName?: string;
  hideCloseButton?: boolean;
  /** Sin marcos externos: para incrustar junto a Personalización de marca en la misma tarjeta */
  embedded?: boolean;
  /** Estado compartido con el preview del SDK (tiempo real) */
  config?: CardDesignConfig;
  onConfigChange?: (updates: Partial<CardDesignConfig>) => void;
};

export function CardEditor({
  onClose,
  onSave,
  defaultUserName = "Carlos Mendoza",
  hideCloseButton = false,
  embedded = false,
  config: controlledConfig,
  onConfigChange,
}: CardEditorProps) {
  const isControlled =
    controlledConfig !== undefined && onConfigChange !== undefined;

  const [internalConfig, setInternalConfig] = useState<CardDesignConfig>(() =>
    createDefaultCardDesignConfig({ cardholderName: defaultUserName })
  );

  const config = isControlled ? controlledConfig! : internalConfig;

  const handleConfigChange = (updates: Partial<CardDesignConfig>) => {
    if (isControlled) {
      onConfigChange!(updates);
    } else {
      setInternalConfig((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleSave = () => {
    onSave(config);
    if (!hideCloseButton) {
      onClose();
    }
  };

  const panel = (
    <CardCustomizationPanel
      config={config}
      onConfigChange={handleConfigChange}
      onSave={handleSave}
      onCancel={hideCloseButton ? () => {} : onClose}
    />
  );

  if (embedded) {
    return (
      <div data-tour-id="tour-cards-create-design">{panel}</div>
    );
  }

  return (
    <div className="mt-6">
      <div className="rounded-3xl border border-stroke bg-white p-7 shadow-sm dark:border-dark-3 dark:bg-dark-2 md:p-10">
        <div className="mx-auto max-w-3xl" data-tour-id="tour-cards-design-editor">
          <div className="rounded-2xl border border-gray-3 bg-white p-7 shadow-sm dark:border-dark-3 dark:bg-dark-2">
            <div data-tour-id="tour-cards-create-design">{panel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
