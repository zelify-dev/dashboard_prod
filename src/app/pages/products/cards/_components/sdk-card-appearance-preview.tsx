"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CardDesignConfig } from "../issuing/design/_components/card-editor";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "./cards-translations";

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "").slice(0, 6);
  if (h.length !== 6) return 0.2;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function cardFaceLuminance(cfg: CardDesignConfig): number {
  if (cfg.colorType === "solid") return hexLuminance(cfg.solidColor);
  const vals = cfg.gradientColors.map(hexLuminance);
  if (vals.length === 0) return 0.2;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/** Máscara tipo cuadraditos blancos (como en la referencia), no puntos. */
function MaskedPanSquares({ className }: { className?: string }) {
  const group = (offset: number) => (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={offset + i}
          className="inline-block size-[5px] shrink-0 rounded-[0.5px] bg-current opacity-95"
        />
      ))}
    </span>
  );
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[10px] text-[17px] leading-none",
        className
      )}
    >
      {group(0)}
      {group(4)}
      {group(8)}
      <span className="ml-1 font-mono text-[17px] font-semibold tracking-[0.22em]">
        8485
      </span>
    </span>
  );
}

function ZelifyMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <rect
        x="5"
        y="5"
        width="22"
        height="22"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M11 21 L21 11 M21 11 h-5 M21 11 v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SdkCardAppearancePreviewProps = {
  config: CardDesignConfig;
  brandLogoUrl?: string | null;
};

const DEMO_PAN_FULL = "5156 1234 5678 8485";

function formatBalanceUsd(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function SdkCardAppearancePreview({
  config,
  brandLogoUrl,
}: SdkCardAppearancePreviewProps) {
  const { language } = useLanguage();
  const previewT = cardsTranslations[language].configurator.preview;
  const [showFullPan, setShowFullPan] = useState(false);

  const isLightFace = cardFaceLuminance(config) > 0.45;
  const networkSrc = config.cardNetwork === "visa" ? "/visa.svg" : "/mastercard.svg";

  const bgStyle: CSSProperties =
    config.colorType === "solid"
      ? { backgroundColor: config.solidColor }
      : {
          backgroundImage: `linear-gradient(135deg, ${config.gradientColors.join(", ")})`,
        };

  const fg = isLightFace ? "text-gray-900" : "text-white";
  const fgMuted = isLightFace ? "text-gray-500" : "text-white/55";

  const balanceDemo = useMemo(() => {
    const base = parseFloat(config.spendingLimit || "1000") || 1000;
    return formatBalanceUsd(base * 4.57135);
  }, [config.spendingLimit]);

  const invertBrandLogo = !isLightFace;

  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-[300px]">
        <div
          className={cn(
            "relative aspect-[1.586/1] w-full overflow-hidden rounded-[1.65rem] shadow-[0_16px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/10",
            config.finishType === "embossed" &&
              "shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-4px_12px_rgba(0,0,0,0.35),0_16px_40px_rgba(0,0,0,0.35)]",
            config.finishType === "metallic" &&
              "after:pointer-events-none after:absolute after:inset-0 after:rounded-[1.65rem] after:content-[''] after:bg-gradient-to-br after:from-white/25 after:via-transparent after:to-white/10"
          )}
          style={bgStyle}
        >
          <div
            className={cn(
              "absolute inset-0 flex flex-col px-[10%] pb-[10%] pt-[9%] antialiased",
              fg
            )}
          >
            {/* Arriba derecha: logo o wordmark Zelify */}
            <div className="flex shrink-0 justify-end">
              {brandLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brandLogoUrl}
                  alt=""
                  className={cn(
                    "h-8 max-h-9 w-auto max-w-[55%] object-contain object-right",
                    invertBrandLogo && "brightness-0 invert"
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isLightFace ? "text-gray-900" : "text-white"
                  )}
                >
                  <ZelifyMark className="size-7 shrink-0" />
                  <span className="text-[1.15rem] font-semibold tracking-tight">
                    Zelify
                  </span>
                </div>
              )}
            </div>

            {/* Centro: PAN a la izquierda, ojo a la derecha (misma fila) */}
            <div className="flex min-h-0 flex-1 items-center justify-between gap-6 py-2">
              <div className="min-w-0 flex-1 text-left">
                {showFullPan ? (
                  <span className="font-mono text-[17px] font-semibold tracking-[0.2em]">
                    {DEMO_PAN_FULL}
                  </span>
                ) : (
                  <MaskedPanSquares />
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowFullPan((v) => !v)}
                className={cn(
                  "shrink-0 rounded-lg p-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                  isLightFace
                    ? "text-gray-900 hover:bg-black/[0.06] focus-visible:ring-primary/50"
                    : "text-white hover:bg-white/10 focus-visible:ring-white/40"
                )}
                aria-label={
                  showFullPan ? previewT.sdkHidePanAria : previewT.sdkShowPanAria
                }
              >
                {showFullPan ? (
                  <EyeOffIcon className="size-6" />
                ) : (
                  <EyeIcon className="size-6" />
                )}
              </button>
            </div>

            {/* Abajo: titular izq. · red + importe der., misma línea base en datos */}
            <div className="flex shrink-0 items-end justify-between gap-4">
              <div className="min-w-0 max-w-[55%]">
                <p
                  className={cn(
                    "mb-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                    fgMuted
                  )}
                >
                  {previewT.sdkCardholderCaption}
                </p>
                <p className="truncate text-base font-bold leading-none tracking-tight">
                  {config.cardholderName || "—"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end text-right">
                <div
                  className={cn(
                    "relative mb-1.5 h-7 w-[56px]",
                    config.cardNetwork === "visa" && !isLightFace && "brightness-0 invert"
                  )}
                >
                  <Image
                    src={networkSrc}
                    alt=""
                    fill
                    className="object-contain object-right object-bottom"
                    sizes="56px"
                  />
                </div>
                <span className="text-base font-bold tabular-nums leading-none tracking-tight">
                  {balanceDemo}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
