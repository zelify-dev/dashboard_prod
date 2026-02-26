"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type GeolocalizationTranslations = {
  pageTitle: string;
  breadcrumb: string;
  integrateButton: string;
  description: string;
  apiLabel: string;
  form: {
    coordinatesLabel: string;
    placeholder: string;
    search: string;
    searching: string;
    formatHint: string;
    errors: {
      invalidFormat: string;
      latRange: string;
      lngRange: string;
      notFound: string;
      fetchFailed: string;
    };
  };
  highlightLabel: string;
  sections: {
    locationDetails: string;
    additionalInformation: string;
    technicalDetails: string;
    jsonData: string;
  };
  infoLabels: {
    country: string;
    state: string;
    city: string;
    mainStreet: string;
    secondaryStreet: string;
    postalCode: string;
    countryCode: string;
    borough: string;
    suburb: string;
    neighbourhood: string;
    quarter: string;
    continent: string;
    politicalUnion: string;
    type: string;
    category: string;
    isoA2: string;
    isoA3: string;
  };
  copyButton: {
    copy: string;
    copied: string;
  };
  locationHighlight: string;
  instructions: string;
  permissionModal: {
    title: string;
    description: string;
    whileUsing: string;
    onlyOnce: string;
    dontAllow: string;
  };
};

const GEO_TRANSLATIONS: Record<Language, GeolocalizationTranslations> = {
  en: {
    pageTitle: "Geolocalization",
    breadcrumb: "Geolocalization",
    integrateButton: "Integrate with Zelify API",
    description: "Enter coordinates (latitude, longitude) to get detailed location information",
    apiLabel: "Integrate with Zelify API",
    instructions: "Enter coordinates (latitude, longitude) to get detailed location information",
    form: {
      coordinatesLabel: "Coordinates",
      placeholder: "-0.17630197947865153, -78.47928775338583",
      search: "Search",
      searching: "Searching...",
      formatHint: "Format: latitude, longitude (separated by comma)",
      errors: {
        invalidFormat: "Please enter valid coordinates in the format: latitude, longitude (e.g., 52.5200, 13.4050)",
        latRange: "Latitude must be between -90 and 90",
        lngRange: "Longitude must be between -180 and 180",
        notFound: "Location not found for the provided coordinates",
        fetchFailed: "Error fetching location data. Please try again.",
      },
    },
    highlightLabel: "Formatted Address",
    sections: {
      locationDetails: "Location Details",
      additionalInformation: "Additional Information",
      technicalDetails: "Technical Details",
      jsonData: "JSON Data",
    },
    infoLabels: {
      country: "Country",
      state: "State / Province",
      city: "City",
      mainStreet: "Main Street",
      secondaryStreet: "Secondary Street",
      postalCode: "Postal Code",
      countryCode: "Country Code",
      borough: "Borough",
      suburb: "Suburb",
      neighbourhood: "Neighbourhood",
      quarter: "Quarter",
      continent: "Continent",
      politicalUnion: "Political Union",
      type: "Type",
      category: "Category",
      isoA2: "ISO 3166-1 α-2",
      isoA3: "ISO 3166-1 α-3",
    },
    copyButton: {
      copy: "Copy JSON",
      copied: "Copied!",
    },
    locationHighlight: "Formatted Address",
    permissionModal: {
      title: "Allow \"Zelify\" to access your location?",
      description: "This app indicated that it may share location data with third parties",
      whileUsing: "While using the app",
      onlyOnce: "Only this time",
      dontAllow: "Don't allow",
    },
  },
  es: {
    pageTitle: "Geolocalización",
    breadcrumb: "Geolocalización",
    integrateButton: "Integrar con la API de Zelify",
    description: "Ingresa coordenadas (latitud, longitud) para obtener información detallada de la ubicación",
    apiLabel: "Integrar con la API de Zelify",
    instructions: "Ingresa coordenadas (latitud, longitud) para obtener información detallada de la ubicación",
    form: {
      coordinatesLabel: "Coordenadas",
      placeholder: "-0.17630197947865153, -78.47928775338583",
      search: "Buscar",
      searching: "Buscando...",
      formatHint: "Formato: latitud, longitud (separadas por coma)",
      errors: {
        invalidFormat: "Por favor ingresa coordenadas válidas en el formato: latitud, longitud (ej., 52.5200, 13.4050)",
        latRange: "La latitud debe estar entre -90 y 90",
        lngRange: "La longitud debe estar entre -180 y 180",
        notFound: "No se encontró una ubicación para las coordenadas proporcionadas",
        fetchFailed: "Error al obtener los datos de ubicación. Intenta nuevamente.",
      },
    },
    highlightLabel: "Dirección formateada",
    sections: {
      locationDetails: "Detalles de la ubicación",
      additionalInformation: "Información adicional",
      technicalDetails: "Detalles técnicos",
      jsonData: "Datos JSON",
    },
    infoLabels: {
      country: "País",
      state: "Estado / Provincia",
      city: "Ciudad",
      mainStreet: "Calle principal",
      secondaryStreet: "Calle secundaria",
      postalCode: "Código postal",
      countryCode: "Código de país",
      borough: "Municipio",
      suburb: "Suburbio",
      neighbourhood: "Barrio",
      quarter: "Distrito",
      continent: "Continente",
      politicalUnion: "Unión política",
      type: "Tipo",
      category: "Categoría",
      isoA2: "ISO 3166-1 α-2",
      isoA3: "ISO 3166-1 α-3",
    },
    copyButton: {
      copy: "Copiar JSON",
      copied: "¡Copiado!",
    },
    locationHighlight: "Dirección formateada",
    permissionModal: {
      title: "¿Permitir que \"Zelify\" acceda a tu ubicación?",
      description: "Esta app indicó que puede compartir datos de ubicación con terceros",
      whileUsing: "Mientras usas la app",
      onlyOnce: "Solo esta vez",
      dontAllow: "No permitir",
    },
  },
};

export function useGeolocalizationTranslations() {
  return useLanguageTranslations(GEO_TRANSLATIONS);
}
