"use client";

import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../../_components/cards-translations";
import { CardDesignConfig } from "./card-editor";
import { useMemo } from "react";

type CardPreview2DProps = {
  config: CardDesignConfig;
};

const DEFAULT_GRADIENT = ["#000000", "#1a1a1a", "#0a0a0a"];

// Helper function to determine if background is light or dark
function isLightColor(color: string): boolean {
  // Remove # if present and handle rgb/rgba
  let hex = color.replace("#", "").trim();

  // Handle rgb/rgba format
  if (color.startsWith("rgb")) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = Number.parseInt(matches[0], 10);
      const g = Number.parseInt(matches[1], 10);
      const b = Number.parseInt(matches[2], 10);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5;
    }
    return false;
  }

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split("").map((char) => char + char).join("");
  }

  // Handle 6-digit hex
  if (hex.length === 6) {
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }

  // Default to dark if can't parse
  return false;
}

function VisaLogo({ isLightBackground = false, size = "md" }: { isLightBackground?: boolean; size?: "sm" | "md" | "lg" }) {
  const height = size === "sm" ? "h-10" : size === "lg" ? "h-14" : "h-12";
  // Para fondos oscuros, invertir el color (el SVG de Visa es azul, lo hacemos blanco)
  // Para fondos claros, mantener el color original azul
  return (
    <div className="flex items-center drop-shadow-md">
      <img
        src="/visa.svg"
        alt="Visa"
        className={`${height} w-auto ${isLightBackground ? "" : "brightness-0 invert"} filter drop-shadow-lg`}
      />
    </div>
  );
}

function MastercardLogo({ isLightBackground = false, size = "md" }: { isLightBackground?: boolean; size?: "sm" | "md" | "lg" }) {
  const height = size === "sm" ? "h-10" : size === "lg" ? "h-14" : "h-12";
  return (
    <div className="flex items-center drop-shadow-md">
      <img
        src="/mastercard.svg"
        alt="Mastercard"
        className={`${height} w-auto filter drop-shadow-lg`}
      />
    </div>
  );
}

function ZelifyLogo({ isLightBackground = false }: { isLightBackground?: boolean }) {
  return (
    <div className="flex items-center drop-shadow-md">
      <img
        src="/images/logo/zelifyLogo_dark.svg"
        alt="Zelify"
        className="h-8 w-auto opacity-95 filter drop-shadow-lg"
        onError={(e) => {
          // Fallback si la imagen no carga
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
        }}
      />
    </div>
  );
}

export function CardPreview2D({ config }: CardPreview2DProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].issuing.editor;

  const gradientColors =
    config.gradientColors && config.gradientColors.length > 0
      ? config.gradientColors
      : DEFAULT_GRADIENT;

  const cardBackground =
    config.colorType === "solid"
      ? config.solidColor
      : `linear-gradient(135deg, ${gradientColors.join(", ")})`;

  // Determine if background is light or dark
  const isLightBg = useMemo(() => {
    if (config.colorType === "solid") {
      return isLightColor(config.solidColor);
    }
    // For gradients, check the first color
    return isLightColor(gradientColors[0] || "#111827");
  }, [config.colorType, config.solidColor, gradientColors]);

  const cardholderName =
    config.cardholderName?.trim() || "CARDHOLDER";

  const limitValue = Number.parseFloat(config.spendingLimit || "0");
  const formattedLimit = Number.isFinite(limitValue)
    ? new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(limitValue)
    : "--";

  const formattedDate = config.expirationDate
    ? new Date(`${config.expirationDate}T00:00:00`).toLocaleDateString(
      language === "es" ? "es-ES" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    )
    : "--";

  const typeLabel = `${config.cardForm === "virtual" ? t.cardFormVirtual : t.cardFormPhysical} ${config.cardType === "credit" ? t.cardTypeCredit : t.cardTypeDebit
    }`;

  const intervalLabel =
    config.limitInterval === "daily"
      ? t.limitIntervalDaily
      : config.limitInterval === "weekly"
        ? t.limitIntervalWeekly
        : t.limitIntervalMonthly;

  const textColor = isLightBg ? "text-dark" : "text-white";
  const textColorMuted = isLightBg ? "text-gray-7" : "text-white/75";
  const textColorSubtle = isLightBg ? "text-gray-6" : "text-white/60";

  // Efectos visuales según el tipo de acabado
  const finishEffects = {
    standard: {
      shadow: "shadow-[0_25px_80px_rgba(0,0,0,0.4)]",
      overlay: "bg-gradient-to-br from-white/10 via-transparent to-black/15",
      overlay2: "bg-gradient-to-t from-black/5 via-transparent to-transparent",
      shine: "",
    },
    embossed: {
      shadow: "shadow-[0_30px_100px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.1)]",
      overlay: "bg-gradient-to-br from-white/20 via-transparent to-black/20",
      overlay2: "bg-gradient-to-t from-black/10 via-transparent to-transparent",
      shine: "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/15 before:via-transparent before:to-transparent before:rounded-3xl",
    },
    metallic: {
      shadow: "shadow-[0_35px_120px_rgba(0,0,0,0.6),0_0_40px_rgba(255,255,255,0.1)]",
      overlay: "bg-gradient-to-br from-white/30 via-white/10 to-black/25",
      overlay2: "bg-gradient-to-t from-black/15 via-transparent to-white/10",
      shine: "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/25 before:via-transparent before:to-transparent before:rounded-3xl before:animate-pulse",
    },
  };

  const currentFinish = finishEffects[config.finishType];

  return (
    <div className="w-full" data-tour-id="tour-cards-preview">
      <div className="mx-auto w-full max-w-[420px]">
        <div
          className={`relative aspect-[1.586/1] w-full overflow-hidden rounded-3xl p-10 ${currentFinish.shadow} ${currentFinish.shine}`}
          style={{ background: cardBackground }}
        >
          {/* Enhanced gradient overlay for depth and premium look */}
          <div className={`pointer-events-none absolute inset-0 ${currentFinish.overlay}`} />
          <div className={`pointer-events-none absolute inset-0 ${currentFinish.overlay2}`} />

          {/* Efecto de relieve para embossed */}
          {config.finishType === "embossed" && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
              <div className="pointer-events-none absolute inset-0 border border-white/10 rounded-3xl" />
            </>
          )}

          {/* Efecto metálico con reflejos */}
          {config.finishType === "metallic" && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-3xl animate-pulse" style={{ animationDuration: "3s" }} />
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 via-white/10 to-transparent rounded-t-3xl" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)] rounded-3xl" />
            </>
          )}

          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10 h-full p-4">
            {/* Brand Logo - Superior derecha (mucho más arriba y más a la derecha) */}
            <div className="absolute top-2 right-2">
              <ZelifyLogo isLightBackground={isLightBg} />
            </div>

            {/* Chip - Centro izquierda (más arriba y más a la izquierda) */}
            <div className="absolute top-8 left-2">
              <div className={`relative h-10 w-14 rounded-md overflow-hidden ${isLightBg
                  ? "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 border border-gray-400/50"
                  : "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 border border-white/20"
                }`}>
                {/* Metallic shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/10" />

                {/* Chip contact lines */}
                <div className="absolute inset-0 opacity-60">
                  <div className="absolute top-[20%] left-0 right-0 h-[1px] bg-gray-600" />
                  <div className="absolute top-[40%] left-0 right-0 h-[1px] bg-gray-600" />
                  <div className="absolute top-[60%] left-0 right-0 h-[1px] bg-gray-600" />
                  <div className="absolute top-[80%] left-0 right-0 h-[1px] bg-gray-600" />
                  <div className="absolute left-[33%] top-0 bottom-0 w-[1px] bg-gray-600" />
                  <div className="absolute right-[33%] top-0 bottom-0 w-[1px] bg-gray-600" />

                  {/* Center piece */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-3 border border-gray-600 rounded-[2px]" />
                </div>
              </div>
            </div>

            {/* Name - Izquierda inferior (más abajo y más a la izquierda) */}
            <div className="absolute bottom-1 left-1">
              {/* Cardholder name */}
              <p 
                className={`text-sm font-medium tracking-wide uppercase ${textColor} ${config.finishType === "embossed" ? "opacity-100" : "opacity-90"}`}
                style={
                  config.finishType === "embossed"
                    ? {
                        textShadow: `
                          1px 1px 0 rgba(0,0,0,0.5),
                          -1px -1px 0 rgba(255,255,255,0.3),
                          2px 2px 2px rgba(0,0,0,0.3),
                          0 0 0 rgba(0,0,0,0.2)
                        `,
                        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
                        letterSpacing: "0.05em",
                      }
                    : {}
                }
              >
                {cardholderName}
              </p>
            </div>

            {/* Network logo - Inferior derecha (más abajo y más a la derecha) */}
            <div className="absolute bottom-1 right-1">
              {config.cardNetwork === "visa" ? (
                <VisaLogo isLightBackground={isLightBg} size="lg" />
              ) : (
                <MastercardLogo isLightBackground={isLightBg} size="lg" />
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-gray-3 bg-white px-5 py-4 text-sm text-dark shadow-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white">
          <div className="flex items-center justify-between text-xs text-gray-6 dark:text-dark-6">
            <span>{t.previewTypeLabel}</span>
            <span className="font-medium text-dark dark:text-white">
              {typeLabel}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-6 dark:text-dark-6">
            <span>{t.previewNicknameLabel}</span>
            <span className="font-medium text-dark dark:text-white">
              {config.nickname || "--"}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-6 dark:text-dark-6">
            <span>{`${t.previewLimitLabel} (${intervalLabel})`}</span>
            <span className="font-medium text-dark dark:text-white">
              {formattedLimit}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-6 dark:text-dark-6">
            <span>{t.previewExpiryLabel}</span>
            <span className="font-medium text-dark dark:text-white">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
