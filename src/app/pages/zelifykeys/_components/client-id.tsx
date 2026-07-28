"use client";

import { useState } from "react";
import { useClientId } from "./use-client-id";
import { useZelifyKeysTranslations } from "./use-zelifykeys-translations";

export function ClientIdSection() {
  const translations = useZelifyKeysTranslations();
  const [copied, setCopied] = useState(false);
  const clientId = useClientId();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(clientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        <svg
          className="h-4 w-4 text-dark-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        <h3 className="text-sm font-normal text-dark">
          {translations.clientId.title}
        </h3>
      </div>
      <div className="relative">
        <input
          type="text"
          value={clientId}
          readOnly
          className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2 pr-12 text-sm font-light text-dark outline-none"
        />
        <button
          onClick={handleCopy}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-dark-6 transition hover:bg-gray-50 hover:text-dark"
          aria-label={translations.clientId.copyToClipboard}
        >
          {copied ? (
            <svg
              className="h-4 w-4 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

