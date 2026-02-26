"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useRef, useCallback } from "react";
import { QRConfig, ViewMode } from "./qr-config";
import { useQRTranslations } from "./use-qr-translations";
import { useCTAButtonAnimations } from "@/hooks/use-cta-button-animations";

interface PreviewPanelProps {
  config: QRConfig;
  updateConfig: (updates: Partial<QRConfig>) => void;
}

type QRMode = "show" | "scan";
type ScreenState = "home" | "confirm" | "processing" | "success";

// Animated Halftone Backdrop - same as auth for consistency
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

// Zelify Logo Component - with custom branding support
function ZelifyLogo({ className, white = false, logo }: { className?: string; white?: boolean; logo?: string | null }) {
  if (!logo) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img src={logo} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain" />
    </div>
  );
}

// QR Code Display using image
function QRCodeDisplay({ size = 140 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <div className="rounded-lg bg-white p-3 shadow-lg">
        <img
          src="/images/imgqr.png"
          alt="QR Code"
          style={{ width: size, height: size }}
          className="object-contain"
        />
      </div>
    </div>
  );
}

// Slide to Confirm Button Component
function SlideToConfirm({
  onConfirm,
  themeColor,
  label,
}: {
  onConfirm: () => void;
  themeColor: string;
  label: string;
}) {
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
      onConfirm();
    }
    setPosition(0);
  }, [position, onConfirm]);

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

      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <span className="text-white/60 text-xs font-medium pl-10" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
          {label}
        </span>
      </div>

      {/* Draggable handle */}
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
          style={{ color: themeColor, animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2.5}
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
  label?: string;
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
        {label || "Confirmar"}
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

// Progress Bar Component  
function AnimatedProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Llenar la barra en 1 segundo para sincronizar con la revelación de la card
    const duration = 1000; // 1 segundo
    const steps = 50;
    const increment = 100 / steps;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
      <div
        className="h-full bg-white rounded-full transition-all duration-75 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function PreviewPanel({ config, updateConfig }: PreviewPanelProps) {
  const translations = useQRTranslations();
  const { viewMode, branding } = config;
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [qrMode, setQrMode] = useState<QRMode>("show");
  const [screenState, setScreenState] = useState<ScreenState>("home");
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Get current branding based on dark mode - same as auth
  const currentBranding = branding.light;
  const themeColor = currentBranding.customColor || "#004492";
  
  // Inicializar animaciones CTA
  useCTAButtonAnimations(themeColor);

  // Helper function to darken color - same as auth
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

  // Helper function to get almost black color - same as auth
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

  // Scanned data simulation
  const scannedRecipient = {
    initials: "CS",
    name: "Banco Nacional",
    details: "BTA Ahorro",
    account: "****1234",
  };

  const originAccount = {
    masked: "****4576",
    available: "12,500.00",
  };

  useEffect(() => {
    const styleId = "qr-preview-animations";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes halftonePulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.8; }
        }
        @keyframes scanLine {
          0% { 
            transform: translateY(0); 
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% { 
            transform: translateY(160px); 
            opacity: 0;
          }
        }
        @keyframes scanGlow {
          0%, 100% {
            box-shadow: 0 0 0px rgba(0, 0, 0, 0);
          }
          50% {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.2);
          }
        }
        @keyframes revealFromLeft {
          0% {
            clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          }
        }
        @keyframes expandWidth {
          0% {
            clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
            opacity: 0.3;
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
          }
        }
        @keyframes wipeLeft {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `;
      document.head.appendChild(style);
    }

    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
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
    if (screenState === "processing") {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 60);

      return () => clearInterval(interval);
    }
  }, [screenState]);

  const handleScanComplete = () => {
    setScreenState("confirm");
  };

  const handleConfirm = () => {
    setLoadingProgress(0);
    setScreenState("processing");
    // Simular animación de carga
    setTimeout(() => {
      setScreenState("success");
    }, 3000);
  };

  const handleClose = () => {
    setScreenState("home");
    setQrMode("show");
  };

  const handleReset = () => {
    setScreenState("home");
    setQrMode("show");
  };

  const renderMobileContent = () => {
    // Processing Screen
    if (screenState === "processing") {
      const isComplete = loadingProgress >= 100;

      return (
        <div className="flex h-full flex-col relative overflow-hidden bg-white">
          {/* Card con gradiente que se va llenando */}
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
            {/* Fondo que se va llenando con efecto de onda */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
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

            {/* Contenido - visible cuando está completo */}
            {isComplete && (
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

                <h2 className="text-3xl font-bold leading-tight" style={{ color: 'white' }}>
                  {translations.preview.scan.success.title}
                </h2>

                <p className="text-base leading-relaxed" style={{ color: 'white', opacity: 0.9 }}>
                  {translations.preview.scan.success.sentTo} {scannedRecipient.name}
                </p>
              </div>
            )}

            {/* Contenido mientras carga */}
            {!isComplete && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                <h2 className="text-xl font-bold">
                  {translations.preview.scan.processing
                    .split('')
                    .map((char, index, array) => {
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
                  {translations.preview.scan.processingSubtitle
                    .split('')
                    .map((char, index, array) => {
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
          </div>
        </div>
      );
    }

    // Success Screen
    if (screenState === "success") {
      return (
        <div className="flex h-full flex-col relative overflow-hidden bg-white">
          {/* Header con logo */}
          <div className="relative mb-3 flex flex-shrink-0 items-center justify-between px-6 pt-6 z-20">
            {currentBranding.logo && (
              <div className="absolute left-1/2 -translate-x-1/2">
                <img src={currentBranding.logo} alt="Logo" className="h-8 max-w-full object-contain" />
              </div>
            )}
            <div className="w-full"></div>
          </div>

          {/* Card con gradiente - mismo diseño que bank-account */}
          <div
            className="relative rounded-3xl flex flex-col items-center justify-center"
            style={{
              background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
              marginTop: '20px',
              marginLeft: '10px',
              marginRight: '10px',
              marginBottom: '80px',
              width: 'calc(100% - 20px)',
              height: 'calc(100% - 10px)',
              boxSizing: 'border-box',
              padding: '40px 20px',
            }}
          >
            {/* Contenido centrado */}
            <div className="flex flex-col items-center justify-center text-center space-y-6">
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
              <h2 className="text-3xl font-bold leading-tight" style={{ color: 'white' }}>
                {translations.preview.scan.success.title}
              </h2>

              {/* Subtítulo */}
              <div className="flex flex-col items-center space-y-2">
                <p className="text-base leading-relaxed" style={{ color: 'white', opacity: 0.9 }}>
                  {translations.preview.scan.success.sentTo} {scannedRecipient.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Confirm Screen
    if (screenState === "confirm") {
      return (
        <div className="relative flex h-full flex-col px-5 py-3">
          {/* Header with close button and logo */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <ZelifyLogo logo={currentBranding.logo} />
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Animated GIF Hero - positioned to overlap */}
          <div className="relative -mb-16 z-0 flex justify-center">
            <img
              src="/gift/ANIMACION%201.gif"
              alt={translations.preview.header.heroAlt}
              className="h-48 w-48 object-contain opacity-90 mix-blend-multiply"
            />
          </div>

          {/* Glass Card with payment details - exactly like home screen, ocupa todo el ancho */}
          <div
            className="relative z-10 flex-1 overflow-hidden rounded-2xl p-4 backdrop-blur-sm flex flex-col -mx-5"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.35)',
            }}
          >
            {/* Recipient Section */}
            <div className="mb-2">
              <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                {translations.preview.scan.recipient}
              </p>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#E8EBF0' }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full overflow-hidden bg-primary">
                    <img
                      src="/images/team/team-03.png"
                      alt={scannedRecipient.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">{scannedRecipient.name}</p>
                    <p className="text-[9px] text-gray-500">{scannedRecipient.details}</p>
                  </div>
                  <p className="text-[10px] text-gray-500">{scannedRecipient.account}</p>
                </div>
              </div>
            </div>

            {/* Origin Account Section */}
            <div className="mb-2">
              <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                {translations.preview.scan.originAccount}
              </p>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#E8EBF0' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">CTA Ahorros</p>
                    <p className="text-[9px] text-gray-500">{originAccount.masked}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-gray-400 uppercase">{translations.preview.scan.available}</p>
                    <p className="text-xs font-bold text-gray-900">${originAccount.available}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Section */}
            <div className="mb-3">
              <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                {translations.preview.scan.amountLabel}
              </p>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#E8EBF0' }}>
                <div className="flex items-center justify-center py-1">
                  <p className="text-xl font-bold text-gray-900">10,000.00 MXN</p>
                </div>
              </div>
            </div>

            {/* Slide to Confirm o Botón fijo */}
            <div className="mt-auto max-w-[180px] mx-auto w-full">
              {(currentBranding?.confirmButtonType || "slider") === "slider" ? (
                <SlideToConfirm
                  onConfirm={handleConfirm}
                  themeColor={themeColor}
                  label={translations.preview.scan.slideToConfirm}
                />
              ) : (
                <SolidConfirmButton
                  onConfirm={handleConfirm}
                  themeColor={themeColor}
                  label={translations.preview.scan.slideToConfirm}
                />
              )}
            </div>
          </div>
        </div>
      );
    }

    // Home Screen (Show QR / Scan QR)
    return (
      <div className="relative flex h-full flex-col px-5 py-3">
        {/* Header with logo */}
        <ZelifyLogo className="mb-3" logo={currentBranding.logo} />

        {/* Animated GIF Hero - positioned to overlap */}
        <div className="relative -mb-16 z-0 flex justify-center">
          <img
            src="/gift/ANIMACION%201.gif"
            alt={translations.preview.header.heroAlt}
            className="h-48 w-48 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
          />
        </div>

        {/* Glass Card with main content - exactly like auth */}
        <div
          className="relative z-10 flex-1 overflow-hidden rounded-2xl p-4 backdrop-blur-sm flex flex-col"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
          }}
        >
          {/* Title */}
          <div className="text-center mb-3">
            <h1 className="text-lg font-bold" style={{ color: themeColor }}>{translations.preview.header.title}</h1>
            <p className="text-[10px] text-gray-500 mt-0.5">{translations.preview.header.subtitle}</p>
          </div>

          {/* Toggle Buttons - Con gradientes */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setQrMode("show")}
              className={cn(
                "group relative flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all border overflow-hidden active:scale-[0.98]",
                qrMode === "show"
                  ? "text-white"
                  : "text-gray-600 hover:opacity-80"
              )}
              style={qrMode === "show" ? {
                background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                borderColor: themeColor,
                boxShadow: `0 4px 14px 0 ${themeColor}40`,
                animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
              } : {
                backgroundColor: '#E8EBF0',
                borderColor: '#E8EBF0',
              }}
            >
              {qrMode === "show" && (
                <>
                  {/* Resplandor animado alrededor del botón */}
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
              <span className="relative z-10" style={{ animation: qrMode === "show" ? 'cta-glow-pulse 2s ease-in-out infinite' : 'none' }}>
                {translations.preview.modes.showQR}
              </span>
              {/* Efecto de brillo al hacer hover */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
            </button>
            <button
              onClick={() => setQrMode("scan")}
              className={cn(
                "group relative flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all border overflow-hidden active:scale-[0.98]",
                qrMode === "scan"
                  ? "text-white"
                  : "text-gray-600 hover:opacity-80"
              )}
              style={qrMode === "scan" ? {
                background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                borderColor: themeColor,
                boxShadow: `0 4px 14px 0 ${themeColor}40`,
                animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
              } : {
                backgroundColor: '#E8EBF0',
                borderColor: '#E8EBF0',
              }}
            >
              {qrMode === "scan" && (
                <>
                  {/* Resplandor animado alrededor del botón */}
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
              <span className="relative z-10" style={{ animation: qrMode === "scan" ? 'cta-glow-pulse 2s ease-in-out infinite' : 'none' }}>
                {translations.preview.modes.scanQR}
              </span>
              {/* Efecto de brillo al hacer hover */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
            </button>
          </div>

          {qrMode === "show" ? (
            <>
              {/* Share instruction */}
              <p className="text-[10px] text-gray-500 text-center mb-3">
                {translations.preview.showQR.subtitle}
              </p>

              {/* QR Code */}
              <div className="flex-1 flex items-center justify-center">
                <QRCodeDisplay size={120} />
              </div>

              {/* Action buttons - gradient style like auth */}
              <div className="flex gap-2 mt-4">
                <button
                  className="group relative flex-1 overflow-hidden rounded-xl border py-2.5 text-xs font-semibold text-white transition-all active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                    borderColor: themeColor,
                    boxShadow: `0 4px 14px 0 ${themeColor}40`,
                    animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                  }}
                >
                  {/* Resplandor animado alrededor del botón */}
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
                  
                  <span className="relative z-10 flex items-center justify-center gap-1" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                    {translations.preview.showQR.shareQR}
                  </span>
                  
                  {/* Efecto de brillo al hacer hover */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
                </button>
                <button
                  className="group relative flex-1 overflow-hidden rounded-xl border py-2.5 text-xs font-semibold text-white transition-all active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                    borderColor: themeColor,
                    boxShadow: `0 4px 14px 0 ${themeColor}40`,
                    animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                  }}
                >
                  {/* Resplandor animado alrededor del botón */}
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
                  
                  <span className="relative z-10 flex items-center justify-center gap-1" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                    {translations.preview.showQR.saveImage}
                  </span>
                  
                  {/* Efecto de brillo al hacer hover */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Scan instruction */}
              <p className="text-[10px] text-gray-500 text-center mb-3">
                {translations.preview.scan.keepInFrame}
              </p>

              {/* Camera View Simulation - Fondo blanco como mockup */}
              <div className="flex-1 relative overflow-hidden rounded-xl bg-white">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-40 w-40">
                    {/* QR Code being scanned */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src="/images/imgqr.png"
                        alt="QR Code"
                        className="h-full w-full object-contain p-1"
                      />
                    </div>

                    {/* Scanning frame - esquinas grises como mockup */}
                    <div className="absolute inset-0 rounded-2xl">
                      {/* Corner indicators - grises redondeados */}
                      <div className="absolute top-0 left-0 h-10 w-10 border-l-[3px] border-t-[3px] border-gray-400 rounded-tl-2xl"></div>
                      <div className="absolute top-0 right-0 h-10 w-10 border-r-[3px] border-t-[3px] border-gray-400 rounded-tr-2xl"></div>
                      <div className="absolute bottom-0 left-0 h-10 w-10 border-b-[3px] border-l-[3px] border-gray-400 rounded-bl-2xl"></div>
                      <div className="absolute bottom-0 right-0 h-10 w-10 border-b-[3px] border-r-[3px] border-gray-400 rounded-br-2xl"></div>

                      {/* Scanning line con rastro */}
                      <div className="absolute left-0 right-0 h-0 overflow-visible" style={{ top: 0 }}>
                        {/* Rastro/glow superior */}
                        <div
                          className="absolute left-0 right-0 h-8 -top-8"
                          style={{
                            background: `linear-gradient(to bottom, transparent, ${themeColor}15, ${themeColor}30)`,
                            animation: "scanLine 2.5s ease-in-out infinite",
                          }}
                        ></div>
                        {/* Línea principal de escaneo */}
                        <div
                          className="absolute left-0 right-0 h-[3px]"
                          style={{
                            backgroundColor: themeColor,
                            boxShadow: `0 0 10px ${themeColor}, 0 0 20px ${themeColor}80, 0 0 30px ${themeColor}40`,
                            animation: "scanLine 2.5s ease-in-out infinite",
                          }}
                        ></div>
                        {/* Rastro/glow inferior */}
                        <div
                          className="absolute left-0 right-0 h-6"
                          style={{
                            background: `linear-gradient(to bottom, ${themeColor}30, ${themeColor}15, transparent)`,
                            animation: "scanLine 2.5s ease-in-out infinite",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulate scan button - gradient style like auth */}
              <button
                onClick={handleScanComplete}
                className="group relative mt-3 w-full overflow-hidden rounded-xl border py-2.5 text-xs font-semibold text-white transition-all active:scale-[0.98]"
                style={{
                  background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                  borderColor: themeColor,
                  boxShadow: `0 4px 14px 0 ${themeColor}40`,
                  animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                }}
              >
                {/* Resplandor animado alrededor del botón */}
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
                
                <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  {translations.preview.scan.simulateScanComplete}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                
                {/* Efecto de brillo al hacer hover */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (viewMode === "mobile") {
    return (
      <div className="rounded-lg bg-transparent p-6 shadow-sm dark:bg-transparent self-start">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark dark:text-white">{translations.preview.title}</h2>
        </div>
        <div className="relative -mx-6 w-[calc(100%+3rem)] py-12">
          <div className="absolute inset-0 overflow-hidden rounded-3xl" style={{ minHeight: "750px" }}>
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 1) 50%, rgba(15, 23, 42, 0.95) 100%)"
                  : "linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 1) 50%, rgba(241, 245, 249, 0.95) 100%)",
              }}
            ></div>

            <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />
            <EdgeFadeOverlay isDarkMode={isDarkMode} />

            <div
              className="absolute inset-0 rounded-3xl mix-blend-overlay"
              style={{
                backgroundImage: isDarkMode
                  ? `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1.2px, transparent 0)`
                  : `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.12) 1.2px, transparent 0)`,
                backgroundSize: "28px 28px",
                opacity: 0.5,
                animation: "halftonePulse 8s ease-in-out infinite",
              }}
            ></div>
          </div>

          <div className="relative mx-auto max-w-[300px] z-10">
            <div className="relative mx-auto">
              <div className="relative overflow-hidden rounded-[2.8rem] border-[5px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
                <div className="relative h-[600px] overflow-hidden rounded-[2.3rem] bg-white dark:bg-black m-0.5 flex flex-col">
                  <div className="relative flex items-center justify-between bg-white dark:bg-black px-5 pt-8 pb-1 flex-shrink-0">
                    <div className="absolute left-5 top-3 flex items-center">
                      <span className="text-[11px] font-semibold text-black dark:text-white">9:41</span>
                    </div>

                    <div className="absolute left-1/2 top-2 -translate-x-1/2">
                      <div className="h-5 w-20 rounded-full bg-black dark:bg-white/20"></div>
                    </div>

                    <div className="absolute right-5 top-3 flex items-center gap-1">
                      <svg className="h-3 w-4" fill="none" viewBox="0 0 20 12">
                        <path
                          d="M1 8h2v2H1V8zm3-2h2v4H4V6zm3-2h2v6H7V4zm3-1h2v7h-2V3z"
                          fill="currentColor"
                          className="text-black dark:text-white"
                        />
                      </svg>
                      <div className="h-2 w-5 rounded-sm border border-black dark:border-white">
                        <div className="h-full w-4/5 rounded-sm bg-black dark:bg-white"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 bg-white dark:bg-black overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {renderMobileContent()}
                  </div>

                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex-shrink-0">
                    <div className="h-1 w-28 rounded-full bg-black/30 dark:bg-white/30"></div>
                  </div>
                </div>

                <div className="absolute -left-[5px] top-20 h-10 w-[3px] rounded-l bg-gray-800 dark:bg-gray-700"></div>
                <div className="absolute -left-[5px] top-36 h-7 w-[3px] rounded-l bg-gray-800 dark:bg-gray-700"></div>
                <div className="absolute -right-[5px] top-28 h-8 w-[3px] rounded-r bg-gray-800 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
