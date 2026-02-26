"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { TxConfig } from "./tx-config";
import { useInternationalTransfersTranslations } from "./use-international-transfers-translations";

export function InternationalTransfersPageContent() {
  const translations = useInternationalTransfersTranslations();

  return (
    <>
      <Breadcrumb pageName={translations.breadcrumb} />
      <TxConfig />
    </>
  );
}

