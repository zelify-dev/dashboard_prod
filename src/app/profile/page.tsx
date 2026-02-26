"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useRef, useEffect } from "react";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";

export default function Page() {
  const { profilePage } = useUiTranslations();
  const [data, setData] = useState({
    businessName: "",
    website: "",
    address: "",
    branding: {
      logo: "",
      color: "#004492", // Default brand color
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPlacement, setColorPickerPlacement] = useState<"top" | "bottom">("bottom");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isTriggerButton = !!target.closest('[data-color-picker-trigger="true"]');
      const isColorButton = target.closest('button[type="button"]') &&
        target.closest('button[type="button"]')?.getAttribute('style')?.includes('backgroundColor');

      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(target) &&
        !isTriggerButton &&
        !isColorButton
      ) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  const toggleColorPicker = () => {
    setShowColorPicker((prev) => {
      const next = !prev;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleColorChange = (newColor: string) => {
    setData({
      ...data,
      branding: {
        ...data.branding,
        color: newColor
      }
    });
  };

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result); // Using simple base64 for now as per simplified requirement
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }

    try {
      const optimizedBase64 = await optimizeImage(file);
      setData({
        ...data,
        branding: {
          ...data.branding,
          logo: optimizedBase64
        }
      });
    } catch (error) {
      console.error("Error processing image:", error);
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
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) handleFileUpload(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving General Information:", data);
  };

  return (
    <div className="mx-auto w-full max-w-[970px]">
      <Breadcrumb pageName={profilePage.title} />

      <div className="w-full">
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-dark dark:text-white">
            {profilePage.title}
          </h2>
          <p className="mt-1 text-sm text-body">
            {profilePage.description}
          </p>
        </div>

        {/* Form Section */}
        <div className="rounded-[10px] bg-white p-8 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-primary dark:text-white">
                {profilePage.title}
              </h3>
            </div>

            <div className="mb-5.5">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="businessName"
              >
                {profilePage.form.businessName} <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="text"
                name="businessName"
                id="businessName"
                placeholder={profilePage.form.businessNamePlaceholder}
                value={data.businessName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-5.5">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="website"
              >
                {profilePage.form.website}
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="url"
                name="website"
                id="website"
                placeholder={profilePage.form.websitePlaceholder}
                value={data.website}
                onChange={handleChange}
              />
            </div>

            <div className="mb-8">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="address"
              >
                {profilePage.form.address} <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="text"
                name="address"
                id="address"
                placeholder={profilePage.form.addressPlaceholder}
                value={data.address}
                onChange={handleChange}
                required
              />
            </div>

            {/* Branding Section */}
            <div className="mb-8 border-t border-stroke pt-8 dark:border-dark-3">
              <h3 className="mb-6 text-lg font-semibold text-primary dark:text-white">
                {profilePage.form.branding.title}
              </h3>

              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {profilePage.form.branding.logoLabel}
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
                    {data.branding.logo ? (
                      <div className="relative">
                        <img
                          src={data.branding.logo}
                          alt="Logo"
                          className="h-16 w-16 rounded-lg object-contain border border-stroke dark:border-dark-3"
                        />
                        <button
                          type="button"
                          onClick={() => setData({ ...data, branding: { ...data.branding, logo: "" } })}
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
                        {profilePage.form.branding.logoHelper}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      >
                        {profilePage.form.branding.uploadButton}
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
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {profilePage.form.branding.colorLabel}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      data-color-picker-trigger="true"
                      ref={colorPickerTriggerRef}
                      onClick={toggleColorPicker}
                      className="flex w-full items-center gap-3 rounded-lg border border-stroke bg-white p-2 text-left transition hover:border-primary dark:border-dark-3 dark:bg-dark-2"
                    >
                      <div
                        className="h-6 w-6 rounded border border-stroke shadow-sm dark:border-dark-3"
                        style={{ backgroundColor: data.branding.color }}
                      />
                      <span className="text-sm text-dark dark:text-white">
                        {data.branding.color.toUpperCase()}
                      </span>
                    </button>
                    {showColorPicker && (
                      <div
                        ref={colorPickerRef}
                        className={cn(
                          "absolute left-0 z-50 rounded-lg border border-stroke bg-white p-3 shadow-xl dark:border-dark-3 dark:bg-dark-2",
                          "max-h-[70vh] overflow-auto",
                          colorPickerPlacement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
                        )}
                      >
                        <HexColorPicker
                          color={data.branding.color}
                          onChange={handleColorChange}
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
                              onClick={() => handleColorChange(presetColor)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 font-medium text-white hover:bg-opacity-90 transition-all text-base"
            >
              ✓ {profilePage.form.saveButton}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
