"use client";

import { useState, useEffect } from "react";
import { BankAccountPreviewPanel } from "./bank-account-preview-panel";
import { CountryConfigPanel, ThemeBranding } from "./country-config-panel";

export type BankAccountCountry = "ecuador" | "mexico" | "brasil" | "colombia" | "estados_unidos";

interface BankAccountConfigProps {
  country?: BankAccountCountry;
}

export function BankAccountConfig({ country: initialCountry = "mexico" }: BankAccountConfigProps) {
  const [selectedCountry, setSelectedCountry] = useState<BankAccountCountry>(initialCountry);
  const [viewMode, setViewMode] = useState<"mobile" | "web">("mobile");
  const [branding, setBranding] = useState<ThemeBranding>({
    light: {
      customColorTheme: "#004492",
      depositButtonType: "slider",
    },
    dark: {
      customColorTheme: "#004492",
      depositButtonType: "slider",
    },
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const handleCountryChange = (country: BankAccountCountry) => {
    setSelectedCountry(country);
  };

  // Get current branding based on dark mode
  const currentBranding = branding[isDarkMode ? "dark" : "light"];

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div data-tour-id="tour-connect-preview">
      <BankAccountPreviewPanel 
        country={selectedCountry} 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
          branding={currentBranding}
      />
      </div>
      <div data-tour-id="tour-connect-config">
        <CountryConfigPanel 
          selectedCountry={selectedCountry} 
          onCountryChange={handleCountryChange}
          branding={branding}
          onBrandingChange={setBranding}
        />
      </div>
    </div>
  );
}

