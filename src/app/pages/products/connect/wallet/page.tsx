"use client";
import React from "react";
import { useLanguage } from "@/contexts/language-context";
import { connectTranslations } from "@/app/pages/products/connect/bank-account-linking/_components/connect-translations";

export default function WalletPage() {
  const { language } = useLanguage();
  const t = connectTranslations[language].wallet;

  return (
    <div className="mx-auto w-full max-w-[420px] px-4">
      <div className="pt-8">
        <h1 className="text-2xl font-bold text-dark dark:text-white">{t.title}</h1>
        <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">{t.desc}</p>
      </div>

      <div className="mt-6 rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
        <div className="rounded-md bg-gradient-to-br from-[#faf8ff] to-[#f3f0ff] p-6">
          <div className="text-sm text-dark-6">{t.totalBalanceLabel}</div>
          <div className="mt-4 text-3xl font-extrabold text-dark dark:text-white">{t.currencyPrefix} 0.00</div>
        </div>

        <button className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white">
          {t.depositButton}
        </button>
      </div>

      <div className="mt-8 rounded-lg bg-white p-4 shadow-sm dark:bg-dark-2">
        <div className="text-sm text-dark-6">{t.connectedBankLabel}</div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-dark-3 flex items-center justify-center">
            {/* Placeholder icon */}
            <svg className="h-5 w-5 text-dark-7" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-dark dark:text-white">Bancolombia</div>
            <div className="text-xs text-dark-6">{t.accountLinked}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
