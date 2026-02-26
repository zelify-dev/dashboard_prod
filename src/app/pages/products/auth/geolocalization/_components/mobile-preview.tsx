"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTour } from "@/contexts/tour-context";

import { useGeolocalizationTranslations } from "./use-geolocalization-translations";

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
        };

        const loop = (time: number) => {
            render(time);
            animationRef.current = requestAnimationFrame(loop);
        };

        const resize = () => {
            const { width, height } = parent.getBoundingClientRect();
            canvas.width = Math.max(1, Math.floor(width * dpr));
            canvas.height = Math.max(1, Math.floor(height * dpr));
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            render(performance.now());
        };

        resize();

        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(resize);
            observer.observe(parent);
            resizeObserverRef.current = observer;
        }

        animationRef.current = requestAnimationFrame(loop);

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

interface MobilePreviewProps {
    locationInfo?: {
        city?: string;
        country?: string;
        formatted?: string;
    } | null;
}

export function MobilePreview({ locationInfo }: MobilePreviewProps) {
    const translations = useGeolocalizationTranslations();
    const [showNotification, setShowNotification] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Agregar estilos de animación
    useEffect(() => {
        const styleId = "mobile-preview-animations";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        @keyframes halftonePulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.8; }
        }
      `;
            document.head.appendChild(style);
        }
    }, []);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains("dark"));
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // Obtener información de ubicación para la notificación
    const notificationLocation = locationInfo?.city && locationInfo?.country
        ? `${locationInfo.city}, ${locationInfo.country}`
        : locationInfo?.formatted
            ? locationInfo.formatted.split(",").slice(0, 2).join(",")
            : "Quito, Ecuador";

    const { isTourActive, currentStep, steps } = useTour();
    const currentStepData = steps[currentStep];
    const isDeviceTarget = isTourActive && currentStepData?.target === "tour-geolocalization-device";
    const modalCardShadow = isDarkMode
        ? "0 10px 24px rgba(0,0,0,0.5)"
        : "0 10px 24px rgba(15,23,42,0.22)";

    return (
        <div className={cn("relative rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2 scroll-mt-48", isDeviceTarget && "z-[102]")} data-tour-id="tour-geolocalization-device">
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                    Vista previa móvil
                </h3>
                <p className="text-sm text-dark-6 dark:text-dark-6">
                    Modal de permisos de geolocalización
                </p>
            </div>

            {/* Container with animated background */}
            <div className="relative -mx-6 w-[calc(100%+3rem)] py-20">
                {/* Background with animated halftone - OUTSIDE the device */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl" style={{ minHeight: "850px" }}>
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

                    {/* Additional halftone layer */}
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

                                {/* Content area - No scroll, fixed height */}
                                <div className="flex-1 min-h-0 bg-white dark:bg-black px-5 py-4 overflow-hidden">
                                    <div className="relative h-full overflow-hidden">
                                        {/* Permission Modal - iOS Style */}
                                        {showNotification && (
                                            <div className="absolute inset-0 z-50 flex items-center justify-center  px-5 animate-slide-down">
                                                <div
                                                    className="w-full max-w-[250px] rounded-[14px] bg-white dark:bg-gray-800 overflow-hidden"
                                                    style={{ boxShadow: modalCardShadow }}
                                                >
                                                    {/* Icon */}
                                                    <div className="flex justify-center pt-7 pb-2.5">
                                                        <div className="w-11 h-11 rounded-full bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center">
                                                            <svg
                                                                className="h-5.5 w-5.5 text-blue-500 dark:text-blue-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                                />
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    {/* Title */}
                                                    <div className="px-4 pb-3.5">
                                                        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white text-center leading-[19px]">
                                                            {translations.permissionModal.title}
                                                        </h3>
                                                    </div>

                                                    {/* Info Box */}
                                                    <div className="mx-3.5 mb-4 rounded-[10px] bg-gray-50 dark:bg-gray-700/50 p-2.5 flex items-start gap-2">
                                                        <svg
                                                            className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        <p className="text-[11px] text-gray-600 dark:text-gray-400 flex-1 leading-[15px]">
                                                            {translations.permissionModal.description}
                                                        </p>
                                                    </div>

                                                    {/* Buttons - iOS Style */}
                                                    <div className="px-3 pb-2.5 space-y-[1px]">
                                                        <button className="w-full rounded-[10px] bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5 text-[14px] font-medium text-blue-500 dark:text-blue-400 active:bg-gray-100 dark:active:bg-gray-700 transition-colors">
                                                            {translations.permissionModal.whileUsing}
                                                        </button>
                                                        <button className="w-full rounded-[10px] bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5 text-[14px] font-medium text-blue-500 dark:text-blue-400 active:bg-gray-100 dark:active:bg-gray-700 transition-colors">
                                                            {translations.permissionModal.onlyOnce}
                                                        </button>
                                                        <button
                                                            onClick={() => setShowNotification(false)}
                                                            className="w-full rounded-[10px] bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5 text-[14px] font-medium text-red-500 dark:text-red-400 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                                                        >
                                                            {translations.permissionModal.dontAllow}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* App Content - Home Screen Style */}
                                        <div className="flex h-full flex-col items-center justify-center px-6 py-12">
                                            <div className="text-center blur-sm">
                                                <div className="mb-6 mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                                                    <svg
                                                        className="h-10 w-10 text-white"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                    </svg>
                                                </div>
                                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                    Zelify
                                                </h2>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {showNotification
                                                        ? "Notificación de geolocalización activa"
                                                        : "Desliza hacia abajo para ver notificaciones"}
                                                </p>
                                            </div>
                                        </div>
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

            {/* Control para mostrar/ocultar modal */}
            <div className="mt-4 flex justify-center">
                <button
                    onClick={() => setShowNotification(!showNotification)}
                    className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
                >
                    {showNotification ? "Ocultar modal" : "Mostrar modal"}
                </button>
            </div>
        </div>
    );
}
