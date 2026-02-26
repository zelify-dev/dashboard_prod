"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useRef, useCallback } from "react";
import { ServiceRegion } from "../../servicios-basicos/_components/basic-services-config";
import type { TransfersBranding } from "./transfers-config";
import { useTransfersTranslations } from "./use-transfers-translations";
import { useLanguage } from "@/contexts/language-context";
import { useCTAButtonAnimations } from "@/hooks/use-cta-button-animations";

interface SlideToConfirmProps {
  onConfirm: () => void;
  themeColor: string;
  label: string;
  isComplete?: boolean;
  onComplete?: () => void;
}

function SlideToConfirm({ onConfirm, themeColor, label, isComplete = false, onComplete }: SlideToConfirmProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxPosition = 180;
  
  // Inicializar animaciones CTA
  useCTAButtonAnimations(themeColor);

  const handleStart = useCallback((clientX: number) => {
    setIsDragging(true);
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPos = Math.max(0, Math.min(clientX - rect.left - 28, maxPosition));
    setPosition(newPos);
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    if (position > maxPosition * 0.7) {
      onComplete?.();
      setTimeout(() => {
        onConfirm();
      }, 300);
    } else {
      setPosition(0);
    }
  }, [position, onConfirm, onComplete]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const darkenColor = (color: string, amount: number = 0.3): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const getAlmostBlackColor = (color: string): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const factor = 0.15;
    const newR = Math.max(0, Math.floor(r * factor));
    const newG = Math.max(0, Math.floor(g * factor));
    const newB = Math.max(0, Math.floor(b * factor));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const darkThemeColor = darkenColor(themeColor, 0.4);
  const almostBlackColor = getAlmostBlackColor(themeColor);
  const blackColor = '#000000';

  return (
    <div
      ref={containerRef}
      className="group relative h-12 w-full rounded-full overflow-hidden"
      style={{
        background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
        boxShadow: `0 4px 14px 0 ${themeColor}40`,
        animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
      }}
    >
      {/* Resplandor animado alrededor del slider */}
      <span 
        className="absolute inset-0 rounded-full opacity-60 blur-md -z-10"
        style={{
          background: themeColor,
          animation: 'cta-pulse-ring 2s ease-in-out infinite',
        }}
      ></span>
      
      {/* Brillo que se mueve automáticamente */}
      <span 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10"
        style={{
          animation: 'cta-shine-sweep 2.5s linear infinite',
        }}
      ></span>
      
      {/* Capa de brillo adicional constante */}
      <span 
        className="absolute inset-0 rounded-full -z-10"
        style={{
          background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`,
          animation: 'cta-glow-pulse 2s ease-in-out infinite',
        }}
      ></span>

      <div className="absolute inset-0 flex items-center justify-center z-10">
        <span className="text-white/60 text-xs font-medium pl-10" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
          {label}
        </span>
      </div>

      <div
        className={cn(
          "absolute top-1 left-1 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-transform cursor-grab select-none z-20",
          isDragging && "cursor-grabbing scale-95"
        )}
        style={{ transform: `translateX(${position}px)` }}
        onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX); }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        <svg 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2.5} 
          style={{ color: themeColor, animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Efecto de brillo al hacer hover */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
    </div>
  );
}

interface SolidConfirmButtonProps {
  onConfirm: () => void;
  themeColor: string;
  label: string;
  disabled?: boolean;
}

function SolidConfirmButton({ onConfirm, themeColor, label, disabled = false }: SolidConfirmButtonProps) {
  const darkenColor = (color: string, amount: number = 0.3): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const getAlmostBlackColor = (color: string): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const factor = 0.15;
    const newR = Math.max(0, Math.floor(r * factor));
    const newG = Math.max(0, Math.floor(g * factor));
    const newB = Math.max(0, Math.floor(b * factor));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const darkThemeColor = darkenColor(themeColor, 0.4);
  const almostBlackColor = getAlmostBlackColor(themeColor);
  const blackColor = '#000000';

  return (
    <button
      onClick={onConfirm}
      disabled={disabled}
      className="group relative flex w-full items-center justify-center overflow-hidden rounded-full border px-4 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed"
      style={{
        background: disabled
          ? '#9BA2AF' 
          : `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
        borderColor: disabled ? '#9BA2AF' : themeColor,
        boxShadow: disabled ? 'none' : `0 4px 14px 0 ${themeColor}40`,
        animation: disabled ? 'none' : 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {!disabled && (
        <>
          {/* Resplandor animado alrededor del botón */}
          <span 
            className="absolute inset-0 rounded-full opacity-60 blur-md -z-10"
            style={{
              background: themeColor,
              animation: 'cta-pulse-ring 2s ease-in-out infinite',
            }}
          ></span>
          
          {/* Brillo que se mueve automáticamente */}
          <span 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10"
            style={{
              animation: 'cta-shine-sweep 2.5s linear infinite',
            }}
          ></span>
          
          {/* Capa de brillo adicional constante */}
          <span 
            className="absolute inset-0 rounded-full -z-10"
            style={{
              background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`,
              animation: 'cta-glow-pulse 2s ease-in-out infinite',
            }}
          ></span>
        </>
      )}
      
      <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: disabled ? 'none' : 'cta-glow-pulse 2s ease-in-out infinite' }}>
        {label}
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{ animation: disabled ? 'none' : 'cta-bounce-arrow 1.2s ease-in-out infinite' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </span>
      
      {/* Efecto de brillo al hacer hover */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
    </button>
  );
}

function AnimatedHalftoneBackdrop({ isDarkMode }: { isDarkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(resize);
      observer.observe(parent);
      resizeObserverRef.current = observer;
    }

    let start = performance.now();
    const spacing = 26;
    const waveFrequency = 1.35;
    const waveSpeed = 0.35;

    const render = (time: number) => {
      const elapsed = (time - start) / 1000;
      const logicalWidth = canvas.width / dpr;
      const logicalHeight = canvas.height / dpr;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      const centerX = logicalWidth / 2;
      const centerY = logicalHeight / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const [r, g, b] = isDarkMode ? [255, 255, 255] : [94, 109, 136];

      for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
        for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = distance / maxDistance;
          const wavePhase = (normalizedDistance * waveFrequency - elapsed * waveSpeed) * Math.PI * 2;
          const pulse = (Math.cos(wavePhase) + 1) / 2;
          const edgeFade = Math.pow(1 - normalizedDistance, 1.4);
          const alpha = (0.06 + pulse * 0.45) * edgeFade;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.4 + pulse * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, [isDarkMode]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

function EdgeFadeOverlay({ isDarkMode }: { isDarkMode: boolean }) {
  const fadeColor = isDarkMode ? "rgba(8,11,25,1)" : "rgba(250,252,255,1)";
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-3xl"
      style={{
        background: `radial-gradient(circle at center, rgba(0,0,0,0) 60%, ${fadeColor} 100%)`,
      }}
    ></div>
  );
}

const currencyByRegion: Record<string, string> = {
  mexico: "MXN",
  brasil: "BRL",
  colombia: "COP",
  estados_unidos: "USD",
  ecuador: "USD",
};

export function TransfersPreviewPanel({ region, branding }: { region: ServiceRegion; branding?: TransfersBranding }) {
  const { language } = useLanguage();
  const translations = useTransfersTranslations();
  const locale = language === "es" ? "es-MX" : "en-US";
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");
  const [amount, setAmount] = useState("0.00");
  const [isRecentTransfersExpanded, setIsRecentTransfersExpanded] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<"amount" | "contacts" | "summary" | "processing" | "success">("amount");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContactData, setSelectedContactData] = useState<typeof contacts[0] | null>(null);
  const [hoveredContact, setHoveredContact] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isSliderComplete, setIsSliderComplete] = useState(false);
  const [isTransactionDetailsExpanded, setIsTransactionDetailsExpanded] = useState(false);

  const contacts = [
    { id: "1", name: "Valentina Duarte", alias: "@vale", bank: "Chase - USA", initials: "VD" },
    { id: "2", name: "Carlos Mendoza", alias: "@CM", bank: "BBVA - México", initials: "CM" },
    { id: "3", name: "Sofia Rodriguez", alias: "@SR", bank: "Santander - España", initials: "SR" },
    { id: "4", name: "Luis Hernandez", alias: "@LH", bank: "Bank of America - USA", initials: "LH" },
    { id: "5", name: "Ana Martinez", alias: "@AM", bank: "HSBC - UK", initials: "AM" },
    { id: "6", name: "Diego Fernandez", alias: "@DF", bank: "Banco de Chile", initials: "DF" },
  ];

  const currency = currencyByRegion[region] || "MXN";

  const recentTransfers = [
    { id: "1", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
    { id: "2", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
    { id: "3", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
    { id: "4", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
    { id: "5", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
    { id: "6", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
  ];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
      setCurrentTheme(isDark ? "dark" : "light");
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (currentScreen === "processing") {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setCurrentScreen("success");
            }, 500);
            return 100;
          }
          return prev + 2;
        });
      }, 60);

      return () => clearInterval(interval);
    }
  }, [currentScreen]);

  const currentBranding = branding ? branding.light : undefined;
  const themeColor = currentBranding?.customColor ?? "#3C50E0";
  
  // Inicializar animaciones CTA
  useCTAButtonAnimations(themeColor);

  const darkenColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, ((num >> 16) & 0xFF) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const darkThemeColor = darkenColor(themeColor, 30);
  const almostBlackColor = darkenColor(themeColor, 80);
  const blackColor = darkenColor(themeColor, 100);

  const gradientStyle = `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`;

  const darkenedTitleColor = darkenColor(themeColor, 15);

  const BLUR_INTENSITY = 4;
  const BACKGROUND_OPACITY = 5;
  const CARD_HEIGHT = 420;

  const TRANSACTION_DETAILS_BLUR = 100;
  const TRANSACTION_DETAILS_OPACITY_COLLAPSED = 80;
  const TRANSACTION_DETAILS_OPACITY_EXPANDED = 100;
  const TRANSACTION_DETAILS_HEIGHT_COLLAPSED = 112;
  const SUCCESS_CONTENT_BOTTOM_GAP = TRANSACTION_DETAILS_HEIGHT_COLLAPSED + 24;

  const restartTransferFlow = useCallback(() => {
    setCurrentScreen("amount");
    setAmount("0.00");
    setSelectedContact(null);
    setSelectedContactData(null);
    setHoveredContact(null);
    setLoadingProgress(0);
    setIsSliderComplete(false);
    setIsTransactionDetailsExpanded(false);
    setIsRecentTransfersExpanded(false);
  }, []);

  const previewContent = (
    <div 
      className="relative flex h-full flex-col" 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {/* Header with back button and logo */}
      <div className="relative flex items-center px-6 pt-4 pb-2 z-30">
        {currentScreen !== "amount" && currentScreen !== "processing" && currentScreen !== "success" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentScreen === "contacts") {
                setCurrentScreen("amount");
              } else if (currentScreen === "summary") {
                setCurrentScreen("contacts");
                setIsSliderComplete(false);
              }
            }}
            className="flex items-center text-sm font-medium text-slate-900 dark:text-white -ml-2 z-30 relative"
          >
            <svg
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{translations.common.back}</span>
          </button>
        )}

        {/* Logo centrado - Branding */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center z-30">
          {currentBranding?.logo ? (
            <img
              src={currentBranding.logo}
              alt={translations.common.logoAlt}
              className="h-6 max-w-[120px] object-contain"
            />
          ) : null}
        </div>
      </div>

      {/* GIF animation - Only visible on amount screen */}
      {currentScreen === "amount" && (
        <div className="px-6 pt-2">
          <img
            src="/gift/ANIMACION 1.gif"
            alt={translations.common.animationAlt}
            className="w-full h-auto max-w-full object-contain"
          />
        </div>
      )}

      {/* GIF for contacts screen - Background */}
      {currentScreen === "contacts" && (
        <div className="pt-2 absolute inset-0 z-0">
          <img
            src="/gift/ANIMACION 1.gif"
            alt={translations.common.animationAlt}
            className="w-full h-auto max-w-full object-contain"
          />
        </div>
      )}

      {/* GIF for summary screen - Background */}
      {currentScreen === "summary" && (
        <div className="px-6 pt-2 absolute inset-0 z-0">
          <img
            src="/gift/ANIMACION 1.gif"
            alt={translations.common.animationAlt}
            className="w-full h-auto max-w-full object-contain"
          />
        </div>
      )}

      {/* Contacts screen with blur card */}
      {currentScreen === "contacts" && (
        <div className="absolute inset-0 flex flex-col justify-start px-6 pt-16 pb-6 z-10" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 text-center mb-4 z-20">
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: themeColor }}
            >
              {translations.recipients.tag}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {translations.recipients.title}
            </p>
          </div>

          <div
            className="w-full flex-1 rounded-3xl px-6 py-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{
              backdropFilter: `blur(${BLUR_INTENSITY}px)`,
              backgroundColor: isDarkMode
                ? `rgba(31, 41, 55, ${BACKGROUND_OPACITY / 100})`
                : `rgba(255, 255, 255, ${BACKGROUND_OPACITY / 100})`,
            }}
          >
            <div className="space-y-2">
              {contacts.map((contact, index) => {
                const isSelected = selectedContact === contact.id;
                const isHovered = hoveredContact === contact.id;
                const shouldShowGradient = isSelected || isHovered;
                const isFirstContact = index === 0; // Primer contacto (Valentina Duarte)
                return (
                  <div
                    key={contact.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedContact(contact.id);
                      setSelectedContactData(contact);
                      setCurrentScreen("summary");
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseEnter={() => setHoveredContact(contact.id)}
                    onMouseLeave={() => setHoveredContact(null)}
                    className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer overflow-hidden ${shouldShowGradient
                      ? "text-white"
                      : "bg-slate-200 dark:bg-slate-600/60"
                      }`}
                    style={shouldShowGradient ? { 
                      background: gradientStyle,
                      boxShadow: `0 4px 14px 0 ${themeColor}40`,
                      animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                    } : isFirstContact ? {
                      boxShadow: `0 4px 14px 0 ${themeColor}40`,
                      animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                    } : {}}
                  >
                    {/* Resplandor animado alrededor del contacto (solo para el primero cuando no está seleccionado) */}
                    {isFirstContact && !shouldShowGradient && (
                      <>
                        <span 
                          className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10"
                          style={{
                            background: themeColor,
                            animation: 'cta-pulse-ring 2s ease-in-out infinite',
                          }}
                        ></span>
                        
                        {/* Brillo que se mueve automáticamente */}
                        <span 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10"
                          style={{
                            animation: 'cta-shine-sweep 2.5s linear infinite',
                          }}
                        ></span>
                        
                        {/* Capa de brillo adicional constante */}
                        <span 
                          className="absolute inset-0 rounded-xl -z-10"
                          style={{
                            background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`,
                            animation: 'cta-glow-pulse 2s ease-in-out infinite',
                          }}
                        ></span>
                      </>
                    )}
                    
                    {/* Resplandor animado cuando está seleccionado */}
                    {shouldShowGradient && (
                      <>
                        <span 
                          className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10"
                          style={{
                            background: themeColor,
                            animation: 'cta-pulse-ring 2s ease-in-out infinite',
                          }}
                        ></span>
                        
                        {/* Brillo que se mueve automáticamente */}
                        <span 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10"
                          style={{
                            animation: 'cta-shine-sweep 2.5s linear infinite',
                          }}
                        ></span>
                        
                        {/* Capa de brillo adicional constante */}
                        <span 
                          className="absolute inset-0 rounded-xl -z-10"
                          style={{
                            background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`,
                            animation: 'cta-glow-pulse 2s ease-in-out infinite',
                          }}
                        ></span>
                      </>
                    )}

                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 relative z-10 ${shouldShowGradient ? "bg-white" : ""
                        }`}
                      style={shouldShowGradient ? {} : { background: gradientStyle }}
                    >
                      <span className={shouldShowGradient ? "text-slate-900" : "text-white"} style={{ animation: shouldShowGradient || isFirstContact ? 'cta-glow-pulse 2s ease-in-out infinite' : 'none' }}>
                        {contact.initials}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 relative z-10">
                      <p
                        className={`font-bold text-sm truncate ${shouldShowGradient ? "text-white" : ""}`}
                        style={{ 
                          color: !shouldShowGradient ? themeColor : undefined,
                          animation: shouldShowGradient || isFirstContact ? 'cta-glow-pulse 2s ease-in-out infinite' : 'none'
                        }}
                      >
                        {contact.name}
                      </p>
                      <p className={`text-xs truncate ${shouldShowGradient ? "text-white/90" : "text-slate-600 dark:text-slate-400"}`}>
                        {contact.alias} - {contact.bank}
                      </p>
                    </div>

                    <svg
                      className="w-4 h-4 flex-shrink-0 relative z-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ 
                        color: shouldShowGradient ? "white" : themeColor,
                        animation: (shouldShowGradient || isFirstContact) ? 'cta-bounce-arrow 1.2s ease-in-out infinite' : 'none'
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    
                    {/* Efecto de brillo al hacer hover */}
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
                  </div>
                );
              })}
            </div>

            {/* Alphabet index */}
            <div className="mt-6 flex flex-wrap justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              {Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)).map((letter, index) => (
                <span
                  key={letter}
                  className={cn(index === 0 && "font-bold")}
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty content placeholder */}
      {currentScreen !== "contacts" && currentScreen !== "summary" && currentScreen !== "processing" && currentScreen !== "success" && (
        <div className="flex-1 flex items-center justify-center px-6">
        </div>
      )}

      {/* Summary screen */}
      {currentScreen === "summary" && (
        <div className="flex-1 flex items-center justify-center px-6 py-6 z-10 relative" onClick={(e) => e.stopPropagation()}>
          <div
            className="w-full rounded-3xl px-6 py-6"
            style={{
              backdropFilter: `blur(${BLUR_INTENSITY}px)`,
              backgroundColor: isDarkMode
                ? `rgba(31, 41, 55, ${BACKGROUND_OPACITY / 100})`
                : `rgba(255, 255, 255, ${BACKGROUND_OPACITY / 100})`,
            }}
          >
            <div className="text-center mb-6">
              <h1
                className="text-lg font-bold mb-2 whitespace-nowrap"
                style={{ color: themeColor }}
              >
                {translations.summary.title}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {translations.summary.subtitle}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {translations.summary.recipientLabel}
                </p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {selectedContactData?.name || ""}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {translations.summary.amountLabel}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {parseFloat(amount || "0").toLocaleString(locale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} {currency}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {translations.summary.noteLabel}
                </p>
                <textarea
                  placeholder={translations.common.notePlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              {(currentBranding?.confirmButtonType || "slider") === "slider" ? (
                <SlideToConfirm
                  onConfirm={() => {
                    setLoadingProgress(0);
                    setCurrentScreen("processing");
                  }}
                  onComplete={() => {
                    setIsSliderComplete(true);
                  }}
                  themeColor={themeColor}
                  label={translations.slider.drag}
                  isComplete={isSliderComplete}
                />
              ) : (
                <SolidConfirmButton
                  onConfirm={() => {
                    setIsSliderComplete(true);
                    setLoadingProgress(0);
                    setCurrentScreen("processing");
                  }}
                  themeColor={themeColor}
                  label={translations.slider.label}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* GIF for processing and success screens */}
      {(currentScreen === "processing" || currentScreen === "success") && (
        <div className="px-6 pt-2 absolute inset-0 z-0">
          <img
            src="/gift/ANIMACION 1.gif"
            alt={translations.common.animationAlt}
            className="w-full h-auto max-w-full object-contain"
          />
        </div>
      )}

      {/* Processing screen */}
      {currentScreen === "processing" && (
        <div className="flex h-full flex-col relative overflow-hidden bg-white dark:bg-black" onClick={(e) => e.stopPropagation()}>
          <div
            className="relative rounded-3xl flex flex-col items-center justify-center overflow-hidden"
            style={{
              marginTop: '20px',
              marginLeft: '10px',
              marginRight: '10px',
              marginBottom: '80px',
              width: 'calc(100% - 20px)',
              height: 'calc(100% - 10px)',
              boxSizing: 'border-box',
              padding: '40px 20px',
              position: 'relative',
              backgroundColor: '#f3f4f6',
            }}
          >
            {/* Wave fill effect */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: gradientStyle,
                clipPath: (() => {
                  const progress = loadingProgress + 20;
                  let points = `0% 0%, `;
                  for (let i = 0; i <= 50; i++) {
                    const y = (i / 50) * 100;
                    const distanceFromCenter = Math.abs(y - 50) / 50;
                    const delay = distanceFromCenter * 15;
                    const adjustedProgress = Math.max(0, progress - delay);
                    const wave = Math.sin((adjustedProgress / 100) * Math.PI * 5 + (y / 100) * Math.PI * 3) * 10;
                    const x = adjustedProgress + (wave / 100) * 12;
                    points += `${x}% ${y}%, `;
                  }
                  points += `0% 100%`;
                  return `polygon(${points})`;
                })(),
                transition: 'clip-path 0.05s linear',
                maskImage: `linear-gradient(to right, 
                  rgba(0,0,0,1) 0%, 
                  rgba(0,0,0,1) ${Math.max(0, loadingProgress - 50)}%, 
                  rgba(0,0,0,0.9) ${Math.max(0, loadingProgress - 40)}%, 
                  rgba(0,0,0,0.6) ${Math.max(0, loadingProgress - 25)}%, 
                  rgba(0,0,0,0.3) ${Math.max(0, loadingProgress - 15)}%, 
                  rgba(0,0,0,0) ${loadingProgress}%, 
                  rgba(0,0,0,0) 100%
                )`,
                WebkitMaskImage: `linear-gradient(to right, 
                  rgba(0,0,0,1) 0%, 
                  rgba(0,0,0,1) ${Math.max(0, loadingProgress - 50)}%, 
                  rgba(0,0,0,0.9) ${Math.max(0, loadingProgress - 40)}%, 
                  rgba(0,0,0,0.6) ${Math.max(0, loadingProgress - 25)}%, 
                  rgba(0,0,0,0.3) ${Math.max(0, loadingProgress - 15)}%, 
                  rgba(0,0,0,0) ${loadingProgress}%, 
                  rgba(0,0,0,0) 100%
                )`,
              }}
            />

            {loadingProgress < 100 && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                <h2 className="text-xl font-bold">
                  {translations.processing.title.split('').map((char, index, array) => {
                    const charProgress = (index / array.length) * 100;
                    const isWhite = loadingProgress >= charProgress;
                    return (
                      <span
                        key={index}
                        style={{
                          color: isWhite ? 'white' : almostBlackColor,
                          transition: 'color 0.2s ease-out',
                        }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </span>
                    );
                  })}
                </h2>

                <p className="text-sm">
                  {translations.processing.subtitle.split('').map((char, index, array) => {
                    const charProgress = (index / array.length) * 100;
                    const isWhite = loadingProgress >= charProgress;
                    return (
                      <span
                        key={index}
                        style={{
                          color: isWhite ? 'rgba(255, 255, 255, 0.9)' : '#666',
                          transition: 'color 0.2s ease-out',
                        }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </span>
                    );
                  })}
                </p>

                <div className="w-full max-w-xs mt-2">
                  <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 ease-out"
                      style={{
                        width: `${loadingProgress}%`,
                        backgroundColor: 'white',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {loadingProgress >= 100 && (
              <div className="flex flex-col items-center justify-center text-center space-y-6 relative z-10">
                <svg
                  className="h-24 w-24"
                  style={{ color: 'white' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    style={{ transform: 'rotate(-2deg)' }}
                  />
                </svg>

                <h2
                  className="text-3xl font-bold leading-tight"
                  style={{ color: 'white' }}
                >
                  {translations.success.title}
                </h2>

                <p
                  className="text-base leading-relaxed"
                  style={{ color: 'white', opacity: 0.9 }}
                >
                  {translations.success.subtitle}
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    restartTransferFlow();
                  }}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.22)" }}
                >
                  {translations.success.cta}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success screen */}
      {currentScreen === "success" && (
        <div className="flex h-full flex-col relative overflow-hidden bg-white dark:bg-black" onClick={(e) => e.stopPropagation()}>
          <div
            className="relative rounded-3xl flex flex-col items-center justify-center overflow-hidden"
            style={{
              marginTop: '20px',
              marginLeft: '10px',
              marginRight: '10px',
              marginBottom: isTransactionDetailsExpanded ? '0px' : `${SUCCESS_CONTENT_BOTTOM_GAP}px`,
              width: 'calc(100% - 20px)',
              height: isTransactionDetailsExpanded ? '100%' : 'calc(100% - 10px)',
              boxSizing: 'border-box',
              padding: isTransactionDetailsExpanded ? '32px 20px 0px 20px' : '32px 20px',
              position: 'relative',
              background: gradientStyle,
            }}
          >
            {!isTransactionDetailsExpanded && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                <svg
                  className="h-20 w-20"
                  style={{ color: 'white' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    style={{ transform: 'rotate(-2deg)' }}
                  />
                </svg>

                <h2
                  className="text-2xl font-bold leading-tight"
                  style={{ color: 'white' }}
                >
                  {translations.success.title}
                </h2>

                <p
                  className="text-base leading-relaxed"
                  style={{ color: 'white', opacity: 0.9 }}
                >
                  {translations.success.subtitle}
                </p>
              </div>
            )}

            {/* Transaction details expandable card */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl transition-all duration-300 overflow-hidden"
              style={{
                height: isTransactionDetailsExpanded ? '100%' : `${TRANSACTION_DETAILS_HEIGHT_COLLAPSED}px`,
                backdropFilter: isTransactionDetailsExpanded ? 'none' : 'none',
                backgroundColor: isTransactionDetailsExpanded
                  ? (isDarkMode
                    ? (TRANSACTION_DETAILS_OPACITY_EXPANDED >= 100
                      ? 'rgb(107, 114, 128)'
                      : `rgba(107, 114, 128, ${TRANSACTION_DETAILS_OPACITY_EXPANDED / 100})`)
                    : (TRANSACTION_DETAILS_OPACITY_EXPANDED >= 100
                      ? 'rgb(255, 255, 255)'
                      : `rgba(255, 255, 255, ${TRANSACTION_DETAILS_OPACITY_EXPANDED / 100})`))
                  : 'transparent',
              }}
            >
              {!isTransactionDetailsExpanded && (
                <div className="w-full px-6 py-2 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTransactionDetailsExpanded(!isTransactionDetailsExpanded);
                    }}
                    className="px-12 py-4 bg-white dark:bg-gray-100 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0"
                  >
                    <svg
                      className="w-5 h-5 text-slate-700 dark:text-slate-800"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-900 whitespace-nowrap">
                      {translations.successDetails.title}
                    </span>
                  </button>
                </div>
              )}

              {isTransactionDetailsExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTransactionDetailsExpanded(false);
                  }}
                  className="w-full px-6 py-2 flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 text-slate-600 dark:text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}

              {isTransactionDetailsExpanded && (
                <div className="h-[calc(100%-60px)] px-6 pb-4 flex flex-col">
                  <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="text-center mb-6">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {translations.successDetails.title}
                      </h3>
                    </div>

                    <div className="space-y-4 pb-2">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {translations.successDetails.dateHour}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          10/10/2025 / 12:26:04 PM
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {translations.summary.recipientLabel}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {selectedContactData?.name || "Valeria Duarte"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {translations.successDetails.transactionNumber}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          871607050
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {translations.successDetails.paymentMethod}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          TRANSFER
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {translations.summary.amountLabel}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          $100.00 USD
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {translations.historyDetail.fee}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          $10.00 USD
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {translations.successDetails.total}
                        </p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          $110.00 USD
                        </p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
                          style={{ background: gradientStyle }}
                        >
                          {translations.historyDetail.share}
                        </button>
                        <button
                          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
                          style={{ background: gradientStyle }}
                        >
                          {translations.successDetails.download}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      restartTransferFlow();
                    }}
                    className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90 flex-shrink-0"
                    style={{ background: gradientStyle }}
                  >
                    {translations.success.cta}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom blur card - Amount screen */}
      {currentScreen === "amount" && (
        <div
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
          style={{
            height: isRecentTransfersExpanded ? '100%' : `${CARD_HEIGHT}px`,
            backdropFilter: `blur(${BLUR_INTENSITY}px)`,
            backgroundColor: isDarkMode
              ? (isRecentTransfersExpanded
                ? `rgba(107, 114, 128, 0.3)`
                : `rgba(31, 41, 55, ${BACKGROUND_OPACITY / 100})`)
              : (isRecentTransfersExpanded
                ? `rgba(156, 163, 175, 0.3)`
                : `rgba(255, 255, 255, ${BACKGROUND_OPACITY / 100})`),
          }}
        >
          {!isRecentTransfersExpanded && (
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
              <div className="mb-4 text-center">
                <h1
                  className="text-lg leading-tight whitespace-nowrap"
                  style={{ color: darkenedTitleColor }}
                >
                  <span className="font-bold">
                    {translations.amount.tag}
                  </span>
                </h1>
              </div>

              <p className="text-base text-black dark:text-white mb-1 text-center">
                {translations.amount.title}
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
                {translations.amount.subtitle}
              </p>

              <label className="block text-xs font-medium text-black dark:text-white mb-2 text-center">
                {translations.amount.amountLabel}
              </label>

              <div className="relative rounded-xl bg-gray-200 dark:bg-gray-700 px-4 py-4 mb-6">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.replace(/[^0-9.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                      }
                      if (parts.length === 2 && parts[1].length > 2) {
                        value = parts[0] + '.' + parts[1].substring(0, 2);
                      }
                      if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
                        value = value.replace(/^0+/, '');
                      }
                      if (value === '' || value === '.') {
                        setAmount('');
                        return;
                      }
                      setAmount(value);
                    }}
                    onBlur={(e) => {
                      let value = e.target.value;
                      if (value === '' || value === '.') {
                        setAmount('0.00');
                      } else {
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                          setAmount(num.toFixed(2));
                        } else {
                          setAmount('0.00');
                        }
                      }
                    }}
                    placeholder="0.00"
                    className="text-2xl font-semibold text-slate-900 dark:text-white bg-transparent border-none outline-none w-full max-w-[60%]"
                  />

                  <div className="flex items-center gap-2">
                    <div
                      className="px-4 py-2 rounded-full text-white text-sm font-medium"
                      style={{
                        background: gradientStyle,
                      }}
                    >
                      {currency}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentScreen("contacts");
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="flex items-center"
                    >
                      <svg
                        className="w-5 h-5 text-slate-700 dark:text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isRecentTransfersExpanded && (
            <div className="flex-1 flex flex-col h-full">
              <div className="flex-shrink-0 flex flex-col items-center justify-center px-6 pt-6 pb-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRecentTransfersExpanded(false);
                  }}
                  className="flex items-center justify-center mb-2"
                >
                  <svg
                    className="w-5 h-5 text-slate-700 dark:text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-1">
                  {translations.amount.historyTag}
                </p>
                <h2
                  className="text-lg font-bold text-center"
                  style={{ color: themeColor }}
                >
                  {translations.amount.historyTitle}
                </h2>
              </div>

              <div
                className="flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="space-y-3">
                  {recentTransfers.map((transfer) => (
                    <div
                      key={transfer.id}
                      className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {transfer.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {transfer.date}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          -{formatAmount(transfer.amount)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                          {transfer.status === "completed"
                            ? translations.statuses.completed.toLowerCase()
                            : transfer.status === "pending"
                              ? translations.statuses.pending.toLowerCase()
                              : translations.statuses.failed.toLowerCase()
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isRecentTransfersExpanded && (
            <div
              className="flex-shrink-0"
              style={{
                background: "none",
                borderTopLeftRadius: '1.5rem',
                borderTopRightRadius: '1.5rem',
              }}
            >
              <div className="w-full px-6 py-3 flex items-end justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRecentTransfersExpanded(true);
                  }}
                  className="w-[70%] max-w-[220px] rounded-t-2xl rounded-b-none text-white shadow-md flex flex-col items-center justify-center gap-0"
                  style={{ background: gradientStyle }}
                >
                  <svg
                    className="w-5 h-5 text-white mt-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="text-xs font-medium pb-2">
                    {translations.amount.historyTitle}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          {translations.previewTitle}
        </h2>
      </div>

      <div className="relative rounded-lg border border-stroke bg-gray-50 p-8 dark:border-dark-3 dark:bg-dark-3">
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />
          <EdgeFadeOverlay isDarkMode={isDarkMode} />
        </div>

        <div className="relative mx-auto max-w-[340px] z-10">
          <div className="relative mx-auto">
            <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
              <div className="relative h-[680px] overflow-hidden rounded-[2.5rem] bg-white dark:bg-black m-0.5 flex flex-col">
                {/* Status bar */}
                <div className="relative flex items-center justify-between bg-white dark:bg-black px-6 pt-10 pb-2 flex-shrink-0">
                  <div className="absolute left-6 top-4 flex items-center">
                    <span className="text-xs font-semibold text-black dark:text-white">9:41</span>
                  </div>

                  <div className="absolute left-1/2 top-3 -translate-x-1/2">
                    <div className="h-5 w-24 rounded-full bg-black dark:bg-white/20"></div>
                    <div className="absolute left-1/2 top-1/2 h-0.5 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800 dark:bg-white/30"></div>
                  </div>

                  <div className="absolute right-6 top-4 flex items-center gap-1.5">
                    <svg className="h-3 w-5" fill="none" viewBox="0 0 20 12">
                      <path
                        d="M1 8h2v2H1V8zm3-2h2v4H4V6zm3-2h2v6H7V4zm3-1h2v7h-2V3z"
                        fill="currentColor"
                        className="text-black dark:text-white"
                      />
                    </svg>
                    <div className="h-2.5 w-6 rounded-sm border border-black dark:border-white">
                      <div className="h-full w-4/5 rounded-sm bg-black dark:bg-white"></div>
                    </div>
                  </div>
                </div>

                {/* Content area */}
                <div className="relative flex-1 min-h-0 bg-white dark:bg-black overflow-hidden">
                  <div className="relative h-full overflow-y-auto">
                    {previewContent}
                  </div>
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-shrink-0">
                  <div className="h-1 w-32 rounded-full bg-black/30 dark:bg-white/30"></div>
                </div>
              </div>

              {/* Side buttons */}
              <div className="absolute -left-1 top-24 h-12 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
              <div className="absolute -left-1 top-40 h-8 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
              <div className="absolute -right-1 top-32 h-10 w-1 rounded-r bg-gray-800 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
