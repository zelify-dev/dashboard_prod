"use client";

import { useState, useEffect } from "react";
import { PreviewPanel } from "./preview-panel";
import { ConfigPanel } from "./config-panel";

export type LoginMethod = "phone" | "username" | "email" | "oauth";
export type OAuthProvider = "google" | "facebook" | "apple";
export type ViewMode = "mobile" | "web";

export type RegistrationFieldId = "username" | "fullName" | "phone" | "address" | "email" | "idNumber" | "birthDate";

export interface RegistrationField {
  id: RegistrationFieldId;
  enabled: boolean;
  required: boolean;
}

export type CustomFieldType = "text" | "email" | "number" | "tel" | "date" | "textarea" | "select";

export interface CustomRegistrationField {
  id: string; // ID único generado
  label: string;
  type: CustomFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // Para tipo select
}

export interface AuthConfig {
  viewMode: ViewMode;
  serviceType: "login" | "register";
  loginMethod: LoginMethod;
  oauthProviders: OAuthProvider[];
  registrationFields: RegistrationField[];
  customRegistrationFields: CustomRegistrationField[];
  branding: ThemeBranding;
}

export interface BrandingConfig {
  logo?: string;
  customColorTheme: string;
}

export interface ThemeBranding {
  light: BrandingConfig;
  dark: BrandingConfig;
}


const defaultRegistrationFields: RegistrationField[] = [
  { id: "username", enabled: true, required: false },
  { id: "fullName", enabled: true, required: true },
  { id: "idNumber", enabled: false, required: false },
  { id: "birthDate", enabled: false, required: false },
  { id: "address", enabled: false, required: false },
];

const DEFAULT_ORG_ID = "9690c49e-08ce-46a8-9e1e-1d313fe6906f";

export function AuthenticationConfig() {
  const [config, setConfig] = useState<AuthConfig>({
    viewMode: "mobile",
    serviceType: "login",
    loginMethod: "email",
    oauthProviders: [],
    registrationFields: defaultRegistrationFields,
    customRegistrationFields: [],
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
          `/api/configuration?idOrg=${DEFAULT_ORG_ID}&service=auth`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.id) {
            setConfigId(data.id);
            // Mapear la configuración del servidor al formato local
            setConfig({
              viewMode: "mobile", // Solo para preview
              serviceType: "login", // Solo para preview
              loginMethod: data.loginMethod || "email",
              oauthProviders: data.oauthProviders || [],
              registrationFields: data.registrationFields || defaultRegistrationFields,
              customRegistrationFields: data.customRegistrationFields || [],
              branding: data.branding || {
                light: {
                  customColorTheme: "#004492",
                },
                dark: {
                  customColorTheme: "#004492",
                },
              },
            });
            setHasChanges(false); // No hay cambios al cargar
          }
        } else if (response.status === 404) {
          // No existe configuración, usar valores por defecto
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

  const updateConfig = (updates: Partial<AuthConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const saveConfiguration = async () => {
    try {
      setIsSaving(true);
      
      // Preparar datos para guardar (sin viewMode y serviceType)
      const configToSave = {
        idOrg: DEFAULT_ORG_ID,
        service: "auth",
        loginMethod: config.loginMethod,
        oauthProviders: config.oauthProviders,
        registrationFields: config.registrationFields,
        customRegistrationFields: config.customRegistrationFields,
        branding: config.branding,
      };

      let response;
      if (configId) {
        // Actualizar configuración existente
        response = await fetch(`/api/configuration/${configId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(configToSave),
        });
      } else {
        // Crear nueva configuración
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
        // Mostrar mensaje de éxito
        alert("Configuración guardada exitosamente");
        console.log("Configuración guardada exitosamente");
      } else {
        // Intentar obtener el mensaje de error
        let errorMessage = "Error al guardar la configuración";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          
          // Mensajes específicos según el código de estado
          if (response.status === 413) {
            errorMessage = "El tamaño de la configuración es demasiado grande. Por favor, optimiza las imágenes o reduce su tamaño.";
          } else if (response.status >= 500) {
            errorMessage = "Error del servidor. Por favor, intenta de nuevo más tarde.";
          }
          
          console.error("Error al guardar configuración:", {
            status: response.status,
            error: errorData,
          });
        } catch (parseError) {
          const errorText = await response.text().catch(() => "");
          console.error("Error al guardar configuración (no JSON):", {
            status: response.status,
            error: errorText,
          });
          errorMessage = `Error ${response.status}: ${errorText || "Error desconocido"}`;
        }
        
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error("Error saving configuration:", error);
      const errorMessage = error.message || "Error de conexión. Por favor, verifica tu conexión e intenta de nuevo.";
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
          <p className="text-sm text-dark-6 dark:text-dark-6">Cargando configuración...</p>
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
