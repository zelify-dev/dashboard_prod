"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type DeviceInfoTranslations = {
  pageTitle: string;
  breadcrumb: string;
  pageDescription: string;
  subtitle: (count: number) => string;
  subtitleGlobal: (count: number) => string;
  viewDevicesFor: string;
  filterByUser: string;
  globalView: string;
  myDevices: string;
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
    user: string;
    device: string;
    risk: string;
    location: string;
    actions: string;
    empty: string;
    noEvents: string;
    searchPlaceholder: string;
  };
  modal: {
    close: string;
    detailsTab: string;
    historyTab: (count: number) => string;
    identification: string;
    technicalRadiography: string;
    securityAnalysis: string;
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
    impossibleTravel: string;
    impossibleTravelDesc: string;
    riskDetected: string;
    safe: string;
    isp: string;
    fingerprint: string;
    userProfile: string;
    revokeSession: string;
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
    copy: string;
    copied: string;
  };
};

const DEVICE_TRANSLATIONS: Record<Language, DeviceInfoTranslations> = {
  en: {
    pageTitle: "Device information",
    breadcrumb: "Device information",
    pageDescription: "View device and geolocation data for users of your application.",
    subtitle: (count) => `${count} events matching`,
    subtitleGlobal: (count) => `${count} total organization snapshot(s)`,
    viewDevicesFor: "View devices for",
    filterByUser: "Filter by user",
    globalView: "Global Organization Access",
    myDevices: "My devices",
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
      user: "USER",
      device: "DEVICE",
      risk: "RISK/VPN",
      location: "LOCATION",
      actions: "ACTIONS",
      empty: "No events found. Click \"Reload data\" to generate an identification event.",
      noEvents: "No history found for this visitor.",
      searchPlaceholder: "Search by Name, Email or IP...",
    },
    modal: {
      close: "Close",
      detailsTab: "Details",
      historyTab: (count) => `Visitor history ${count}`,
      identification: "Identification",
      technicalRadiography: "Technical Radiography",
      securityAnalysis: "Security Analysis",
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
      vpn: "VPN detected",
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
      impossibleTravel: "Impossible Travel Detected",
      impossibleTravelDesc: "Distance between snapshots is too large for the elapsed time.",
      riskDetected: "Risk Detected",
      safe: "Safe / No VPN",
      isp: "ISP / Provider",
      fingerprint: "Device Fingerprint",
      userProfile: "User Profile",
      revokeSession: "Revoke Session",
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
      copy: "Copy",
      copied: "Copied!",
    },
  },
  es: {
    pageTitle: "Información del dispositivo",
    breadcrumb: "Información del dispositivo",
    pageDescription: "Consulta dispositivos y geolocalización de los usuarios de tu aplicación.",
    subtitle: (count) => `${count} eventos coinciden`,
    subtitleGlobal: (count) => `${count} registro(s) totales de la organización`,
    viewDevicesFor: "Ver dispositivos de",
    filterByUser: "Filtrar por usuario",
    globalView: "Acceso Global de la Organización",
    myDevices: "Mis dispositivos",
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
      user: "USUARIO",
      device: "DISPOSITIVO",
      risk: "RIESGO/VPN",
      location: "UBICACIÓN",
      actions: "ACCIONES",
      empty: "No se encontraron eventos. Haz clic en \"Recargar datos\" para generar un evento.",
      noEvents: "No se encontró historial para este visitante.",
      searchPlaceholder: "Buscar por Nombre, Email o IP...",
    },
    modal: {
      close: "Cerrar",
      detailsTab: "Detalles",
      historyTab: (count) => `Historial del visitante ${count}`,
      identification: "Identificación",
      technicalRadiography: "Radiografía Técnica",
      securityAnalysis: "Análisis de Seguridad",
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
      vpn: "VPN detectada",
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
      impossibleTravel: "Viaje Imposible Detectado",
      impossibleTravelDesc: "La distancia entre registros es demasiado grande para el tiempo transcurrido.",
      riskDetected: "Riesgo Detectado",
      safe: "Seguro / Sin VPN",
      isp: "ISP / Proveedor",
      fingerprint: "Fingerprint del Dispositivo",
      userProfile: "Perfil de Usuario",
      revokeSession: "Revocar Sesión",
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
      copy: "Copiar",
      copied: "¡Copiado!",
    },
  },
};

export function useDeviceInfoTranslations() {
  return useLanguageTranslations(DEVICE_TRANSLATIONS);
}
