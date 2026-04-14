"use client";

import { useState } from "react";
import { confirmCouponUse } from "@/lib/discounts-api";
import { useUiTranslations } from "@/hooks/use-ui-translations";

interface CouponValidatorProps {
  onSuccess?: () => void;
  className?: string;
}

export function CouponValidator({ onSuccess, className = "" }: CouponValidatorProps) {
  const t = useUiTranslations().merchantRedemption;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setFeedback(null);

    try {
      const result = await confirmCouponUse({ code: code.trim() });
      if (result.ok || (result as any).success) {
        setFeedback({ type: "success", message: t.redeemSuccess });
        setCode("");
        if (onSuccess) onSuccess();
      } else {
        setFeedback({ type: "error", message: t.redeemError });
      }
    } catch (err) {
      setFeedback({ type: "error", message: t.redeemError });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-dark-2 ${className}`}>
      <div className="border-b border-stroke bg-gray-1 px-6 py-4 dark:border-dark-3 dark:bg-dark-3/50">
        <h3 className="text-sm font-bold text-dark dark:text-white">{t.redeemTitle}</h3>
        <p className="mt-1 text-[10px] text-dark-6 uppercase tracking-wider">{t.redeemSubtitle}</p>
      </div>
      <div className="p-6">
        <form onSubmit={handleValidate} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t.redeemPlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm font-mono focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3/30 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {t.redeemBtn}
          </button>
        </form>

        {feedback && (
          <div className={`mt-4 rounded-xl p-4 transition-all animate-fadeIn ${
            feedback.type === "success" 
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}>
            <p className="text-xs font-bold leading-none">{feedback.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
