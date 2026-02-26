"use client";

import { useState, useRef, useEffect } from "react";
import ReactCountryFlag from "react-country-flag";

interface Country {
  code: string;
  name: string;
  dialCode: string;
}

const COUNTRIES: Country[] = [
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "MX", name: "Mexico", dialCode: "+52" },
  { code: "CO", name: "Colombia", dialCode: "+57" },
  { code: "EC", name: "Ecuador", dialCode: "+593" },
  { code: "PE", name: "Peru", dialCode: "+51" },
  { code: "AR", name: "Argentina", dialCode: "+54" },
  { code: "CL", name: "Chile", dialCode: "+56" },
  { code: "ES", name: "Spain", dialCode: "+34" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "CA", name: "Canada", dialCode: "+1" },
];

interface CountrySelectorProps {
  value?: string;
  onChange: (country: Country) => void;
  className?: string;
}

export function CountrySelector({ value, onChange, className = "" }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const country = COUNTRIES.find((c) => c.code === value);
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    onChange(country);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-stroke bg-gray-2 px-3 text-sm text-dark outline-none transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
      >
        <ReactCountryFlag
          countryCode={selectedCountry.code}
          svg
          style={{ width: "20px", height: "20px" }}
        />
        <span className="flex-1 text-left">{selectedCountry.code} {selectedCountry.dialCode}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-dark-2">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleSelect(country)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-gray-2 dark:hover:bg-dark-3 ${
                selectedCountry.code === country.code
                  ? "bg-primary/10 dark:bg-primary/20"
                  : ""
              }`}
            >
              <ReactCountryFlag
                countryCode={country.code}
                svg
                style={{ width: "20px", height: "20px" }}
              />
              <span className="flex-1 text-dark dark:text-white">{country.code}</span>
              <span className="text-dark-6 dark:text-dark-6">{country.dialCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { COUNTRIES };
export type { Country };




