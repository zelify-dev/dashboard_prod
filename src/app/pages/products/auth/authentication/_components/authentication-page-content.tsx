"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { AuthenticationConfig } from "./authentication-config";
import { useAuthTranslations } from "./use-auth-translations";

export function AuthenticationPageContent() {
  const translations = useAuthTranslations();

  return (
    <>
      <Breadcrumb pageName={translations.breadcrumb} />
      <AuthenticationConfig />
    </>
  );
}
