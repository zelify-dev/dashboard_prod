"use client";

import { useZelifyKeysTranslations } from "./use-zelifykeys-translations";

export function SecureKeysInfo() {
  const translations = useZelifyKeysTranslations();

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
      <div className="mb-4 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <svg
            className="h-6 w-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      </div>
      <h3 className="mb-4 text-center text-lg font-semibold text-dark dark:text-white">
        {translations.secureKeysInfo.title}
      </h3>
      <p className="text-sm leading-relaxed text-dark-6 dark:text-dark-6">
        {translations.secureKeysInfo.description}
      </p>
      <button className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3" >
        {translations.secureKeysInfo.viewDocumentation}
      </button>
    </div>
  );
}

