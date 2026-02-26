"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";
import { CustomKeysConfig, CustomKeyType } from "./custom-keys-config";
import { useCustomKeysTranslations } from "./use-custom-keys-translations";

interface ConfigPanelProps {
  config: CustomKeysConfig;
  updateConfig: (updates: Partial<CustomKeysConfig>) => void;
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

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        enabled ? "bg-primary" : "bg-gray-300 dark:bg-dark-3"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function ConfigPanel({ config, updateConfig }: ConfigPanelProps) {
  const translations = useCustomKeysTranslations();
  type OpenSection = "customKeys" | "branding";
  const [openSection, setOpenSection] = useState<OpenSection>("customKeys");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentTheme: "light" = "light";
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const colorPickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Optimized image handler matching auth
  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
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
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo crear el contexto del canvas'));
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
          const mimeType = file.type || 'image/png';
          
          try {
            const optimizedBase64 = canvas.toDataURL(mimeType, quality);
            resolve(optimizedBase64);
          } catch (error) {
            const fallbackBase64 = canvas.toDataURL('image/png', quality);
            resolve(fallbackBase64);
          }
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) {
      console.warn("No file provided");
      return;
    }

    const validImageTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
      'image/webp', 'image/svg+xml', 'image/svg'
    ];
    
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    const isValidType = validImageTypes.includes(file.type.toLowerCase()) || 
                       file.type.startsWith('image/') ||
                       validExtensions.includes(fileExtension);
    
    if (!isValidType) {
      console.error("Invalid file type. Accepted formats: PNG, JPG, GIF, WEBP, SVG");
      alert(translations.config.invalidFileTypeMessage);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("File too large. Maximum size: 5MB");
      alert(translations.config.fileTooLargeMessage);
      return;
    }

    try {
      const optimizedBase64 = await optimizeImage(file);
      
      const base64Size = optimizedBase64.length;
      const maxBase64Size = 2 * 1024 * 1024;
      if (base64Size > maxBase64Size) {
        alert(translations.config.optimizedFileTooLargeMessage);
        return;
      }

      updateConfig({
        branding: {
          ...config.branding,
          [currentTheme]: {
            ...config.branding?.[currentTheme],
            logo: optimizedBase64
          }
        }
      });
    } catch (error) {
      console.error("Error processing image:", error);
      alert(translations.config.imageProcessErrorMessage);
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
      const item = items[i];
      if (item.type.startsWith('image/') || item.type === 'image/svg+xml') {
        const file = item.getAsFile();
        if (file) {
          handleFileUpload(file);
        }
      }
    }
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openColorPicker) {
        const pickerElement = colorPickerRefs.current[openColorPicker];
        const target = event.target as HTMLElement;
        
        const isColorButton = target.closest('button[type="button"]') && 
            target.closest('button[type="button"]')?.getAttribute('style')?.includes('backgroundColor');
        
        if (pickerElement && !pickerElement.contains(target) && !isColorButton) {
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

  const getKeyTypeLabel = (type: CustomKeyType): string => {
    return translations.preview.keyTypes[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Custom Keys Configuration */}
      <div className="rounded-lg bg-white shadow-sm dark:bg-dark-2">
          <button
            onClick={() => setOpenSection("customKeys")}
            className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
          >
            <h3 className="text-lg font-semibold text-dark dark:text-white">{translations.config.customKeysTitle}</h3>
            <ChevronDownIcon
              className={cn(
                "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
                openSection === "customKeys" && "rotate-180"
              )}
            />
          </button>
          {openSection === "customKeys" && (
            <div className="border-t border-stroke px-6 py-4 dark:border-dark-3">
              <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {translations.config.availableTypesLabel}
                </label>
                <div className="space-y-2">
                  {(["cedula", "telefono", "correo"] as CustomKeyType[]).map((keyType) => (
                    <label key={keyType} className="flex items-center justify-between rounded-lg border border-stroke p-3 dark:border-dark-3">
                      <span className="text-sm text-dark dark:text-white">{getKeyTypeLabel(keyType)}</span>
                      <input
                        type="checkbox"
                        checked={config.availableKeyTypes.includes(keyType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newTypes = [...config.availableKeyTypes, keyType];
                            updateConfig({ availableKeyTypes: newTypes });
                          } else {
                            const newTypes = config.availableKeyTypes.filter(t => t !== keyType);
                            // Si se deshabilita el tipo actual, cambiar al primero disponible
                            if (newTypes.length > 0 && config.currentKeyType === keyType) {
                              updateConfig({ 
                                availableKeyTypes: newTypes,
                                currentKeyType: newTypes[0]
                              });
                            } else {
                              updateConfig({ availableKeyTypes: newTypes });
                            }
                          }
                        }}
                        disabled={config.availableKeyTypes.length === 1 && config.availableKeyTypes.includes(keyType)}
                        className="h-4 w-4 rounded border-stroke text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed dark:border-dark-3"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-dark-6 dark:text-dark-6">
                  {translations.config.availableTypesDescription}
                </p>
              </div>
              </div>
            </div>
          )}
        </div>

      {/* Custom Branding */}
      <div className="rounded-lg bg-white shadow-sm dark:bg-dark-2">
        <button
          onClick={() => setOpenSection("branding")}
          className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
        >
          <h3 className="text-lg font-semibold text-dark dark:text-white">
            {translations.config.brandingTitle}
          </h3>
          <ChevronDownIcon
            className={cn(
              "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
              openSection === "branding" && "rotate-180"
            )}
          />
        </button>
        {openSection === "branding" && (
          <div className="border-t border-stroke px-6 py-4 dark:border-dark-3">
            <div className="space-y-6">
              {/* Theme Selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {translations.config.themeLabel}
                </label>
                <button
                  type="button"
                  className="w-full cursor-default rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-white"
                >
                  {translations.config.lightMode}
                </button>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {translations.config.logoLabel ?? `Logo para modo claro`}
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
                  {config.branding?.[currentTheme]?.logo ? (
                    <div className="relative">
                      <img
                        src={config.branding[currentTheme].logo}
                        alt={translations.preview.logoAlt}
                        className="h-16 w-16 rounded-lg object-contain border border-stroke dark:border-dark-3"
                      />
                      <button
                        type="button"
                        onClick={() => updateConfig({
                          branding: {
                            ...config.branding,
                            [currentTheme]: {
                              ...config.branding[currentTheme],
                              logo: undefined
                            }
                          }
                        })}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-3">
                      <svg className="h-8 w-8 text-dark-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="mb-2 text-sm text-dark dark:text-white">
                      {translations.config.logoUploadHelp}
                    </p>
                    <p className="mb-3 text-xs text-dark-6 dark:text-dark-6">
                      {translations.config.logoSupportedFormats}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    >
                      {translations.config.uploadButton}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                          // Reset input value to allow re-uploading the same file
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Custom Color Theme */}
              <div>
                <h4 className="mb-4 text-sm font-medium text-dark dark:text-white">
                  {translations.config.colorLabel ?? `Paleta de colores para modo ${currentTheme === 'light' ? 'claro' : 'oscuro'}`}
                </h4>
                <div className="relative">
                  <label className="mb-2 block text-xs font-medium text-dark-6 dark:text-dark-6">
                    {translations.config.primaryColorLabel}
                  </label>
                  <button
                    type="button"
                    data-color-picker-trigger="true"
                    onClick={() => setOpenColorPicker(openColorPicker === "customColorTheme" ? null : "customColorTheme")}
                    className="flex w-full items-center gap-3 rounded-lg border border-stroke bg-white p-2 text-left transition hover:border-primary dark:border-dark-3 dark:bg-dark-2"
                  >
                    <div
                      className="h-6 w-6 rounded border border-stroke shadow-sm dark:border-dark-3"
                      style={{ backgroundColor: config.branding?.[currentTheme]?.customColor || '#004492' }}
                    />
                    <span className="text-sm text-dark dark:text-white">
                      {(config.branding?.[currentTheme]?.customColor || '#004492').toUpperCase()}
                    </span>
                  </button>
                  {openColorPicker === "customColorTheme" && (
                    <div
                      ref={(el) => {
                        colorPickerRefs.current["customColorTheme"] = el;
                      }}
                      className="absolute bottom-full left-0 z-50 mb-2 max-h-[70vh] overflow-auto rounded-lg border border-stroke bg-white p-3 shadow-xl dark:border-dark-3 dark:bg-dark-2"
                    >
                      <HexColorPicker
                        color={config.branding?.[currentTheme]?.customColor || '#004492'}
                        onChange={(color) => updateConfig({
                          branding: {
                            ...config.branding,
                            [currentTheme]: {
                              ...config.branding?.[currentTheme],
                              customColor: color
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
                                ...config.branding,
                                [currentTheme]: {
                                  ...config.branding?.[currentTheme],
                                  customColor: presetColor
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

    </div>
  );
}
