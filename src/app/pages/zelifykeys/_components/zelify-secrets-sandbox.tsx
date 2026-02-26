"use client";

import { useState } from "react";
import { NAME_KEY, SECRET_KEY, ISSUED_DATE } from "./keys-data";
import { useZelifyKeysTranslations } from "./use-zelifykeys-translations";

export function ZelifySecretsSandbox() {
  const translations = useZelifyKeysTranslations();
  const [copiedName, setCopiedName] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  
  const nameKey = NAME_KEY;
  const secretKey = SECRET_KEY;
  const issuedDate = ISSUED_DATE;

  const handleCopyName = async () => {
    await navigator.clipboard.writeText(nameKey);
    setCopiedName(true);
    setTimeout(() => setCopiedName(false), 2000);
  };

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleRotate = () => {
    setShowRotateConfirm(true);
  };

  const confirmRotate = () => {
    // Here would be the logic to rotate the key
    setShowRotateConfirm(false);
    alert(translations.zelifySecrets.rotateConfirm.successMessage);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark dark:text-white">
              {translations.zelifySecrets.title}
            </h3>
            <p className="text-sm text-dark-6 dark:text-dark-6">{translations.zelifySecrets.sandbox}</p>
          </div>
        </div>
        <button
          onClick={handleRotate}
          className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
        >
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {translations.zelifySecrets.rotate}
        </button>
      </div>

      {showRotateConfirm && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="mb-3 text-sm font-medium text-dark dark:text-white">
            {translations.zelifySecrets.rotateConfirm.title}
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmRotate}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              {translations.zelifySecrets.rotateConfirm.yesRotate}
            </button>
            <button
              onClick={() => setShowRotateConfirm(false)}
              className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
            >
              {translations.zelifySecrets.rotateConfirm.cancel}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            {translations.zelifySecrets.keyName}
          </label>
          <div className="relative">
            <input
              type="text"
              value={nameKey}
              readOnly
              className="w-full rounded-lg border border-stroke bg-gray-2 px-4 py-3 pr-12 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark dark:text-white"
            />
            <button
              onClick={handleCopyName}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
              aria-label={translations.zelifySecrets.copyToClipboard}
            >
              {copiedName ? (
                <svg
                  className="h-5 w-5 text-green-500"
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
                  className="h-5 w-5"
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

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            {translations.zelifySecrets.secretKey}
          </label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={secretKey}
              readOnly
              className="w-full rounded-lg border border-stroke bg-gray-2 px-4 py-3 pr-24 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark dark:text-white"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
                aria-label={showSecret ? translations.zelifySecrets.hide : translations.zelifySecrets.show}
              >
                {showSecret ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={handleCopySecret}
                className="text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
                aria-label={translations.zelifySecrets.copyToClipboard}
              >
                {copiedSecret ? (
                  <svg
                    className="h-5 w-5 text-green-500"
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
                    className="h-5 w-5"
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
        </div>

        <div className="space-y-2 text-sm text-dark-6 dark:text-dark-6">
          <p>{translations.zelifySecrets.issuedOn} {issuedDate}</p>
          <a
            href="#"
            className="text-primary hover:underline dark:text-blue-400"
          >
            {translations.zelifySecrets.compromisedQuestion}
          </a>
        </div>
      </div>
    </div>
  );
}

