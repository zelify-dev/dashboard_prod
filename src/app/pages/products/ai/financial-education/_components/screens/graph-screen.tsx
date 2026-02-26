"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FinancialEducationConfig } from "../financial-education-config";
import { BottomActionButton } from "../ui/bottom-action-button";
import zelifyLogoDark from "@/assets/logos/zelifyLogo_dark.svg";
import zelifyLogoLight from "@/assets/logos/zelifyLogo_ligth.svg";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import { type Language } from "@/contexts/language-context";

interface GraphScreenProps {
  config: FinancialEducationConfig;
  updateConfig: (updates: Partial<FinancialEducationConfig>) => void;
}

type GraphTranslations = {
  back: string;
  today: string;
  filters: {
    all: string;
    increasing: string;
    spending: string;
    savings: string;
  };
  discoverMore: string;
};

const translations: Record<Language, GraphTranslations> = {
  en: {
    back: "back",
    today: "Today",
    filters: {
      all: "All",
      increasing: "Increasing",
      spending: "Spending",
      savings: "Savings",
    },
    discoverMore: "Discover More",
  },
  es: {
    back: "atrás",
    today: "Hoy",
    filters: {
      all: "Todo",
      increasing: "Aumentando",
      spending: "Gastos",
      savings: "Ahorros",
    },
    discoverMore: "Descubrir Más",
  },
};

export function GraphScreen({ config, updateConfig }: GraphScreenProps) {
  const t = useLanguageTranslations(translations);
  const timeframes = ["24H", "1W", "1M", "3M", "6M", "1Y", "All"];
  const [selectedTimeframe, setSelectedTimeframe] = useState("1W");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "increasing" | "spending" | "savings">("all");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Datos del gráfico con tipos
  const graphData = [
    { height: 65, type: "increasing", color: "#10B981" },
    { height: 45, type: "spending", color: "#004492" },
    { height: 80, type: "savings", color: "#F59E0B" },
    { height: 55, type: "increasing", color: "#10B981" },
    { height: 70, type: "spending", color: "#004492" },
    { height: 60, type: "savings", color: "#F59E0B" },
    { height: 75, type: "increasing", color: "#10B981" },
    { height: 50, type: "spending", color: "#004492" },
    { height: 85, type: "savings", color: "#F59E0B" },
    { height: 65, type: "increasing", color: "#10B981" },
    { height: 70, type: "spending", color: "#004492" },
    { height: 60, type: "savings", color: "#F59E0B" },
  ];

  // Filtrar datos según el filtro seleccionado
  const getFilteredData = () => {
    if (selectedFilter === "all") {
      return graphData;
    }
    return graphData.map(item => ({
      ...item,
      height: item.type === selectedFilter ? item.height : 0,
    }));
  };

  const filteredData = getFilteredData();

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-black">
      <div className="flex-shrink-0 px-6 pt-3">
        <button
          onClick={() => updateConfig({ currentScreen: "summary" })}
          className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          &lt; {t.back}
        </button>
        <div className="mb-3 flex justify-center">
          <div className="relative h-6 w-24">
            <Image
              src={zelifyLogoLight}
              fill
              className="dark:hidden"
              alt="Zelify logo"
              role="presentation"
              quality={100}
            />
            <Image
              src={zelifyLogoDark}
              fill
              className="hidden dark:block"
              alt="Zelify logo"
              role="presentation"
              quality={100}
            />
          </div>
        </div>
        <div className="mb-3 flex items-center justify-center gap-2">
          <button className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white">
            {t.today} 01-09-26
          </button>
        </div>
        <div className="mb-3 flex justify-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-500"></div>
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{t.filters.increasing}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500"></div>
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{t.filters.spending}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-yellow-500"></div>
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{t.filters.savings}</span>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {[
            { key: "all" as const, label: t.filters.all },
            { key: "increasing" as const, label: t.filters.increasing },
            { key: "spending" as const, label: t.filters.spending },
            { key: "savings" as const, label: t.filters.savings },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                selectedFilter === filter.key
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden px-6 py-2">
        <div className="w-full max-w-md">
          {/* Graph Area */}
          <div className="h-48 rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="flex h-full items-end justify-between gap-1 p-3">
              {filteredData.map((bar, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${bar.height}%`,
                    backgroundColor: bar.color,
                    opacity: bar.height === 0 ? 0.2 : 1,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  selectedTimeframe === timeframe
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-black">
        <BottomActionButton label={t.discoverMore} onClick={() => {}} />
      </div>
    </div>
  );
}
