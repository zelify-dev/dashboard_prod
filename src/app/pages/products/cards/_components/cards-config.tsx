"use client";

import { useState, useEffect } from "react";
import { PreviewPanel } from "./preview-panel";
import { ConfigPanel } from "./config-panel";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "./cards-translations";

export interface BrandingConfig {
  logo?: string;
  customColorTheme: string;
}

export interface ThemeBranding {
  light: BrandingConfig;
  dark: BrandingConfig;
}

export interface CardsConfig {
  branding: ThemeBranding;
}

const DEFAULT_ORG_ID = "9690c49e-08ce-46a8-9e1e-1d313fe6906f";

export function CardsConfig() {
  const { language } = useLanguage();
  const t = cardsTranslations[language].configurator;

  const [config, setConfig] = useState<CardsConfig>({
    branding: {
      light: {
        customColorTheme: "#004492",
      },
      dark: {
        customColorTheme: "#004492",
      },
    },
  });
  const [configId, setConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar configuración al iniciar
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/configuration?idOrg=${DEFAULT_ORG_ID}&service=cards`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.id) {
            setConfigId(data.id);
            setConfig({
              branding: data.branding || {
                light: {
                  customColorTheme: "#004492",
                },
                dark: {
                  customColorTheme: "#004492",
                },
              },
            });
            setHasChanges(false);
          }
        } else if (response.status === 404) {
          setHasChanges(false);
        }
      } catch (error) {
        console.error("Error loading configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  const updateConfig = (updates: Partial<CardsConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const saveConfiguration = async () => {
    try {
      setIsSaving(true);
      
      const configToSave = {
        idOrg: DEFAULT_ORG_ID,
        service: "cards",
        branding: config.branding,
      };

      let response;
      if (configId) {
        response = await fetch(`/api/configuration/${configId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(configToSave),
        });
      } else {
        response = await fetch("/api/configuration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(configToSave),
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.id && !configId) {
          setConfigId(data.id);
        }
        setHasChanges(false);
        alert(t.alerts.saveSuccess);
      } else {
        let errorMessage = t.alerts.saveErrorDefault;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          const errorText = await response.text().catch(() => "");
          errorMessage = `${t.alerts.httpErrorPrefix} ${response.status}: ${errorText || t.alerts.unknownError}`;
        }
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error("Error saving configuration:", error);
      const errorMessage = error.message || t.alerts.connectionError;
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !configId) {
    return (
      <div className="mt-6 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-dark-6 dark:text-dark-6">{t.loadingConfig}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PreviewPanel config={config} updateConfig={updateConfig} />
        <ConfigPanel 
          config={config} 
          updateConfig={updateConfig}
          onSave={saveConfiguration}
          hasChanges={hasChanges}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
