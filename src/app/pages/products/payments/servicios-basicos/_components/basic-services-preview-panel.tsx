"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ServiceRegion } from "./basic-services-config";
import { useBasicServicesTranslations } from "./use-basic-services-translations";
import { cn } from "@/lib/utils";

export type ServiceCategory =
  | "telecom"
  | "electricity"
  | "water"
  | "government"
  | "gas";

export interface ServiceProvider {
  id: string;
  name: string;
  logo?: string;
  category: ServiceCategory;
  isPopular?: boolean;
  paymentOptions: string[];
}

interface BasicServicesConfig {
  logo?: string | null;
  customColorTheme: string;
}

interface BasicServicesPreviewPanelProps {
  region: ServiceRegion;
  config: BasicServicesConfig;
  visibleProviderIds?: string[];
}

type Screen = "screen1" | "screen2" | "screen3" | "screen4" | "screen5";

// Placeholder providers data - simplified version
export const PROVIDERS_BY_REGION: Record<
  ServiceRegion,
  ServiceProvider[] | "coming_soon"
> = {
  ecuador: "coming_soon",
  mexico: [
    { id: "mx-1", name: "CFE", logo: "/images/business/CFE-PNG-500x500.png", category: "electricity", paymentOptions: ["reference"] },
    { id: "mx-2", name: "Telmex", logo: "/images/business/telmex_1.png", category: "telecom", paymentOptions: ["phone"] },
  ],
  brasil: [
    { id: "br-1", name: "Vivo", logo: "/images/business/vivo.webp", category: "telecom", paymentOptions: ["phone"], isPopular: true },
    { id: "br-2", name: "Enel Brasil", logo: "/images/business/enel.png", category: "electricity", paymentOptions: ["reference"], isPopular: true },
    { id: "br-3", name: "Sabesp", logo: "/images/business/sabesp.png", category: "water", paymentOptions: ["reference"], isPopular: true },
    { id: "br-4", name: "Claro Brasil", logo: "/images/business/claro.png", category: "telecom", paymentOptions: ["phone"] },
    { id: "br-5", name: "Oi", logo: "/images/business/oi.png", category: "telecom", paymentOptions: ["phone"] },
    { id: "br-6", name: "TIM Brasil", logo: "/images/business/tim.webp", category: "telecom", paymentOptions: ["phone"] },
  ],
  colombia: [
    { id: "co-1", name: "Movistar Colombia", logo: "/images/business/movistar.webp", category: "telecom", paymentOptions: ["phone"], isPopular: true },
    { id: "co-2", name: "EPM", logo: "/images/business/epm.jpg", category: "electricity", paymentOptions: ["reference"], isPopular: true },
  ],
  estados_unidos: [
    { id: "us-1", name: "AT&T", logo: "/images/business/at.png", category: "telecom", paymentOptions: ["phone"], isPopular: true },
    { id: "us-2", name: "Verizon", logo: "/images/business/verizon.jfif", category: "telecom", paymentOptions: ["phone"], isPopular: true },
  ],
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
      const [r, g, b] = isDarkMode ? [255, 255, 255] : [70, 85, 110];
      const minAlpha = isDarkMode ? 0.06 : 0.1;
      const maxAlpha = isDarkMode ? 0.45 : 0.5;

      for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
        for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = distance / maxDistance;
          const wavePhase =
            (normalizedDistance * waveFrequency - elapsed * waveSpeed) *
            Math.PI *
            2;
          const pulse = (Math.cos(wavePhase) + 1) / 2;
          const edgeFade = Math.pow(1 - normalizedDistance, 1.4);
          const alpha = (minAlpha + pulse * maxAlpha) * edgeFade;
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

export function BasicServicesPreviewPanel({
  region,
  config,
  visibleProviderIds,
}: BasicServicesPreviewPanelProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("screen1");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"popular" | "favorites" | ServiceCategory>("popular");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);
  const [favoriteProviderIds, setFavoriteProviderIds] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const translations = useBasicServicesTranslations();
  const themeColor = config.customColorTheme || "#004492";

  // Función para oscurecer el color
  const darkenColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xFF) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const darkThemeColor = darkenColor(themeColor, 30);
  const almostBlackColor = darkenColor(themeColor, 100);
  const blackColor = darkenColor(themeColor, 150);

  // Obtener proveedores según la región y filtros
  const providersData = PROVIDERS_BY_REGION[region];
  const isComingSoon = providersData === "coming_soon";
  const allProviders = isComingSoon ? [] : (providersData as ServiceProvider[]);
  const providers = useMemo(() => {
    // `undefined`: sin filtro (mostrar todas). `[]`: ninguna visible.
    if (Array.isArray(visibleProviderIds)) {
      return allProviders.filter((provider) => visibleProviderIds.includes(provider.id));
    }
    return allProviders;
  }, [allProviders, visibleProviderIds]);

  // Filtrar proveedores según búsqueda y categoría
  const filteredProviders = useMemo(() => {
    let filtered = providers;

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query));
    }

    // Filtrar por categoría
    if (selectedCategory === "popular") {
      filtered = filtered.filter((p) => p.isPopular);
    } else if (selectedCategory === "favorites") {
      filtered = filtered.filter((p) => favoriteProviderIds.includes(p.id));
    } else if (typeof selectedCategory === "string") {
      // Es una categoría de servicio
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    return filtered;
  }, [providers, searchQuery, selectedCategory, favoriteProviderIds]);

  // Obtener categorías disponibles
  const availableCategories = useMemo(() => {
    const cats: Array<{ type: "popular" | "favorites" | ServiceCategory; label: string }> = [
      { type: "popular", label: translations.popularLabel },
      { type: "favorites", label: translations.favoritesLabel },
    ];

    const categorySet = new Set<ServiceCategory>();
    providers.forEach((p) => categorySet.add(p.category));

    categorySet.forEach((cat) => {
      cats.push({
        type: cat,
        label: translations.categories?.[cat] || cat,
      });
    });

    return cats;
  }, [providers, translations]);

  // Calcular qué categorías mostrar (solo 3 a la vez)
  const visibleCategories = useMemo(() => {
    const total = availableCategories.length;
    if (total === 0) return [];

    const activeIndex = activeCategoryIndex;

    // Si es el primero, mostrar los primeros 3
    if (activeIndex === 0) {
      return availableCategories.slice(0, Math.min(3, total));
    }

    // Si es el último, mostrar los últimos 3
    if (activeIndex === total - 1) {
      return availableCategories.slice(Math.max(0, total - 3), total);
    }

    // Si está en el medio, mostrar el anterior, el actual y el siguiente
    return availableCategories.slice(Math.max(0, activeIndex - 1), Math.min(total, activeIndex + 2));
  }, [availableCategories, activeCategoryIndex]);

  // Sincronizar selectedCategory con activeCategoryIndex
  useEffect(() => {
    const index = availableCategories.findIndex((cat) => cat.type === selectedCategory);
    if (index !== -1) {
      setActiveCategoryIndex(index);
    }
  }, [selectedCategory, availableCategories]);

  const handleCategoryClick = (categoryType: "popular" | "favorites" | ServiceCategory, index: number) => {
    setSelectedCategory(categoryType);
    setActiveCategoryIndex(index);
  };

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

  // Add CSS animations
  useEffect(() => {
    const styleId = "basic-services-animations";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes halftonePulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Parámetros configurables del blur y transparencia
  const BLUR_INTENSITY = 8; // Intensidad del blur en píxeles
  const BACKGROUND_OPACITY = 0.4; // Opacidad del fondo (0-1)
  const CARD_HEIGHT = "65%"; // Altura del div con blur desde abajo
  const CARD_PADDING_HORIZONTAL = 0; // Padding lateral en píxeles (mx-4 = 16px)
  const CARD_PADDING_BOTTOM = 0; // Padding inferior en píxeles

  const renderScreen = () => {
    const showGifAndBlur = currentScreen === "screen1" || currentScreen === "screen2" || currentScreen === "screen3";

    return (
      <div className="relative h-full w-full">
        {/* GIF de fondo - Solo en las primeras 3 pantallas */}
        {showGifAndBlur && (
          <div className="absolute top-0 left-0 right-0 h-1/2 z-0 px-4 overflow-hidden flex items-center justify-center pt-4">
            <img
              src="/gift/ANIMACION 1.gif"
              alt={translations.preview.animationAlt}
              className="w-[140%] h-auto object-contain"
            />
          </div>
        )}

        {/* Div con blur transparente - Solo en las primeras 3 pantallas */}
        {showGifAndBlur && (
          <div
            className="absolute bottom-0 left-0 right-0 z-10 flex flex-col"
            style={{
              height: CARD_HEIGHT,
              borderRadius: '24px 24px 0 0', // Esquinas redondeadas solo arriba
              backdropFilter: `blur(${BLUR_INTENSITY}px)`,
              backgroundColor: isDarkMode
                ? `rgba(0, 0, 0, ${BACKGROUND_OPACITY})`
                : `rgba(255, 255, 255, ${BACKGROUND_OPACITY})`,
            }}
          >
            {/* Contenido de screen1 */}
            {currentScreen === "screen1" && (
              <div className="flex-1 flex flex-col px-4 pt-4 pb-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Título */}
                <h1
                  className="text-xl font-bold mb-1 text-center"
                  style={{ color: themeColor }}
                >
                  {translations.screen1.title}
                </h1>

                {/* Subtítulo */}
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-3">
                  {translations.screen1.subtitle}
                </p>

                {/* Barra de búsqueda */}
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={translations.screen1.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{
                      '--tw-ring-color': themeColor,
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                  />
                </div>

                {/* Fila de proveedores - Carrusel horizontal */}
                {providers.length > 0 && (
                  <div className="flex gap-3 mb-4 overflow-x-auto pb-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {providers.slice(0, 6).map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => {
                          setSelectedProvider(provider);
                          setCurrentScreen("screen2");
                        }}
                        className="flex flex-col items-center gap-2 min-w-[80px] flex-shrink-0"
                      >
                        {/* Círculo con inicial */}
                        <div
                          className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-md border-2"
                          style={{
                            borderColor: themeColor + '40',
                            backgroundColor: '#F3F4F6',
                          }}
                        >
                          {provider.logo ? (
                            <img
                              src={provider.logo}
                              alt={provider.name}
                              className={cn(
                                "rounded-full object-cover",
                                provider.id === "br-3" ? "h-8 w-8" : "h-10 w-10"
                              )}
                            />
                          ) : (
                            <span
                              className="text-lg font-bold"
                              style={{ color: themeColor }}
                            >
                              {provider.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                          {provider.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tarjetas de categorías con efecto pirámide */}
                <div className="mt-4 relative flex flex-col items-center flex-shrink-0" style={{ isolation: 'isolate' }}>
                  {visibleCategories.map((category) => {
                    // Encontrar el índice global de esta categoría
                    const globalIndex = availableCategories.findIndex((c) => c.type === category.type);
                    const isActive = activeCategoryIndex === globalIndex;
                    const distanceFromActive = Math.abs(activeCategoryIndex - globalIndex);
                    const zIndex = 50 - distanceFromActive;

                    // Calcular el índice local dentro de visibleCategories
                    const visibleIndex = visibleCategories.findIndex((c) => c.type === category.type);

                    return (
                      <button
                        key={category.type}
                        onClick={() => handleCategoryClick(category.type, globalIndex)}
                        className="relative w-full cursor-pointer flex items-center justify-center transition-all duration-500"
                        style={{
                          borderRadius: '20px',
                          zIndex: zIndex,
                          marginTop: visibleIndex === 0 ? '0px' : '-20px',
                          height: isActive ? '60px' : '55px',
                          padding: isActive ? '20px 24px' : '16px 24px',
                          backgroundColor: isActive ? undefined : '#E5E7EB',
                          color: isActive ? 'white' : '#1F2937',
                          border: '5px solid #FFFFFF',
                          boxShadow: isActive
                            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          transform: isActive ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          ...(isActive ? {
                            background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                          } : {}),
                        }}
                      >
                        <span
                          className={cn(
                            "font-medium text-center",
                            isActive ? 'text-sm font-semibold' : 'text-xs font-medium'
                          )}
                          style={{
                            whiteSpace: 'nowrap',
                            color: isActive ? 'white' : '#1F2937',
                          }}
                        >
                          {category.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contenido de screen2 */}
            {currentScreen === "screen2" && selectedProvider && (
              <div className="flex-1 flex flex-col px-4 pt-6 pb-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Botón de atrás */}
                <button
                  onClick={() => {
                    setCurrentScreen("screen1");
                    setSelectedProvider(null);
                  }}
                  className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">{translations.backLabel}</span>
                </button>

                {/* Nombre del proveedor centrado */}
                <h1
                  className="text-2xl font-bold mb-8 text-center"
                  style={{ color: themeColor }}
                >
                  {selectedProvider.name}
                </h1>

                {/* Tarjeta 1: My Phone Number */}
                <button
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 p-4 mb-3 text-left transition hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {translations.paymentMethods?.["phone-my-number"]?.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {translations.paymentMethods?.["phone-my-number"]?.description}
                  </div>
                </button>

                {/* Tarjeta 2: Enter Phone Number */}
                <button
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 p-4 text-left transition hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {translations.paymentMethods?.phone?.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {translations.paymentMethods?.phone?.description}
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contenido por defecto si no es una de las primeras 3 pantallas */}
        {!showGifAndBlur && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-dark-6 dark:text-dark-6">
              {translations.preview.screenLabelPrefix} {currentScreen.replace("screen", "")}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg bg-transparent p-6 shadow-sm dark:bg-transparent">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          {translations.previewTitle}
        </h2>
      </div>
      <div className="relative -mx-6 w-[calc(100%+3rem)] py-12">
        {/* Interactive animated background with halftone dots and glow */}
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl"
          style={{ minHeight: "850px" }}
        >
          {/* Base gradient background */}
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

          {/* Additional animated halftone layer for depth */}
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

        {/* iPhone Frame */}
        <div className="relative mx-auto max-w-[340px] z-10">
          <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
            {/* Screen */}
            <div className="relative h-[680px] overflow-hidden rounded-[2.5rem] bg-white dark:bg-black m-0.5 flex flex-col">
              {/* Status Bar */}
              <div className="relative flex items-center justify-between bg-white dark:bg-black px-4 pt-10 pb-2 flex-shrink-0">
                <div className="absolute left-6 top-4 flex items-center">
                  <span className="text-xs font-semibold text-black dark:text-white">
                    9:41
                  </span>
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

              {/* Header con logo centrado */}
              {config.logo && (
                <div className="relative mb-3 flex flex-shrink-0 items-center justify-center px-6 pt-6">
                  <div className="absolute left-1/2 -translate-x-1/2">
                    <img
                      src={config.logo}
                      alt={translations.preview.logoAlt}
                      className="h-8 max-w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div
                className="flex-1 min-h-0 bg-white dark:bg-black overflow-y-auto px-4 py-6"
                style={{ scrollbarWidth: "thin" }}
              >
                {renderScreen()}
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-shrink-0">
                <div className="h-1 w-32 rounded-full bg-black/30 dark:bg-white/30"></div>
              </div>
            </div>

            {/* Phone Frame Details */}
            <div className="absolute -left-1 top-24 h-12 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
            <div className="absolute -left-1 top-40 h-8 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
            <div className="absolute -right-1 top-32 h-10 w-1 rounded-r bg-gray-800 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
