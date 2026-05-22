"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { canAccessZelifyKeys } from "@/lib/auth-api";
import { useOrganizationScopes } from "@/hooks/use-organization-scopes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClientIdSection } from "./client-id";
import { ZelifySecretsSandbox } from "./zelify-secrets-sandbox";
import { DataSection } from "./data";
import { useZelifyKeysTranslations } from "./use-zelifykeys-translations";
import { ZelifyKeysDataProvider } from "./zelify-keys-data-context";

export function ZelifyKeysPageContent() {
  const translations = useZelifyKeysTranslations();
  const router = useRouter();
  const scopes = useOrganizationScopes();
  const canViewZelifyKeys = canAccessZelifyKeys(scopes);

  useEffect(() => {
    if (scopes !== null && !canViewZelifyKeys) {
      router.replace("/");
    }
  }, [canViewZelifyKeys, router, scopes]);

  if (scopes === null || !canViewZelifyKeys) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <ZelifyKeysDataProvider>
      <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName={translations.breadcrumb} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[26px] font-bold leading-[30px] text-dark dark:text-white">
          {translations.pageTitle}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ClientIdSection />
          <ZelifySecretsSandbox />
        </div>
        <div className="lg:col-span-1">
          <DataSection />
        </div>
      </div>
    </div>
    </ZelifyKeysDataProvider>
  );
}
