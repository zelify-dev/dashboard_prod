"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { BasicServicesConfig } from "./_components/basic-services-config";
import { useBasicServicesTranslations } from "./_components/use-basic-services-translations";

export default function BasicServicesPage() {
  const translations = useBasicServicesTranslations();
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={translations.pageTitle} />
      <BasicServicesConfig />
    </div>
  );
}
