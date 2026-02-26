"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CustomKeysConfig } from "./custom-keys-config";
import { useCustomKeysTranslations } from "./use-custom-keys-translations";

export function CustomKeysPageContent() {
  const translations = useCustomKeysTranslations();

  return (
    <>
      <Breadcrumb pageName={translations.breadcrumb} />
      <CustomKeysConfig />
    </>
  );
}

