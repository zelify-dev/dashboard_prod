"use client";

import { useState } from "react";
import { useTour } from "@/contexts/tour-context";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import { useLanguage } from "@/contexts/language-context";
import { TOUR_TRANSLATIONS } from "./tour-translations";
import type { TourStep } from "@/contexts/tour-context";

type ProductKey = "auth" | "aml" | "identity" | "connect" | "cards" | "payments" | "tx" | "ai" | "discounts";

const SIDEBAR_STEP: Record<"es" | "en", TourStep> = {
  es: {
    id: "sidebar",
    target: "tour-sidebar",
    title: "Sección de productos",
    content: "Se muestran los productos de zelify",
    position: "right" as const,
  },
  en: {
    id: "sidebar",
    target: "tour-sidebar",
    title: "Products Section",
    content: "Zelify products are displayed here",
    position: "right" as const,
  },
};

// Código antiguo eliminado - ahora se usa TOUR_TRANSLATIONS desde tour-translations.ts

export function TourModal() {
  const { isModalOpen, closeModal, startTour } = useTour();
  const translations = useUiTranslations();
  const { language } = useLanguage();
  const tourTranslations = useLanguageTranslations(TOUR_TRANSLATIONS);
  const modalRef = useClickOutside<HTMLDivElement>(() => closeModal());
  const [showProductSelection, setShowProductSelection] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<ProductKey>>(new Set());

  const productLabels: Record<ProductKey, string> = {
    auth: translations.sidebar.menuItems.auth,
    aml: translations.sidebar.menuItems.aml,
    identity: translations.sidebar.menuItems.identity,
    connect: translations.sidebar.menuItems.connect,
    cards: translations.sidebar.menuItems.cards,
    payments: translations.sidebar.menuItems.payments,
    tx: translations.sidebar.menuItems.tx,
    ai: translations.sidebar.menuItems.ai,
    discounts: translations.sidebar.menuItems.discountsCoupons,
  };

  const toggleProduct = (product: ProductKey) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(product)) {
        newSet.delete(product);
      } else {
        newSet.add(product);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedProducts(new Set(Object.keys(tourTranslations) as ProductKey[]));
  };

  const deselectAll = () => {
    setSelectedProducts(new Set());
  };

  const handleContinue = () => {
    if (selectedProducts.size === 0) {
      return;
    }
    setShowProductSelection(false);
  };

  const handleStartTour = () => {
    closeModal();
    setTimeout(() => {
      const tourSteps: TourStep[] = [
        SIDEBAR_STEP[language],
      ];

      // Agregar pasos de cada producto seleccionado
      selectedProducts.forEach((product) => {
        tourSteps.push(...tourTranslations[product]);
      });

      startTour(tourSteps);
    }, 300);
  };

  const handleBack = () => {
    setShowProductSelection(true);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-dark-2"
      >
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {showProductSelection ? (
          <>
            <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-dark dark:text-white">
                {translations.tourModal.selectProductsTitle}
          </h2>
          <p className="text-sm text-dark-6 dark:text-dark-6">
                {translations.tourModal.selectProductsDescription}
          </p>
        </div>

            <div className="mb-4 flex gap-2">
              <button
                onClick={selectAll}
                className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-dark transition-colors hover:bg-gray-2 dark:border-stroke-dark dark:text-white dark:hover:bg-dark-3"
              >
                {translations.tourModal.selectAll}
              </button>
              <button
                onClick={deselectAll}
                className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-dark transition-colors hover:bg-gray-2 dark:border-stroke-dark dark:text-white dark:hover:bg-dark-3"
              >
                {translations.tourModal.deselectAll}
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {(Object.keys(tourTranslations) as ProductKey[]).map((product) => (
                <button
                  key={product}
                  onClick={() => toggleProduct(product)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${selectedProducts.has(product)
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-stroke hover:border-primary/50 dark:border-stroke-dark"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 ${selectedProducts.has(product)
                        ? "border-primary bg-primary"
                        : "border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {selectedProducts.has(product) && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-dark dark:text-white">
                      {productLabels[product]}
                    </span>
                  </div>
                </button>
              ))}
            </div>

        <div className="flex gap-3">
          <button
            onClick={closeModal}
            className="flex-1 rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-2 dark:border-stroke-dark dark:text-white dark:hover:bg-dark-3"
          >
            {translations.tourModal.cancel}
          </button>
              <button
                onClick={handleContinue}
                disabled={selectedProducts.size === 0}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {translations.tourModal.continue}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="mb-2 text-2xl font-bold text-dark dark:text-white">
                {translations.tourModal.welcomeTitle}
              </h2>
              <p className="text-sm text-dark-6 dark:text-dark-6">
                {translations.tourModal.welcomeDescription}
              </p>
              <div className="mt-3">
                <p className="text-xs font-medium text-dark dark:text-white mb-2">
                  {translations.tourModal.selectedProducts}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedProducts).map((product) => (
                    <span
                      key={product}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/20"
                    >
                      {productLabels[product]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-2 dark:border-stroke-dark dark:text-white dark:hover:bg-dark-3"
              >
                {translations.tourModal.back}
              </button>
          <button
            onClick={handleStartTour}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            {translations.tourModal.startTour}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
