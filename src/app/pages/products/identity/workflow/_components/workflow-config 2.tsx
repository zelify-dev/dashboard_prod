"use client";

import { useState, useEffect } from "react";
import { PreviewPanel } from "./preview-panel";
import { ConfigPanel } from "./config-panel";
import { useTour } from "@/contexts/tour-context";

export type ViewMode = "mobile" | "web";
export type Country = "ecuador" | "mexico" | "colombia";
export type DocumentType = "drivers_license" | "id_card" | "passport";
export type LivenessType = "photo" | "video" | "selfie_photo" | "selfie_video";
export type ScreenStep = "welcome" | "document_selection" | "document_capture" | "liveness_check" | "result";

export interface BrandingConfig {
  logo?: string;
  customColorTheme: string;
}

export interface ThemeBranding {
  light: BrandingConfig;
  dark: BrandingConfig;
}

export interface WorkflowConfig {
  viewMode: ViewMode;
  country: Country;
  currentScreen: ScreenStep;
  enabledScreens: {
    welcome: boolean;
    document_selection: boolean;
    document_capture: boolean;
    liveness_check: boolean;
    result: boolean;
  };
  documentTypes: {
    drivers_license: boolean;
    id_card: boolean;
    passport: boolean;
  };
  livenessTypes: {
    photo: boolean;
    video: boolean;
    selfie_photo: boolean;
    selfie_video: boolean;
  };
  selectedDocumentType?: DocumentType;
  selectedLivenessType?: LivenessType;
  result: "approved" | "rejected" | null;
  branding: ThemeBranding;
}

interface WorkflowConfigProps {
  workflowId?: string;
  isNew?: boolean;
}

export function WorkflowConfig({ workflowId, isNew }: WorkflowConfigProps) {
  const { isTourActive, currentStep, steps } = useTour();
  const [config, setConfig] = useState<WorkflowConfig>({
    viewMode: "mobile",
    country: "ecuador",
    currentScreen: "welcome",
    enabledScreens: {
      welcome: true,
      document_selection: true,
      document_capture: true,
      liveness_check: true,
      result: true,
    },
    documentTypes: {
      drivers_license: true,
      id_card: true,
      passport: true,
    },
    livenessTypes: {
      photo: true,
      video: true,
      selfie_photo: true,
      selfie_video: true,
    },
    result: null,
    branding: {
      light: {
        customColorTheme: "#004492",
      },
      dark: {
        customColorTheme: "#004492",
      },
    },
  });

  const updateConfig = (updates: Partial<WorkflowConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // Asegurar que el viewMode esté en "mobile" y la pantalla correcta cuando el tour busque la vista previa
  useEffect(() => {
    if (isTourActive && steps.length > 0 && currentStep < steps.length) {
      const currentStepData = steps[currentStep];
      if (currentStepData?.target === "tour-identity-workflow-preview") {
        // Asegurar que el viewMode esté en "mobile"
        setConfig((prev) => {
          if (prev.viewMode !== "mobile") {
            return { ...prev, viewMode: "mobile" };
          }
          return prev;
        });
      } else if (currentStepData?.target === "tour-identity-workflow-config-liveness") {
        // Asegurar que selfie_photo y selfie_video estén habilitados cuando el tour llegue al paso de configuración
        setConfig((prev) => {
          if (!prev.livenessTypes.selfie_photo || !prev.livenessTypes.selfie_video) {
            return {
              ...prev,
              livenessTypes: {
                ...prev.livenessTypes,
                selfie_photo: true,
                selfie_video: true,
              },
            };
          }
          return prev;
        });
      } else if (currentStepData?.target === "tour-identity-workflow-liveness-preview") {
        // Cambiar a la pantalla de liveness_check y asegurar que el viewMode esté en "mobile"
        setConfig((prev) => {
          const updates: Partial<WorkflowConfig> = {
            viewMode: "mobile",
            currentScreen: "liveness_check",
            // Seleccionar automáticamente selfie_photo para que el botón aparezca
            selectedLivenessType: "selfie_photo"
          };
          // Asegurar que selfie_photo y selfie_video estén habilitados
          if (!prev.livenessTypes.selfie_photo || !prev.livenessTypes.selfie_video) {
            updates.livenessTypes = {
              ...prev.livenessTypes,
              selfie_photo: true,
              selfie_video: true,
            };
          }
          return { ...prev, ...updates };
        });
      }
    }
  }, [isTourActive, currentStep, steps]);

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PreviewPanel config={config} updateConfig={updateConfig} />
      <div data-tour-id="tour-identity-workflow-config">
        <ConfigPanel config={config} updateConfig={updateConfig} />
      </div>
    </div>
  );
}

