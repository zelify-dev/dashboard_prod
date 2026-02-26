import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { DiscountsConfigState } from "./discounts-config";
import { useDiscountsTranslations } from "./use-discounts-translations";

interface DiscountsConfigPanelProps {
  config: DiscountsConfigState;
  updateConfig: (updates: Partial<DiscountsConfigState>) => void;
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

export function DiscountsConfigPanel({
  config,
  updateConfig,
  onSave,
  hasChanges = false,
  isSaving = false,
}: DiscountsConfigPanelProps) {
  const t = useDiscountsTranslations();
  const { plans, promoCount, showHourField, branding } = config;
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const currentTheme: "light" = "light";
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close color picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(target as Node) &&
        !target.closest('[data-color-picker-trigger="true"]') &&
        !target.closest('button[style*="background-color"]')
      ) {
        setOpenColorPicker(null);
      }
    };

    if (openColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openColorPicker]);

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (
        file.type === "image/svg+xml" ||
        file.name.toLowerCase().endsWith(".svg")
      ) {
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
            const optimizedBase64 = canvas.toDataURL(mimeType, quality);
            resolve(optimizedBase64);
          } catch (error) {
            const fallbackBase64 = canvas.toDataURL("image/png", quality);
            resolve(fallbackBase64);
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

    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    const isValidType =
      validImageTypes.includes(file.type.toLowerCase()) ||
      file.type.startsWith("image/") ||
      validImageTypes.some((type) => type.endsWith(fileExtension));

    if (!isValidType) {
      alert(t.configPanel.errors.invalidFileType);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(t.configPanel.errors.fileTooLarge);
      return;
    }

    try {
      const optimizedBase64 = await optimizeImage(file);
      const maxBase64Size = 2 * 1024 * 1024;
      if (optimizedBase64.length > maxBase64Size) {
        alert(t.configPanel.errors.imageTooLarge);
        return;
      }

      updateConfig({
        branding: {
          ...branding,
          [currentTheme]: {
            ...branding[currentTheme],
            logo: optimizedBase64,
          },
        },
      });
    } catch (error) {
      console.error("Error processing image:", error);
      alert(t.configPanel.errors.imageProcessError);
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

  const handlePlanChange = (index: number, field: string, value: string) => {
    const newPlans = [...plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    updateConfig({ plans: newPlans });
  };

  return (
    <div className="space-y-6 relative" data-tour-id="tour-discounts-config-panel">
      <div className="rounded-lg bg-white shadow-sm dark:bg-dark-2">
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-dark-3"
        >
          <h3 className="text-lg font-semibold text-dark dark:text-white">
            {t.configPanel.title}
          </h3>
          <ChevronDownIcon
            className={cn(
              "h-5 w-5 text-dark-6 transition-transform duration-200 dark:text-dark-6",
              isConfigOpen && "rotate-180"
            )}
          />
        </button>

        {isConfigOpen && (
          <div className="border-t border-stroke px-6 py-4 dark:border-dark-3 space-y-6">
            {/* Plans Verification */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-dark dark:text-white">
                {t.configPanel.planVerification}
              </h4>
              <div className="space-y-4">
                {plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className="p-3 bg-gray-50 rounded-lg dark:bg-dark-3 border border-gray-100 dark:border-dark-4"
                  >
                    <p className="text-xs font-bold uppercase text-gray-400 mb-2">
                      {(plan.id === "free"
                        ? t.preview.plans.free.title
                        : t.preview.plans.premium.title)}{" "}
                      {t.configPanel.planSuffix}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          {t.configPanel.fields.title}
                        </label>
                        <input
                          type="text"
                          value={plan.title}
                          onChange={(e) =>
                            handlePlanChange(index, "title", e.target.value)
                          }
                          className="w-full text-sm border-gray-200 rounded-md dark:bg-dark-4 dark:border-dark-4"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          {t.configPanel.fields.price}
                        </label>
                        <input
                          type="text"
                          value={plan.price}
                          onChange={(e) =>
                            handlePlanChange(index, "price", e.target.value)
                          }
                          className="w-full text-sm border-gray-200 rounded-md dark:bg-dark-4 dark:border-dark-4"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Here We Go Screen */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-dark dark:text-white">
                {t.configPanel.hereWeGoScreenTitle}
              </h4>
              <div>
                <label className="text-sm text-gray-500 mb-2 block">
                  {t.configPanel.quantityDiscountsToShowLabel}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={promoCount}
                    onChange={(e) =>
                      updateConfig({ promoCount: parseInt(e.target.value) })
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <span className="text-sm font-medium w-6 text-center">
                    {promoCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Configure Promo Screen */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-dark dark:text-white">
                {t.configPanel.configurePromoScreenTitle}
              </h4>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-dark-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t.configPanel.showHourFieldLabel}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHourField}
                    onChange={(e) =>
                      updateConfig({ showHourField: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Custom Branding */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-dark dark:text-white">
                {t.configPanel.customBrandingTitle}
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg dark:bg-dark-3 border border-gray-100 dark:border-dark-4 space-y-4">
                {/* Theme Selector */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    {t.configPanel.theme.title}
                  </label>
                  <button
                    type="button"
                    className="w-full cursor-default rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-white"
                  >
                    {t.configPanel.theme.light}
                  </button>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    {t.configPanel.logo.title(
                      t.configPanel.logo.light
                    )}
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-2 border-dashed p-3 transition",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 dark:border-dark-4"
                    )}
                  >
                    {config.branding?.[currentTheme]?.logo ? (
                      <div className="relative shrink-0">
                        <img
                          src={config.branding[currentTheme].logo}
                          alt="Logo"
                          className="h-12 w-12 rounded-lg object-contain border border-gray-200 bg-white"
                        />
                        <button
                          onClick={() =>
                            updateConfig({
                              branding: {
                                ...config.branding,
                                [currentTheme]: {
                                  ...config.branding[currentTheme],
                                  logo: undefined,
                                },
                              },
                            })
                          }
                          className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600 shadow-sm"
                        >
                          <svg
                            className="h-2.5 w-2.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 dark:border-dark-4 dark:bg-dark-2">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-dark transition hover:bg-gray-50 dark:border-dark-4 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 w-full">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        {config.branding?.[currentTheme]?.logo
                          ? t.configPanel.logo.change
                          : t.configPanel.logo.upload}
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
                      <p className="mt-1 text-[10px] text-gray-400 truncate">
                        {t.configPanel.logoFormatsHint}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    {t.configPanel.colors.title(
                      currentTheme === "light"
                        ? t.configPanel.logo.light
                        : t.configPanel.logo.dark
                    )}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      data-color-picker-trigger="true"
                      onClick={() =>
                        setOpenColorPicker(
                          openColorPicker === "customColorTheme"
                            ? null
                            : "customColorTheme"
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 text-left transition hover:border-primary dark:border-dark-4 dark:bg-dark-2"
                    >
                      <div
                        className="h-6 w-6 rounded border border-gray-200 shadow-sm dark:border-dark-4"
                        style={{
                          backgroundColor:
                            config.branding?.[currentTheme]?.customColorTheme ||
                            "#004492",
                        }}
                      />
                      <span className="text-sm text-dark dark:text-white">
                        {(
                          config.branding?.[currentTheme]?.customColorTheme ||
                          "#004492"
                        ).toUpperCase()}
                      </span>
                    </button>
                    {openColorPicker === "customColorTheme" && (
                      <div
                        ref={colorPickerRef}
                        className="absolute bottom-full left-0 z-50 mb-2 max-h-[70vh] overflow-auto rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-dark-4 dark:bg-dark-2"
                      >
                        <HexColorPicker
                          color={
                            config.branding?.[currentTheme]?.customColorTheme ||
                            "#004492"
                          }
                          onChange={(color) =>
                            updateConfig({
                              branding: {
                                ...config.branding,
                                [currentTheme]: {
                                  ...config.branding[currentTheme],
                                  customColorTheme: color,
                                },
                              },
                            })
                          }
                        />
                        <div className="mt-3 grid grid-cols-5 gap-2">
                          {[
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
                          ].map((presetColor) => (
                            <button
                              key={presetColor}
                              type="button"
                              className="h-6 w-6 rounded border border-gray-200 dark:border-dark-4"
                              style={{ backgroundColor: presetColor }}
                              onClick={() =>
                                updateConfig({
                                  branding: {
                                    ...config.branding,
                                    [currentTheme]: {
                                      ...config.branding[currentTheme],
                                      customColorTheme: presetColor,
                                    },
                                  },
                                })
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 z-20 -mx-6 -mb-6 bg-gray-50 p-6 pt-4 dark:bg-dark-2 sm:static sm:mx-0 sm:mb-0 sm:bg-transparent sm:p-0 sm:pt-0 sm:dark:bg-transparent">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {hasChanges && (
            <p className="text-sm font-medium text-warning-600 dark:text-warning-400">
              {t.configPanel.unsavedChanges}
            </p>
          )}
          <button
            onClick={onSave}
            disabled={!hasChanges || isSaving}
            className={cn(
              "inline-flex items-center justify-center rounded-lg px-8 py-2.5 text-center font-medium text-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none dark:focus:ring-primary/40",
              hasChanges
                ? "bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98]"
                : "bg-gray-400 shadow-none dark:bg-dark-4"
            )}
          >
            {isSaving ? (
              <>
                <svg
                  className="mr-2 -ml-1 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t.configPanel.actions.saving}
              </>
            ) : (
              t.configPanel.actions.saveChanges
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
