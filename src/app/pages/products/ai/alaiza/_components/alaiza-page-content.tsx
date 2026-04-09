"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { AlaizaConfig } from "./alaiza-config";
import { useAlaizaTranslations } from "./use-alaiza-translations";
import { useAlaizaContextStatus } from "@/hooks/use-alaiza-context-status";
import { OrgContextOnboardingModal } from "./org-context-onboarding-modal";

export function AlaizaPageContent() {
  const translations = useAlaizaTranslations();
  const {
    loading,
    hasContext,
    canSubmit,
    orgId,
    apiKey,
    apiSecret,
    refetch,
  } = useAlaizaContextStatus();

  // Mostrar el modal si ya terminó de cargar y la org NO tiene contexto generado
  const showModal = !loading && !hasContext && orgId && apiKey && apiSecret;

  return (
    <>
      {/* Popup de onboarding — obligatorio si no hay contexto */}
      {showModal && (
        <OrgContextOnboardingModal
          orgId={orgId}
          apiKey={apiKey}
          apiSecret={apiSecret}
          canSubmit={canSubmit}
          onSuccess={refetch}
        />
      )}

      <Breadcrumb pageName={translations.breadcrumb} />
      <AlaizaConfig />
    </>
  );
}
