"use client";

import { useState } from "react";
import { CLIENT_ID, NAME_KEY, SECRET_KEY } from "./keys-data";
import { useZelifyKeysTranslations } from "./use-zelifykeys-translations";

export function DataSection() {
  const translations = useZelifyKeysTranslations();
  
  // Real values from components (for copying) - read from shared file
  const accessData = {
    [translations.data.clientId]: CLIENT_ID,
    [translations.data.keyName]: NAME_KEY,
    [translations.data.secretKey]: SECRET_KEY,
  };

  // Masked values to display on screen
  const maskedAccessData = {
    [translations.data.clientId]: "****************",
    [translations.data.keyName]: "Sandbox - *******",
    [translations.data.secretKey]: "**********",
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Copy the real values
      await navigator.clipboard.writeText(JSON.stringify(accessData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  };

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
        {translations.data.title}
      </h3>
      <p className="text-sm leading-relaxed text-dark-6 dark:text-dark-6 mb-4">
        {translations.data.description}
      </p>
      <div className="relative mb-4">
        <div className="rounded bg-gray-1 dark:bg-dark-3 px-3 py-2 font-mono text-xs text-dark-6 dark:text-dark-6 whitespace-pre-wrap break-all">
          {JSON.stringify(maskedAccessData, null, 2)}
        </div>
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 rounded p-1 text-dark-6 transition-colors hover:bg-gray-100 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-3 dark:hover:text-white"
          aria-label={translations.data.copyToClipboard}
        >
          {copied ? (
            <svg
              className="h-4 w-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

