"use client";

import { CardDesignConfig, CardColorType, CardFinishType } from "./card-editor";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";

type CardCustomizationPanelProps = {
  config: CardDesignConfig;
  onConfigChange: (updates: Partial<CardDesignConfig>) => void;
  onSave: () => void;
  onCancel: () => void;
};

import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../../_components/cards-translations";

export function CardCustomizationPanel({
  config,
  onConfigChange,
  onSave,
  onCancel,
}: CardCustomizationPanelProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].issuing.editor;
  const [openColorPicker, setOpenColorPicker] = useState<number | null>(null);
  const [openSolidColorPicker, setOpenSolidColorPicker] = useState(false);
  const colorPickerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const solidColorPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on color input or its native picker
      if (target.tagName === "INPUT" && target.getAttribute("type") === "color") {
        return;
      }
      
      // Check if click is outside gradient color pickers
      if (openColorPicker !== null) {
        const ref = colorPickerRefs.current[openColorPicker];
        if (ref && !ref.contains(target)) {
          setOpenColorPicker(null);
        }
      }
      
      // Check if click is outside solid color picker
      if (openSolidColorPicker && solidColorPickerRef.current && !solidColorPickerRef.current.contains(target)) {
        setOpenSolidColorPicker(false);
      }
    };

    // Use a small delay to allow native color picker to open
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openColorPicker, openSolidColorPicker]);

  const handleColorTypeChange = (type: CardColorType) => {
    onConfigChange({ colorType: type });
  };

  const handleSolidColorChange = (color: string) => {
    onConfigChange({ solidColor: color });
  };

  const handleGradientColorChange = (index: number, color: string) => {
    const newColors = [...config.gradientColors];
    newColors[index] = color;
    onConfigChange({ gradientColors: newColors });
  };

  const handleFinishTypeChange = (type: CardFinishType) => {
    onConfigChange({ finishType: type });
  };

  const handleCardNetworkChange = (network: "visa" | "mastercard") => {
    onConfigChange({ cardNetwork: network });
  };

  const inputBase =
    "w-full rounded-lg border border-gray-3 bg-white px-4 py-2.5 text-sm text-dark placeholder:text-gray-5 focus:border-gray-5 focus:outline-none focus:ring-1 focus:ring-gray-5/20 dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:placeholder:text-dark-6";
  const sectionTitle =
    "text-sm font-medium text-dark-5 dark:text-dark-6 mb-1";
  const fieldLabel =
    "mb-2 block text-sm font-normal text-gray-6 dark:text-dark-6";

  return (
    <div className="space-y-8">
      <div>
        <h3 className={sectionTitle}>{t.sectionAppearance}</h3>
        <div className="mt-5 space-y-6">
          <div>
            <label className={fieldLabel}>{t.cardNetworkLabel}</label>
            <div className="flex gap-3">
              <button
                onClick={() => handleCardNetworkChange("visa")}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
                  config.cardNetwork === "visa"
                    ? "border-blue-light bg-white text-blue-light shadow-sm"
                    : "border-gray-3 bg-white text-gray-6 hover:border-gray-4 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6"
                )}
                >
                Visa
              </button>
              <button
                onClick={() => handleCardNetworkChange("mastercard")}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
                  config.cardNetwork === "mastercard"
                    ? "border-blue-light bg-white text-blue-light shadow-sm"
                    : "border-gray-3 bg-white text-gray-6 hover:border-gray-4 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6"
                )}
                >
                Mastercard
              </button>
            </div>
          </div>

          <div>
            <label className={fieldLabel}>{t.colorTypeLabel}</label>
            <div className="flex gap-3">
              <button
                onClick={() => handleColorTypeChange("solid")}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
                  config.colorType === "solid"
                    ? "border-blue-light bg-white text-blue-light shadow-sm"
                    : "border-gray-3 bg-white text-gray-6 hover:border-gray-4 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6"
                )}
                >
                {t.solidLabel}
              </button>
              <button
                onClick={() => handleColorTypeChange("gradient")}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
                  config.colorType === "gradient"
                    ? "border-blue-light bg-white text-blue-light shadow-sm"
                    : "border-gray-3 bg-white text-gray-6 hover:border-gray-4 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6"
                )}
                >
                {t.gradientLabel}
              </button>
            </div>
          </div>

          {/* Solid Color Picker */}
          {config.colorType === "solid" && (
            <div className="pt-1">
              <label className={fieldLabel}>{t.solidLabel}</label>
              <div className="flex items-center gap-4">
                <div className="relative" ref={solidColorPickerRef}>
                  <button
                    type="button"
                    onClick={() => setOpenSolidColorPicker(!openSolidColorPicker)}
                    className="h-12 w-20 cursor-pointer rounded-lg border border-gray-3 dark:border-dark-3"
                    style={{ backgroundColor: config.solidColor }}
                  />
                  {openSolidColorPicker && (
                    <div 
                      className="absolute left-0 top-full z-[9999] mt-2 rounded-lg border border-gray-3 bg-white p-4 shadow-2xl dark:border-dark-3 dark:bg-dark-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-3 text-xs font-medium text-gray-7 dark:text-dark-6">
                        Seleccionar color sólido
                      </div>
                      <HexColorPicker
                        color={config.solidColor}
                        onChange={handleSolidColorChange}
                        className="!w-full"
                        style={{ width: "280px", height: "200px" }}
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <HexColorInput
                          color={config.solidColor}
                          onChange={handleSolidColorChange}
                          prefixed
                          className="flex-1 rounded border border-gray-3 bg-white px-3 py-2 text-sm text-dark focus:border-blue-light focus:outline-none focus:ring-1 focus:ring-blue-light/20 dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenSolidColorPicker(false);
                          }}
                          className="rounded border border-gray-3 bg-white px-3 py-2 text-xs font-medium text-dark transition hover:bg-gray-1 dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={config.solidColor}
                  onChange={(e) => handleSolidColorChange(e.target.value)}
                  className={inputBase}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          )}

          {/* Gradient Colors */}
          {config.colorType === "gradient" && (
            <div className="pt-1">
              <label className={fieldLabel}>{t.gradientColorsLabel}</label>
              <div className="space-y-4">
                <div
                  className="h-12 w-full rounded-full border border-gray-3 dark:border-dark-3"
                  style={{
                    background: `linear-gradient(135deg, ${config.gradientColors.join(", ")})`,
                  }}
                />
                <div className="flex flex-wrap items-center gap-4">
                  {config.gradientColors.map((color, index) => (
                    <div
                      key={index}
                      className="relative"
                      ref={(el) => {
                        colorPickerRefs.current[index] = el;
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenColorPicker(openColorPicker === index ? null : index)}
                        className="flex items-center gap-3 rounded-full border border-gray-3 bg-white px-3 py-2 text-xs font-medium text-dark shadow-sm transition hover:border-gray-4 dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                      >
                        <span
                          className="h-6 w-6 rounded-full border border-white/70 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span>{color.toUpperCase()}</span>
                      </button>
                      {openColorPicker === index && (
                        <div 
                          className="absolute left-0 top-full z-[9999] mt-2 rounded-lg border border-gray-3 bg-white p-4 shadow-2xl dark:border-dark-3 dark:bg-dark-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mb-3 text-xs font-medium text-gray-7 dark:text-dark-6">
                            Seleccionar color {index + 1}
                          </div>
                          <HexColorPicker
                            color={color}
                            onChange={(newColor) => handleGradientColorChange(index, newColor)}
                            className="!w-full"
                            style={{ width: "280px", height: "200px" }}
                          />
                          <div className="mt-3 flex items-center gap-2">
                            <HexColorInput
                              color={color}
                              onChange={(newColor) => handleGradientColorChange(index, newColor)}
                              prefixed
                              className="flex-1 rounded border border-gray-3 bg-white px-3 py-2 text-sm text-dark focus:border-blue-light focus:outline-none focus:ring-1 focus:ring-blue-light/20 dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenColorPicker(null);
                              }}
                              className="rounded border border-gray-3 bg-white px-3 py-2 text-xs font-medium text-dark transition hover:bg-gray-1 dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4"
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Finish Type */}
          <div>
              <label className={fieldLabel}>{t.finishLabel}</label>
            <div className="space-y-3">
              <button
                onClick={() => handleFinishTypeChange("standard")}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all",
                  config.finishType === "standard"
                    ? "border-blue-light bg-white text-blue-light shadow-sm"
                    : "border-gray-3 bg-white text-gray-6 hover:border-gray-4 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6"
                )}
                >
                {t.finishStandard}
              </button>
              <button
                onClick={() => handleFinishTypeChange("embossed")}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all",
                  config.finishType === "embossed"
                    ? "border-blue-light bg-white text-blue-light shadow-sm"
                    : "border-gray-3 bg-white text-gray-6 hover:border-gray-4 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6"
                )}
                >
                {t.finishEmbossed}
              </button>
              <button
                onClick={() => handleFinishTypeChange("metallic")}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all",
                  config.finishType === "metallic"
                    ? "border-blue-light bg-white text-blue-light shadow-sm"
                    : "border-gray-3 bg-white text-gray-6 hover:border-gray-4 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6"
                )}
                >
                {t.finishMetallic}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-3 bg-white px-4 py-3 text-sm font-medium text-dark shadow-sm transition hover:bg-gray-1 dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4"
        >
          {t.cancelButton}
        </button>
        <button
          onClick={onSave}
          className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
        >
          {t.saveButton}
        </button>
      </div>
    </div>
  );
}
