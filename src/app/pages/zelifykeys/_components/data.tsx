"use client";

import { useState } from "react";
import { useZelifyKeysTranslations } from "./use-zelifykeys-translations";
import { useZelifyKeysData } from "./zelify-keys-data-context";
import { maskApiKey } from "@/lib/organization-api-keys";

const MASKED = "****************";

export function DataSection() {
  const translations = useZelifyKeysTranslations();
  const { apiKey, apiSecret } = useZelifyKeysData();

  // Valores reales para copiar (Key Name + Secret; la org se resuelve por token)
  const accessDataToCopy = {
    [translations.data.keyName]: apiKey ?? MASKED,
    [translations.data.secretKey]: apiSecret ?? MASKED,
  };

  // Siempre enmascarado en pantalla
  const maskedAccessData = {
    [translations.data.keyName]: apiKey ? maskApiKey(apiKey) : "*******",
    [translations.data.secretKey]: "**********",
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(accessDataToCopy, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6">
      <div className="mb-3 text-center">
        <svg
          className="mx-auto h-5 w-5 text-dark-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-center text-sm font-normal text-dark">
        {translations.data.title}
      </h3>
      <p className="mb-4 text-center text-xs font-light leading-relaxed text-dark-6">
        {translations.data.description}
      </p>
      <div className="relative mb-4">
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 font-mono text-[11px] font-light text-dark-6 whitespace-pre-wrap break-all">
          {JSON.stringify(maskedAccessData, null, 2)}
        </div>
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 rounded-lg p-1 text-dark-6 transition hover:bg-gray-100 hover:text-dark"
          aria-label={translations.data.copyToClipboard}
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

