"use client";

import { useState } from "react";
import { AuthError } from "@/lib/auth-api";
import { confirmCouponUse } from "@/lib/discounts-api";
import { useUiTranslations } from "@/hooks/use-ui-translations";

interface CouponValidatorProps {
  onSuccess?: (code: string) => void;
  className?: string;
}

export function CouponValidator({ onSuccess, className = "" }: CouponValidatorProps) {
  const t = useUiTranslations().merchantRedemption;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || loading) return;

    setLoading(true);
    setFeedback(null);

    try {
      const result = await confirmCouponUse({ code: cleanCode });
      if (result.ok || (result as any).success) {
        setFeedback({ type: "success", message: t.redeemSuccess });
        setCode("");
        if (onSuccess) onSuccess(cleanCode);
      } else {
        setFeedback({ type: "error", message: t.redeemError });
      }
    } catch (err) {
      let message = t.redeemErrorGeneric;
      if (err instanceof AuthError) {
        if (err.statusCode === 404) message = t.redeemErrorNotFound;
        else if (err.statusCode === 400)
          message = (err.message && err.message.trim()) ? err.message : t.redeemErrorBadRequest;
        else if (err.statusCode === 403) message = t.redeemErrorForbidden;
        else if (err.message?.trim()) message = err.message;
      }
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-1 ${className}`}>
      <form onSubmit={handleValidate} className="flex flex-col gap-3">
        <div className="relative group">
          <input
            type="text"
            placeholder={t.redeemPlaceholder}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoFocus
            className="w-full bg-gray-50 border-2 border-slate-200 rounded-lg px-5 py-4 text-xl font-mono font-bold tracking-[0.2em] text-slate-800 focus:bg-white focus:border-slate-800 focus:outline-none transition-all dark:bg-dark-3 dark:border-dark-4 dark:text-white dark:focus:border-white uppercase placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400 placeholder:opacity-50"
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
             <kbd className="hidden sm:inline-flex h-6 items-center px-1.5 font-mono text-[10px] font-medium border border-slate-300 rounded text-slate-500 bg-white">ENTER</kbd>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="relative overflow-hidden group h-14 w-full bg-slate-900 text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-black transition-all disabled:bg-slate-200 disabled:text-slate-400 dark:bg-white dark:text-black dark:disabled:bg-dark-4 dark:disabled:text-dark-6"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
               <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white dark:border-slate-500 dark:border-t-black"></div>
               <span className="animate-pulse">PROCESSING...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 transform group-hover:scale-105 transition-transform">
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               {t.redeemBtn}
            </div>
          )}
        </button>
      </form>

      {/* Result feedback */}
      <div className="mt-6 min-h-[60px]">
        {feedback && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border-l-4 animate-fadeIn ${
            feedback.type === "success" 
              ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" 
              : "bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400"
          }`}>
            <div className={`p-1.5 rounded-full ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {feedback.type === 'success' ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <p className="text-sm font-bold tracking-tight">{feedback.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
