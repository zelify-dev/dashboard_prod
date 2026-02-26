"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { BehaviorCategory, NotificationTemplate } from "./behavior-analysis-config";
import type { BehaviorAnalysisCategoryId } from "./use-behavior-analysis-translations";
import { useBehaviorAnalysisTranslations } from "./use-behavior-analysis-translations";
import { useLanguage } from "@/contexts/language-context";

interface BehaviorAnalysisPreviewProps {
    selectedCategory: BehaviorAnalysisCategoryId | null;
    notification: NotificationTemplate | null;
    categoryColor: string;
    onNextNotification?: () => void;
    notificationIndex?: number;
    totalNotifications?: number;
    defaultNotification?: NotificationTemplate | null;
    customIcon?: string | null;
    categories?: BehaviorCategory[];
}

interface StackedNotification {
    id: string;
    categoryId: BehaviorAnalysisCategoryId;
    notificationOriginalId: string; // ID from translations
    timestamp: string;
    badge?: number;
    color: string;
}

// Helper component for Swipe Logic
function SwipeableNotificationItem({
    notif,
    index,
    isExpanded,
    customIcon,
    CONFIG,
    totalCount,
    onDelete,
    onClick,
    t,
}: {
    notif: StackedNotification;
    index: number;
    isExpanded: boolean;
    customIcon: string | null | undefined;
    CONFIG: any;
    totalCount: number;
    onDelete: (id: string) => void;
    onClick: (e: React.MouseEvent) => void;
    t: ReturnType<typeof useBehaviorAnalysisTranslations>;
}) {
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Get notification content from translations based on current language
    const notificationData = useMemo(() => {
        const categoryNotifications = t.categoryNotifications[notif.categoryId];
        if (!categoryNotifications) {
            return { title: '', message: '' };
        }
        const originalNotif = categoryNotifications.find(n => n.id === notif.notificationOriginalId);
        return originalNotif ? { title: originalNotif.title, message: originalNotif.message } : { title: '', message: '' };
    }, [t, notif.categoryId, notif.notificationOriginalId]);

    // Reset offset if expanded state changes or index changes (recycling)
    useEffect(() => {
        setOffsetX(0);
        setIsDragging(false);
    }, [isExpanded, index]); // Reset when view mode changes

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isExpanded) return; // Only distinct swipe in expanded mode? 
        // Actually user might want to swipe the top card in stack mode too?
        // Let's restrict to expanded for now as per "scrollable list" context, 
        // but user said "slide to delete some notification", usually implies list view.
        // Stacking mode delete usually removes top card. Let's allow it if it makes sense.
        // But in stack mode, gesture conflict with "Expand". 
        // Plan: Only allow swipe in EXPANDED mode for safety + clearer UX.

        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        // Calculate delta roughly. 
        // Doing full math: need start X. 
        // Simpler: use movementX accumulator? No, can drift.
        // We need a ref for startX. 
    };

    // Re-impl with proper StartX capture
    const startX = useRef(0);

    const onPointerDown = (e: React.PointerEvent) => {
        if (!isExpanded) return; // Only swipe when expanded
        setIsDragging(true);
        startX.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const delta = currentX - startX.current;

        // Limit to left swipe (negative)
        if (delta < 0) {
            setOffsetX(delta);
        } else {
            // Elastic resistance on right swipe
            setOffsetX(delta * 0.1);
        }
    };

    const onPointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);

        if (offsetX < -100) {
            // Swipe threshold met
            // Animate out? Or just delete.
            onDelete(notif.id);
        } else {
            // Spring back
            setOffsetX(0);
        }
    };

    // Visual Styling Calculation
    let translateY = 0;
    let scale = 1;
    let opacity = 0.9;
    let zIndex = 50 - index;

    if (isExpanded) {
        // Expanded List: simple vertical list
        // Note: The parent container is bottom-anchored Flex column-reverse? 
        // Previously we used absolute positioning.
        // Let's stick to Absolute calculation for smooth transitions between modes.
        translateY = -(index * (CONFIG.cardHeight + CONFIG.cardGap));
    } else {
        // Collapsed Stack
        if (index < CONFIG.stackVisibleCount) {
            translateY = -(index * CONFIG.stackOffset);
            scale = 1 - (index * CONFIG.stackScale);
            opacity = 1 - (index * 0.15);
        } else {
            translateY = -((CONFIG.stackVisibleCount - 1) * CONFIG.stackOffset);
            scale = 1 - ((CONFIG.stackVisibleCount - 1) * CONFIG.stackScale);
            opacity = 0;
        }
    }

    // Interactive Transform (Swipe)
    const swipeTransform = `translateX(${offsetX}px)`;
    // Base Transform (Stack/List)
    const layoutTransform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;

    return (
        <div
            className="absolute bottom-0 left-0 right-0 origin-bottom transition-all"
            style={{
                zIndex,
                opacity,
                transform: layoutTransform,
                transition: isDragging ? 'none' : (isExpanded ? CONFIG.transitionSpring : CONFIG.transitionSmooth),
            }}
        >
            {/* Swipe Container */}
            <div className="relative">
                {/* Background Trash Icon (Revealed on Swipe) */}
                <div
                    className="absolute inset-y-0 right-0 w-full rounded-[22px] bg-red-500/80 flex items-center justify-end px-6 pr-8 backdrop-blur-md transition-opacity duration-200"
                    style={{ opacity: offsetX < -20 ? 1 : 0 }}
                >
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>

                {/* Main Card */}
                <div
                    ref={cardRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    onClick={(e) => {
                        // If swiping, don't trigger click
                        if (Math.abs(offsetX) > 5) return;
                        onClick(e);
                    }}
                    className="relative cursor-pointer touch-none"
                    style={{
                        transform: swipeTransform,
                        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                >
                    <div
                        className="relative overflow-hidden rounded-[22px] backdrop-blur-2xl transition-all"
                        style={{
                            background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
                            minHeight: CONFIG.cardHeight
                        }}
                    >
                        {/* Shine overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />

                        <div className="relative p-4">
                            <div className="flex items-start gap-3.5">
                                {/* Icon with Glass Container */}
                                <div
                                    className="h-10 w-10 flex-shrink-0 rounded-[12px] flex items-center justify-center overflow-hidden backdrop-blur-md relative"
                                    style={{
                                        background: "linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                    }}
                                >
                                    {/* Icon Layer */}
                                    <img
                                        src={customIcon || "/images/iconAlaiza.svg"}
                                        className="h-7 w-7 object-contain drop-shadow-sm"
                                        alt="Notification Icon"
                                    />

                                    {/* Subtle shine overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h4 className="text-[14px] font-semibold text-white truncate pr-2 tracking-wide drop-shadow-sm">
                                            {notificationData.title}
                                        </h4>
                                        <span className="text-[12px] text-white/70 flex-shrink-0 font-medium tracking-tight">
                                            {notif.timestamp}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-white/90 leading-snug line-clamp-2 drop-shadow-sm font-light">
                                        {notificationData.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Bottom "More" indicator */}
                        {!isExpanded && index === 0 && totalCount > 1 && (
                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)] animate-pulse"></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function BehaviorAnalysisPreview({
    selectedCategory,
    notification,
    categoryColor,
    notificationIndex = 0,
    defaultNotification,
    customIcon,
    categories = [],
}: BehaviorAnalysisPreviewProps) {
    const t = useBehaviorAnalysisTranslations();
    const { language } = useLanguage();

    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [notifications, setNotifications] = useState<StackedNotification[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    const activeCategoryId = useRef<string | null>(null);

    // Config for visuals
    const CONFIG = {
        cardHeight: 85,
        cardGap: 10,
        stackOffset: 12,
        stackScale: 0.05,
        stackVisibleCount: 3,
        transitionSpring: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
        transitionSmooth: "all 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const enabledCategories = categories.filter((c) => c.enabled);
        if (enabledCategories.length === 0) {
            setNotifications([]);
            return;
        }

        if (!activeCategoryId.current && enabledCategories.length > 0) {
            activeCategoryId.current = enabledCategories[0].id;
        }

        if (selectedCategory && activeCategoryId.current !== selectedCategory) {
            setNotifications([]);
            activeCategoryId.current = selectedCategory;
            setIsExpanded(false);
        }

        const pushNotification = () => {
            const categoryToUse = enabledCategories.find(c => c.id === activeCategoryId.current) || enabledCategories[0];
            if (!categoryToUse) return;

            const randomNotif = categoryToUse.notifications[Math.floor(Math.random() * categoryToUse.notifications.length)];

            const nowLabel = new Date().toLocaleTimeString(language === "es" ? "es-ES" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });

            const newNotif: StackedNotification = {
                id: crypto.randomUUID(),
                categoryId: categoryToUse.id,
                notificationOriginalId: randomNotif.id,
                timestamp: nowLabel,
                badge: randomNotif.badge,
                color: categoryToUse.color,
            };

            setNotifications(prev => [newNotif, ...prev]);
        };

        if (notifications.length === 0) {
            pushNotification();
        }

        const interval = setInterval(pushNotification, 5000);
        return () => clearInterval(interval);
    }, [categories, selectedCategory, language, notifications.length]);


    const handleStackClick = () => {
        if (!isExpanded && notifications.length > 1) {
            setIsExpanded(true);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (isExpanded) {
            e.stopPropagation();
            setIsExpanded(false);
        }
    };

    const handleDelete = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        // If clear all, maybe collapse?
        if (notifications.length <= 2 && isExpanded) {
            // keep expanded usually, unless empty
        }
    };

    return (
        <div className="rounded-lg bg-transparent p-6 shadow-sm dark:bg-transparent" data-tour-id="tour-behavior-preview">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark dark:text-white">
                    {t.preview.title}
                </h2>
            </div>

            <div className="relative -mx-6 w-[calc(100%+3rem)] py-12">
                <div className="absolute inset-0 overflow-hidden rounded-3xl" style={{ minHeight: "850px" }}>
                    <div className="absolute inset-0 rounded-3xl bg-white"></div>
                </div>

                <div className="relative mx-auto max-w-[340px] z-10">
                    <div className="relative mx-auto">
                        <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
                            <div className="relative h-[720px] overflow-hidden rounded-[2.5rem] bg-white m-0.5 flex flex-col">

                                <div className="absolute inset-0 z-0">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                        style={{
                                            backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000&auto=format&fit=crop')`,
                                            filter: 'brightness(0.95) contrast(1.1) saturate(1.05)',
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"></div>
                                    </div>
                                </div>

                                <div className="relative z-20 flex items-center justify-between px-6 pt-10 pb-2">
                                    <div className="text-white text-xs font-semibold">9:41</div>
                                    <div className="absolute left-1/2 top-3 -translate-x-1/2">
                                        <div className="h-7 w-28 rounded-full bg-black flex items-center justify-center">
                                            <div className="h-1 w-16 rounded-full bg-gray-900/50"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-white">
                                        <svg className="h-3 w-4" fill="currentColor" viewBox="0 0 20 12"><path d="M1 8h2v2H1V8zm3-2h2v4H4V6zm3-2h2v6H7V4zm3-1h2v7h-2V3z" /></svg>
                                        <div className="h-2.5 w-6 rounded-sm border border-white/50 p-[1px]"><div className="h-full w-full rounded-[1px] bg-white"></div></div>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-12 text-center text-white">
                                    <div className="text-7xl font-light drop-shadow-md">
                                        {currentTime.toLocaleTimeString(language === "es" ? "es-ES" : "en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: false,
                                        })}
                                    </div>
                                    <div className="mt-1 text-lg font-medium drop-shadow-md opacity-90">
                                        {currentTime.toLocaleDateString(language === "es" ? "es-ES" : "en-US", { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </div>
                                </div>

                                {/* Notifications Area - BOTTOM ANCHORED with SCROLL PROTECTION */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 top-0 z-20 flex flex-col justify-end px-4 pb-12"
                                    onClick={handleBackdropClick}
                                >
                                    {/* 
                                       Max-Height Container: Limits potentially massive lists to 60% of screen 
                                       Overflow: Allows scrolling inside this area if too many notifications.
                                       Scrollbar hidden via CSS/utility usually (no-scrollbar).
                                    */}
                                    <div
                                        className="relative w-full overflow-y-auto no-scrollbar"
                                        style={{
                                            height: isExpanded ? 'auto' : '150px',
                                            maxHeight: '60%', // Protected Safe Area for Date/Time 
                                            // The list renders reversed via absolute positioning in Items, 
                                            // so we need enough 'virtual' height or just let the items flow?
                                            // Actually, since items are absolute, the container height doesn't automatically grow.
                                            // We need to set container height explicitly based on items for scrolling to work?
                                            // OR: Switch to Flexbox when Expanded for natural scrolling.
                                            // Hybrid approach:
                                            // If Expanded: Use Flexbox (column-reverse or column).
                                            // Stack mode: Absolute.
                                            // Let's try FLEX for expanded mode to support native scrolling easily.
                                        }}
                                    >
                                        {/* 
                                            Hybrid Render Container 
                                            If Expanded: Relative container with internal height.
                                        */}
                                        <div className="relative w-full" style={{
                                            height: isExpanded ? `${Math.max(120, notifications.length * (CONFIG.cardHeight + CONFIG.cardGap))}px` : '120px'
                                        }}>
                                            {notifications.map((notif, index) => {
                                                // If collapsed and deep in stack, skip render
                                                if (!isExpanded && index > 5) return null;

                                                return (
                                                    <SwipeableNotificationItem
                                                        key={notif.id}
                                                        notif={notif}
                                                        index={index}
                                                        isExpanded={isExpanded}
                                                        customIcon={customIcon}
                                                        CONFIG={CONFIG}
                                                        totalCount={notifications.length}
                                                        onDelete={handleDelete}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStackClick();
                                                        }}
                                                        t={t}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* Placeholder */}
                                        {notifications.length === 0 && (
                                            <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col items-center justify-center opacity-70">
                                                <div className="text-white text-sm text-center font-medium drop-shadow-md px-8">
                                                    {t.preview.placeholder}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30">
                                    <div className="h-1.5 w-32 rounded-full bg-white/50 backdrop-blur-md"></div>
                                </div>
                            </div>
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
