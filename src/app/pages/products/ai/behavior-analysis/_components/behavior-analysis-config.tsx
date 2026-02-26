"use client";

import React, { useMemo, useState, useEffect } from "react";
import { BehaviorAnalysisPreview } from "./behavior-analysis-preview";
import { BehaviorAnalysisCategories } from "./behavior-analysis-categories";
import {
    type BehaviorAnalysisCategoryId,
    useBehaviorAnalysisTranslations,
} from "./use-behavior-analysis-translations";

export interface BehaviorCategory {
    id: BehaviorAnalysisCategoryId;
    name: string;
    icon: React.ReactNode;
    color: string;
    enabled: boolean;
    notifications: NotificationTemplate[];
}

export interface NotificationTemplate {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    badge?: number;
}

export function BehaviorAnalysisConfig() {
    const t = useBehaviorAnalysisTranslations();

    const [selectedCategory, setSelectedCategory] = useState<BehaviorAnalysisCategoryId | null>(null);
    const [notificationIndex, setNotificationIndex] = useState(0);
    const [customIcon, setCustomIcon] = useState<string | null>(null);
    const [enabledByCategoryId, setEnabledByCategoryId] = useState<Record<BehaviorAnalysisCategoryId, boolean>>({
        expenses: true,
        income: true,
        savings: true,
        budget: true,
        investments: true,
        bills: true,
    });

    const categories: BehaviorCategory[] = useMemo(() => {
        const getNotifications = (categoryId: BehaviorAnalysisCategoryId) =>
            t.categoryNotifications[categoryId].map((n) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                timestamp: n.timestamp,
                badge: n.badge,
            }));

        return [
            {
                id: "expenses",
                name: t.categoryNames.expenses,
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                ),
                color: "#10B981",
                enabled: enabledByCategoryId.expenses,
                notifications: getNotifications("expenses"),
            },
            {
                id: "income",
                name: t.categoryNames.income,
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        <path d="M7 12h10" />
                    </svg>
                ),
                color: "#3B82F6",
                enabled: enabledByCategoryId.income,
                notifications: getNotifications("income"),
            },
            {
                id: "savings",
                name: t.categoryNames.savings,
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M3 10h18" />
                        <path d="M8 4v6" />
                        <path d="M16 4v6" />
                    </svg>
                ),
                color: "#8B5CF6",
                enabled: enabledByCategoryId.savings,
                notifications: getNotifications("savings"),
            },
            {
                id: "budget",
                name: t.categoryNames.budget,
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                ),
                color: "#F59E0B",
                enabled: enabledByCategoryId.budget,
                notifications: getNotifications("budget"),
            },
            {
                id: "investments",
                name: t.categoryNames.investments,
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                    </svg>
                ),
                color: "#EF4444",
                enabled: enabledByCategoryId.investments,
                notifications: getNotifications("investments"),
            },
            {
                id: "bills",
                name: t.categoryNames.bills,
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                ),
                color: "#06B6D4",
                enabled: enabledByCategoryId.bills,
                notifications: getNotifications("bills"),
            },
        ];
    }, [enabledByCategoryId, t.categoryNames, t.categoryNotifications]);

    const handleCategoryClick = (categoryId: BehaviorAnalysisCategoryId) => {
        setSelectedCategory(categoryId);
    };

    // Reset notification index when category changes
    useEffect(() => {
        setNotificationIndex(0);
    }, [selectedCategory]);

    const handleNextNotification = () => {
        if (selectedCategoryData) {
            setNotificationIndex((prev) => (prev + 1) % selectedCategoryData.notifications.length);
        }
    };

    const selectedCategoryData = categories.find((cat) => cat.id === selectedCategory);
    const currentNotification = selectedCategoryData?.notifications[notificationIndex] || null;
    const defaultNotification: NotificationTemplate = useMemo(() => {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        return {
            id: "default-1",
            title: t.defaultNotification.title,
            message: t.defaultNotification.message,
            timestamp: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
        };
    }, [t.defaultNotification.message, t.defaultNotification.title]);

    return (
        <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
                <div>
                    <BehaviorAnalysisPreview
                        selectedCategory={selectedCategory}
                        notification={currentNotification}
                        categoryColor={selectedCategoryData?.color || "#10B981"}
                        onNextNotification={handleNextNotification}
                        notificationIndex={notificationIndex}
                        totalNotifications={selectedCategoryData?.notifications.length || 0}
                        defaultNotification={defaultNotification}
                        customIcon={customIcon}
                        categories={categories}
                    />
                </div>
                <div>
                    <BehaviorAnalysisCategories
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryClick={handleCategoryClick}
                        onToggleCategory={(categoryId, enabled) => {
                            setEnabledByCategoryId((prev) => ({ ...prev, [categoryId]: enabled }));
                        }}
                        customIcon={customIcon}
                        onCustomIconChange={setCustomIcon}
                    />
                </div>
            </div>
        </div>
    );
}
