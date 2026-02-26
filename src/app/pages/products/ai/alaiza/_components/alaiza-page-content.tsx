"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { AlaizaConfig } from "./alaiza-config";
import { useAlaizaTranslations } from "./use-alaiza-translations";

export function AlaizaPageContent() {
  const translations = useAlaizaTranslations();

  return (
    <>
      <Breadcrumb pageName={translations.breadcrumb} />
      <AlaizaConfig />
    </>
  );
}

