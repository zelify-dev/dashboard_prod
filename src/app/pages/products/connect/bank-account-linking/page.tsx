"use client";
import { useLanguage } from "@/contexts/language-context";
import { connectTranslations } from "./_components/connect-translations";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { BankAccountConfig } from "./_components/bank-account-config";

export default function BankAccountLinkingPage() {
    const { language } = useLanguage();
    const t = connectTranslations[language];
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={t.pageTitle} />
      {/* Aplica t.[...] en todos los textos visibles del componente y sus hijos, por ejemplo: t.backToList, t.newLink, t.linksTitle, t.linksDesc, etc. */}
      <BankAccountConfig />
    </div>
  );
}

