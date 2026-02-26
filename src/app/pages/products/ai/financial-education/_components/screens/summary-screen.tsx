"use client";

import { useState } from "react";
import { FinancialEducationConfig } from "../financial-education-config";
import { ScoreRing } from "../ui/score-ring";
import { BottomActionButton } from "../ui/bottom-action-button";
import {
  PyramidCarousel,
  type PyramidCarouselItem,
} from "../ui/pyramid-carousel";
import { ScoreSystemModal } from "../ui/score-system-modal";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import { type Language } from "@/contexts/language-context";
import { useCTAButtonAnimations } from "@/hooks/use-cta-button-animations";

interface SummaryScreenProps {
  config: FinancialEducationConfig;
  updateConfig: (updates: Partial<FinancialEducationConfig>) => void;
}

type SummaryTranslations = {
  scoreLabel: string;
  buttons: {
    streak: string;
    graph: string;
    rewards: string;
    learn: string;
  };
  scoreSystem: string;
  metrics: {
    stability: { title: string; subtitle: string; description: string };
    intelligence: { title: string; subtitle: string; description: string };
    discipline: { title: string; subtitle: string; description: string };
  };
};

const translations: Record<Language, SummaryTranslations> = {
  en: {
    scoreLabel: "Your Zelify Score",
    buttons: {
      streak: "Streak",
      graph: "Graph",
      rewards: "Rewards",
      learn: "Learn",
    },
    scoreSystem: "Score System",
    metrics: {
      stability: {
        title: "Stability",
        subtitle: "Intelligence",
        description:
          "Transform your data into clear insights to optimize your consumption.",
      },
      intelligence: {
        title: "Intelligence",
        subtitle: "Intelligence",
        description:
          "Transform your data into clear insights to optimize your consumption.",
      },
      discipline: {
        title: "Discipline",
        subtitle: "",
        description:
          "Your consistency in managing finances and following financial goals.",
      },
    },
  },
  es: {
    scoreLabel: "Tu Zelify Score",
    buttons: {
      streak: "Racha",
      graph: "Gráfico",
      rewards: "Recompensas",
      learn: "Aprender",
    },
    scoreSystem: "Sistema de Puntuación",
    metrics: {
      stability: {
        title: "Estabilidad",
        subtitle: "Confianza",
        description:
          "Convierte datos de gastos en decisiones inteligentes y resultados efectivos.",
      },
      intelligence: {
        title: "Inteligencia",
        subtitle: "Estrategia",
        description:
          "Transforma tus datos en insights claros para optimizar tu consumo.",
      },
      discipline: {
        title: "Disciplina",
        subtitle: "Hábito",
        description:
          "Consistencia en la gestión y cumplimiento de tus objetivos financieros.",
      },
    },
  },
};

export function SummaryScreen({ config, updateConfig }: SummaryScreenProps) {
  const [showScoreModal, setShowScoreModal] = useState(false);
  const t = useLanguageTranslations(translations);
  const themeColor = "#004492";
  useCTAButtonAnimations(themeColor);

  const metrics: PyramidCarouselItem[] = [
    {
      id: "stability",
      title: t.metrics.stability.title,
      subtitle: t.metrics.stability.subtitle,
      percent: config.stabilityIntelligence,
      description: t.metrics.stability.description,
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: "intelligence",
      title: t.metrics.intelligence.title,
      subtitle: t.metrics.intelligence.subtitle,
      percent: config.stabilityIntelligence,
      description: t.metrics.intelligence.description,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.69 3.32 1.81 4.48C5.5 14.5 4 16.14 4 18.22V20c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1.78c0-2.08-1.5-3.72-3.81-4.74C18.31 12.32 19 10.74 19 9c0-3.87-3.13-7-7-7z" />
          <circle cx="9" cy="9" r="1.5" />
          <circle cx="15" cy="9" r="1.5" />
          <path d="M12 13.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      ),
    },
    {
      id: "discipline",
      title: t.metrics.discipline.title,
      subtitle: t.metrics.discipline.subtitle,
      percent: config.discipline,
      description: t.metrics.discipline.description,
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative flex h-full flex-col bg-white dark:bg-black">
      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-6">
        {/* Score Ring */}
        <div className="flex justify-center pt-4 pb-0">
          <ScoreRing
            score={config.zelifyScore}
            size={200}
            strokeWidth={10}
            label={t.scoreLabel}
            secondaryProgress={75}
          />
        </div>

        {/* Metrics Carousel - Pyramid Style */}
        <PyramidCarousel items={metrics} defaultActiveIndex={1} />
      </div>

      {/* Bottom Navigation */}
      <div className="flex-shrink-0 space-y-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-black">
        <div className="flex justify-center gap-2">
          {[
            { key: "streak", label: t.buttons.streak, screen: "streak" },
            { key: "graph", label: t.buttons.graph, screen: "graph" },
            { key: "rewards", label: t.buttons.rewards, screen: "rewards" },
            { key: "learn", label: t.buttons.learn, screen: "learn" },
          ].map((item) => {
            const themeColor = "#004492";
            return (
              <button
                key={item.key}
                onClick={() => {
                  updateConfig({ currentScreen: item.screen as any });
                }}
                className="group relative flex h-10 min-w-[60px] items-center justify-center rounded-full px-3 text-[10px] font-medium text-white transition-all active:scale-[0.98] overflow-hidden"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0, 68, 146, 0.95) 0%, #004492 50%, rgba(0, 51, 102, 0.95) 100%)",
                  boxShadow: `0 4px 14px 0 ${themeColor}40`,
                  animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                }}
              >
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
                
                <span className="relative z-10" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  {item.label}
                </span>
                
                {/* Efecto de brillo al hacer hover */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
              </button>
            );
          })}
        </div>
        <BottomActionButton
          label={t.scoreSystem}
          onClick={() => setShowScoreModal(true)}
        />
        <ScoreSystemModal
          isOpen={showScoreModal}
          onClose={() => setShowScoreModal(false)}
        />
      </div>
    </div>
  );
}
