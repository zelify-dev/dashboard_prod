"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { CardsConfig } from "./cards-config";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "./cards-translations";

interface ConfigPanelProps {
    config: CardsConfig;
    updateConfig: (updates: Partial<CardsConfig>) => void;
    onSave?: () => void;
    hasChanges?: boolean;
    isSaving?: boolean;
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="m4 6 4 4 4-4" />
        </svg>
    );
}

export function ConfigPanel({ config, updateConfig, onSave, hasChanges = false, isSaving = false }: ConfigPanelProps) {
    const { language } = useLanguage();
    const t = cardsTranslations[language].configurator;

    const { branding } = config;
    const [isBrandingOpen, setIsBrandingOpen] = useState(true);
    const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
    const [colorPickerPlacement, setColorPickerPlacement] = useState<"top" | "bottom">("bottom");
    const currentTheme: "light" = "light";
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const colorPickerTriggerRef = useRef<HTMLButtonElement | null>(null);
    const colorPickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const currentBranding = branding[currentTheme];
    const modeLabel = t.common.lightMode;
    const logoLabel = t.configPanel.logoLabel(modeLabel);
    const colorPaletteLabel = t.configPanel.colorPaletteLabel(modeLabel);

    // Cerrar color picker al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openColorPicker) {
                const pickerElement = colorPickerRefs.current[openColorPicker];
                const target = event.target as HTMLElement;

                const isTriggerButton = !!target.closest('[data-color-picker-trigger="true"]');
                const isColorButton = target.closest('button[type="button"]') &&
                    target.closest('button[type="button"]')?.getAttribute('style')?.includes('backgroundColor');

                if (pickerElement && !pickerElement.contains(target) && !isTriggerButton && !isColorButton) {
                    setOpenColorPicker(null);
                }
            }
        };

        if (openColorPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openColorPicker]);

    const toggleColorPicker = (key: string) => {
        setOpenColorPicker((prev) => {
            const next = prev === key ? null : key;
            if (next) {
                const trigger = colorPickerTriggerRef.current;
                if (trigger) {
                    const rect = trigger.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const spaceAbove = rect.top;
                    const estimatedHeight = 360;
                    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
                        setColorPickerPlacement("top");
                    } else {
                        setColorPickerPlacement("bottom");
                    }
                } else {
                    setColorPickerPlacement("bottom");
                }
            }
            return next;
        });
    };

    // Función para optimizar y redimensionar imágenes
    const optimizeImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Si es SVG, no optimizar, solo leer
            if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    resolve(result);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('No se pudo obtener el contexto del canvas'));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64 = canvas.toDataURL('image/png', 0.8);
                    resolve(base64);
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileUpload = async (file: File) => {
        try {
            const optimizedBase64 = await optimizeImage(file);
            updateConfig({
                branding: {
                    ...branding,
                    [currentTheme]: {
                        ...branding[currentTheme],
                        logo: optimizedBase64
                    }
                }
            });
        } catch (error) {
            console.error("Error processing image:", error);
            alert(t.alerts.imageProcessError);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileUpload(file);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    handleFileUpload(file);
                }
                break;
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Personalización de Marca */}
            <div className="rounded-lg bg-white shadow-sm dark:bg-dark-2">
                <button
                    onClick={() => setIsBrandingOpen(!isBrandingOpen)}
                    className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
                >
                    <h3 className="text-lg font-semibold text-dark dark:text-white">
                        {t.configPanel.brandingTitle}
                    </h3>
                    <ChevronDownIcon
                        className={cn(
                            "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
                            isBrandingOpen && "rotate-180"
                        )}
                    />
                </button>

                {isBrandingOpen && (
                    <div className="border-t border-stroke px-6 py-4 dark:border-dark-3" data-tour-id="tour-cards-config-branding">
                        <div className="space-y-6">
                            {/* Theme Selector */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    {t.configPanel.themeLabel}
                                </label>
                                <button
                                    type="button"
                                    className="w-full cursor-default rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-white"
                                >
                                    {t.configPanel.lightModeButton}
                                </button>
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    {logoLabel}
                                </label>
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onPaste={handlePaste}
                                    className={cn(
                                        "flex items-center gap-4 rounded-lg border-2 border-dashed p-4 transition",
                                        isDragging
                                            ? "border-primary bg-primary/5 dark:bg-primary/10"
                                            : "border-stroke dark:border-dark-3"
                                    )}
                                >
                                    {currentBranding.logo ? (
                                        <div className="relative">
                                            <img
                                                src={currentBranding.logo}
                                                alt="Logo"
                                                className="h-16 w-16 rounded-lg object-contain border border-stroke dark:border-dark-3"
                                            />
                                            <button
                                                onClick={() => updateConfig({
                                                    branding: {
                                                        ...branding,
                                                        [currentTheme]: {
                                                            ...branding[currentTheme],
                                                            logo: undefined
                                                        }
                                                    }
                                                })}
                                                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                            >
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-3">
                                            <svg className="h-8 w-8 text-dark-6 dark:text-dark-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            {currentBranding.logo ? t.configPanel.changeLogo : t.configPanel.uploadLogo}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml,.svg,image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handleFileUpload(file);
                                                    }
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                        <p className="mt-2 text-xs text-dark-6 dark:text-dark-6">
                                            {t.configPanel.logoHint}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Color Theme */}
                            <div>
                                <h4 className="mb-4 text-sm font-medium text-dark dark:text-white">
                                    {colorPaletteLabel}
                                </h4>
                                <div className="relative">
                                    <label className="mb-2 block text-xs font-medium text-dark-6 dark:text-dark-6">
                                        {t.configPanel.customColorLabel}
                                    </label>
                                    <button
                                        type="button"
                                        data-color-picker-trigger="true"
                                        ref={colorPickerTriggerRef}
                                        onClick={() => toggleColorPicker("customColorTheme")}
                                        className="flex w-full items-center gap-3 rounded-lg border border-stroke bg-white p-2 text-left transition hover:border-primary dark:border-dark-3 dark:bg-dark-2"
                                    >
                                        <div
                                            className="h-6 w-6 rounded border border-stroke shadow-sm dark:border-dark-3"
                                            style={{ backgroundColor: currentBranding.customColorTheme }}
                                        />
                                        <span className="text-sm text-dark dark:text-white">
                                            {currentBranding.customColorTheme.toUpperCase()}
                                        </span>
                                    </button>
                                    {openColorPicker === "customColorTheme" && (
                                        <div
                                            ref={(el) => { colorPickerRefs.current["customColorTheme"] = el; }}
                                            className={cn(
                                                "absolute left-0 z-50 rounded-lg border border-stroke bg-white p-3 shadow-xl dark:border-dark-3 dark:bg-dark-2",
                                                "max-h-[70vh] overflow-auto",
                                                colorPickerPlacement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
                                            )}
                                        >
                                            <HexColorPicker
                                                color={currentBranding.customColorTheme}
                                                onChange={(color) => updateConfig({
                                                    branding: {
                                                        ...branding,
                                                        [currentTheme]: {
                                                            ...branding[currentTheme],
                                                            customColorTheme: color
                                                        }
                                                    }
                                                })}
                                            />
                                            <div className="mt-3 grid grid-cols-5 gap-2">
                                                {[
                                                    "#004492", // Brand Blue
                                                    "#0FADCF", // Cyan
                                                    "#10B981", // Emerald
                                                    "#F0950C", // Orange
                                                    "#E11D48", // Rose
                                                    "#8B5CF6", // Violet
                                                    "#FF5722", // Deep Orange
                                                    "#212121", // Dark Gray
                                                    "#607D8B", // Blue Gray
                                                    "#000000", // Black
                                                ].map((presetColor) => (
                                                    <button
                                                        key={presetColor}
                                                        type="button"
                                                        className="h-6 w-6 rounded border border-stroke dark:border-dark-3"
                                                        style={{ backgroundColor: presetColor }}
                                                        onClick={() => updateConfig({
                                                            branding: {
                                                                ...branding,
                                                                [currentTheme]: {
                                                                    ...branding[currentTheme],
                                                                    customColorTheme: presetColor
                                                                }
                                                            }
                                                        })}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={onSave}
                    disabled={!hasChanges || isSaving}
                    className={cn(
                        "rounded-lg px-6 py-2.5 text-sm font-medium text-white transition",
                        hasChanges && !isSaving
                            ? "bg-primary hover:bg-primary/90"
                            : "cursor-not-allowed bg-gray-400 dark:bg-gray-600"
                    )}
                >
                    {isSaving ? t.configPanel.saving : t.configPanel.saveChanges}
                </button>
            </div>
        </div>
    );
}
