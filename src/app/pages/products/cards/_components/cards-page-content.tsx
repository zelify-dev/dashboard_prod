"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CardsConfig } from "./cards-config";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "./cards-translations";

export function CardsPageContent() {
  const { language } = useLanguage();
  const t = cardsTranslations[language].configurator;

  return (
    <>
      <Breadcrumb pageName={t.breadcrumb} />
      <CardsConfig />
    </>
  );
}
