"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { LogsPageContent } from "./logs-content";

export function LogsPageClient() {
  const translations = useUiTranslations();

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <Breadcrumb pageName={translations.sidebar.menuItems.logs} />
      <LogsPageContent />
    </div>
  );
}

