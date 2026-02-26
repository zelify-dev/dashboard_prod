"use client";

import { Transaction } from "./transactions-table";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../_components/cards-translations";

interface TransactionDetailProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetail({ transaction, onClose }: TransactionDetailProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].transactions.detail;
  const tTx = cardsTranslations[language].transactions;

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400";
      case "declined":
        return "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400";
      case "refunded":
        return "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 transition-all duration-300">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-[#1A1A1A] dark:shadow-black/50"
        data-tour-id="tour-cards-transactions-detail"
      >
        {/* Header Actions */}
        <div className="absolute right-4 top-4 z-10">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 pb-10">
          {/* Header / Hero Section */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl dark:bg-white/5">
              {/* Merchant Icon Placeholder - could be improved with dynamic icons */}
              <span className="opacity-50">🛒</span>
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              {transaction.merchant}
            </h2>

            <div className="mb-4 flex flex-col items-center">
              <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                {formatAmount(transaction.amount, transaction.currency)}
              </span>
              <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {dayjs(transaction.date).format("MMM DD, HH:mm")}
              </span>
            </div>

            <div className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              getStatusColor(transaction.status)
            )}>
              {tTx.status[transaction.status] ?? transaction.status}
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/5">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.cardInfo}</span>
              <div className="flex items-start flex-col gap-1 text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{transaction.cardholderName}</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-500">•••• {transaction.cardNumber.slice(-4)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/5">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.category}</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {tTx.categories[transaction.category] ?? transaction.category}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/5">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.type}</span>
              <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                {tTx.types[transaction.type] ?? transaction.type}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.transactionId}</span>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-500">{transaction.id}</span>
            </div>
          </div>
        </div>

        {/* Decorative / Branding footer (optional) */}
        <div className="bg-gray-50 px-8 py-4 text-center dark:bg-white/5">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Zelify Business Cards
          </p>
        </div>
      </div>
    </div>
  );
}
