"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { DeviceInformationContent } from "./device-information-content";
import { useDeviceInfoTranslations } from "./use-device-info-translations";

export function DeviceInformationPageContent() {
  const translations = useDeviceInfoTranslations();

  return (
    <>
      <Breadcrumb pageName={translations.pageTitle} />
      <DeviceInformationContent />
    </>
  );
}
