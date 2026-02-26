"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { QRConfig, WebhookEvent } from "./qr-config";
import { cn } from "@/lib/utils";
import { useQRTranslations } from "./use-qr-translations";

interface ConfigPanelProps {
  config: QRConfig;
  updateConfig: (updates: Partial<QRConfig>) => void;
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

export function ConfigPanel({ config, updateConfig }: ConfigPanelProps) {
  const translations = useQRTranslations();
  const { webhookUrl, webhookEvents } = config;
  type OpenSection = "webhooks" | "branding";
  const [openSection, setOpenSection] = useState<OpenSection>("webhooks");
  const currentTheme: "light" = "light";
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const colorPickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleWebhookUrlChange = (value: string) => {
    updateConfig({ webhookUrl: value });
  };

  const handleEventToggle = (event: WebhookEvent) => {
    const newEvents = webhookEvents.includes(event)
      ? webhookEvents.filter((e) => e !== event)
      : [...webhookEvents, event];
    updateConfig({ webhookEvents: newEvents });
  };

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
      alert("Formato de archivo no válido. Por favor, sube una imagen PNG, JPG, GIF, WEBP o SVG.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("File too large. Maximum size: 5MB");
      alert("El archivo es demasiado grande. El tamaño máximo permitido es 5MB.");
      return;
    }

    try {
      const optimizedBase64 = await optimizeImage(file);
      
      const base64Size = optimizedBase64.length;
      const maxBase64Size = 2 * 1024 * 1024;
      if (base64Size > maxBase64Size) {
        alert("La imagen optimizada sigue siendo muy grande. Por favor, intenta con una imagen más pequeña.");
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
      alert("Error al procesar la imagen. Por favor, intenta de nuevo.");
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

  const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; description: string }[] = [
    {
      value: "payment.succeeded",
      label: translations.config.webhooks.events.paymentSucceeded.label,
      description: translations.config.webhooks.events.paymentSucceeded.description,
    },
    {
      value: "payment.failed",
      label: translations.config.webhooks.events.paymentFailed.label,
      description: translations.config.webhooks.events.paymentFailed.description,
    },
    {
      value: "payment.pending",
      label: translations.config.webhooks.events.paymentPending.label,
      description: translations.config.webhooks.events.paymentPending.description,
    },
    {
      value: "charge.refunded",
      label: translations.config.webhooks.events.chargeRefunded.label,
      description: translations.config.webhooks.events.chargeRefunded.description,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Webhooks Configuration */}
      <div className="rounded-lg bg-white shadow-sm dark:bg-dark-2">
          <button
            onClick={() => setOpenSection("webhooks")}
            className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
          >
            <h3 className="text-lg font-semibold text-dark dark:text-white">{translations.config.webhooks.title}</h3>
            <ChevronDownIcon
              className={cn(
                "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
                openSection === "webhooks" && "rotate-180"
              )}
            />
          </button>
          {openSection === "webhooks" && (
            <div className="border-t border-stroke px-6 py-4 dark:border-dark-3">
              <div className="space-y-6">
              <div>
                <p className="text-sm text-dark-6 dark:text-dark-6">
                  {translations.config.webhooks.description}
                </p>
              </div>

              {/* URL del Webhook */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {translations.config.webhooks.urlLabel}
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => handleWebhookUrlChange(e.target.value)}
                  placeholder={translations.config.webhooks.urlPlaceholder}
                  className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-dark placeholder-dark-6 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:placeholder-dark-6"
                />
                <p className="mt-1.5 text-xs text-dark-6 dark:text-dark-6">
                  {translations.config.webhooks.urlHint}
                </p>
              </div>

              {/* Eventos a Notificar */}
              <div>
                <label className="mb-3 block text-sm font-medium text-dark dark:text-white">
                  {translations.config.webhooks.eventsLabel}
                </label>
                <p className="mb-3 text-xs text-dark-6 dark:text-dark-6">
                  {translations.config.webhooks.eventsDescription}
                </p>
                
                <div className="space-y-3">
                  {WEBHOOK_EVENTS.map((event) => {
                    const isChecked = webhookEvents.includes(event.value);
                    return (
                      <div
                        key={event.value}
                        className={cn(
                          "rounded-lg border p-4 transition",
                          isChecked
                            ? "border-primary bg-primary/5 dark:border-primary dark:bg-primary/10"
                            : "border-stroke bg-gray-50 dark:border-dark-3 dark:bg-dark-3"
                        )}
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleEventToggle(event.value)}
                            className="mt-0.5 h-4 w-4 rounded border-stroke text-primary focus:ring-1 focus:ring-primary dark:border-dark-3"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-dark dark:text-white">
                              {event.label}
                            </p>
                            <p className="mt-1 text-xs text-dark-6 dark:text-dark-6">
                              {event.description}
                            </p>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
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
            {translations.config.brandingTitle ?? 'Personalización de marca'}
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
                {translations.config.themeLabel ?? 'Tema'}
              </label>
              <button
                type="button"
                className="w-full cursor-default rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                {translations.config.lightMode ?? 'Claro'}
              </button>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {translations.config.logoLabel ?? 'Logo'} ({translations.config.lightMode ?? 'Claro'})
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
                      alt="Logo"
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
                    {translations.config.logoUploadHelp ?? 'Arrastra, pega o selecciona una imagen'}
                  </p>
                  <p className="mb-3 text-xs text-dark-6 dark:text-dark-6">
                    PNG, JPG, SVG, GIF, WEBP (máx. 5MB)
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  >
                    {translations.config.uploadButton ?? 'Seleccionar archivo'}
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
                {translations.config.colorLabel ?? 'Paleta de colores'} ({currentTheme === 'light' ? (translations.config.lightMode ?? 'Claro') : (translations.config.darkMode ?? 'Oscuro')})
              </h4>
              <div className="relative">
                <label className="mb-2 block text-xs font-medium text-dark-6 dark:text-dark-6">
                  Color primario
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

              {/* Confirm Button Type */}
              <div>
                <h4 className="mb-4 text-sm font-medium text-dark dark:text-white">
                  Tipo de botón de confirmación
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig({
                        branding: {
                          ...config.branding,
                          [currentTheme]: {
                            ...config.branding?.[currentTheme],
                            confirmButtonType: "slider",
                          },
                        },
                      });
                    }}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      (config.branding?.[currentTheme]?.confirmButtonType || "slider") === "slider"
                        ? "border-primary bg-primary text-white"
                        : "border-stroke bg-white text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    }`}
                  >
                    Deslizar para confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig({
                        branding: {
                          ...config.branding,
                          [currentTheme]: {
                            ...config.branding?.[currentTheme],
                            confirmButtonType: "button",
                          },
                        },
                      });
                    }}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      config.branding?.[currentTheme]?.confirmButtonType === "button"
                        ? "border-primary bg-primary text-white"
                        : "border-stroke bg-white text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    }`}
                  >
                    Botón fijo
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
