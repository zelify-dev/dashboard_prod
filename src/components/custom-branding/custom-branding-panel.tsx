"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import type { BrandingConfig } from "@/app/pages/products/auth/authentication/_components/authentication-config";

interface CustomBrandingPanelProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  themeLabel: string;
  themeButtonLabel: string;
  logoLabel: string;
  changeLogoLabel: string;
  uploadLogoLabel: string;
  logoHint: string;
  colorPaletteLabel: string;
  customColorThemeLabel: string;
  branding: BrandingConfig;
  onBrandingChange: (updates: Partial<BrandingConfig>) => void;
  dataTourSectionId?: string;
  dataTourContentId?: string;
  invalidFileTypeMessage?: string;
  fileTooLargeMessage?: string;
  fileStillTooLargeMessage?: string;
  imageProcessingErrorMessage?: string;
  presetColors?: string[];
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

const DEFAULT_PRESET_COLORS = [
  "#004492",
  "#0FADCF",
  "#10B981",
  "#F0950C",
  "#E11D48",
  "#8B5CF6",
  "#FF5722",
  "#212121",
  "#607D8B",
  "#000000",
];

export function CustomBrandingPanel({
  title,
  isOpen,
  onToggle,
  themeLabel,
  themeButtonLabel,
  logoLabel,
  changeLogoLabel,
  uploadLogoLabel,
  logoHint,
  colorPaletteLabel,
  customColorThemeLabel,
  branding,
  onBrandingChange,
  dataTourSectionId,
  dataTourContentId,
  invalidFileTypeMessage = "Formato de archivo no válido. Por favor, sube una imagen PNG, JPG, GIF, WEBP o SVG.",
  fileTooLargeMessage = "El archivo es demasiado grande. El tamaño máximo permitido es 5MB.",
  fileStillTooLargeMessage = "La imagen optimizada sigue siendo muy grande. Por favor, intenta con una imagen más pequeña.",
  imageProcessingErrorMessage = "Error al procesar la imagen. Por favor, intenta de nuevo.",
  presetColors = DEFAULT_PRESET_COLORS,
}: CustomBrandingPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isTrigger = !!target.closest("[data-color-picker-trigger='true']");

      if (colorPickerRef.current && !colorPickerRef.current.contains(target) && !isTrigger) {
        setIsColorPickerOpen(false);
      }
    };

    if (isColorPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColorPickerOpen]);

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("No se pudo crear el contexto del canvas"));
            return;
          }

          const maxDimension = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const quality = 0.85;
          const mimeType = file.type || "image/png";

          try {
            resolve(canvas.toDataURL(mimeType, quality));
          } catch {
            resolve(canvas.toDataURL("image/png", quality));
          }
        };

        img.onerror = () => reject(new Error("Error al cargar la imagen"));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const validImageTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/svg",
    ];
    const validExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    const isValidType =
      validImageTypes.includes(file.type.toLowerCase()) ||
      file.type.startsWith("image/") ||
      validExtensions.includes(fileExtension);

    if (!isValidType) {
      alert(invalidFileTypeMessage);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(fileTooLargeMessage);
      return;
    }

    try {
      const optimizedBase64 = await optimizeImage(file);
      const maxBase64Size = 2 * 1024 * 1024;
      if (optimizedBase64.length > maxBase64Size) {
        alert(fileStillTooLargeMessage);
        return;
      }

      onBrandingChange({ logo: optimizedBase64 });
    } catch {
      alert(imageProcessingErrorMessage);
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
    if (file) handleFileUpload(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.type.startsWith("image/") || item.type === "image/svg+xml") {
        const file = item.getAsFile();
        if (file) handleFileUpload(file);
      }
    }
  };

  return (
    <div className="rounded-lg bg-white shadow-sm dark:bg-dark-2" data-tour-id={dataTourSectionId}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
      >
        <h3 className="text-lg font-semibold text-dark dark:text-white">{title}</h3>
        <ChevronDownIcon
          className={cn(
            "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-stroke px-6 py-4 dark:border-dark-3" data-tour-id={dataTourContentId}>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{themeLabel}</label>
              <button
                type="button"
                className="w-full cursor-default rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                {themeButtonLabel}
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{logoLabel}</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                className={cn(
                  "flex items-center gap-4 rounded-lg border-2 border-dashed p-4 transition",
                  isDragging ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-stroke dark:border-dark-3"
                )}
              >
                {branding.logo ? (
                  <div className="relative">
                    <img
                      src={branding.logo}
                      alt="Logo"
                      className="h-16 w-16 rounded-lg border border-stroke object-contain dark:border-dark-3"
                    />
                    <button
                      onClick={() => onBrandingChange({ logo: undefined })}
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                <div className="flex-1">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {branding.logo ? changeLogoLabel : uploadLogoLabel}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml,.svg,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <p className="mt-2 text-xs text-dark-6 dark:text-dark-6">{logoHint}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-medium text-dark dark:text-white">{colorPaletteLabel}</h4>
              <div className="relative">
                <label className="mb-2 block text-xs font-medium text-dark-6 dark:text-dark-6">{customColorThemeLabel}</label>
                <button
                  type="button"
                  data-color-picker-trigger="true"
                  onClick={() => setIsColorPickerOpen((prev) => !prev)}
                  className="flex w-full items-center gap-3 rounded-lg border border-stroke bg-white p-2 text-left transition hover:border-primary dark:border-dark-3 dark:bg-dark-2"
                >
                  <div
                    className="h-6 w-6 rounded border border-stroke shadow-sm dark:border-dark-3"
                    style={{ backgroundColor: branding.customColorTheme }}
                  />
                  <span className="text-sm text-dark dark:text-white">{branding.customColorTheme.toUpperCase()}</span>
                </button>

                {isColorPickerOpen && (
                  <div
                    ref={colorPickerRef}
                    className="absolute left-0 top-full z-50 mt-2 rounded-lg border border-stroke bg-white p-3 shadow-xl dark:border-dark-3 dark:bg-dark-2"
                  >
                    <HexColorPicker
                      color={branding.customColorTheme}
                      onChange={(color) => onBrandingChange({ customColorTheme: color })}
                    />
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {presetColors.map((presetColor) => (
                        <button
                          key={presetColor}
                          type="button"
                          className="h-6 w-6 rounded border border-stroke dark:border-dark-3"
                          style={{ backgroundColor: presetColor }}
                          onClick={() => onBrandingChange({ customColorTheme: presetColor })}
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
  );
}
