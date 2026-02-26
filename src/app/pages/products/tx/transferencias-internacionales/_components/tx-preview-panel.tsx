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

  // Contenido del preview con header y logo
  const previewContent = (
    <div className="relative flex h-full flex-col">
      {/* Header con botón atrás y logo */}
      <div className="relative flex items-center px-6 pt-4 pb-2 z-30">
        {/* Botón atrás pegado a la izquierda - Solo visible cuando no estamos en la pantalla inicial */}
        {currentScreen !== "amount" && (
          <button 
            onClick={() => {
              if (currentScreen === "contacts") {
                setCurrentScreen("amount");
                setSelectedContact(null);
                setSelectedContactData(null);
                screenBeforeProcessingRef.current = null;
                screenBeforeSuccessRef.current = null;
              } else if (currentScreen === "currency-selector") {
                setCurrentScreen("amount");
                screenBeforeProcessingRef.current = null;
                screenBeforeSuccessRef.current = null;
              } else if (currentScreen === "summary") {
                // La selección de usuarios vive en la pantalla "currency-selector"
                setCurrentScreen("currency-selector");
                setIsSliderComplete(false);
              } else if (currentScreen === "processing") {
                setCurrentScreen(
                  screenBeforeProcessingRef.current ??
                    (selectedContact ? "summary" : "amount")
                );
                setIsSliderComplete(false);
              } else if (currentScreen === "success") {
                setCurrentScreen(
                  screenBeforeSuccessRef.current ??
                    screenBeforeProcessingRef.current ??
                    (selectedContact ? "summary" : "amount")
                );
                setIsTransactionDetailsExpanded(false);
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
            <span>{translations.preview.recipients.back.replace("← ", "")}</span>
          </button>
        )}

        {/* Logo centrado - Siempre visible si existe */}
        {currentBranding.logo && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center z-30">
            <img
              src={currentBranding.logo}
              alt="Logo"
              className="h-8 w-auto max-w-[120px] object-contain"
            />
          </div>
        )}
      </div>

      {/* GIF justo después del logo - Solo visible en pantalla amount */}
      {currentScreen === "amount" && (
        <div className="px-6 pt-2">
          <img
            src="/gift/ANIMACION 1.gif"
            alt="Animación"
            className="w-full h-auto max-w-full object-contain"
          />
        </div>
      )}

      {/* GIF para pantalla currency-selector - Misma posición (siempre en el fondo) */}
      {currentScreen === "currency-selector" && (
        <div className="  pt-2 absolute inset-0 z-0">
          <img
            src="/gift/ANIMACION 1.gif"
            alt="Animación"
            className="w-full h-auto max-w-full object-contain"
          />
        </div>
      )}

      {/* GIF para pantalla summary - Misma posición (siempre en el fondo) */}
      {currentScreen === "summary" && (
        <div className="px-6 pt-2 absolute inset-0 z-0">
          <img
            src="/gift/ANIMACION 1.gif"
            alt="Animación"
            className="w-full h-auto max-w-full object-contain"
          />
        </div>
      )}
      
      {/* Div con blur transparente - Cubre casi toda la pantalla */}
      {currentScreen === "currency-selector" && (
        <div className="absolute inset-0 flex flex-col justify-start px-6 pt-16 pb-6 z-10">
          {/* Título y subtítulo - Dentro del contenedor, antes del div con blur */}
          <div className="px-6 text-center mb-4 z-20">
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: themeColor }}
            >
              {translations.preview.recipients.tag}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {translations.preview.recipients.title}
            </p>
          </div>
          
          {/* Div con blur y lista de contactos */}
          <div 
            className="w-full flex-1 rounded-3xl px-6 py-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{
              backdropFilter: `blur(${BLUR_INTENSITY}px)`,
              backgroundColor: isDarkMode 
                ? `rgba(31, 41, 55, ${BACKGROUND_OPACITY / 100})` // gray-800
                : `rgba(255, 255, 255, ${BACKGROUND_OPACITY / 100})`, // white
            }}
          >
            {/* Lista de contactos en tarjetas */}
            <div className="space-y-2">
              {contacts.map((contact) => {
                const isSelected = selectedContact === contact.id;
                const isHovered = hoveredContact === contact.id;
                const shouldShowGradient = isSelected || isHovered;
                return (
                  <div
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact.id);
                      setSelectedContactData(contact);
                      setCurrentScreen("summary");
                    }}
                    onMouseEnter={() => setHoveredContact(contact.id)}
                    onMouseLeave={() => setHoveredContact(null)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      shouldShowGradient 
                        ? "text-white" 
                        : "bg-slate-200 dark:bg-slate-600/60"
                    }`}
                    style={shouldShowGradient ? { background: gradientStyle } : {}}
                  >
                    {/* Avatar circular con gradiente o blanco si está seleccionado/hovered */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 ${
                        shouldShowGradient ? "bg-white" : ""
                      }`}
                      style={shouldShowGradient ? {} : { background: gradientStyle }}
                    >
                      <span className={shouldShowGradient ? "text-slate-900" : "text-white"}>
                        {contact.initials}
                      </span>
                    </div>
                    
                    {/* Información del contacto */}
                    <div className="flex-1 min-w-0">
                      <p 
                        className={`font-bold text-sm truncate ${shouldShowGradient ? "text-white" : ""}`}
                        style={!shouldShowGradient ? { color: themeColor } : {}}
                      >
                        {contact.name}
                      </p>
                      <p className={`text-xs truncate ${shouldShowGradient ? "text-white/90" : "text-slate-600 dark:text-slate-400"}`}>
                        {contact.alias} - {contact.bank}
                      </p>
                    </div>
                    
                    {/* Flecha */}
                    <svg 
                      className="w-4 h-4 flex-shrink-0" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      style={{ color: shouldShowGradient ? "white" : themeColor }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal - vacío por ahora */}
      {currentScreen !== "currency-selector" && currentScreen !== "summary" && (
        <div className="flex-1 flex items-center justify-center px-6">
          {/* Contenido vacío - listo para el nuevo diseño */}
        </div>
      )}

      {/* Pantalla de resumen y confirmación */}
      {currentScreen === "summary" && (
        <div className="flex-1 flex items-center justify-center px-6 py-6 z-10 relative">
          {/* Tarjeta con blur transparente y esquinas redondeadas */}
          <div 
            className="w-full rounded-3xl px-6 py-6"
            style={{
              backdropFilter: `blur(${BLUR_INTENSITY}px)`,
              backgroundColor: isDarkMode 
                ? `rgba(31, 41, 55, ${BACKGROUND_OPACITY / 100})` // gray-800
                : `rgba(255, 255, 255, ${BACKGROUND_OPACITY / 100})`, // white
            }}
          >
            {/* Título y subtítulo */}
            <div className="text-center mb-6">
              <h1 
                className="text-lg font-bold mb-2 whitespace-nowrap"
                style={{ color: themeColor }}
              >
                {translations.preview.summary.title}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {translations.preview.summary.subtitle}
              </p>
            </div>

            {/* Detalles de la transferencia */}
            <div className="space-y-4 mb-6">
              {/* Destinatario */}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {translations.preview.summary.recipientLabel}
                </p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {selectedContactData?.name || ""}
                </p>
              </div>

              {/* Monto */}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {translations.preview.summary.amountLabel}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {parseFloat(amount || "0").toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} {currency}
                </p>
              </div>

              {/* Resumen de cambio */}
              <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {translations.preview.summary.youSend}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {parseFloat(amount || "0").toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} {currency}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {translations.preview.summary.exchangeRate}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    1 {currency} = 0.0580 USD
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Total
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    ${(parseFloat(amount || "0") * 0.0580).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} USD
                  </p>
                </div>
              </div>
            </div>

            {/* Deslizador para confirmar */}
            <SlideToConfirm
              onConfirm={() => {
                setLoadingProgress(0);
                screenBeforeProcessingRef.current = currentScreen;
                setCurrentScreen("processing");
              }}
              onComplete={() => {
                setIsSliderComplete(true);
              }}
              gradientStyle={gradientStyle}
              label={translations.preview.summary.slideToConfirm}
              isComplete={isSliderComplete}
            />
          </div>
        </div>
      )}

      {/* GIF para pantallas processing y success - Misma posición (siempre en el fondo) */}
      {(currentScreen === "processing" || currentScreen === "success") && (
        <div className="px-6 pt-2 absolute inset-0 z-0">
          <img
            src="/gift/ANIMACION 1.gif"
            alt="Animación"
            className="w-full h-auto max-w-full object-contain"
          />
        </div>
      )}

      {/* Pantalla de procesamiento */}
      {currentScreen === "processing" && (
        <div className="flex h-full flex-col relative overflow-hidden bg-white dark:bg-black">
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
            {/* Fondo que se va llenando con efecto de onda desde el centro */}
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

            {/* Contenido mientras carga */}
            {loadingProgress < 100 && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                {/* Título con cambio letra por letra */}
                <h2 className="text-xl font-bold">
                  {translations.preview.processing.title.split('').map((char, index, array) => {
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

                {/* Subtítulo con cambio letra por letra */}
                <p className="text-sm">
                  {translations.preview.processing.subtitle.split('').map((char, index, array) => {
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

                {/* Barra de progreso */}
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

            {/* Contenido cuando está completo */}
            {loadingProgress >= 100 && (
              <div className="flex flex-col items-center justify-center text-center space-y-6 relative z-10">
                {/* Icono: Checkmark */}
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

                {/* Título principal */}
                <h2
                  className="text-3xl font-bold leading-tight"
                  style={{ color: 'white' }}
                >
                  {translations.preview.success.title}
                </h2>

                {/* Subtítulo */}
                <p
                  className="text-base leading-relaxed"
                  style={{ color: 'white', opacity: 0.9 }}
                >
                  {translations.preview.success.subtitle}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pantalla de éxito (success) */}
      {currentScreen === "success" && (
        <div className="flex h-full flex-col relative overflow-hidden bg-white dark:bg-black">
          <div
            className="relative rounded-3xl flex flex-col items-center justify-center overflow-hidden"
            style={{
              marginTop: '20px',
              marginLeft: '10px',
              marginRight: '10px',
              marginBottom: isTransactionDetailsExpanded ? '0px' : '80px',
              width: 'calc(100% - 20px)',
              height: isTransactionDetailsExpanded ? '100%' : 'calc(100% - 10px)',
              boxSizing: 'border-box',
              padding: isTransactionDetailsExpanded ? '40px 20px 0px 20px' : '40px 20px',
              position: 'relative',
              background: gradientStyle,
            }}
          >
            <div className="flex flex-col items-center justify-center text-center space-y-6 relative z-10">
              {/* Icono: Checkmark */}
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

              {/* Título principal */}
              <h2
                className="text-3xl font-bold leading-tight"
                style={{ color: 'white' }}
              >
                {translations.preview.success.title}
              </h2>

              {/* Subtítulo */}
              <p
                className="text-base leading-relaxed"
                style={{ color: 'white', opacity: 0.9 }}
              >
                {translations.preview.success.subtitle}
              </p>
            </div>

            {/* Tarjeta expandible de detalles de transacción */}
            <div 
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl transition-all duration-300 overflow-hidden"
              style={{
                // Cuando está expandida debe sobreponerse, pero dejando ver parte del fondo superior
                height: isTransactionDetailsExpanded ? '92%' : `${TRANSACTION_DETAILS_HEIGHT_COLLAPSED}px`,
                backdropFilter: isTransactionDetailsExpanded ? 'none' : 'none',
                // El sheet de detalles debe tener fondo sólido (no transparente) para legibilidad
                backgroundColor: isDarkMode ? 'rgb(26, 26, 26)' : 'rgb(255, 255, 255)',
              }}
            >
              {/* Botón para expandir/contraer - Centrado */}
              {!isTransactionDetailsExpanded && (
                <div className="w-full px-6 py-2 flex items-center justify-center -mt-2">
                  <button
                    onClick={() => setIsTransactionDetailsExpanded(!isTransactionDetailsExpanded)}
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
                      {translations.preview.success.transactionDetails}
                    </span>
                  </button>
                </div>
              )}

              {/* Botón para contraer - Solo cuando está expandida */}
              {isTransactionDetailsExpanded && (
                <button
                  onClick={() => setIsTransactionDetailsExpanded(false)}
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

              {/* Contenido expandido */}
              {isTransactionDetailsExpanded && (
                <div className="flex h-full min-h-0 flex-col px-6 pb-16">
                  <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {/* Título de detalles */}
                    <div className="text-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {translations.preview.success.transactionDetails}
                      </h3>
                    </div>

                    <div className="space-y-3">
                    {/* Date/Hour */}
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                        {translations.preview.success.dateHour}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        10/10/2025 / 12:26:04 PM
                      </p>
                    </div>

                    {/* Recipient */}
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                        {translations.preview.success.recipient}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {selectedContactData?.name || "Valeria Duarte"}
                      </p>
                    </div>

                    {/* Transaction number */}
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                        {translations.preview.success.transactionNumber}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        871607050
                      </p>
                    </div>

                    {/* Payment method */}
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                        {translations.preview.success.paymentMethod}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        TRANSFER
                      </p>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                        {translations.preview.success.amount}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        $100.00 USD
                      </p>
                    </div>

                    {/* Fee */}
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                        {translations.preview.success.fee}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        $10.00 USD
                      </p>
                    </div>

                    {/* Total */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {translations.preview.success.total}
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        $110.00 USD
                      </p>
                    </div>
                  </div>
                </div>

                  {/* Acciones fijas abajo (siempre visibles) */}
                  <div className="flex flex-shrink-0 gap-3 pt-2 pb-2">
                    <button
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
                      style={{ background: gradientStyle }}
                    >
                      {translations.preview.success.share}
                    </button>
                    <button
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
                      style={{ background: gradientStyle }}
                    >
                      {translations.preview.success.download}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tarjeta con blur transparente desde abajo - Solo visible en pantalla amount */}
      {currentScreen === "amount" && (
        <div 
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col transition-all duration-300"
          style={{
            height: isRecentTransfersExpanded ? '100%' : `${CARD_HEIGHT}px`,
            backdropFilter: `blur(${BLUR_INTENSITY}px)`,
            backgroundColor: isDarkMode 
              ? (isRecentTransfersExpanded 
                ? `rgba(107, 114, 128, 0.3)` // gray-500 transparente cuando expandido
                : `rgba(31, 41, 55, ${BACKGROUND_OPACITY / 100})`) // gray-800 normal
              : (isRecentTransfersExpanded
                ? `rgba(156, 163, 175, 0.3)` // gray-400 transparente cuando expandido
                : `rgba(255, 255, 255, ${BACKGROUND_OPACITY / 100})`), // white normal
          }}
        >
        {/* Contenido de la tarjeta - se oculta cuando está expandido */}
        {!isRecentTransfersExpanded && (
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
            {currentScreen === "amount" ? (
              <>
                {/* Título: International Transfers / Transferencias Internacionales */}
                <div className="mb-4">
                  <h1 
                    className="text-lg leading-tight whitespace-nowrap"
                    style={{ color: darkenedTitleColor }}
                  >
                    <span className="font-normal">
                      {language === "en" ? "International" : "Transferencias"}
                    </span>{" "}
                    <span className="font-bold">
                      {language === "en" ? "Transfers" : "Internacionales"}
                    </span>
                  </h1>
                </div>

                {/* Pregunta */}
                <p className="text-base text-black dark:text-white mb-1">
                  {translations.preview.amount.title}
                </p>
                
                {/* Instrucción */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {translations.preview.amount.subtitle}
                </p>

                {/* Label Amount / Monto */}
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  {translations.preview.amount.amountLabel}
                </label>

                {/* Tarjeta de input con monto y selector de moneda */}
                <div className="relative rounded-xl bg-gray-200 dark:bg-gray-700 px-4 py-4 mb-6">
                  <div className="flex items-center justify-between">
                    {/* Monto alineado a la izquierda - Input editable */}
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => {
                        let value = e.target.value;
                        
                        // Permitir solo números y punto decimal
                        value = value.replace(/[^0-9.]/g, '');
                        
                        // No permitir múltiples puntos decimales
                        const parts = value.split('.');
                        if (parts.length > 2) {
                          value = parts[0] + '.' + parts.slice(1).join('');
                        }
                        
                        // Limitar a 2 decimales
                        if (parts.length === 2 && parts[1].length > 2) {
                          value = parts[0] + '.' + parts[1].substring(0, 2);
                        }
                        
                        // Eliminar ceros a la izquierda (excepto si es "0." o "0.0" o "0.00")
                        if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
                          value = value.replace(/^0+/, '');
                        }
                        
                        // Si está vacío, permitir que quede vacío o poner "0.00"
                        if (value === '' || value === '.') {
                          setAmount('');
                          return;
                        }
                        
                        setAmount(value);
                      }}
                      onBlur={(e) => {
                        // Al perder el foco, formatear correctamente
                        let value = e.target.value;
                        if (value === '' || value === '.') {
                          setAmount('0.00');
                        } else {
                          // Asegurar formato correcto
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

                    {/* Pastilla con gradiente y flecha */}
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
                        onClick={() => setCurrentScreen("currency-selector")}
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
              </>
            ) : currentScreen === "currency-selector" ? (
              <>
                {/* Pantalla de selector de moneda - Div con blur transparente */}
                <div 
                  className="mx-6 my-6 rounded-3xl px-6 py-6"
                  style={{
                    backdropFilter: `blur(${BLUR_INTENSITY}px)`,
                    backgroundColor: isDarkMode 
                      ? `rgba(31, 41, 55, ${BACKGROUND_OPACITY / 100})` // gray-800
                      : `rgba(255, 255, 255, ${BACKGROUND_OPACITY / 100})`, // white
                  }}
                >
                  {/* Contenido vacío por ahora */}
                </div>
              </>
            ) : currentScreen === "contacts" ? (
              <>
                {/* Pantalla de selección de contactos */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Header centrado */}
                  <div className="flex-shrink-0 px-6 pt-6 pb-4">
                    <h1 
                      className="text-xl font-bold text-center mb-1"
                      style={{ color: themeColor }}
                    >
                      {translations.preview.recipients.title}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                      {translations.preview.recipients.tag}
                    </p>
                  </div>

                  {/* Lista de contactos scrolleable (sin barra visible) */}
                  <div 
                    className="flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  >
                    <div className="space-y-3">
                      {contacts.map((contact) => {
                        const isSelected = selectedContact === contact.id;
                        return (
                          <button
                            key={contact.id}
                            onClick={() => {
                              setSelectedContact(contact.id);
                              setSelectedContactData(contact);
                              setCurrentScreen("summary");
                            }}
                            className={cn(
                              "group relative w-full rounded-xl px-4 py-3 flex items-center justify-between transition-all overflow-hidden",
                              isSelected
                                ? "text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-slate-900 dark:text-white"
                            )}
                            style={{
                              ...(isSelected && {
                                background: gradientStyle,
                                boxShadow: `0 4px 14px 0 ${themeColor}40`,
                                animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                              }),
                            }}
                          >
                            {/* Resplandor animado cuando está seleccionado */}
                            {isSelected && (
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

                            {/* Avatar con iniciales */}
                            <div 
                              className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 relative z-10",
                                !isSelected && "text-sm"
                              )}
                              style={{
                                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : themeColor,
                                animation: isSelected ? 'cta-glow-pulse 2s ease-in-out infinite' : 'none',
                              }}
                            >
                              {contact.initials}
                            </div>

                            {/* Información del contacto */}
                            <div className="flex-1 ml-4 text-left relative z-10">
                              <p className={cn(
                                "font-semibold",
                                isSelected ? "text-white" : "text-slate-900 dark:text-white"
                              )}
                              style={{ animation: isSelected ? 'cta-glow-pulse 2s ease-in-out infinite' : 'none' }}
                              >
                                {contact.name}
                              </p>
                              <p className={cn(
                                "text-xs mt-0.5",
                                isSelected ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                              )}>
                                {contact.alias} - {contact.bank}
                              </p>
                            </div>

                            {/* Flecha */}
                            <svg 
                              className={cn(
                                "w-5 h-5 flex-shrink-0 relative z-10",
                                isSelected ? "text-white" : "text-slate-700 dark:text-slate-300"
                              )}
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                              style={{ animation: isSelected ? 'cta-bounce-arrow 1.2s ease-in-out infinite' : 'none' }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            
                            {/* Efecto de brillo al hacer hover */}
                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Índice alfabético */}
                    <div className="mt-6 flex justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)).map((letter, index) => (
                        <span 
                          key={letter}
                          className={cn(
                            index === 0 && "font-bold"
                          )}
                        >
                          {letter}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Contenido expandido - Historial de transferencias */}
        {isRecentTransfersExpanded && (
          <div className="flex-1 flex flex-col h-full">
            {/* Header del historial - Centrado */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center px-6 pt-6 pb-4">
              <button
                onClick={() => setIsRecentTransfersExpanded(false)}
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
                Historial
              </p>
              <h2 
                className="text-lg font-bold text-center"
                style={{ color: themeColor }}
              >
                {translations.preview.amount.historyTitle}
              </h2>
            </div>

            {/* Lista scrolleable de transferencias (sin barra visible) */}
            <div 
              className="flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="space-y-3">
                {recentTransfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between"
                  >
                    {/* Lado izquierdo: Nombre y fecha */}
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {transfer.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {transfer.date}
                      </p>
                    </div>

                    {/* Lado derecho: Monto y estado */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        -{formatAmount(transfer.amount)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                        {transfer.status === "completed" 
                          ? translations.preview.statuses.completed.toLowerCase()
                          : transfer.status === "pending"
                          ? translations.preview.statuses.pending.toLowerCase()
                          : translations.preview.statuses.failed.toLowerCase()
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

          {/* Tarjeta inferior con gradiente - Transferencias recientes (solo visible cuando no está expandido) */}
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
                  onClick={() => setIsRecentTransfersExpanded(true)}
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
                    {translations.preview.amount.historyTitle}
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
