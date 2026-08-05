"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useRef, useCallback } from "react";
import { TxConfig } from "./tx-config";
import { useLanguage } from "@/contexts/language-context";
import { useInternationalTransfersTranslations } from "./use-international-transfers-translations";
import { useCTAButtonAnimations } from "@/hooks/use-cta-button-animations";

interface PreviewPanelProps {
  config: TxConfig;
  updateConfig: (updates: Partial<TxConfig>) => void;
}

interface SlideToConfirmProps {
  onConfirm: () => void;
  gradientStyle: string;
  label: string;
  isComplete?: boolean;
  onComplete?: () => void;
}

function SlideToConfirm({ onConfirm, gradientStyle, label, isComplete = false, onComplete }: SlideToConfirmProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  
  // Extraer themeColor del gradientStyle para las animaciones
  const themeColorMatch = gradientStyle.match(/#[0-9A-Fa-f]{6}/);
  const themeColor = themeColorMatch ? themeColorMatch[0] : "#3C50E0";
  
  // Inicializar animaciones CTA
  useCTAButtonAnimations(themeColor);

  const handleMove = useCallback((clientX: number) => {
    if (!trackRef.current || isComplete) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const sliderWidth = sliderRef.current?.offsetWidth || 48;
    const maxPosition = rect.width - sliderWidth;
    const newPosition = Math.max(0, Math.min(clientX - rect.left, maxPosition));
    setSlidePosition(newPosition);
    
    // Si llegó al 80% del ancho, confirmar automáticamente
    if (newPosition >= maxPosition * 0.8 && !isComplete) {
      setSlidePosition(maxPosition);
      setIsDragging(false);
      onComplete?.();
      setTimeout(() => {
        onConfirm();
      }, 300);
    }
  }, [onConfirm, onComplete, isComplete]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseMoveEvent = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (trackRef.current && sliderRef.current) {
      const trackWidth = trackRef.current.offsetWidth;
      const sliderWidth = sliderRef.current.offsetWidth;
      const maxPosition = trackWidth - sliderWidth;
      const threshold = maxPosition * 0.8; // 80% del ancho para confirmar
      
      if (slidePosition >= threshold) {
        onConfirm();
      }
      // Resetear posición si no se alcanzó el threshold
      if (slidePosition < threshold) {
        setSlidePosition(0);
      }
    }
  }, [isDragging, slidePosition, onConfirm]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMoveEvent);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleMouseMoveEvent as any);
      document.addEventListener("touchend", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMoveEvent);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleMouseMoveEvent as any);
        document.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMoveEvent, handleMouseUp]);

  return (
    <div
      ref={trackRef}
      className="group relative w-full h-14 rounded-full overflow-hidden select-none"
      style={{ 
        background: gradientStyle,
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

      <div
        ref={sliderRef}
        className="absolute left-0 top-0 h-full w-12 bg-white rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-20"
        style={{
          transform: `translateX(${slidePosition}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          e.preventDefault();
          setIsDragging(true);
          const touch = e.touches[0];
          if (touch) handleMove(touch.clientX);
        }}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ 
            color: themeColor,
            animation: 'cta-bounce-arrow 1.2s ease-in-out infinite'
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      {!isComplete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="text-white text-sm font-medium ml-14" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
            {label}
          </span>
        </div>
      )}
      
      {/* Efecto de brillo al hacer hover */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
    </div>
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

export function PreviewPanel({ config, updateConfig }: PreviewPanelProps) {
  const { branding, region } = config;
  const { language } = useLanguage();
  const translations = useInternationalTransfersTranslations();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");
  const [amount, setAmount] = useState("0.00");
  const [isRecentTransfersExpanded, setIsRecentTransfersExpanded] = useState(false);
  type Screen = "amount" | "currency-selector" | "contacts" | "summary" | "processing" | "success";
  const [currentScreen, setCurrentScreen] = useState<Screen>("amount");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContactData, setSelectedContactData] = useState<typeof contacts[0] | null>(null);
  const [hoveredContact, setHoveredContact] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isSliderComplete, setIsSliderComplete] = useState(false);
  const [isTransactionDetailsExpanded, setIsTransactionDetailsExpanded] = useState(false);
  const screenBeforeProcessingRef = useRef<Screen | null>(null);
  const screenBeforeSuccessRef = useRef<Screen | null>(null);
  
  // Datos de ejemplo para contactos
  const contacts = [
    { id: "1", name: "Valentina Duarte", alias: "@JP", bank: "Chase - USA", initials: "VD" },
    { id: "2", name: "Carlos Mendoza", alias: "@CM", bank: "BBVA - México", initials: "CM" },
    { id: "3", name: "Sofia Rodriguez", alias: "@SR", bank: "Santander - España", initials: "SR" },
    { id: "4", name: "Luis Hernandez", alias: "@LH", bank: "Bank of America - USA", initials: "LH" },
    { id: "5", name: "Ana Martinez", alias: "@AM", bank: "HSBC - UK", initials: "AM" },
    { id: "6", name: "Diego Fernandez", alias: "@DF", bank: "Banco de Chile", initials: "DF" },
  ];
  
  const currency = currencyByRegion[region] || "MXN";

  // Datos de ejemplo para transferencias recientes
  const recentTransfers = [
    { id: "1", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
    { id: "2", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
    { id: "3", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
    { id: "4", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
    { id: "5", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
    { id: "6", name: "Lucía Gómez", date: "12-10-2025", amount: 1250.00, status: "completed" },
  ];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
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

  // Efecto para la barra de progreso cuando estamos en processing
  useEffect(() => {
    if (currentScreen === "processing") {
      setLoadingProgress(0);
      const interval = setInterval(() => {
            setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              screenBeforeSuccessRef.current = screenBeforeProcessingRef.current ?? "summary";
              setCurrentScreen("success");
              // No volver automáticamente, la pantalla success se queda fija
            }, 500);
            return 100;
          }
          return prev + 2;
        });
      }, 60); // Actualizar cada 60ms para completar en ~3 segundos

      return () => clearInterval(interval);
    }
  }, [currentScreen]);

  const currentBranding = branding[currentTheme];
  
  // Calcular colores del gradiente (mismo que en Connect)
  const themeColor = currentBranding.customColorTheme || "#3C50E0";
  
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
  
  // Color oscurecido para el título (medio oscurecido)
  const darkenedTitleColor = darkenColor(themeColor, 15);

  // Parámetros configurables del blur y transparencia
  const BLUR_INTENSITY = 4; // Intensidad del blur en píxeles
  const BACKGROUND_OPACITY = 5; // Opacidad del fondo en porcentaje (0-100)
  const CARD_HEIGHT = 420; // Altura de la tarjeta desde abajo
  
  // Parámetros específicos para la tarjeta de detalles de transacción
  const TRANSACTION_DETAILS_BLUR = 100; // Intensidad del blur cuando está contraída
  const TRANSACTION_DETAILS_OPACITY_COLLAPSED = 80; // Opacidad cuando está contraída (0-100)
  const TRANSACTION_DETAILS_OPACITY_EXPANDED = 85; // Opacidad cuando está expandida (0-100)
  const TRANSACTION_DETAILS_HEIGHT_COLLAPSED = 30; // Altura de la tarjeta cuando está contraída (en píxeles)

  // Contenido del preview - Pantalla de Transferencias y Pagos calcada a la captura del usuario
  const previewContent = (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-white dark:bg-black text-slate-800 dark:text-slate-100 selection:bg-none">
      {/* Header Superior del Teléfono: < Atrás ... Ajustes */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-3 pb-1 text-slate-700 dark:text-slate-200">
        <button type="button" className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Atrás
        </button>
        <button type="button" className="hover:opacity-80 transition" aria-label="Ajustes">
          <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Cuerpo Desplazable Interno */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-none">
        {/* Título Principal y Subtítulo */}
        <div className="text-center pt-1 space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight text-[#0e2246] dark:text-white leading-tight">
            Transferencias <br /> y pagos
          </h1>
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
            ¿Qué tipo de servicio quieres utilizar?
          </p>
        </div>

        {/* Pestañas de Selección Superior (Transferencias vs Pago de servicios) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button type="button" className="flex-1 pb-2 flex items-center justify-center gap-1.5 border-b-2 border-[#0e2246] dark:border-white text-[#0e2246] dark:text-white">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Transferencias
          </button>

          <button type="button" className="flex-1 pb-2 flex items-center justify-center gap-1.5 border-b-2 border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Pago de servicios
          </button>
        </div>

        {/* Pregunta intermedia */}
        <p className="text-center text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
          ¿Qué tipo de transferencia quieres hacer hoy?
        </p>

        {/* Grid de 4 Acciones (Directas, Entre cuentas, Interbancarias, Internacionales) */}
        <div className="grid grid-cols-4 gap-2">
          {/* Directas */}
          <button type="button" className="flex flex-col items-center justify-center transition group">
            <div className="flex h-13 w-full items-center justify-center rounded-[1.2rem] bg-slate-100/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 group-hover:bg-slate-200/90 transition">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <span className="mt-1.5 text-[10.5px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight text-center">
              Directas
            </span>
          </button>

          {/* Entre cuentas */}
          <button type="button" className="flex flex-col items-center justify-center transition group">
            <div className="flex h-13 w-full items-center justify-center rounded-[1.2rem] bg-slate-100/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 group-hover:bg-slate-200/90 transition">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="mt-1.5 text-[10.5px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight text-center">
              Entre cuentas
            </span>
          </button>

          {/* Interbancarias */}
          <button type="button" className="flex flex-col items-center justify-center transition group">
            <div className="flex h-13 w-full items-center justify-center rounded-[1.2rem] bg-slate-100/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 group-hover:bg-slate-200/90 transition">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0v-4m0 4h4m-4-4h4m1-4H8m8 0V9m-8 0v2m8-2V7m-8 0v2" />
              </svg>
            </div>
            <span className="mt-1.5 text-[10.5px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight text-center">
              Interbancarias
            </span>
          </button>

          {/* Internacionales (Pestaña del producto) */}
          <button type="button" className="flex flex-col items-center justify-center transition group">
            <div className="flex h-13 w-full items-center justify-center rounded-[1.2rem] bg-slate-100/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 group-hover:bg-slate-200/90 transition">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <span className="mt-1.5 text-[10.5px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight text-center">
              Internacionales
            </span>
          </button>
        </div>

        {/* Sección Transferencias Recientes */}
        <div className="rounded-[1.4rem] bg-slate-100/70 dark:bg-slate-900/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Transferencias recientes
            </span>
            <button type="button" className="rounded-full border border-slate-800 dark:border-slate-200 px-3 py-1 text-[10.5px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200/50 transition">
              Ver todas
            </button>
          </div>

          {/* Tarjeta de usuario reciente */}
          <div className="flex flex-col items-start gap-1">
            <div className="relative size-12 overflow-hidden rounded-full border border-gray-200 dark:border-slate-700">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Andres Santos"
                className="size-full object-cover"
              />
            </div>
            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
              Andres Santos Vi...
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
              -$10.00
            </p>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">
              05-08-2026
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Navegación Inferior Fija (Bottom Tab Bar) */}
      <div className="shrink-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/80 px-3 py-1.5 flex items-center justify-around text-[10px] font-medium text-slate-400">
        <button type="button" className="flex flex-col items-center gap-0.5 hover:text-slate-800 dark:hover:text-white transition">
          <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Inicio
        </button>

        <button type="button" className="flex flex-col items-center gap-0.5 hover:text-slate-800 dark:hover:text-white transition">
          <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Cuentas
        </button>

        {/* Tab Activo: Pagos (Cápsula gris envolviendo icono + texto) */}
        <button type="button" className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 text-slate-900 dark:text-white font-semibold shadow-xs">
          <svg className="size-4 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Pagos
        </button>

        <button type="button" className="flex flex-col items-center gap-0.5 hover:text-slate-800 dark:hover:text-white transition">
          <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          Tarjetas
        </button>

        {/* Botón flotante asistente Zelify */}
        <div className="relative">
          <button type="button" className="flex size-6.5 items-center justify-center rounded-full bg-black text-white shadow-md">
            <span className="text-[11px] font-bold font-mono">7</span>
          </button>
          <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-[#75fa4c] text-[8.5px] font-bold text-black">
            1
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Vista Previa
        </h2>
      </div>
      
      <div className="relative rounded-lg border border-stroke bg-gray-50 p-8 dark:border-dark-3 dark:bg-dark-3">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />
          <EdgeFadeOverlay isDarkMode={isDarkMode} />
        </div>

        <div className="relative mx-auto max-w-[340px] z-10">
          {/* iPhone Frame */}
          <div className="relative mx-auto">
            {/* Outer frame with iPhone-like design */}
            <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
              {/* Screen - Fixed height container */}
              <div className="relative h-[680px] overflow-hidden rounded-[2.5rem] bg-white dark:bg-black m-0.5 flex flex-col">
                {/* Status bar with Dynamic Island and icons aligned */}
                <div className="relative flex items-center justify-between bg-white dark:bg-black px-6 pt-10 pb-2 flex-shrink-0">
                  {/* Left side - Time aligned with Dynamic Island */}
                  <div className="absolute left-6 top-4 flex items-center">
                    <span className="text-xs font-semibold text-black dark:text-white">9:41</span>
                  </div>

                  {/* Center - Dynamic Island */}
                  <div className="absolute left-1/2 top-3 -translate-x-1/2">
                    <div className="h-5 w-24 rounded-full bg-black dark:bg-white/20"></div>
                    {/* Speaker */}
                    <div className="absolute left-1/2 top-1/2 h-0.5 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800 dark:bg-white/30"></div>
                  </div>

                  {/* Right side - Signal and Battery aligned with Dynamic Island */}
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

                {/* Content area - VACÍO, listo para empezar desde cero */}
                <div className="relative flex-1 min-h-0 bg-white dark:bg-black overflow-hidden">
                  <div className="relative h-full overflow-y-auto">
                    {previewContent}
                  </div>
                </div>

                {/* Home indicator - Fixed at bottom */}
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
