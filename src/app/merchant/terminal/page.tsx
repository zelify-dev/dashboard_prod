"use client";

import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ActorRouteGuard } from "@/components/Dashboard/actor-route-guard";
import { CouponValidator } from "@/components/Dashboard/coupon-validator";
import { useLanguage } from "@/contexts/language-context";
import { useUiTranslations } from "@/hooks/use-ui-translations";

interface RedemptionLog {
  id: string;
  code: string;
  timestamp: string;
}

export default function MerchantTerminalPage() {
  const { language } = useLanguage();
  const t = useUiTranslations().terminalPage;
  const [history, setHistory] = useState<RedemptionLog[]>([]);

  const handleSuccess = (code: string) => {
    const entry: RedemptionLog = {
      id: Math.random().toString(36).substr(2, 9),
      code,
      timestamp: new Date().toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setHistory(prev => [entry, ...prev].slice(0, 10));
  };

  return (
    <ActorRouteGuard actor="merchant">
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        <Breadcrumb pageName={t.breadcrumb} />

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Main Validation Area */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-dark-4 dark:bg-dark-2">
              <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-dark-4 dark:bg-dark-3/30">
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.title}</h1>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-dark-6 max-w-md">
                   {t.subtitle}
                </p>
              </div>
              
              <div className="p-8 pb-12">
                <div className="max-w-xl">
                  <CouponValidator onSuccess={handleSuccess} className="!p-0" />
                </div>
              </div>

              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 dark:bg-dark-3/20 dark:border-dark-4">
                 <p className="text-[10px] font-mono text-slate-400 dark:text-dark-6 uppercase tracking-widest">System Status: Secured Connection · End-to-End Encrypted</p>
              </div>
            </div>
          </div>

          {/* Activity Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-dark-4 dark:bg-dark-2">
               <h2 className="mb-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] border-b border-slate-100 pb-3 dark:border-dark-4">
                 {t.activityLog}
               </h2>
               
               <div className="space-y-3">
                 {history.length > 0 ? history.map((item) => (
                   <div key={item.id} className="group flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 dark:border-dark-4 dark:bg-dark-3/30 animate-slideIn">
                      <div className="flex flex-col">
                         <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-widest">{item.code}</span>
                         <span className="text-[10px] text-slate-400 font-medium">{item.timestamp}</span>
                      </div>
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                         <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                   </div>
                 )) : (
                   <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                      <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs font-bold uppercase tracking-widest">{t.noActivity}</p>
                   </div>
                 )}
               </div>
            </div>

            <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-dark-4 flex items-center gap-4 opacity-70">
               <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-dark-3 flex items-center justify-center text-slate-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <p className="text-[10px] font-medium leading-relaxed text-slate-500 dark:text-dark-6">
                  {t.claimCodeHint}
               </p>
            </div>
          </div>
        </div>
      </div>
    </ActorRouteGuard>
  );
}
