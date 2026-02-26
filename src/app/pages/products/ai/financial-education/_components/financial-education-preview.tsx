"use client";

import { useEffect, useState, useRef } from "react";
import { FinancialEducationConfig, ScreenType } from "./financial-education-config";
import { ScoreRing } from "./ui/score-ring";
import { MetricRing } from "./ui/metric-ring";
import { Card } from "./ui/card";
import { ProgressBar } from "./ui/progress-bar";
import { BottomActionButton } from "./ui/bottom-action-button";
import { SummaryScreen } from "./screens/summary-screen";
import { StreakScreen } from "./screens/streak-screen";
import { GraphScreen } from "./screens/graph-screen";
import { LearnScreen } from "./screens/learn-screen";
import { LearnContentViewScreen } from "./screens/learn-content-view-screen";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import { type Language } from "@/contexts/language-context";

type ScreenTranslations = {
  summary: string;
  streak: string;
  graph: string;
  learn: string;
};

const screenTranslations: Record<Language, ScreenTranslations> = {
  en: {
    summary: "Summary",
    streak: "Streak",
    graph: "Graph",
    learn: "Learn",
  },
  es: {
    summary: "Resumen",
    streak: "Racha",
    graph: "Gráfico",
    learn: "Aprender",
  },
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

interface FinancialEducationPreviewProps {
  config: FinancialEducationConfig;
  updateConfig: (updates: Partial<FinancialEducationConfig>) => void;
}

export function FinancialEducationPreview({
  config,
  updateConfig,
}: FinancialEducationPreviewProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const screenT = useLanguageTranslations(screenTranslations);

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

    // Add halftonePulse animation
    const styleId = "financial-education-animations";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes halftonePulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => observer.disconnect();
  }, []);

  const renderScreen = () => {
    switch (config.currentScreen) {
      case "summary":
        return <SummaryScreen config={config} updateConfig={updateConfig} />;
      case "streak":
        return <StreakScreen config={config} updateConfig={updateConfig} />;
      case "graph":
        return <GraphScreen config={config} updateConfig={updateConfig} />;
      case "learn":
        return <LearnScreen config={config} updateConfig={updateConfig} />;
      case "learn-content":
        return <LearnContentViewScreen config={config} updateConfig={updateConfig} />;
      default:
        return <SummaryScreen config={config} updateConfig={updateConfig} />;
    }
  };

  return (
    <div className="rounded-lg bg-transparent p-6 shadow-sm dark:bg-transparent" data-tour-id="tour-financial-preview">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          Vista Previa Móvil
        </h2>
        <div className="flex gap-2">
          {(["summary", "streak", "graph", "learn"] as ScreenType[]).map((screen) => (
            <button
              key={screen}
              onClick={() => updateConfig({ currentScreen: screen })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${config.currentScreen === screen
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
            >
              {screenT[screen as keyof typeof screenT]}
            </button>
          ))}
        </div>
      </div>
      <div className="relative -mx-6 w-[calc(100%+3rem)] py-12">
        <div className="absolute inset-0 overflow-hidden rounded-3xl" style={{ minHeight: "850px" }}>
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

                {/* Screen Content */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-black">
                  {renderScreen()}
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
