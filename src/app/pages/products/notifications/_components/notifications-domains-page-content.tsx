"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { NotificationsDomainsPanel } from "./notifications-domains-panel";
import { useNotificationsTranslations } from "./use-notifications-translations";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { isOrganizationOnboardingVerified } from "@/lib/auth-api";

export function NotificationsDomainsPageContent() {
  const translations = useNotificationsTranslations();
  const ui = useUiTranslations();
  const { organization, loading: orgLoading } = useOrganizationCountry();
  const canUseWebhooks = isOrganizationOnboardingVerified(organization);
  const locked = orgLoading || !canUseWebhooks;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <Breadcrumb pageName={translations.domainsBreadcrumb} />
      {orgLoading && (
        <p className="text-sm text-dark-6 dark:text-dark-6">{ui.webhooksPage.loadingAccess}</p>
      )}
      {!orgLoading && !canUseWebhooks && (
        <div
          role="status"
          className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-dark dark:text-white/90 dark:border-primary/40 dark:bg-primary/15"
        >
          {ui.webhooksPage.lockedUntilOnboarding}
        </div>
      )}

      {!locked ? <NotificationsDomainsPanel /> : null}
    </div>
  );
}
