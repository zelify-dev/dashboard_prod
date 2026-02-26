"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { TransfersConfig } from "./_components/transfers-config";
import { useTransfersTranslations } from "./_components/use-transfers-translations";

export default function TransfersPage() {
  const translations = useTransfersTranslations();
  return (
    <div className="mx-auto w-full max-w-[970px]">
      <Breadcrumb pageName={translations.amount.tag} />
      <TransfersConfig />
    </div>
  );
}
