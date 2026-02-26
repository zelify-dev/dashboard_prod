"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Select from "react-select";

type SimpleSelectProps = {
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
  isSearchable?: boolean;
};

export function SimpleSelect({
  options,
  value,
  defaultValue,
  placeholder,
  onChange,
  className,
  isSearchable = false,
}: SimpleSelectProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedValue, setSelectedValue] = useState<{ value: string; label: string } | null>(
    value ? options.find(item => item.value === value) || null
    : defaultValue ? options.find(item => item.value === defaultValue) || null
    : null
  );

  useEffect(() => {
    if (value !== undefined) {
      const option = options.find(item => item.value === value);
      setSelectedValue(option || null);
    }
  }, [value, options]);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const hasError = className?.includes('react-select-error');

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: hasError 
        ? (isDarkMode ? '#7F1D1D' : '#FEF2F2')
        : (isDarkMode ? '#1F2937' : '#FFFFFF'),
      borderColor: hasError
        ? '#EF4444'
        : (isDarkMode ? '#374151' : '#E5E7EB'),
      borderRadius: '0.5rem',
      padding: '0.25rem 0.5rem',
      minHeight: '38px',
      fontSize: '0.875rem',
      boxShadow: state.isFocused 
        ? (hasError 
          ? '0 0 0 1px #EF4444' 
          : (isDarkMode ? '0 0 0 1px #004492' : '0 0 0 1px #004492'))
        : 'none',
      '&:hover': {
        borderColor: hasError ? '#EF4444' : (isDarkMode ? '#004492' : '#004492'),
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 50,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? (isDarkMode ? '#004492' : '#004492')
        : state.isFocused
        ? (isDarkMode ? '#374151' : '#F3F4F6')
        : 'transparent',
      color: isDarkMode ? '#FFFFFF' : '#111827',
      fontSize: '0.875rem',
      '&:hover': {
        backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDarkMode ? '#FFFFFF' : '#111827',
      fontSize: '0.875rem',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      fontSize: '0.875rem',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      padding: '4px',
    }),
  };

  return (
    <div className={cn("w-full", className)}>
      <Select
        options={options}
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
        isSearchable={isSearchable || options.length > 10}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
      />
    </div>
  );
}

