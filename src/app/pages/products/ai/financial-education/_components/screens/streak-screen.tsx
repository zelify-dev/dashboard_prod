"use client";

import { FinancialEducationConfig } from "../financial-education-config";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import { type Language } from "@/contexts/language-context";

interface StreakScreenProps {
  config: FinancialEducationConfig;
  updateConfig: (updates: Partial<FinancialEducationConfig>) => void;
}

type StreakTranslations = {
  back: string;
  dayStreak: string;
  streakStarted: string;
  maxStreak: string;
  thisWeek: string;
  moreDays: string;
  toUnlock: string;
  activeRewards: string;
  viewAll: string;
  futureRewards: string;
  days: readonly string[];
};

const translations: Record<Language, StreakTranslations> = {
  en: {
    back: "back",
    dayStreak: "day streak",
    streakStarted: "Streak Started",
    maxStreak: "Max Streak",
    thisWeek: "This Week",
    moreDays: "more days",
    toUnlock: "To unlock your next reward",
    activeRewards: "Your active rewards",
    viewAll: "View all",
    futureRewards: "Your future rewards",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  es: {
    back: "atrás",
    dayStreak: "días de racha",
    streakStarted: "Racha Iniciada",
    maxStreak: "Racha Máxima",
    thisWeek: "Esta Semana",
    moreDays: "días más",
    toUnlock: "Para desbloquear tu próxima recompensa",
    activeRewards: "Tus recompensas activas",
    viewAll: "Ver todas",
    futureRewards: "Tus futuras recompensas",
    days: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  },
};

export function StreakScreen({ config, updateConfig }: StreakScreenProps) {
  const t = useLanguageTranslations(translations);
  const days = t.days;
  const dayColors = ["#004492", "#10B981", "#34D399", "#6EE7B7", "#10B981"];
  const progressPercent = (config.goalProgress.current / config.goalProgress.target) * 100;
  const remainingDays = config.goalProgress.target - config.goalProgress.current;

  // Parse rewards to extract brand and description
  const parseReward = (reward: string) => {
    const parts = reward.split(" ");
    if (parts.length >= 2) {
      return {
        brand: parts[0] === "Juan" ? "Juan Valdez" : parts[0] === "Only" ? "Only & Sons" : parts[0],
        description: parts.slice(parts[0] === "Juan" || parts[0] === "Only" ? 2 : 1).join(" "),
      };
    }
    return { brand: reward, description: "" };
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-black">
      <div className="flex-shrink-0 px-6 pt-4">
        <button
          onClick={() => updateConfig({ currentScreen: "summary" })}
          className="mb-4 text-sm font-medium text-gray-400 dark:text-gray-500"
        >
          &lt; {t.back}
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
        {/* Streak Display - Semicircle with Gradient */}
        <div className="relative flex justify-center pt-4">
          <div className="relative h-40 w-72">
            {/* Semicircle with brand colors gradient */}
            <div
              className="absolute bottom-0 left-1/2 h-40 w-72 -translate-x-1/2 rounded-t-full"
              style={{
                background: "linear-gradient(135deg, #004492 0%, #3B82F6 20%, #10B981 50%, #059669 75%, #047857 100%)",
                boxShadow: "0 4px 12px rgba(0, 68, 146, 0.3)",
              }}
            >
              {/* Additional color overlay for more vibrant gradient */}
              <div
                className="absolute inset-0 rounded-t-full opacity-70"
                style={{
                  background: "linear-gradient(90deg, rgba(0, 68, 146, 0.9) 0%, rgba(59, 130, 246, 0.8) 25%, rgba(16, 185, 129, 0.9) 60%, rgba(5, 150, 105, 1) 100%)",
                }}
              />

              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 rounded-t-full bg-white/10 backdrop-blur-sm" />

              {/* Content */}
              <div className="relative flex h-full flex-col items-center justify-center pt-6">
                <div className="text-6xl font-bold text-white drop-shadow-sm">
                  {config.streakDays}
                </div>
                <div className="mt-1 text-sm font-medium text-white/95 drop-shadow-sm">
                  {t.dayStreak}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Streak Details Card */}
        <div
          className="mx-auto -mt-6 w-full max-w-[300px] rounded-2xl bg-gray-50 p-4 shadow-sm dark:bg-gray-800"
          style={{ border: "1px solid rgba(229, 231, 235, 0.5)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t.streakStarted}
              </span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t.maxStreak}
              </span>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {config.streakStartDate}
              </span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {config.maxStreak}
              </span>
            </div>
          </div>
        </div>

        {/* This Week Progress */}
        <div className="text-center">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white" style={{ color: "#004492" }}>
            {t.thisWeek}
          </h3>
          <div className="flex justify-center gap-2">
            {days.map((day, index) => {
              const isCompleted = config.weeklyProgress[index];
              const color = isCompleted ? dayColors[index] || "#10B981" : undefined;
              return (
                <div key={day} className="flex flex-col items-center gap-1.5">
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
                    style={{
                      background: isCompleted
                        ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
                        : undefined,
                      backgroundColor: !isCompleted ? "transparent" : undefined,
                      border: !isCompleted ? "2px solid #E5E7EB" : undefined,
                      boxShadow: isCompleted ? "0 2px 8px rgba(0, 0, 0, 0.1)" : undefined,
                    }}
                  />
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reward Progress Bar */}
        <div
          className="mx-auto w-full max-w-[300px] rounded-2xl bg-gray-50 p-5 shadow-sm dark:bg-gray-800"
          style={{ border: "1px solid rgba(229, 231, 235, 0.5)" }}
        >
          <div className="flex items-center gap-3">
            {/* Left circle */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              }}
            >
              {config.goalProgress.current}
            </div>

            {/* Progress section */}
            <div className="flex-1">
              <div className="mb-2 text-center text-xs font-semibold text-gray-900 dark:text-white">
                {remainingDays} {t.moreDays}
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    background: "linear-gradient(90deg, #10B981 0%, #34D399 100%)",
                  }}
                />
              </div>
              <div className="mt-2 text-center text-[10px] font-medium text-gray-600 dark:text-gray-400">
                {t.toUnlock}
              </div>
            </div>

            {/* Right circle */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              }}
            >
              {config.goalProgress.target}
            </div>
          </div>
        </div>

        {/* Active Rewards */}
        <div className="text-center">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white" style={{ color: "#004492" }}>
            {t.activeRewards}
          </h3>
          <div className="flex justify-center gap-2.5">
            {config.activeRewards.map((reward, index) => {
              const parsed = parseReward(reward);
              return (
                <div
                  key={index}
                  className="flex-1 max-w-[75px] rounded-xl bg-gray-100 p-2.5 text-center shadow-sm dark:bg-gray-800"
                  style={{
                    border: "1px solid rgba(229, 231, 235, 0.5)",
                  }}
                >
                  <div
                    className="mb-1 text-[10px] font-semibold leading-tight"
                    style={{ color: "#004492" }}
                  >
                    {parsed.brand}
                  </div>
                  <div
                    className="text-[9px] font-medium leading-tight"
                    style={{ color: "#004492" }}
                  >
                    {parsed.description}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className="mt-3 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ color: "#004492" }}
          >
            {t.viewAll}
          </button>
        </div>

        {/* Future Rewards */}
        <div
          className="mx-auto w-full max-w-[300px] rounded-2xl bg-gray-50 p-5 text-center shadow-sm dark:bg-gray-800"
          style={{ border: "1px solid rgba(229, 231, 235, 0.5)" }}
        >
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {t.futureRewards}
          </span>
          </div>
      </div>
    </div>
  );
}
