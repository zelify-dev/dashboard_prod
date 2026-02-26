"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useLanguage } from "@/contexts/language-context";
import { useTour } from "@/contexts/tour-context";
import { cardsTranslations } from "../../_components/cards-translations";
import { CardDesign } from "../_components/card-design";
import { CardEditor, CardDesignConfig } from "./_components/card-editor";

const CARD_DESIGNS = [
  {
    id: "classic-blue",
    name: "Classic Blue",
    description: "Diseño clásico con gradiente azul",
    gradient: "from-blue-600 to-blue-800",
    textColor: "text-white",
    previewImage: "/images/card1.svg",
    cardNetwork: "visa" as const,
  },
  {
    id: "premium-black",
    name: "Premium Black",
    description: "Diseño elegante en negro premium",
    gradient: "from-gray-900 to-black",
    textColor: "text-white",
    previewImage: "/images/card2.svg",
    cardNetwork: "mastercard" as const,
  },
];

export default function CardsIssuingDesignPage() {
  const { language } = useLanguage();
  const t = cardsTranslations[language].issuing;
  const { isTourActive, currentStep, steps } = useTour();
  // TODO: Obtener el nombre del usuario desde la sesión
  const currentUserName = "Carlos Mendoza";

  const handleSaveDesign = (config: CardDesignConfig) => {
    // TODO: Guardar el diseño en la base de datos
    console.log("Saving design:", config);
    // El editor permanece visible, no se cierra
  };

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <Breadcrumb pageName={t.pageTitle} />

      {/* Editor de Tarjetas - Siempre visible arriba */}
      <div data-tour-id="tour-cards-create-design">
        <CardEditor
          onClose={() => {
            // No hacer nada, el editor siempre está visible
          }}
          onSave={handleSaveDesign}
          defaultUserName={currentUserName}
          hideCloseButton={true}
        />
      </div>
    </div>
  );
}
