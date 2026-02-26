"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { BehaviorAnalysisConfig } from "./behavior-analysis-config";
import { useBehaviorAnalysisTranslations } from "./use-behavior-analysis-translations";

export function BehaviorAnalysisPageContent() {
  const t = useBehaviorAnalysisTranslations();
  return (
    <>
      <Breadcrumb pageName={t.breadcrumb} />
      <BehaviorAnalysisConfig />
    </>
  );
}
