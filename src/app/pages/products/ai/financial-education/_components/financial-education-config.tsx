"use client";

import { useState } from "react";
import { FinancialEducationPreview } from "./financial-education-preview";
import { FinancialEducationConfigPanel } from "./financial-education-config-panel";

export type ScreenType = "summary" | "streak" | "graph" | "learn" | "learn-content";

export interface FinancialEducationConfig {
  currentScreen: ScreenType;
  zelifyScore: number;
  stabilityIntelligence: number;
  discipline: number;
  streakDays: number;
  streakStartDate: string;
  maxStreak: number;
  weeklyProgress: boolean[];
  goalProgress: { current: number; target: number };
  activeRewards: string[];
  futureRewards: string[];
  increasingPercent: number;
  spendingPercent: number;
  savingsPercent: number;
  weeklySummary: string;
  tips: Array<{
    id: string;
    title: string;
    image: string;
  }>;
  selectedTip: string | null;
  videos: Array<{
    id: string;
    title: string;
    url: string;
    thumbnail: string;
  }>;
  blogs: Array<{
    id: string;
    title: string;
    url: string;
    excerpt: string;
  }>;
}

const defaultConfig: FinancialEducationConfig = {
  currentScreen: "summary",
  zelifyScore: 91,
  stabilityIntelligence: 85,
  discipline: 75,
  streakDays: 14,
  streakStartDate: "Jan 02, 2026",
  maxStreak: 15,
  weeklyProgress: [true, true, true, true, true, false, false],
  goalProgress: { current: 14, target: 23 },
  activeRewards: [
    "Only & Sons 20% off",
    "Juan Valdez 2 in coffee",
    "Multicines Free Combo",
    "BK"
  ],
  futureRewards: [],
  increasingPercent: 90,
  spendingPercent: 75,
  savingsPercent: 39,
  weeklySummary: "Your Spending is getting bigger this week, which is not allowing you to increase your savings. The categories in which you are overspending are food and entertainment.",
  tips: [
    {
      id: "tip-1",
      title: "How to control overspending on not basic items",
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400"
    },
    {
      id: "tip-2",
      title: "How to increase your incoming",
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400"
    }
  ],
  selectedTip: null,
  videos: [],
  blogs: []
};

export function FinancialEducationConfig() {
  const [config, setConfig] = useState<FinancialEducationConfig>(defaultConfig);

  const updateConfig = (updates: Partial<FinancialEducationConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FinancialEducationPreview config={config} updateConfig={updateConfig} />
        <FinancialEducationConfigPanel config={config} updateConfig={updateConfig} />
      </div>
    </div>
  );
}
