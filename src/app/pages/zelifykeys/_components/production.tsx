"use client";

import { useZelifyKeysTranslations } from "./use-zelifykeys-translations";

export function ProductionSection() {
  const translations = useZelifyKeysTranslations();

  return (
    <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-dark-2">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <svg
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-dark dark:text-white">
          {translations.production.title}
        </h3>
      </div>
      <div className="flex items-center justify-between">
        <button className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3">
          {translations.production.requestAccess}
        </button>
      </div>
    </div>
  );
}
