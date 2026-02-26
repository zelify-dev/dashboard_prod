"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ClientIdSection } from "./client-id";
import { ZelifySecretsSandbox } from "./zelify-secrets-sandbox";
import { ProductionSection } from "./production";
import { SecureKeysInfo } from "./secure-keys-info";
import { DataSection } from "./data";
import { useZelifyKeysTranslations } from "./use-zelifykeys-translations";

export function ZelifyKeysPageContent() {
  const translations = useZelifyKeysTranslations();

  return (
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
          <ProductionSection />
        </div>
        <div className="lg:col-span-1">
          <SecureKeysInfo />
          <hr className="my-4 border-t border-stroke dark:border-dark-3" />
          <DataSection />
        </div>
      </div>
    </div>
  );
}

