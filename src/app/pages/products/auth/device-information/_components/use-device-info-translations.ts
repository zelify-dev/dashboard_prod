"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type DeviceInfoTranslations = {
  pageTitle: string;
  breadcrumb: string;
  subtitle: (count: number) => string;
  reloadButton: {
    default: string;
    loading: string;
  };
  errors: {
    geolocationUnsupported: string;
    permissionDenied: string;
    positionUnavailable: string;
    timeout: string;
    default: string;
  };
  table: {
    visitorId: string;
    ipAddress: string;
    requestId: string;
    date: string;
    empty: string;
    noEvents: string;
  };
  modal: {
    close: string;
    detailsTab: string;
    historyTab: (count: number) => string;
    identification: string;
    visitorId: string;
    lastSeen: string;
    firstSeen: string;
    confidence: string;
    incognito: string;
    yes: string;
    no: string;
    client: string;
    browser: string;
    os: string;
    device: string;
    location: string;
    ipAddress: string;
    city: string;
    region: string;
    country: string;
    continent: string;
    timezone: string;
    asn: string;
    vpn: string;
    proxy: string;
    highActivity: string;
    suspectScore: string;
    suspectLevels: {
      high: string;
      medium: string;
      low: string;
    };
    additionalInfo: string;
    totalEvents: string;
    userAgent: string;
    showJson: string;
    hideJson: string;
    jsonCopied: string;
    visitorHistoryTitle: string;
    historyEmpty: string;
  };
  map: {
    loading: string;
    unknownLocation: string;
  };
  historyTable: {
    visitorId: string;
    ipAddress: string;
    requestId: string;
    date: string;
  };
  common: {
    unknown: string;
  };
};

const DEVICE_TRANSLATIONS: Record<Language, DeviceInfoTranslations> = {
  en: {
    pageTitle: "Device information",
    breadcrumb: "Device information",
    subtitle: (count) => `${count} events matching`,
    reloadButton: {
      default: "Reload data",
      loading: "Loading...",
    },
    errors: {
      geolocationUnsupported: "Geolocation is not supported by your browser",
      permissionDenied: "Location permission denied. Please allow location access to generate events.",
      positionUnavailable: "Location unavailable. Please check your device settings.",
      timeout: "Location request timeout. Please try again.",
      default: "Failed to generate event. Please try again.",
    },
    table: {
      visitorId: "VISITOR ID",
      ipAddress: "IP ADDRESS",
      requestId: "REQUEST ID",
      date: "DATE",
      empty: "No events found. Click \"Reload data\" to generate an identification event.",
      noEvents: "No history found for this visitor.",
    },
    modal: {
      close: "Close",
      detailsTab: "Details",
      historyTab: (count) => `Visitor history ${count}`,
      identification: "Identification",
      visitorId: "Visitor ID",
      lastSeen: "Last seen",
      firstSeen: "First seen",
      confidence: "Confidence",
      incognito: "Replayed",
      yes: "Yes",
      no: "No",
      client: "Client",
      browser: "Browser",
      os: "Operating system",
      device: "Device",
      location: "Location",
      ipAddress: "IP address",
      city: "City",
      region: "Region",
      country: "Country",
      continent: "Continent",
      timezone: "Timezone",
      asn: "ASN",
      vpn: "VPN",
      proxy: "Proxy",
      highActivity: "High activity",
      suspectScore: "Suspect Score",
      suspectLevels: {
        high: "High",
        medium: "Medium",
        low: "Low",
      },
      additionalInfo: "Additional Information",
      totalEvents: "Total Events",
      userAgent: "User Agent",
      showJson: "Show JSON",
      hideJson: "Hide JSON",
      jsonCopied: "JSON copied to clipboard!",
      visitorHistoryTitle: "Visitor History",
      historyEmpty: "No history found for this visitor.",
    },
    map: {
      loading: "Loading map...",
      unknownLocation: "Unknown",
    },
    historyTable: {
      visitorId: "VISITOR ID",
      ipAddress: "IP ADDRESS",
      requestId: "REQUEST ID",
      date: "DATE",
    },
    common: {
      unknown: "Unknown",
    },
  },
  es: {
    pageTitle: "Información del dispositivo",
    breadcrumb: "Información del dispositivo",
    subtitle: (count) => `${count} eventos coinciden`,
    reloadButton: {
      default: "Recargar datos",
      loading: "Cargando...",
    },
    errors: {
      geolocationUnsupported: "Tu navegador no soporta geolocalización",
      permissionDenied: "Permiso de ubicación denegado. Permite el acceso para generar eventos.",
      positionUnavailable: "Ubicación no disponible. Revisa la configuración de tu dispositivo.",
      timeout: "La solicitud de ubicación excedió el tiempo. Intenta nuevamente.",
      default: "No se pudo generar el evento. Intenta nuevamente.",
    },
    table: {
      visitorId: "ID DEL VISITANTE",
      ipAddress: "DIRECCIÓN IP",
      requestId: "ID DE SOLICITUD",
      date: "FECHA",
      empty: "No se encontraron eventos. Haz clic en \"Recargar datos\" para generar un evento.",
      noEvents: "No se encontró historial para este visitante.",
    },
    modal: {
      close: "Cerrar",
      detailsTab: "Detalles",
      historyTab: (count) => `Historial del visitante ${count}`,
      identification: "Identificación",
      visitorId: "ID del visitante",
      lastSeen: "Última vez visto",
      firstSeen: "Primera vez visto",
      confidence: "Confianza",
      incognito: "Modo incógnito",
      yes: "Sí",
      no: "No",
      client: "Cliente",
      browser: "Navegador",
      os: "Sistema operativo",
      device: "Dispositivo",
      location: "Ubicación",
      ipAddress: "Dirección IP",
      city: "Ciudad",
      region: "Región",
      country: "País",
      continent: "Continente",
      timezone: "Zona horaria",
      asn: "ASN",
      vpn: "VPN",
      proxy: "Proxy",
      highActivity: "Actividad alta",
      suspectScore: "Índice sospechoso",
      suspectLevels: {
        high: "Alto",
        medium: "Medio",
        low: "Bajo",
      },
      additionalInfo: "Información adicional",
      totalEvents: "Eventos totales",
      userAgent: "Agente de usuario",
      showJson: "Ver JSON",
      hideJson: "Ocultar JSON",
      jsonCopied: "¡JSON copiado al portapapeles!",
      visitorHistoryTitle: "Historial del visitante",
      historyEmpty: "No se encontró historial para este visitante.",
    },
    map: {
      loading: "Cargando mapa...",
      unknownLocation: "Desconocido",
    },
    historyTable: {
      visitorId: "ID DEL VISITANTE",
      ipAddress: "DIRECCIÓN IP",
      requestId: "ID DE SOLICITUD",
      date: "FECHA",
    },
    common: {
      unknown: "Desconocido",
    },
  },
};

export function useDeviceInfoTranslations() {
  return useLanguageTranslations(DEVICE_TRANSLATIONS);
}
