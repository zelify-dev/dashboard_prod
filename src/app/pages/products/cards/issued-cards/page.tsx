"use client";

import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../_components/cards-translations";
import { IssuedCardsTable, IssuedCard, mockIssuedCards } from "./_components/issued-cards-table";

export default function IssuedCardsPage() {
  const { language } = useLanguage();
  const t = cardsTranslations[language].issuedCards;
  const [cards] = useState<IssuedCard[]>(mockIssuedCards);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={t.pageTitle} />
      <div className="mt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-white">{t.title}</h2>
          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">{t.desc}</p>
        </div>
        <IssuedCardsTable cards={cards} />
      </div>
    </div>
  );
}
