"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { QRConfig } from "./qr-config";
import { useQRTranslations } from "./use-qr-translations";

export function QRPageContent() {
  const translations = useQRTranslations();

  return (
    <>
      <Breadcrumb pageName={translations.breadcrumb} />
      <QRConfig />
    </>
  );
}

