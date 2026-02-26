"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { NotificationsDomainsPanel } from "./notifications-domains-panel";
import { useNotificationsTranslations } from "./use-notifications-translations";

export function NotificationsDomainsPageContent() {
  const translations = useNotificationsTranslations();

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <Breadcrumb pageName={translations.domainsBreadcrumb} />
      <NotificationsDomainsPanel />
    </div>
  );
}
