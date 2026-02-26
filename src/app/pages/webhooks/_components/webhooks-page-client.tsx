"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { WebhooksPageContent } from "./webhooks-content";

export function WebhooksPageClient() {
  const translations = useUiTranslations();

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={translations.sidebar.menuItems.webhooks} />
      <WebhooksPageContent />
    </div>
  );
}

