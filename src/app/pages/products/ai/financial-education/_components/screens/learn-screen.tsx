"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FinancialEducationConfig } from "../financial-education-config";
import { MetricRing } from "../ui/metric-ring";
import { Card } from "../ui/card";
import zelifyLogoDark from "@/assets/logos/zelifyLogo_dark.svg";
import zelifyLogoLight from "@/assets/logos/zelifyLogo_ligth.svg";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import { type Language } from "@/contexts/language-context";

interface LearnScreenProps {
  config: FinancialEducationConfig;
  updateConfig: (updates: Partial<FinancialEducationConfig>) => void;
}

type LearnTranslations = {
  back: string;
  increasing: string;
  spending: string;
  savings: string;
  weeklySummary: string;
  weeklySummaryContent: string;
  tipsForYou: string;
  videos: string;
  blogs: string;
  tipTitles: {
    [key: string]: string;
  };
};

const translations: Record<Language, LearnTranslations> = {
  en: {
    back: "back",
    increasing: "increasing",
    spending: "spending",
    savings: "savings",
    weeklySummary: "Your weekly summary",
    weeklySummaryContent: "Your Spending is getting bigger this week, which is not allowing you to increase your savings. The categories in which you are overspending are food and entertainment.",
    tipsForYou: "Our tips for you",
    videos: "Educational Videos",
    blogs: "Recommended Blogs",
    tipTitles: {
      "tip-1": "How to control overspending on not basic items",
      "tip-2": "How to increase your incoming",
    },
  },
  es: {
    back: "atrás",
    increasing: "aumentando",
    spending: "gastos",
    savings: "ahorros",
    weeklySummary: "Tu resumen semanal",
    weeklySummaryContent: "Tus gastos están aumentando esta semana, lo que no te permite incrementar tus ahorros. Las categorías en las que estás gastando de más son comida y entretenimiento.",
    tipsForYou: "Nuestros consejos para ti",
    videos: "Videos Educativos",
    blogs: "Blogs Recomendados",
    tipTitles: {
      "tip-1": "Cómo controlar el gasto excesivo en artículos no básicos",
      "tip-2": "Cómo aumentar tus ingresos",
    },
  },
};

export function LearnScreen({ config, updateConfig }: LearnScreenProps) {
  const t = useLanguageTranslations(translations);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
      <div className="flex-shrink-0 px-6 pt-4">
        <button
          onClick={() => updateConfig({ currentScreen: "summary" })}
          className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          &lt; {t.back}
        </button>
        <div className="mb-6 flex justify-center">
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
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
        {/* Performance Metrics */}
        <div className="flex justify-around">
          <MetricRing
            percent={config.increasingPercent}
            label={t.increasing}
            color="#10B981"
          />
          <MetricRing
            percent={config.spendingPercent}
            label={t.spending}
            color="#004492"
          />
          <MetricRing
            percent={config.savingsPercent}
            label={t.savings}
            color="#F59E0B"
          />
        </div>

        {/* Weekly Summary */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{t.weeklySummary}</h3>
          <Card>
            <p className="text-sm text-gray-700 dark:text-gray-300">{t.weeklySummaryContent}</p>
          </Card>
        </div>

        {/* Tips Section */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{t.tipsForYou}</h3>
          <div className="grid grid-cols-2 gap-3">
            {config.tips.map((tip) => (
              <Card
                key={tip.id}
                className="cursor-pointer overflow-hidden p-0"
                onClick={() => {
                  updateConfig({ currentScreen: "learn-content", selectedTip: tip.id });
                }}
              >
                <img
                  src={tip.image}
                  alt={t.tipTitles[tip.id] || tip.title}
                  className="h-32 w-full object-cover"
                />
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{t.tipTitles[tip.id] || tip.title}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Videos Section */}
        {config.videos && config.videos.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{t.videos}</h3>
            <div className="space-y-3">
              {config.videos.map((video) => (
                <Card
                  key={video.id}
                  className="cursor-pointer overflow-hidden p-0"
                  onClick={() => {
                    if (video.url) {
                      window.open(video.url, '_blank');
                    }
                  }}
                >
                  <div className="relative h-32 w-full bg-gray-100 dark:bg-gray-800">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-gray-400"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{video.title}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Blogs Section */}
        {config.blogs && config.blogs.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{t.blogs}</h3>
            <div className="space-y-3">
              {config.blogs.map((blog) => (
                <Card
                  key={blog.id}
                  className="cursor-pointer p-4"
                  onClick={() => {
                    if (blog.url) {
                      window.open(blog.url, '_blank');
                    }
                  }}
                >
                  <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">{blog.title}</h4>
                  {blog.excerpt && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{blog.excerpt}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
