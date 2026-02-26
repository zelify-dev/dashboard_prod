"use client";

import { cn } from "@/lib/utils";
import { useId, useState, useEffect } from "react";
import Select from "react-select";

type PropsType = {
  label: string;
  items: { value: string; label: string }[];
  prefixIcon?: React.ReactNode;
  className?: string;
  disablePortal?: boolean;
  onChange?: (value: string) => void;
} & (
  | { placeholder?: string; defaultValue: string }
  | { placeholder: string; defaultValue?: string }
);

export function SelectComponent({
  items,
  label,
  defaultValue,
  placeholder,
  prefixIcon,
  className,
  onChange,
  disablePortal = false,
}: PropsType) {
  const id = useId();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedValue, setSelectedValue] = useState<{
    value: string;
    label: string;
  } | null>(
    defaultValue
      ? items.find((item) => item.value === defaultValue) || null
      : null,
  );

  // Update selectedValue when defaultValue changes
  useEffect(() => {
    if (defaultValue) {
      const newValue = items.find((item) => item.value === defaultValue);
      if (newValue && newValue.value !== selectedValue?.value) {
        setSelectedValue(newValue);
      }
    }
  }, [defaultValue, items]);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1F2937" : "transparent",
      borderColor: isDarkMode ? "#374151" : "#E5E7EB",
      borderRadius: "0.5rem",
      padding: "0.5rem 0.75rem",
      minHeight: "48px",
      boxShadow: state.isFocused
        ? isDarkMode
          ? "0 0 0 1px #004492"
          : "0 0 0 1px #004492"
        : "none",
      "&:hover": {
        borderColor: isDarkMode ? "#004492" : "#004492",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
      borderRadius: "0.5rem",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      zIndex: 99999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? isDarkMode
          ? "#004492"
          : "#004492"
        : state.isFocused
          ? isDarkMode
            ? "#374151"
            : "#F3F4F6"
          : "transparent",
      color: isDarkMode ? "#FFFFFF" : "#111827",
      "&:hover": {
        backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDarkMode ? "#FFFFFF" : "#111827",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDarkMode ? "#9CA3AF" : "#6B7280",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: isDarkMode ? "#9CA3AF" : "#6B7280",
    }),
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor={id}
        className="block text-body-sm font-medium text-dark dark:text-white"
      >
        {label}
      </label>

      <div className="relative">
        {prefixIcon && (
          <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2">
            {prefixIcon}
          </div>
        )}

        <div className={cn(prefixIcon && "pl-11.5")}>
          <Select
            instanceId={id}
            options={items}
            value={selectedValue}
            placeholder={placeholder}
            onChange={(option) => {
              if (option) {
                setSelectedValue(option);
                onChange?.(option.value);
              }
            }}
            styles={customStyles}
            classNamePrefix="react-select"
            isSearchable={items.length > 10}
            menuPortalTarget={
              !disablePortal && typeof document !== "undefined"
                ? document.body
                : null
            }
            menuPosition={disablePortal ? "absolute" : "fixed"}
          />
        </div>
      </div>
    </div>
  );
}

// Export with the original name for backward compatibility
export { SelectComponent as Select };
