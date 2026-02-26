"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDeviceInfoTranslations } from "./use-device-info-translations";

// Fix para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationMapProps {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  ipAddress?: string;
}

// Función para obtener coordenadas aproximadas por país
function getCountryCoordinates(country?: string): { lat: number; lng: number } | null {
  const countryCoords: Record<string, { lat: number; lng: number }> = {
    "United States": { lat: 39.8283, lng: -98.5795 },
    "Ecuador": { lat: -1.8312, lng: -78.1834 },
    "Mexico": { lat: 23.6345, lng: -102.5528 },
    "Colombia": { lat: 4.5709, lng: -74.2973 },
    "Argentina": { lat: -38.4161, lng: -63.6167 },
    "Brazil": { lat: -14.235, lng: -51.9253 },
    "Chile": { lat: -35.6751, lng: -71.543 },
    "Spain": { lat: 40.4637, lng: -3.7492 },
    "Germany": { lat: 51.1657, lng: 10.4515 },
    "France": { lat: 46.2276, lng: 2.2137 },
    "United Kingdom": { lat: 55.3781, lng: -3.436 },
    "Canada": { lat: 56.1304, lng: -106.3468 },
  };

  if (!country) return null;
  return countryCoords[country] || null;
}

// Función para geocodificación inversa usando ip-api.com (gratis, sin API key)
async function geocodeIP(ipAddress: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // ip-api.com permite 45 requests por minuto sin API key
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,lat,lon`);
    const data = await response.json();
    if (data.status === "success" && data.lat && data.lon) {
      return {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
}

export function LocationMap({ latitude, longitude, city, country, ipAddress }: LocationMapProps) {
  const translations = useDeviceInfoTranslations();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Determinar coordenadas
    const determineCoordinates = async () => {
      // Si ya tenemos coordenadas exactas, usarlas
      if (latitude && longitude) {
        setCoords({ lat: latitude, lng: longitude });
        setIsLoading(false);
        return;
      }

      // Intentar obtener coordenadas del país
      const countryCoords = getCountryCoordinates(country);
      if (countryCoords) {
        setCoords(countryCoords);
        setIsLoading(false);
        return;
      }

      // Si tenemos IP, intentar geocodificación inversa
      if (ipAddress && ipAddress !== "Unknown") {
        const geocoded = await geocodeIP(ipAddress);
        if (geocoded) {
          setCoords(geocoded);
          setIsLoading(false);
          return;
        }
      }

      // Coordenadas por defecto (centro del mundo)
      setCoords({ lat: 20, lng: 0 });
      setIsLoading(false);
    };

    determineCoordinates();
  }, [latitude, longitude, country, ipAddress]);

  useEffect(() => {
    if (!mapContainerRef.current || !coords || isLoading) return;

    const lat = coords.lat;
    const lng = coords.lng;
    const hasExactCoords = latitude && longitude;

    // Inicializar el mapa solo una vez
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], hasExactCoords ? 10 : 4);

      // Agregar capa de OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Agregar o actualizar marcador
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(
        `<div class="text-sm">
          <p class="font-semibold">${city || translations.common.unknown}, ${country || translations.common.unknown}</p>
          ${ipAddress ? `<p class="text-gray-600">${ipAddress}</p>` : ""}
        </div>`
      );
    } else {
      markerRef.current = L.marker([lat, lng])
        .addTo(mapRef.current)
        .bindPopup(
          `<div class="text-sm">
            <p class="font-semibold">${city || translations.common.unknown}, ${country || translations.common.unknown}</p>
            ${ipAddress ? `<p class="text-gray-600">${ipAddress}</p>` : ""}
          </div>`
        );
    }

    // Ajustar la vista al marcador
    mapRef.current.setView([lat, lng], hasExactCoords ? 10 : 4);

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [coords, isLoading, city, country, ipAddress, latitude, longitude]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-xs text-dark-6 dark:text-dark-6">{translations.map.loading}</p>
        </div>
      </div>
    );
  }

  return <div ref={mapContainerRef} className="h-full w-full rounded-lg" style={{ minHeight: "256px" }} />;
}
