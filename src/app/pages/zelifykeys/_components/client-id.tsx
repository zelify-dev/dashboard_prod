"use client";

import { useState } from "react";
import { CLIENT_ID } from "./keys-data";
import { useZelifyKeysTranslations } from "./use-zelifykeys-translations";

export function ClientIdSection() {
  const translations = useZelifyKeysTranslations();
  const [copied, setCopied] = useState(false);
  const clientId = CLIENT_ID;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(clientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-dark dark:text-white">
          {translations.clientId.title}
        </h3>
      </div>
      <div className="relative">
        <input
          type="text"
          value={clientId}
          readOnly
          className="w-full rounded-lg border border-stroke bg-gray-2 px-4 py-2.5 pr-12 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark dark:text-white"
        />
        <button
          onClick={handleCopy}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-dark-6 transition-colors hover:bg-gray-100 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-3 dark:hover:text-white"
          aria-label={translations.clientId.copyToClipboard}
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

