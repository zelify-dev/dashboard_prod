"use client";

import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CardsConfig } from "./cards-config";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "./cards-translations";
import {
  CardEditor,
  createDefaultCardDesignConfig,
  type CardDesignConfig,
} from "../issuing/design/_components/card-editor";

export function CardsPageContent() {
  const { language } = useLanguage();
  const t = cardsTranslations[language].configurator;
  const currentUserName = "Carlos Mendoza";

  const [cardAppearance, setCardAppearance] = useState<CardDesignConfig>(() =>
    createDefaultCardDesignConfig({ cardholderName: currentUserName })
  );

  const handleSaveDesign = (_config: CardDesignConfig) => {
    // TODO: persist card design (API)
  };

  return (
    <>
      <Breadcrumb pageName={t.designPageTitle} />
      <div className="mt-2 mb-6">
        <p className="text-sm text-dark-6 dark:text-dark-6">{t.designPageDesc}</p>
      </div>

      <div className="mb-10">
        <CardsConfig
          cardAppearance={cardAppearance}
          appearanceSection={
            <CardEditor
              embedded
              config={cardAppearance}
              onConfigChange={(updates) =>
                setCardAppearance((prev) => ({ ...prev, ...updates }))
              }
              onClose={() => {}}
              onSave={handleSaveDesign}
              defaultUserName={currentUserName}
              hideCloseButton
            />
          }
        />
      </div>
    </>
  );
}
