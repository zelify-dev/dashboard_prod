"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { CardsConfig } from "./cards-config";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "./cards-translations";

interface PreviewPanelProps {
  config: CardsConfig;
  updateConfig: (updates: Partial<CardsConfig>) => void;
}

type HorizontalActionLabels = {
  number: string;
  wallet: string;
  freeze: string;
  security: string;
  more: string;
  lock: string;
};

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

// Componente de acciones horizontales
// ============================================
// PARÁMETROS CONFIGURABLES - Ajusta estos valores según tus necesidades
// ============================================
function HorizontalActions({
  activeId,
  onActionChange,
  labels,
}: {
  activeId: string;
  onActionChange: (id: string) => void;
  labels: HorizontalActionLabels;
}) {
  // ===== DIMENSIONES =====
  const CARD_HEIGHT = 60; // Altura de las tarjetas en píxeles
  const CARD_MIN_WIDTH = 60; // Ancho mínimo cuando está inactiva
  const CARD_ACTIVE_WIDTH = 95; // Ancho cuando está activa
  const CARD_BORDER_RADIUS = 20; // Radio de las esquinas redondeadas
  const CARD_BORDER_WIDTH = 6; // Grosor del borde blanco

  // ===== ESPACIADO =====
  const OVERLAP_DISTANCE = 20; // Distancia de solapamiento entre tarjetas (negativo = más overlap)
  const CONTAINER_PADDING_X = 5; // Padding horizontal del contenedor (en unidades Tailwind: px-5 = 1.25rem)
  const CONTAINER_PADDING_Y = 10; // Padding vertical del contenedor (en unidades Tailwind: py-10 = 2.5rem)
  const GAP_BETWEEN_ICON_LABEL = 0.3; // Espacio entre icono y label (en unidades Tailwind: gap-0.5 = 0.125rem)

  // ===== ESCALA Y TRANSFORMACIONES =====
  const ACTIVE_SCALE = 1.1; // Escala cuando está activa (1.1 = 10% más grande)
  const BASE_Z_INDEX = 50; // Z-index base para el cálculo de profundidad

  // ===== COLORES =====
  const COLOR_ACTIVE_BG = '#002A8F'; // Color de fondo cuando está activa
  const COLOR_ACTIVE_TEXT = 'white'; // Color de texto cuando está activa
  const COLOR_INACTIVE_BG = '#E5E7EB'; // Color de fondo cuando está inactiva
  const COLOR_INACTIVE_TEXT = '#9CA3AF'; // Color de texto cuando está inactiva
  const COLOR_BORDER = 'white'; // Color del borde

  // ===== TIPOGRAFÍA =====
  const ICON_SIZE = 15; // Tamaño del icono SVG (width y height)
  const LABEL_FONT_SIZE = 'text-sm'; // Tamaño del label (text-xs, text-sm, text-base, etc.)
  const VALUE_FONT_SIZE = 'text-sm'; // Tamaño del valor (text-xs, text-sm, etc.)
  const LABEL_FONT_WEIGHT = 'font-semibold'; // Peso de la fuente del label
  const VALUE_FONT_WEIGHT = 'font-light'; // Peso de la fuente del valor
  const VALUE_OPACITY = 80; // Opacidad del valor en porcentaje (0-100)

  // ===== ANIMACIONES =====
  const TRANSITION_DURATION = 400; // Duración de la transición en milisegundos
  const TRANSITION_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // Curva de animación (easing)
  // Opciones de easing comunes:
  // - 'cubic-bezier(0.34, 1.56, 0.64, 1)' - Bounce suave (actual)
  // - 'cubic-bezier(0.4, 0, 0.2, 1)' - Ease in out
  // - 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' - Bounce más pronunciado
  // - 'ease-in-out' - Suave

  // ===== DEFINICIÓN DE ACCIONES =====
  const ACTIONS = [
    {
      id: 'number',
      label: labels.number,
      value: '',
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      )
    },
    {
      id: 'wallet',
      label: labels.wallet,
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
          <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
          <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
        </svg>
      )
    },
    {
      id: 'freeze',
      label: labels.freeze,
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" />
          <path d="M20 10l-16 4" />
          <path d="M20 14l-16-4" />
        </svg>
      )
    },
    {
      id: 'security',
      label: labels.security,
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'more',
      label: labels.more,
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      )
    },
    {
      id: 'lock',
      label: labels.lock,
      icon: (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
  ];

  const activeIndex = ACTIONS.findIndex(item => item.id === activeId);

  return (
    <div
      className="flex flex-row items-center justify-center w-full"
      style={{
        isolation: 'isolate',
        paddingLeft: `${CONTAINER_PADDING_X * 0.25}rem`,
        paddingRight: `${CONTAINER_PADDING_X * 0.25}rem`,
        paddingTop: `${CONTAINER_PADDING_Y * 0.25}rem`,
        paddingBottom: `${CONTAINER_PADDING_Y * 0.25}rem`,
      }}
    >
      {ACTIONS.map((item, index) => {
        const isActive = item.id === activeId;
        const distanceFromActive = Math.abs(activeIndex - index);

        return (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-center cursor-pointer relative overflow-hidden",
              isActive ? "z-[100]" : ""
            )}
            onClick={() => onActionChange(item.id)}
            style={{
              height: `${CARD_HEIGHT}px`,
              minWidth: isActive ? `${CARD_ACTIVE_WIDTH}px` : `${CARD_MIN_WIDTH}px`,
              borderRadius: `${CARD_BORDER_RADIUS}px`,
              borderWidth: `${CARD_BORDER_WIDTH}px`,
              borderColor: COLOR_BORDER,
              borderStyle: 'solid',
              backgroundColor: isActive ? COLOR_ACTIVE_BG : COLOR_INACTIVE_BG,
              color: isActive ? COLOR_ACTIVE_TEXT : COLOR_INACTIVE_TEXT,
              zIndex: BASE_Z_INDEX - distanceFromActive,
              transform: isActive ? `scale(${ACTIVE_SCALE})` : 'scale(1)',
              marginLeft: index === 0 ? 0 : `-${OVERLAP_DISTANCE}px`,
              transition: `all ${TRANSITION_DURATION}ms ${TRANSITION_EASING}`,
            }}
          >
            <div
              className="flex flex-col items-center justify-center w-full"
              style={{ gap: `${GAP_BETWEEN_ICON_LABEL * 0.25}rem` }}
            >
              <span className="leading-none">
                {item.icon}
              </span>

              {isActive && (
                <div className="flex flex-col items-center leading-none">
                  {item.value && (
                    <span
                      className={cn(VALUE_FONT_SIZE, VALUE_FONT_WEIGHT)}
                      style={{ opacity: VALUE_OPACITY / 100 }}
                    >
                      {item.value}
                    </span>
                  )}
                  <span className={cn(LABEL_FONT_SIZE, LABEL_FONT_WEIGHT, "whitespace-nowrap")}>
                    {item.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Componente de CVV dinámico que cambia de color con el tiempo
function DynamicCVV() {
  const TOTAL_TIME = 30; // 30 segundos totales (estándar para CVV dinámicos)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [cvv, setCvv] = useState('123');

  useEffect(() => {
    // Generar un CVV aleatorio cada vez que se monta
    const generateCVV = () => {
      return Math.floor(100 + Math.random() * 900).toString();
    };

    setCvv(generateCVV());

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Generar nuevo CVV cuando llega a 0
          setCvv(generateCVV());
          return TOTAL_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calcular el color: verde cuando hay mucho tiempo, rojo cuando queda poco
  const getColor = () => {
    const percentage = timeLeft / TOTAL_TIME;
    if (percentage > 0.5) {
      // Verde cuando queda más del 50%
      return '#22c55e'; // green-500
    } else if (percentage > 0.25) {
      // Amarillo cuando queda entre 25% y 50%
      return '#eab308'; // yellow-500
    } else {
      // Rojo cuando queda menos del 25%
      return '#ef4444'; // red-500
    }
  };

  // Calcular el porcentaje para el círculo (anti carga - va disminuyendo)
  const percentage = (timeLeft / TOTAL_TIME) * 100;
  const circumference = 2 * Math.PI * 20; // radio = 20
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center">
      {/* CVV en círculo con borde que disminuye */}
      <div className="relative flex items-center justify-center">
        {/* Círculo de fondo (gris) */}
        <svg className="transform -rotate-90" width="60" height="60">
          <circle
            cx="30"
            cy="30"
            r="20"
            stroke="#e5e7eb"
            strokeWidth="3"
            fill="none"
          />
          {/* Círculo de progreso (anti carga) */}
          <circle
            cx="30"
            cy="30"
            r="20"
            stroke={getColor()}
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* CVV en el centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-lg font-bold font-mono transition-colors duration-300"
            style={{ color: getColor() }}
          >
            {cvv}
          </span>
        </div>
      </div>
    </div>
  );
}

// Componente de tarjeta colapsable de gastos
function DailySpentCard({
  isExpanded,
  onToggle,
  activeId,
  isCardLocked,
  onToggleCardLock,
  customColorTheme,
  sheetT,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  activeId: string;
  isCardLocked: boolean;
  onToggleCardLock: () => void;
  customColorTheme?: string;
  sheetT: (typeof cardsTranslations)["en"]["configurator"]["preview"]["sheet"];
}) {
  // Contenido según la acción activa
  const getContent = () => {
    switch (activeId) {
      case 'number':
        return {
          title: sheetT.cardDetailsTitle,
          content: (
            <div className="w-full space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.cardNumberLabel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">**** **** **** 1234</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.expirationLabel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">12/25</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 dark:text-gray-400 pt-2">{sheetT.cvvLabel}</span>
                  <div className="flex flex-col items-end gap-2">
                    <DynamicCVV />
                    {/* Mensaje informativo */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-right max-w-[200px]">
                      {sheetT.cvvInfo(30)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        };

      case 'wallet':
        const themeColor = customColorTheme || "#002A8F";
        return {
          title: sheetT.dailySpentTitle,
          content: (
            <div className="w-full space-y-4">
              {/* Resumen de gastos del día */}
              <div className="space-y-3">
                <div>
                  <p
                    className="text-sm font-semibold mb-2"
                    style={{ color: themeColor }}
                  >
                    {sheetT.spentToday("$122,20")}
                  </p>

                  {/* Barra de progreso */}
                  <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: '4.07%', // 122.20 / 3000 * 100
                        backgroundColor: themeColor
                      }}
                    ></div>
                  </div>
                </div>

                {/* Tarjeta con detalles financieros */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs font-medium"
                      style={{ color: themeColor }}
                    >
                      {sheetT.dailySpendingLimit}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: themeColor }}
                    >
                      $3,000.00
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs font-medium"
                      style={{ color: themeColor }}
                    >
                      {sheetT.posted}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: themeColor }}
                    >
                      $0,00
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs font-medium"
                      style={{ color: themeColor }}
                    >
                      {sheetT.pending}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: themeColor }}
                    >
                      -$122,20
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs font-medium"
                      style={{ color: themeColor }}
                    >
                      {sheetT.available}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: themeColor }}
                    >
                      $2,877.80
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        };

      case 'freeze':
        return {
          title: sheetT.freezeStatusTitle,
          content: (
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.statusLabel}</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">{sheetT.statusActive}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.lastFreezeLabel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{sheetT.lastFreezeNever}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.canFreezeLabel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{sheetT.yes}</span>
                </div>
              </div>
            </div>
          )
        };

      case 'security':
        return {
          title: sheetT.securityTitle,
          content: (
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.twoFaLabel}</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">{sheetT.enabled}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.notificationsLabel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{sheetT.enabled}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.lastAccessLabel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{sheetT.lastAccessValue}</span>
                </div>
              </div>
            </div>
          )
        };

      case 'more':
        return {
          title: sheetT.moreOptionsTitle,
          content: (
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.settingsLabel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{sheetT.availableValue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.historyLabel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{sheetT.viewAllValue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.supportLabel}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{sheetT.contactValue}</span>
                </div>
              </div>
            </div>
          )
        };

      case 'lock':
      default:
        return {
          title: sheetT.lockTitle,
          content: (
            <div className="w-full space-y-4">
              <div className="space-y-4">
                {/* Estado actual */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{sheetT.currentStatusLabel}</span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isCardLocked
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    )}
                  >
                    {isCardLocked ? sheetT.lockedValue : sheetT.unlockedValue}
                  </span>
                </div>

                {/* Información sobre bloqueo */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {isCardLocked ? sheetT.unlockDescription : sheetT.lockDescription}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {sheetT.lockBullet1}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {sheetT.lockBullet2}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {sheetT.lockBullet3}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón de acción */}
                <button
                  onClick={onToggleCardLock}
                  className={cn(
                    "w-full text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200",
                    isCardLocked
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {isCardLocked ? sheetT.unlockButton : sheetT.lockButton}
                </button>
              </div>
            </div>
          )
        };
    }
  };

  const { title, content } = getContent();

  // ===== PARÁMETROS CONFIGURABLES DEL BLUR Y TRANSPARENCIA =====
  // Ajusta estos valores según tus necesidades:
  const BLUR_INTENSITY = 10; // Intensidad del blur en píxeles
  // Valores comunes: 8 (sm) 12 (md), 16 (lg), 24 (xl - actual), 40 (2xl), 64 (3xl)
  // Más alto = más blur, más bajo = menos blur

  const BACKGROUND_OPACITY = 40; // Opacidad del fondo en porcentaje (0-100)
  // 0 = completamente transparente, 100 = completamente opaco
  // 80 = 80% opaco, 20% transparente (actual)
  // Valores comunes: 60 (más transparente), 70, 80 (actual), 90 (menos transparente), 95

  const EXPANDED_HEIGHT = activeId === "lock" ? 410 : 340; // Altura dinámica para evitar scroll con textos largos

  // Detectar dark mode para el background
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 transition-all duration-300 ease-in-out rounded-t-3xl",
        !isExpanded && "h-[60px] bg-white dark:bg-gray-800"
      )}
      style={{
        ...(isExpanded && {
          height: `${EXPANDED_HEIGHT}px`,
          backdropFilter: `blur(${BLUR_INTENSITY}px)`,
          backgroundColor: isDarkMode
            ? `rgba(31, 41, 55, ${BACKGROUND_OPACITY / 100})` // gray-800
            : `rgba(255, 255, 255, ${BACKGROUND_OPACITY / 100})`, // white
        }),
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="w-full h-full flex flex-col">
        {/* Header clickeable */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 flex items-center justify-center gap-2 p-4 text-gray-600 dark:text-gray-400 transition-all duration-300"
        >
          <svg
            className={cn(
              "w-5 h-5 transition-transform duration-300",
              isExpanded ? "rotate-180" : ""
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-sm font-medium">{title}</span>
        </button>

        {/* Contenido expandible */}
        {isExpanded && (
          <div className="flex-1 overflow-hidden px-4 pb-4">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

export function PreviewPanel({ config, updateConfig }: PreviewPanelProps) {
  const { language } = useLanguage();
  const previewT = cardsTranslations[language].configurator.preview;
  const sheetT = previewT.sheet;

  const { branding } = config;
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");
  const [activeAction, setActiveAction] = useState('number');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCardLocked, setIsCardLocked] = useState(false);

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

  const currentBranding = branding[currentTheme];

  // Contenido del preview - Tarjeta SVG con acciones y detalles
  const previewContent = (
    <>
      <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-black pb-[60px]">
        {/* Header con logo */}
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          {currentBranding.logo && (
            <div className="flex justify-center">
              <img
                src={currentBranding.logo}
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* Tarjeta SVG */}
        <div className="flex-shrink-0 px-6 py-4 flex justify-center">
          <div className="relative w-full max-w-[280px]">
            <Image
              src="/images/cards/card.svg"
              alt="Card"
              width={280}
              height={174}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Acciones horizontales */}
        <div className="flex-shrink-0">
          <HorizontalActions activeId={activeAction} onActionChange={setActiveAction} labels={previewT.actions} />
        </div>

        {/* Información de la tarjeta */}
        <div className="flex-shrink-0 px-6 py-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">{previewT.cardTypeLabel}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{previewT.cardTypeValue}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">{previewT.accountLabel}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{previewT.accountValue}</span>
          </div>
        </div>

        {/* Espaciador para la tarjeta colapsable */}
        <div className="flex-1 min-h-[60px]"></div>
      </div>

      {/* Tarjeta colapsable de gastos - Fuera del scroll */}
      <DailySpentCard
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        activeId={activeAction}
        isCardLocked={isCardLocked}
        onToggleCardLock={() => setIsCardLocked((prev) => !prev)}
        customColorTheme={currentBranding.customColorTheme}
        sheetT={sheetT}
      />
    </>
  );

  // Funciones auxiliares para ajustar el color del SVG
  function getHueRotate(color: string): number {
    // Convertir hex a HSL y calcular rotación de matiz
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;

    if (max === min) {
      h = 0;
    } else if (max === r) {
      h = ((g - b) / (max - min)) % 6;
    } else if (max === g) {
      h = (b - r) / (max - min) + 2;
    } else {
      h = (r - g) / (max - min) + 4;
    }

    h = Math.round(h * 60);
    // El color base del SVG es #002340 (azul oscuro), así que calculamos la diferencia
    const baseHue = 210; // Aproximado para #002340
    return h - baseHue;
  }

  function getSaturate(color: string): number {
    // Calcular saturación basada en el color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;

    return Math.round(saturation * 100);
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          {previewT.title}
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
            <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]" data-tour-id="tour-cards-preview-main">
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

                {/* Content area */}
                <div className="relative flex-1 min-h-0 bg-white dark:bg-black  py-4 overflow-hidden">
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
