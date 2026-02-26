"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CardPreview2D } from "./card-preview-2d";
import { CardCustomizationPanel } from "./card-customization-panel";
import { CardDesign } from "../../_components/card-design";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../../_components/cards-translations";

type CardDesignPreset = {
  id: string;
  name: string;
  description: string;
  gradient: string;
  textColor: string;
  previewImage: string;
  cardNetwork: "visa" | "mastercard";
};

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

type CardEditorProps = {
  onClose: () => void;
  onSave: (config: CardDesignConfig) => void;
  defaultUserName?: string;
  hideCloseButton?: boolean;
};

export function CardEditor({ onClose, onSave, defaultUserName = "Carlos Mendoza", hideCloseButton = false }: CardEditorProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].issuing.editor;
  const cardDesigns: CardDesignPreset[] = useMemo(
    () => [
      {
        id: "classic-blue",
        name: t.designPresets.classicBlue.name,
        description: t.designPresets.classicBlue.description,
        gradient: "from-blue-600 to-blue-800",
        textColor: "text-white",
        previewImage: "/images/card1.svg",
        cardNetwork: "visa",
      },
      {
        id: "premium-black",
        name: t.designPresets.premiumBlack.name,
        description: t.designPresets.premiumBlack.description,
        gradient: "from-gray-900 to-black",
        textColor: "text-white",
        previewImage: "/images/card2.svg",
        cardNetwork: "mastercard",
      },
    ],
    [t]
  );
  const [config, setConfig] = useState<CardDesignConfig>({
    cardholderName: defaultUserName,
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
  });
  const [selectedDesign, setSelectedDesign] = useState<CardDesignPreset | null>(null);


  const handleConfigChange = (updates: Partial<CardDesignConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    onSave(config);
    // No cerrar el editor si hideCloseButton es true
    if (!hideCloseButton) {
      onClose();
    }
  };

  return (
    <div className="mt-6">
      <div className="rounded-3xl border border-stroke bg-white p-7 shadow-sm dark:border-dark-3 dark:bg-dark-2 md:p-10">

        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[440px_minmax(0,1fr)]">
          <div className="order-1" data-tour-id="tour-cards-design-editor">
            <div className="rounded-2xl border border-gray-3 bg-white p-7 shadow-sm dark:border-dark-3 dark:bg-dark-2">
              <CardCustomizationPanel
                config={config}
                onConfigChange={handleConfigChange}
                onSave={handleSave}
                onCancel={hideCloseButton ? () => {} : onClose}
              />
            </div>
          </div>

          <div className="order-2 xl:order-2" data-tour-id="tour-cards-create-design">
            <div className="h-full w-full rounded-2xl bg-[#F3F4F6] p-8 dark:bg-dark-3">
              <div className="xl:sticky xl:top-24">
                <CardPreview2D config={config} />
                
                {/* Carousel de Diseños - Debajo de la tarjeta */}
                <div className="mt-8" data-tour-id="tour-cards-issuing-design">
                  <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                    {cardsTranslations[language].issuing.designsTitle}
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {cardDesigns.map((design) => (
                      <div 
                        key={design.id} 
                        className="flex-shrink-0 w-44 cursor-pointer transform transition-transform hover:scale-105"
                        onClick={() => setSelectedDesign(design)}
                      >
                        <div className="scale-[0.65] origin-top-left">
                          <CardDesign design={design} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para mostrar diseño seleccionado */}
      {selectedDesign && typeof window !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedDesign(null)}
        >
          <div 
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-dark-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDesign(null)}
              className="absolute top-4 right-4 rounded-full border border-gray-3 bg-white p-2 text-gray-6 transition hover:bg-gray-1 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6 dark:hover:bg-dark-3"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-4">
              <h3 className="mb-2 text-xl font-semibold text-dark dark:text-white">
                {selectedDesign.name}
              </h3>
              <p className="mb-4 text-sm text-dark-6 dark:text-dark-6">
                {selectedDesign.description}
              </p>
              <div className="flex justify-center">
                <div className="w-full max-w-xs">
                  <CardDesign design={selectedDesign} />
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
