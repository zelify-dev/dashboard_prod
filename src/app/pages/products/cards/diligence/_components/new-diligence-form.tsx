"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Diligence } from "./diligence-list";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../_components/cards-translations";

interface NewDiligenceFormProps {
  onSave: (diligence: Omit<Diligence, "id" | "submittedDate">) => void;
  onCancel: () => void;
}

export function NewDiligenceForm({ onSave, onCancel }: NewDiligenceFormProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].diligence.newForm;
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿÑñ]+)+$/;
  const [formData, setFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    riskLevel: "low" as Diligence["riskLevel"],
    documents: 0,
  });
  const [errors, setErrors] = useState<{
    cardholderName?: string;
    cardNumber?: string;
  }>({});

  const sanitizeNameInput = (value: string) =>
    value
      .replace(/[^A-Za-zÀ-ÖØ-öø-ÿÑñ\s]/g, "")
      .replace(/\s{2,}/g, " ");

  const normalizeName = (value: string) =>
    sanitizeNameInput(value).trim().replace(/\s+/g, " ");

  const normalizeCardNumber = (value: string) => value.replace(/\D/g, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = normalizeName(formData.cardholderName);
    const normalizedCardNumber = normalizeCardNumber(formData.cardNumber);
    const nextErrors: {
      cardholderName?: string;
      cardNumber?: string;
    } = {};

    if (!nameRegex.test(normalizedName)) {
      nextErrors.cardholderName = t.validation.cardholderFullName;
    }

    if (normalizedCardNumber.length < 4) {
      nextErrors.cardNumber = t.validation.cardNumberMinDigits;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      ...formData,
      cardholderName: normalizedName,
      cardNumber: `**** ${normalizedCardNumber.slice(-4)}`,
      status: "pending",
    });
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ 
        zIndex: 2147483647, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)' 
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl rounded-lg border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-dark-2"
        style={{ zIndex: 2147483647 }}
        data-tour-id="tour-cards-diligence-create"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke p-6 dark:border-dark-3">
          <h2 className="text-2xl font-bold text-dark dark:text-white">{t.title}</h2>
          <button
            onClick={onCancel}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{t.cardholderName}</label>
              <input
                type="text"
                required
                value={formData.cardholderName}
                onChange={(e) => {
                  const value = sanitizeNameInput(e.target.value);
                  setFormData({ ...formData, cardholderName: value });
                  if (errors.cardholderName) {
                    setErrors((prev) => ({ ...prev, cardholderName: undefined }));
                  }
                }}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                placeholder={t.placeholders.cardholderName}
              />
              {errors.cardholderName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.cardholderName}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{t.cardNumber}</label>
              <input
                type="text"
                required
                value={formData.cardNumber}
                onChange={(e) => {
                  const value = normalizeCardNumber(e.target.value);
                  setFormData({ ...formData, cardNumber: value });
                  if (errors.cardNumber) {
                    setErrors((prev) => ({ ...prev, cardNumber: undefined }));
                  }
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={19}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                placeholder={t.placeholders.cardNumber}
              />
              {errors.cardNumber && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.cardNumber}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{t.riskLevel}</label>
              <select
                value={formData.riskLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    riskLevel: e.target.value as Diligence["riskLevel"],
                  })
                }
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="low">{cardsTranslations[language].diligence.risk.low}</option>
                <option value="medium">{cardsTranslations[language].diligence.risk.medium}</option>
                <option value="high">{cardsTranslations[language].diligence.risk.high}</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{t.numberOfDocuments}</label>
              <input
                type="number"
                min="0"
                required
                value={formData.documents}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    documents: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                {t.create}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(modalContent, document.body);
}
