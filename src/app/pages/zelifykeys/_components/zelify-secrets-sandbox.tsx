"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listApiKeys,
  getApiKeySecret,
  rotateApiKeys,
  maskApiKey,
  type ApiKeyItem,
} from "@/lib/organization-api-keys";
import { getStoredOrganization } from "@/lib/auth-api";
import { useZelifyKeysTranslations } from "./use-zelifykeys-translations";
import { useZelifyKeysData } from "./zelify-keys-data-context";
import { useLanguage } from "@/contexts/language-context";

const MASKED_PLACEHOLDER = "••••••••••••••••••••••••••••••";

function formatIssuedDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ZelifySecretsSandbox() {
  const translations = useZelifyKeysTranslations();
  const { language } = useLanguage();
  const { setKeysData } = useZelifyKeysData();
  const locale = language === "es" ? "es-ES" : "en-US";
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [currentKey, setCurrentKey] = useState<ApiKeyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [revealingSecret, setRevealingSecret] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    setKeysData(currentKey?.api_key ?? null, revealedSecret);
  }, [currentKey?.api_key, revealedSecret, setKeysData]);

  const fetchKeys = useCallback(async () => {
    setError(null);
    setLoading(true);
    const orgId = getStoredOrganization()?.id ?? null;
    try {
      const list = await listApiKeys(orgId);
      setKeys(list);
      const active = list.find((k) => k.status === "ACTIVE") ?? list[0] ?? null;
      setCurrentKey(active);
    } catch (e) {
      setError(translations.zelifySecrets.errorLoading);
      setKeys([]);
      setCurrentKey(null);
      setRevealedSecret(null);
    } finally {
      setLoading(false);
    }
  }, [translations.zelifySecrets.errorLoading]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCopyName = async () => {
    if (!currentKey?.api_key) return;
    await navigator.clipboard.writeText(currentKey.api_key);
    setCopiedName(true);
    setTimeout(() => setCopiedName(false), 2000);
  };

  const handleCopySecret = async () => {
    if (revealedSecret) {
      await navigator.clipboard.writeText(revealedSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleToggleSecret = async () => {
    if (!currentKey) return;
    if (showSecret) {
      setShowSecret(false);
      setRevealedSecret(null);
      return;
    }
    setRevealingSecret(true);
    const orgId = getStoredOrganization()?.id ?? null;
    try {
      const { api_secret } = await getApiKeySecret(currentKey.id, orgId);
      setRevealedSecret(api_secret);
      setShowSecret(true);
    } catch {
      setError(translations.zelifySecrets.errorLoading);
    } finally {
      setRevealingSecret(false);
    }
  };

  const confirmRotate = async () => {
    setRotating(true);
    setError(null);
    const orgId = getStoredOrganization()?.id ?? null;
    try {
      const { api_secret } = await rotateApiKeys(orgId);
      await fetchKeys();
      setRevealedSecret(api_secret);
      setShowSecret(true);
      setShowRotateConfirm(false);
      setSuccessMessage(translations.zelifySecrets.rotateConfirm.successMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : translations.zelifySecrets.errorLoading);
    } finally {
      setRotating(false);
    }
  };

  if (loading && keys.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
        <p className="text-dark-6 dark:text-dark-6">{translations.zelifySecrets.loading}</p>
      </div>
    );
  }

  if (error && keys.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
        <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => fetchKeys()}
          className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        >
          {translations.zelifySecrets.retry}
        </button>
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
        <h3 className="text-lg font-semibold text-dark dark:text-white">
          {translations.zelifySecrets.title}
        </h3>
        <p className="mt-2 text-dark-6 dark:text-dark-6">{translations.zelifySecrets.noKeys}</p>
        <button
          type="button"
          onClick={confirmRotate}
          disabled={rotating}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {rotating ? translations.zelifySecrets.loading : translations.zelifySecrets.generateKey}
        </button>
      </div>
    );
  }

  const displayKeyName = currentKey ? maskApiKey(currentKey.api_key) : "";
  const displaySecret = showSecret && revealedSecret ? revealedSecret : MASKED_PLACEHOLDER;

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
          onClick={() => setShowRotateConfirm(true)}
          disabled={rotating}
          className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 disabled:opacity-50"
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

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          {successMessage}
        </div>
      )}

      {showRotateConfirm && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="mb-2 text-sm font-medium text-dark dark:text-white">
            {translations.zelifySecrets.rotateConfirm.title}
          </p>
          <p className="mb-3 text-xs text-dark-6 dark:text-dark-6">
            {translations.zelifySecrets.rotateWarning}
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmRotate}
              disabled={rotating}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {rotating ? translations.zelifySecrets.loading : translations.zelifySecrets.rotateConfirm.yesRotate}
            </button>
            <button
              onClick={() => setShowRotateConfirm(false)}
              disabled={rotating}
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
              value={displayKeyName}
              readOnly
              className="w-full rounded-lg border border-stroke bg-gray-2 px-4 py-3 pr-12 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark dark:text-white"
            />
            <button
              onClick={handleCopyName}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
              aria-label={translations.zelifySecrets.copyToClipboard}
            >
              {copiedName ? (
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
              value={displaySecret}
              readOnly
              className="w-full rounded-lg border border-stroke bg-gray-2 px-4 py-3 pr-24 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark dark:text-white"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              <button
                onClick={handleToggleSecret}
                disabled={revealingSecret}
                className="text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white disabled:opacity-50"
                aria-label={showSecret ? translations.zelifySecrets.hide : translations.zelifySecrets.show}
              >
                {revealingSecret ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : showSecret ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleCopySecret}
                disabled={!revealedSecret}
                className="text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white disabled:opacity-50"
                aria-label={translations.zelifySecrets.copyToClipboard}
                title={!revealedSecret ? translations.zelifySecrets.revealToCopy : undefined}
              >
                {copiedSecret ? (
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-dark-6 dark:text-dark-6">
          <p>
            {translations.zelifySecrets.issuedOn}{" "}
            {currentKey?.created_at ? formatIssuedDate(currentKey.created_at, locale) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
