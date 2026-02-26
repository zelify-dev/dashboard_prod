"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FinancialEducationConfig } from "./financial-education-config";
import { useFinancialEducationTranslations } from "./use-financial-education-translations";

export function FinancialEducationPageContent() {
  const t = useFinancialEducationTranslations();
  return (
    <>
      <Breadcrumb pageName={t.breadcrumb} />
      <FinancialEducationConfig />
    </>
  );
}
