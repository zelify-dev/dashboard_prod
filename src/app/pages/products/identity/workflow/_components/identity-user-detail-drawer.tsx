"use client";

import { useState, useEffect } from "react";
import { getUserVerification, IdentityVerificationDetail } from "@/lib/identity-api";
import { useIdentityWorkflowTranslations } from "./use-identity-translations";
import { formatLocalDateTime } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

interface IdentityUserDetailDrawerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IdentityUserDetailDrawer({ userId, isOpen, onClose }: IdentityUserDetailDrawerProps) {
  const { userDetailDrawer: t } = useIdentityWorkflowTranslations();
  const [data, setData] = useState<IdentityVerificationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal para ver imagen en grande
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      setError(null);
      getUserVerification(userId)
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
          console.error("[IdentityUserDetailDrawer] Error fetching verification:", err);
          setError(err.message || "Error fetching details");
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!isOpen) {
      // Clear data when closing to avoid flickering when opening a new one
      setTimeout(() => setData(null), 300);
    }
  }, [isOpen, userId]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreenImageUrl) setFullscreenImageUrl(null);
        else onClose();
      }
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, fullscreenImageUrl]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[999] bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[1000] h-full w-full max-w-[500px] border-l border-stroke bg-white shadow-xl transition-transform duration-300 dark:border-dark-3 dark:bg-dark-2 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <h3 className="text-xl font-light text-dark">{t.title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-dark-6 hover:bg-gray-50"
              aria-label={t.close}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
 
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : error ? (
              <div className="rounded-xl bg-red-50 p-4 text-xs font-light text-red-600">
                {error}
              </div>
            ) : data ? (
              <div className="space-y-0 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
                {/* Minimalist Profile Summary */}
                <div className="px-6 py-6">
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-light text-dark-6">
                      {data.fullName?.charAt(0) || "U"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-normal tracking-tight text-dark">
                          {data.fullName}
                        </h4>
                        {data.status === "APPROVED" && (
                          <svg className="h-5 w-5 text-zelify-green bg-zelify-midnight rounded-full p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className={cn(
                        "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider",
                        data.status === "APPROVED" ? "bg-zelify-midnight text-zelify-green" :
                        data.status === "REJECTED" ? "bg-red-50 text-red-600 border border-red-200/40" :
                        "bg-gray-100 text-dark-6 border border-gray-200/50"
                      )}>
                        {t.statusLabels[data.status] || data.status}
                      </div>
                    </div>
                  </div>
                  
                  {data.errors && data.status === "REJECTED" && (
                    <div className="mt-4 text-xs font-light text-red-600">
                      {data.errors}
                    </div>
                  )}
                </div>
 
                {/* Personal Information */}
                <section className="border-t border-gray-100 px-6 py-6">
                  <h5 className="mb-4 text-[10px] font-light uppercase tracking-wider text-dark-6">
                    {t.personalInfo}
                  </h5>
                  <div className="grid grid-cols-2 gap-y-6">
                    <DetailItem label={t.labels.fullName} value={data.fullName} className="col-span-2" />
                    <DetailItem label={t.labels.email} value={data.email} className="col-span-2" />
                    {data.verifiedAt && (
                      <DetailItem label={t.verifiedAt} value={formatLocalDateTime(data.verifiedAt)} className="col-span-2" />
                    )}
                  </div>
                </section>
 
                {/* Document Data (OCR) */}
                {data.documentData && (
                  <section className="border-t border-gray-100 px-6 py-6">
                    <h5 className="mb-4 text-[10px] font-light uppercase tracking-wider text-dark-6">
                      {t.ocrData}
                    </h5>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <DetailItem label={t.labels.documentName} value={data.documentData.fullName} className="col-span-2" />
                      <DetailItem label={t.labels.documentNumber} value={data.documentData.documentNumber} />
                      <DetailItem
                        label={t.labels.documentType}
                        value={t.documentTypeLabels[data.documentData.documentType] || data.documentData.documentType}
                      />
                      <DetailItem label={t.labels.dateOfBirth} value={data.documentData.dateOfBirth} />
                      <DetailItem label={t.labels.dateOfExpiry} value={data.documentData.dateOfExpiry} />
                      <DetailItem label={t.labels.sex} value={data.documentData.sex} />
                      <DetailItem label={t.labels.nationality} value={data.documentData.nationality} />
                      <DetailItem label={t.labels.country} value={data.documentData.countryCode} className="col-span-2" />
                    </div>
                  </section>
                )}

                {/* Verification Scores - [NEW] Technical Section */}
                {data.scores && (
                  <section className="border-t border-gray-100 px-6 py-6">
                    <h5 className="mb-4 text-[10px] font-light uppercase tracking-wider text-dark-6">
                      VERIFICATION ANALYTICS
                    </h5>
                    <div className="space-y-6">
                      <ScoreLine label="OCR CONFIDENCE" score={data.scores.ocrConfidence} />
                      <ScoreLine label="FACIAL MATCH" score={data.scores.facialMatchScore} />
                      <ScoreLine label="LIVENESS SCORE" score={data.scores.livenessScore} />
                    </div>
                  </section>
                )}

                {/* Evidence (Images) */}
                {data.images && (
                  <section className="border-t border-gray-100 px-6 py-6">
                    <h5 className="mb-4 text-[10px] font-light uppercase tracking-wider text-dark-6">
                      VERIFICATION EVIDENCE
                    </h5>
                    <div className="grid grid-cols-3 gap-4">
                      <ImagePreview
                        label="Front Photo"
                        url={data.images.frontUrl}
                        onClick={() => setFullscreenImageUrl(data.images.frontUrl)}
                      />
                      <ImagePreview
                        label="Back Photo"
                        url={data.images.backUrl}
                        onClick={() => setFullscreenImageUrl(data.images.backUrl)}
                      />
                      <ImagePreview
                        label="Selfie / Liveness"
                        url={data.images.selfieUrl}
                        onClick={() => setFullscreenImageUrl(data.images.selfieUrl)}
                      />
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <p className="py-10 text-center text-xs font-light text-dark-6">{t.noData}</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Fullscreen Image */}
      {fullscreenImageUrl && (
        <div
          className="fixed inset-0 z-[3000] flex flex-col items-center justify-center bg-black/95 p-4 md:p-8 animate-in fade-in duration-300"
          onClick={() => setFullscreenImageUrl(null)}
        >
          {/* Main Modal Container */}
          <div 
            className="relative flex flex-col items-center max-h-[90vh] max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button (Premium Design) */}
            <div className="absolute -top-12 right-0 sm:-right-12 z-[3001]">
              <button
                className="group flex flex-col items-center gap-1.5 transition-transform active:scale-95 hover:scale-105"
                onClick={() => setFullscreenImageUrl(null)}
                aria-label={t.close}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-dark shadow-xl ring-1 ring-gray-100 transition-all">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-[9px] font-light uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                  {t.close}
                </span>
              </button>
            </div>

            {/* Image Container with Delimitation */}
            <div 
              className="relative max-h-[85vh] max-w-full overflow-hidden rounded-3xl border border-gray-800 bg-black shadow-2xl transition-all duration-700 animate-in zoom-in-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullscreenImageUrl}
                alt="Fullscreen Preview"
                className="h-auto max-h-[85vh] w-auto max-w-full object-contain select-none"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
            
            <div className="mt-8 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-1000">
              <p className="text-[10px] font-light uppercase tracking-widest text-white/30">
                 Pulsa <kbd className="mx-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-sans text-xs text-white/60">ESC</kbd> o haz clic fuera para salir
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5 min-w-0", className)}>
      <p className="text-[10px] font-light uppercase tracking-wider text-dark-6">
        {label}
      </p>
      <p className="text-sm font-normal text-dark break-all md:break-words">
        {value || "—"}
      </p>
    </div>
  );
}

function ScoreLine({ label, score }: { label: string; score: number | string | null }) {
  if (score === null || score === undefined) return null;
  const numericScore = Number(score);
  const isHigh = numericScore >= 90;
  
  return (
    <div className="flex justify-between items-center border-b border-gray-100/50 pb-2 last:border-0 last:pb-0">
      <p className="text-[10px] font-light uppercase tracking-wider text-dark-6">
        {label}
      </p>
      <span className={cn(
        "text-sm font-light",
        isHigh ? "text-green-600" : "text-dark"
      )}>
        {numericScore.toFixed(2)}%
      </span>
    </div>
  );
}

function ImagePreview({ label, url, onClick }: { label: string; url: string | null; onClick: () => void }) {
  if (!url) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-light uppercase text-dark-6">{label}</p>
      <div
        onClick={onClick}
        className="group relative cursor-zoom-in overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
           <div className="rounded-full bg-white/90 p-2 text-dark shadow-lg">
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
           </div>
        </div>
      </div>
    </div>
  );
}
