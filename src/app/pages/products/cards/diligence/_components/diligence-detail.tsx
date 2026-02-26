"use client";

import { Diligence } from "./diligence-list";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../_components/cards-translations";

interface DiligenceDetailProps {
  diligence: Diligence;
  onClose: () => void;
}

export function DiligenceDetail({ diligence, onClose }: DiligenceDetailProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].diligence;
  const locale = language === "es" ? "es-ES" : "en-US";

  const formatDateTime = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      hourCycle: "h23",
    }).format(new Date(date));

  const getStatusColor = (status: Diligence["status"]) => {
    switch (status) {
      case "approved":
        return "bg-[#219653]/[0.08] text-[#219653]";
      case "in_review":
        return "bg-[#FFA70B]/[0.08] text-[#FFA70B]";
      case "rejected":
        return "bg-[#D34053]/[0.08] text-[#D34053]";
      case "pending":
        return "bg-gray-100 text-gray-600 dark:bg-dark-3 dark:text-dark-6";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getRiskLevelColor = (riskLevel: Diligence["riskLevel"]) => {
    switch (riskLevel) {
      case "low":
        return "bg-[#219653]/[0.08] text-[#219653]";
      case "medium":
        return "bg-[#FFA70B]/[0.08] text-[#FFA70B]";
      case "high":
        return "bg-[#D34053]/[0.08] text-[#D34053]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl rounded-lg border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-dark-2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke p-6 dark:border-dark-3">
          <h2 className="text-2xl font-bold text-dark dark:text-white">{t.detailsTitle}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-dark-6 hover:bg-gray-100 dark:text-dark-6 dark:hover:bg-dark-3"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Status and Risk Level */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium capitalize",
                  getStatusColor(diligence.status)
                )}
              >
                {t.status[diligence.status] ?? diligence.status}
              </div>
              <div
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium capitalize",
                  getRiskLevelColor(diligence.riskLevel)
                )}
              >
                {t.risk[diligence.riskLevel]} {t.risk.suffix}
              </div>
            </div>

            {/* Cardholder Information */}
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3">
              <p className="mb-3 text-sm font-medium text-dark-6 dark:text-dark-6">{t.cardholderInformation}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{t.newForm.cardholderName}</p>
                  <p className="mt-1 text-dark dark:text-white">{diligence.cardholderName}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{t.newForm.cardNumber}</p>
                  <p className="mt-1 text-dark dark:text-white">{diligence.cardNumber}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="mb-3 text-sm font-medium text-dark-6 dark:text-dark-6">{t.timeline}</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{t.submittedDate}</p>
                  <p className="mt-1 text-dark dark:text-white">
                    {formatDateTime(diligence.submittedDate)}
                  </p>
                </div>
                {diligence.reviewedDate && (
                  <div>
                    <p className="text-xs text-dark-6 dark:text-dark-6">{t.reviewedDate}</p>
                    <p className="mt-1 text-dark dark:text-white">
                      {formatDateTime(diligence.reviewedDate)}
                    </p>
                  </div>
                )}
                {diligence.reviewer && (
                  <div>
                    <p className="text-xs text-dark-6 dark:text-dark-6">{t.reviewedBy}</p>
                    <p className="mt-1 text-dark dark:text-white">{diligence.reviewer}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div>
              <p className="mb-3 text-sm font-medium text-dark-6 dark:text-dark-6">{t.documents}</p>
              <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3">
                <p className="text-sm text-dark dark:text-white">
                  {typeof t.documentsSubmitted === 'function' ? t.documentsSubmitted(diligence.documents) : `${diligence.documents} ${t.filesSuffix}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-stroke p-6 dark:border-dark-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}

