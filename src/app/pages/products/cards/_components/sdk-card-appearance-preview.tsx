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

function ZelifyIsotype({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 26 L26 6 M26 6 H14 M26 6 V18"
        stroke="#75fa4c"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MastercardBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 38 24" fill="none">
      <circle cx="14" cy="12" r="10" fill="#EB001B" />
      <circle cx="24" cy="12" r="10" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  );
}

export function SdkCardAppearancePreview({
  config,
  brandLogoUrl,
}: SdkCardAppearancePreviewProps) {
  const { language } = useLanguage();
  const previewT = cardsTranslations[language].configurator.preview;

  const isLightFace = cardFaceLuminance(config) > 0.55;
  const isVisa = config.cardNetwork === "visa";

  const bgStyle: CSSProperties =
    config.colorType === "solid"
      ? { backgroundColor: config.solidColor || "#0f2347" }
      : {
          backgroundImage: `linear-gradient(135deg, ${
            config.gradientColors?.length ? config.gradientColors.join(", ") : "#0e2246, #122c5a, #1a3c75"
          })`,
        };

  const fg = isLightFace ? "text-slate-900" : "text-white";
  const fgMuted = isLightFace ? "text-slate-500" : "text-white/60";

  const balanceDemo = useMemo(() => {
    return "$ 490.00";
  }, []);

  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-[320px]">
        {/* Cuerpo de la Tarjeta */}
        <div
          className={cn(
            "relative aspect-[1.586/1] w-full overflow-hidden rounded-[1.25rem] border border-white/10 p-5 shadow-lg transition-all duration-300",
            config.finishType === "embossed" && "border-white/20 shadow-inner",
            config.finishType === "metallic" &&
              "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-tr before:from-white/10 before:via-transparent before:to-white/5"
          )}
          style={bgStyle}
        >
          {/* Textura mate de fondo sutil */}
          <div className="absolute inset-0 bg-radial-at-t from-white/5 via-transparent to-black/30 pointer-events-none" />

          <div className="relative z-10 flex h-full flex-col justify-between antialiased">
            {/* Fila Superior: Isotipo Zelify en Verde Bolt arriba a la derecha */}
            <div className="flex items-center justify-end">
              {brandLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brandLogoUrl}
                  alt="Logo Marca"
                  className={cn(
                    "h-7 max-h-8 w-auto max-w-[90px] object-contain object-right",
                    !isLightFace && "brightness-0 invert"
                  )}
                />
              ) : (
                <ZelifyIsotype className="size-8 shrink-0" />
              )}
            </div>

            {/* Fila Inferior: Titular a la Izquierda | Marca + Saldo a la Derecha */}
            <div className="flex items-end justify-between">
              <div className="min-w-0 max-w-[68%] space-y-0.5">
                <span className={cn("block text-[9px] font-semibold uppercase tracking-[0.2em]", fgMuted)}>
                  {previewT.sdkCardholderCaption || "TITULAR"}
                </span>
                <p className={cn("truncate text-xs font-semibold tracking-wide", fg)}>
                  {config.cardholderName || "Stalin Vicente Narvaez Molina"}
                </p>
              </div>

              <div className="flex flex-col items-end space-y-1 text-right">
                {isVisa ? (
                  <div className="relative h-4 w-[36px]">
                    <Image
                      src="/visa.svg"
                      alt="Visa"
                      fill
                      className={cn("object-contain object-right", !isLightFace && "brightness-0 invert")}
                    />
                  </div>
                ) : (
                  <MastercardBadge className="h-5 w-8" />
                )}
                <span className={cn("text-xs font-semibold tabular-nums tracking-tight", fg)}>
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
