"use client";

import { useState } from "react";
import { AMLConfig } from "./aml-config-types";
import { useAMLTranslations } from "./use-aml-translations";
import { CustomBrandingPanel } from "@/components/custom-branding/custom-branding-panel";

interface AMLPersonalizationConfigProps {
  config: AMLConfig;
  updateConfig: (updates: Partial<AMLConfig>) => void;
}

export function AMLPersonalizationConfig({ config, updateConfig }: AMLPersonalizationConfigProps) {
  const [isOpen, setIsOpen] = useState(true);
  const translations = useAMLTranslations();
  const currentTheme: "light" = "light";
  const currentBranding = config.branding[currentTheme];

  const logoLabel = `${translations.personalization.logo} ${translations.personalization.logoLightMode}`;
  const colorPaletteLabel = `${translations.personalization.themeColor} ${translations.personalization.logoLightMode}`;

  return (
    <div className="space-y-6">
      <CustomBrandingPanel
        title={translations.personalization.title}
        isOpen={isOpen}
        onToggle={() => setIsOpen((prev) => !prev)}
        themeLabel={translations.personalization.title}
        themeButtonLabel={translations.personalization.lightMode}
        logoLabel={logoLabel}
        changeLogoLabel={translations.personalization.selectFile}
        uploadLogoLabel={translations.personalization.selectFile}
        logoHint={translations.personalization.fileFormats}
        colorPaletteLabel={colorPaletteLabel}
        customColorThemeLabel={translations.personalization.themeColor}
        branding={{
          logo: currentBranding.logo || undefined,
          customColorTheme: currentBranding.customColorTheme,
        }}
        onBrandingChange={(updates) => {
          const hasLogoUpdate = Object.prototype.hasOwnProperty.call(updates, "logo");
          const nextLogo = hasLogoUpdate ? updates.logo ?? null : currentBranding.logo;

          updateConfig({
            branding: {
              ...config.branding,
              [currentTheme]: {
                ...config.branding[currentTheme],
                ...(updates.customColorTheme ? { customColorTheme: updates.customColorTheme } : {}),
                logo: nextLogo,
              },
            },
          });
        }}
        invalidFileTypeMessage={translations.personalization.invalidFileType}
        fileTooLargeMessage={translations.personalization.fileTooLarge}
        imageProcessingErrorMessage={translations.personalization.errorProcessingImage}
      />
    </div>
  );
}
