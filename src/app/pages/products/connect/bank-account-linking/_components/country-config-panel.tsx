"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { useLanguage } from "@/contexts/language-context";
import { connectTranslations } from "./connect-translations";
import { BankAccountCountry } from "./bank-account-config";

export interface BrandingConfig {
  logo?: string;
  customColorTheme: string;
  depositButtonType?: "slider" | "button";
}

export interface ThemeBranding {
  light: BrandingConfig;
  dark: BrandingConfig;
}

interface CountryConfigPanelProps {
  selectedCountry: BankAccountCountry;
  onCountryChange: (country: BankAccountCountry) => void;
  branding?: ThemeBranding;
  onBrandingChange?: (branding: ThemeBranding) => void;
}

function EcuadorFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14" fill="none" {...props}>
      <rect width="20" height="4.67" y="0" fill="#FFD700" />
      <rect width="20" height="4.67" y="4.67" fill="#0033A0" />
      <rect width="20" height="4.67" y="9.33" fill="#EF3340" />
    </svg>
  );
}

function MexicoFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14" fill="none" {...props}>
      <rect width="6.67" height="14" x="0" fill="#006847" />
      <rect width="6.67" height="14" x="6.67" fill="#FFFFFF" />
      <rect width="6.67" height="14" x="13.33" fill="#CE1126" />
    </svg>
  );
}

function ColombiaFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14" fill="none" {...props}>
      <rect width="20" height="7" y="0" fill="#FCD116" />
      <rect width="20" height="3.5" y="7" fill="#003893" />
      <rect width="20" height="3.5" y="10.5" fill="#CE1126" />
    </svg>
  );
}

function BrasilFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14" fill="none" {...props}>
      <rect width="20" height="14" fill="#009739" />
      <path
        d="M10 3.5C10 3.5 12.5 2 16 2C16 2 16 12 16 12C12.5 12 10 10.5 10 10.5C10 10.5 7.5 12 4 12C4 12 4 2 4 2C7.5 2 10 3.5 10 3.5Z"
        fill="#FEDD00"
      />
      <circle cx="10" cy="7" r="2.5" fill="#012169" />
      <path
        d="M10 5.5L10.3 6.3L11.1 6.5L10.3 6.7L10 7.5L9.7 6.7L8.9 6.5L9.7 6.3L10 5.5Z"
        fill="#FEDD00"
      />
    </svg>
  );
}

function EstadosUnidosFlagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14" fill="none" {...props}>
      <rect width="20" height="14" fill="#B22234" />
      <rect width="20" height="1" y="1" fill="#FFFFFF" />
      <rect width="20" height="1" y="3" fill="#FFFFFF" />
      <rect width="20" height="1" y="5" fill="#FFFFFF" />
      <rect width="20" height="1" y="7" fill="#FFFFFF" />
      <rect width="20" height="1" y="9" fill="#FFFFFF" />
      <rect width="20" height="1" y="11" fill="#FFFFFF" />
      <rect width="8.67" height="7" fill="#3C3B6E" />
      <circle cx="1.2" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="2.4" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="3.6" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="4.8" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="6" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="7.2" cy="1.2" r="0.3" fill="#FFFFFF" />
      <circle cx="1.2" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="2.4" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="3.6" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="4.8" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="6" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="7.2" cy="2.4" r="0.3" fill="#FFFFFF" />
      <circle cx="1.2" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="2.4" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="3.6" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="4.8" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="6" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="7.2" cy="3.6" r="0.3" fill="#FFFFFF" />
      <circle cx="1.2" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="2.4" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="3.6" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="4.8" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="6" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="7.2" cy="4.8" r="0.3" fill="#FFFFFF" />
      <circle cx="1.2" cy="6" r="0.3" fill="#FFFFFF" />
      <circle cx="2.4" cy="6" r="0.3" fill="#FFFFFF" />
      <circle cx="3.6" cy="6" r="0.3" fill="#FFFFFF" />
      <circle cx="4.8" cy="6" r="0.3" fill="#FFFFFF" />
      <circle cx="6" cy="6" r="0.3" fill="#FFFFFF" />
      <circle cx="7.2" cy="6" r="0.3" fill="#FFFFFF" />
    </svg>
  );
}

const countryNames: Record<BankAccountCountry, { es: string; en: string }> = {
  ecuador: {
    es: "Ecuador",
    en: "Ecuador"
  },
  mexico: {
    es: "México",
    en: "Mexico"
  },
  brasil: {
    es: "Brasil",
    en: "Brazil"
  },
  colombia: {
    es: "Colombia",
    en: "Colombia"
  },
  estados_unidos: {
    es: "Estados Unidos",
    en: "United States"
  },
};

const countryFlagIcons: Record<BankAccountCountry, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  ecuador: EcuadorFlagIcon,
  mexico: MexicoFlagIcon,
  brasil: BrasilFlagIcon,
  colombia: ColombiaFlagIcon,
  estados_unidos: EstadosUnidosFlagIcon,
};

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

export function CountryConfigPanel({ 
  selectedCountry, 
  onCountryChange,
  branding,
  onBrandingChange
}: CountryConfigPanelProps) {
  const countries: BankAccountCountry[] = ["mexico", "brasil", "colombia", "estados_unidos", "ecuador"];
  const { language } = useLanguage();
  const t = connectTranslations[language];

  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const currentTheme: "light" = "light";
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [colorPickerPlacement, setColorPickerPlacement] = useState<"top" | "bottom">("bottom");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const colorPickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Default branding if not provided
  const defaultBranding: ThemeBranding = {
    light: {
      customColorTheme: "#004492",
      depositButtonType: "slider",
    },
    dark: {
      customColorTheme: "#004492",
      depositButtonType: "slider",
    },
  };

  const currentBranding = branding?.[currentTheme] || defaultBranding[currentTheme];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openColorPicker) {
        const pickerElement = colorPickerRefs.current[openColorPicker];
        const target = event.target as HTMLElement;
        const isTriggerButton = !!target.closest('[data-color-picker-trigger="true"]');
        const isLegacyColorButton = target.closest('button[type="button"]') &&
          target.closest('button[type="button"]')?.getAttribute('style')?.includes('backgroundColor');

        if (pickerElement && !pickerElement.contains(target) && !isTriggerButton && !isLegacyColorButton) {
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
          const estimatedHeight = 360; // picker + presets + padding
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

  const handleFileUpload = (file: File) => {
    if (file && (file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.name.endsWith('.svg'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (onBrandingChange && branding) {
          onBrandingChange({
            ...branding,
            [currentTheme]: {
              ...branding[currentTheme],
              logo: event.target?.result as string
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
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

  const configurationDescText =
    selectedCountry === "ecuador" ? (t.configurationDescEcuador ?? t.configurationDesc) : t.configurationDesc;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-dark dark:text-white">{t.configurationTitle}</h2>
        <p className="text-sm text-dark-6 dark:text-dark-6">{configurationDescText}</p>
      </div>

      <div className="space-y-4">
        {/* Country Selection */}
        <div>
          <label className="mb-3 block text-sm font-semibold text-dark dark:text-white">{t.countryLabel}</label>
          <div className="space-y-2">
            {countries.map((country) => {
              const FlagIcon = countryFlagIcons[country];
              const isSelected = selectedCountry === country;
              const isEcuadorSelected = country === "ecuador" && isSelected;
              return (
                <button
                  key={country}
                  onClick={() => onCountryChange(country)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-stroke bg-white hover:border-primary/50 dark:border-dark-3 dark:bg-dark-2",
                    isEcuadorSelected && "opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      isSelected ? "bg-primary/10" : "bg-gray-2 dark:bg-dark-3"
                    )}
                  >
                    <FlagIcon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-dark dark:text-white">
                    {countryNames[country][language]}
                  </span>
                  {country === "ecuador" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {t.comingSoon}
                    </span>
                  )}
                  {isSelected && (
                    <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Personalización Section */}
        <div className="mt-6 rounded-lg bg-white shadow-sm dark:bg-dark-2">
          <button
            onClick={() => setIsBrandingOpen(!isBrandingOpen)}
            className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
          >
            <h3 className="text-lg font-semibold text-dark dark:text-white">{t.branding.sectionTitle}</h3>
            <ChevronDownIcon
              className={cn(
                "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
                isBrandingOpen && "rotate-180"
              )}
            />
          </button>

          {isBrandingOpen && (
            <div className="border-t border-stroke px-6 py-4 dark:border-dark-3">
              <div className="space-y-6">
                {/* Theme Selector */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {t.branding.themeLabel}
                  </label>
                  <button
                    type="button"
                    className="w-full cursor-default rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-white"
                  >
                    {t.branding.lightMode}
                  </button>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {t.branding.logoLabel.replace("{mode}", t.branding.lightMode)}
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
                          onClick={() => {
                            if (onBrandingChange && branding) {
                              onBrandingChange({
                                ...branding,
                                [currentTheme]: {
                                  ...branding[currentTheme],
                                  logo: undefined,
                                },
                              });
                            }
                          }}
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
                        {currentBranding.logo ? t.branding.changeLogo : t.branding.uploadLogo}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.svg,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file);
                            }
                          }}
                        />
                      </label>
                      <p className="mt-2 text-xs text-dark-6 dark:text-dark-6">
                        {t.branding.logoHint}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Color Theme */}
                <div>
                  <h4 className="mb-4 text-sm font-medium text-dark dark:text-white">
                    {t.branding.colorThemeLabel}
                  </h4>
                  <div className="relative">
                    <label className="mb-2 block text-xs font-medium text-dark-6 dark:text-dark-6">
                      {t.branding.colorThemeLabel}
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
                          onChange={(color) => {
                            if (onBrandingChange && branding) {
                              onBrandingChange({
                                ...branding,
                                [currentTheme]: {
                                  ...branding[currentTheme],
                                  customColorTheme: color,
                                },
                              });
                            }
                          }}
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
                              onClick={() => {
                                if (onBrandingChange && branding) {
                                  onBrandingChange({
                                    ...branding,
                                    [currentTheme]: {
                                      ...branding[currentTheme],
                                      customColorTheme: presetColor,
                                    },
                                  });
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deposit Button Type */}
                <div>
                  <h4 className="mb-4 text-sm font-medium text-dark dark:text-white">
                    {t.branding.depositButtonTypeLabel}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onBrandingChange && branding) {
                          onBrandingChange({
                            ...branding,
                            [currentTheme]: {
                              ...branding[currentTheme],
                              depositButtonType: "slider",
                            },
                          });
                        }
                      }}
                      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        (currentBranding.depositButtonType || "slider") === "slider"
                          ? "border-primary bg-primary text-white"
                          : "border-stroke bg-white text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      }`}
                    >
                      {t.branding.depositButtonTypeSlider}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onBrandingChange && branding) {
                          onBrandingChange({
                            ...branding,
                            [currentTheme]: {
                              ...branding[currentTheme],
                              depositButtonType: "button",
                            },
                          });
                        }
                      }}
                      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        currentBranding.depositButtonType === "button"
                          ? "border-primary bg-primary text-white"
                          : "border-stroke bg-white text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      }`}
                    >
                      {t.branding.depositButtonTypeButton}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
