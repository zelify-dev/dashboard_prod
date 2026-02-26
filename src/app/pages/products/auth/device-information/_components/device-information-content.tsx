"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useDeviceInfoTranslations } from "./use-device-info-translations";
import { useTour } from "@/contexts/tour-context";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

// Importar el mapa dinámicamente
const LocationMap = dynamic(
  () => import("./location-map").then((mod) => ({ default: mod.LocationMap })),
  { ssr: false }
);

interface DeviceDetails {
  browserName: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  userAgent: string;
  confidence: number;
  incognito: boolean;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  continent?: string;
  region?: string;
  asn?: string | undefined;
  asnName?: string | undefined;
  vpn?: boolean | undefined;
  proxy?: boolean | undefined;
  highActivity?: boolean | undefined;
  suspectScore?: number | undefined;
}

interface IdentificationEvent {
  id: string;
  visitorId: string;
  ipAddress: string;
  countryCode?: string;
  country?: string;
  city?: string;
  requestId: string;
  date: string;
  timestamp: number;
  details?: DeviceDetails;
}

const STORAGE_KEY = "device_info_events";

// Función para obtener bandera del país (emoji)
function getCountryFlag(countryCode?: string): string {
  if (!countryCode) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Función para generar un ID aleatorio
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Función para generar un requestId
function generateRequestId(): string {
  return `${Date.now()}.${Math.random().toString(36).substring(2, 8)}`;
}

// Función para obtener la IP real del usuario
async function getRealIPAddress(): Promise<string> {
  try {
    // Intentar con ipify (simple y rápido)
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "Unknown";
  } catch (error) {
    console.error("Error getting IP address:", error);
    // Fallback a otra API
    try {
      const response = await fetch("https://api64.ipify.org?format=json");
      const data = await response.json();
      return data.ip || "Unknown";
    } catch (fallbackError) {
      console.error("Error getting IP address (fallback):", fallbackError);
      return "Unknown";
    }
  }
}

// Función para obtener información de geolocalización usando Nominatim
async function getLocationInfo(lat: number, lng: number, ipAddress: string): Promise<{
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  continent?: string;
  ipAddress: string;
}> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
    );
    const data = await response.json();

    // Mapear continentes por país
    const continentMap: Record<string, string> = {
      "US": "North America", "CA": "North America", "MX": "North America",
      "EC": "South America", "CO": "South America", "AR": "South America", "BR": "South America", "CL": "South America",
      "ES": "Europe", "DE": "Europe", "FR": "Europe", "GB": "Europe", "IT": "Europe",
      "CN": "Asia", "JP": "Asia", "IN": "Asia", "KR": "Asia",
      "AU": "Oceania", "NZ": "Oceania",
      "ZA": "Africa", "EG": "Africa", "NG": "Africa",
    };

    const countryCode = data.address?.country_code?.toUpperCase();

    return {
      country: data.address?.country,
      countryCode: countryCode,
      city: data.address?.city || data.address?.town || data.address?.village,
      region: data.address?.state || data.address?.region,
      continent: continentMap[countryCode || ""] || "Unknown",
      ipAddress: ipAddress, // Usar la IP real obtenida
    };
  } catch (error) {
    console.error("Error getting location info:", error);
    return {
      ipAddress: ipAddress, // Usar la IP real incluso si falla la geolocalización
    };
  }
}

// Función para detectar información real del navegador
function getRealDeviceDetails(lat?: number, lng?: number): DeviceDetails {
  const userAgent = navigator.userAgent;

  // Detectar navegador
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  // Edge debe detectarse primero porque su user agent incluye "Chrome"
  if (userAgent.includes("Edg/")) {
    browserName = "Edge";
    const match = userAgent.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }
  // Safari debe detectarse antes de Chrome porque Safari incluye "Chrome" en su user agent
  else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && !userAgent.includes("Edg/")) {
    browserName = "Safari";
    const match = userAgent.match(/Version\/(\d+(?:\.\d+)?)/);
    browserVersion = match ? match[1] : "Unknown";
  }
  // Chrome
  else if (userAgent.includes("Chrome/") && !userAgent.includes("Edg/")) {
    browserName = "Chrome";
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }
  // Firefox
  else if (userAgent.includes("Firefox/")) {
    browserName = "Firefox";
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }
  // Opera
  else if (userAgent.includes("Opera/") || userAgent.includes("OPR/")) {
    browserName = "Opera";
    const match = userAgent.match(/(?:Opera|OPR)\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }

  // Detectar OS
  let os = "Unknown";
  let osVersion = "Unknown";

  if (userAgent.includes("Mac OS X")) {
    os = "Mac OS X";
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    if (match) {
      osVersion = match[1].replace("_", ".");
    } else {
      osVersion = "Unknown";
    }
  } else if (userAgent.includes("Windows NT")) {
    os = "Windows";
    const match = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (match) {
      const version = match[1];
      const versionMap: Record<string, string> = {
        "10.0": "10/11",
        "6.3": "8.1",
        "6.2": "8",
        "6.1": "7",
      };
      osVersion = versionMap[version] || version;
    } else {
      osVersion = "Unknown";
    }
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
    osVersion = "Unknown";
  } else if (userAgent.includes("Android")) {
    os = "Android";
    const match = userAgent.match(/Android (\d+(?:\.\d+)?)/);
    osVersion = match ? match[1] : "Unknown";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = userAgent.includes("iPad") ? "iPadOS" : "iOS";
    const match = userAgent.match(/OS (\d+[._]\d+)/);
    if (match) {
      osVersion = match[1].replace("_", ".");
    } else {
      osVersion = "Unknown";
    }
  }

  // Detectar tipo de dispositivo
  let device = "Desktop";
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  const isTablet = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent);

  if (isTablet) {
    device = "Tablet";
  } else if (isMobile) {
    device = "Mobile";
  } else {
    device = "Desktop";
  }

  // Detectar modo incógnito (limitado, no siempre funciona)
  let incognito = false;
  try {
    // Safari en modo privado
    if (browserName === "Safari") {
      try {
        localStorage.setItem("__test_incognito__", "1");
        localStorage.removeItem("__test_incognito__");
      } catch {
        incognito = true;
      }
    }
    // Chrome/Edge en modo incógnito
    if (browserName === "Chrome" || browserName === "Edge") {
      // @ts-ignore - webdriver puede indicar modo incógnito
      if (navigator.webdriver) {
        incognito = true;
      }
    }
  } catch {
    // Si no se puede detectar, asumir false
    incognito = false;
  }

  // Obtener timezone real
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    browserName,
    browserVersion,
    os,
    osVersion,
    device,
    userAgent,
    confidence: 100, // Confianza alta ya que son datos reales
    incognito,
    latitude: lat,
    longitude: lng,
    timezone,
    continent: "Unknown", // Se llenará después con datos de geolocalización
    region: "Unknown", // Se llenará después con datos de geolocalización
    // No mostrar ASN si no es real
    asn: undefined,
    asnName: undefined,
    // No mostrar VPN/Proxy si no podemos detectarlo realmente
    vpn: undefined,
    proxy: undefined,
    highActivity: undefined,
    suspectScore: undefined,
  };
}

// Función para cargar eventos desde localStorage
function loadEvents(): IdentificationEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Función para guardar eventos en localStorage
function saveEvents(events: IdentificationEvent[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error("Failed to save events:", error);
  }
}

// Componente Modal de Detalles
function DeviceDetailsModal({
  event,
  onClose,
  allEvents,
}: {
  event: IdentificationEvent;
  onClose: () => void;
  allEvents: IdentificationEvent[];
}) {
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [showJSON, setShowJSON] = useState(false);
  const translations = useDeviceInfoTranslations();
  const formatUnknown = (value?: string | number | null) => {
    if (value === undefined || value === null || value === "" || value === "Unknown") {
      return translations.common.unknown;
    }
    return value;
  };

  const details = event.details || getRealDeviceDetails();
  const relatedEvents = allEvents.filter((e) => e.visitorId === event.visitorId);
  const firstSeen = relatedEvents.length > 0
    ? Math.min(...relatedEvents.map((e) => e.timestamp))
    : event.timestamp;
  const lastSeen = event.timestamp;

  const lastSeenAgo = dayjs(lastSeen).fromNow();
  const firstSeenAgo = dayjs(firstSeen).fromNow();

  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      alert(translations.modal.jsonCopied);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const { isTourActive, currentStep, steps } = useTour();
  const currentStepData = steps[currentStep];
  const isModalTarget = isTourActive && currentStepData?.target === "tour-device-information-modal";

  // Ensure we are on the client
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 flex items-center justify-center bg-black/50 p-4", isModalTarget ? "z-[110]" : "z-50")}
      onClick={(e) => {
        // No cerrar el modal si está en el tour
        if (isModalTarget) {
          return;
        }
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={cn("relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-dark-2", isModalTarget && "z-[111]")}>
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-stroke bg-white px-6 py-4 dark:border-dark-3 dark:bg-dark-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-dark dark:text-white">{event.requestId}</span>
                  <span className="text-sm text-dark-6 dark:text-dark-6">
                    {dayjs(event.timestamp).format("DD MMM YYYY HH:mm")}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {details.vpn !== undefined && details.vpn && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {translations.modal.vpn}
                    </span>
                  )}
                  {details.proxy !== undefined && details.proxy && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                      {translations.modal.proxy}
                    </span>
                  )}
                  {details.highActivity !== undefined && details.highActivity && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      {translations.modal.highActivity}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJSON(!showJSON)}
                className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
              >
                {showJSON ? translations.modal.hideJson : translations.modal.showJson}
              </button>
              <button
                onClick={onClose}
                className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-4 border-b border-stroke dark:border-dark-3">
            <button
              onClick={() => setActiveTab("details")}
              className={`pb-2 text-sm font-medium transition ${activeTab === "details"
                ? "border-b-2 border-primary text-primary"
                : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
                }`}
            >
              {translations.modal.detailsTab}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-2 text-sm font-medium transition ${activeTab === "history"
                ? "border-b-2 border-primary text-primary"
                : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
                }`}
            >
              {translations.modal.historyTab(relatedEvents.length)}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "details" ? (
            <div className="space-y-6">
              {/* Device Information Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Identification */}
                <div className="rounded-lg border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2" data-tour-id="tour-device-information-modal">
                  <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">{translations.modal.identification}</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        {translations.modal.visitorId}
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-dark dark:text-white">
                        {event.visitorId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        {translations.modal.lastSeen}
                      </p>
                      <p className="mt-1 text-sm text-dark dark:text-white">{lastSeenAgo}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        {translations.modal.firstSeen}
                      </p>
                      <p className="mt-1 text-sm text-dark dark:text-white">{firstSeenAgo}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        {translations.modal.confidence}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-dark dark:text-white">{details.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        {translations.modal.incognito}
                      </p>
                      <p className="mt-1 text-sm text-dark dark:text-white">
                        {details.incognito ? translations.modal.yes : translations.modal.no}
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        {translations.modal.client}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-dark-6 dark:text-dark-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <span className="text-sm text-dark dark:text-white">
                            {translations.modal.browser}: {details.browserName} {details.browserVersion}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-dark-6 dark:text-dark-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-dark dark:text-white">
                            {translations.modal.os}: {details.os} {details.osVersion}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-dark-6 dark:text-dark-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-dark dark:text-white">
                            {translations.modal.device}: {details.device}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="rounded-lg border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
                  <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">{translations.modal.location}</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        {translations.modal.ipAddress}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-lg">{getCountryFlag(event.countryCode)}</span>
                        <span className="font-mono text-sm font-semibold text-dark dark:text-white">
                          {event.ipAddress}
                        </span>
                      </div>
                    </div>
                    <div className="h-64 rounded-lg border border-stroke bg-gray-100 dark:border-dark-3 dark:bg-dark-3 overflow-hidden">
                      <LocationMap
                        latitude={details.latitude}
                        longitude={details.longitude}
                        city={event.city}
                        country={event.country}
                        ipAddress={event.ipAddress}
                      />
                    </div>
                    <div className="space-y-1 text-xs text-dark-6 dark:text-dark-6">
                      {event.city && <div>{translations.modal.city}: {event.city}</div>}
                      {details.region && (
                        <div>
                          {translations.modal.region}: {formatUnknown(details.region)}
                        </div>
                      )}
                      {event.country && (
                        <div>
                          {translations.modal.country}: {formatUnknown(event.country)} ({event.countryCode})
                        </div>
                      )}
                      {details.continent && (
                        <div>
                          {translations.modal.continent}: {formatUnknown(details.continent)}
                        </div>
                      )}
                      {details.timezone && (
                        <div>
                          {translations.modal.timezone}: {formatUnknown(details.timezone)}
                        </div>
                      )}
                    </div>
                    {details.asn && details.asnName && (
                      <div className="mt-2 text-xs text-dark-6 dark:text-dark-6">
                        <div>
                          {translations.modal.asn}: {details.asn} - {details.asnName}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Smart Signals */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Suspect Score - Solo mostrar si hay datos */}
                {details.suspectScore !== undefined && (
                  <div className="rounded-lg border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
                    <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">{translations.modal.suspectScore}</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-dark dark:text-white">{details.suspectScore}</span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${details.suspectScore >= 50
                            ? "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
                            : details.suspectScore >= 25
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                        >
                          {details.suspectScore >= 50
                            ? translations.modal.suspectLevels.high
                            : details.suspectScore >= 25
                              ? translations.modal.suspectLevels.medium
                              : translations.modal.suspectLevels.low}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-dark-3">
                          <div
                            className={`h-2 rounded-full ${details.suspectScore >= 50 ? "bg-red-500" : details.suspectScore >= 25 ? "bg-orange-500" : "bg-green-500"
                              }`}
                            style={{ width: `${Math.min(details.suspectScore, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="rounded-lg border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
                  <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">{translations.modal.additionalInfo}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark dark:text-white">{translations.modal.totalEvents}</span>
                      <span className="font-semibold text-dark dark:text-white">{relatedEvents.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark dark:text-white">{translations.modal.userAgent}</span>
                      <span className="text-xs text-dark-6 dark:text-dark-6 truncate max-w-[200px]" title={details.userAgent}>
                        {details.userAgent}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">{translations.modal.visitorHistoryTitle}</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2">
                      <TableHead>{translations.historyTable.visitorId}</TableHead>
                      <TableHead>{translations.historyTable.ipAddress}</TableHead>
                      <TableHead>{translations.historyTable.requestId}</TableHead>
                      <TableHead>{translations.historyTable.date}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-dark-6 dark:text-dark-6">
                          {translations.modal.historyEmpty}
                        </TableCell>
                      </TableRow>
                    ) : (
                      relatedEvents.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium text-dark dark:text-white">
                            {e.visitorId}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCountryFlag(e.countryCode)}</span>
                              <span className="text-dark dark:text-white">{e.ipAddress}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-dark dark:text-white">{e.requestId}</TableCell>
                          <TableCell className="text-dark dark:text-white">{e.date}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* JSON View */}
        {showJSON && (
          <div className="border-t border-stroke p-6 dark:border-dark-3">
            <div className="relative rounded-lg bg-gray-50 p-4 dark:bg-dark-3">
              <button
                onClick={copyJSON}
                className="absolute right-2 top-2 rounded p-1 hover:bg-gray-200 dark:hover:bg-dark-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <pre className="overflow-auto text-xs" style={{ maxHeight: "400px" }}>
                <code>{JSON.stringify(event, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function DeviceInformationContent() {
  const [events, setEvents] = useState<IdentificationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<IdentificationEvent | null>(null);
  const hasLoadedRef = useRef(false);
  const translations = useDeviceInfoTranslations();

  // Tour integration
  const { isTourActive, currentStep, steps } = useTour();

  // Log cuando selectedEvent cambia
  useEffect(() => {
    if (selectedEvent) {
      console.log("🎯 selectedEvent establecido:", selectedEvent.visitorId);
    } else {
      console.log("🎯 selectedEvent es null");
    }
  }, [selectedEvent]);

  // Función para generar un nuevo evento mockeado
  const handleReloadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Pedir permisos de geolocalización
      if (!navigator.geolocation) {
        throw new Error(translations.errors.geolocationUnsupported);
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      // Obtener IP real del usuario
      const realIP = await getRealIPAddress();

      // Obtener información de ubicación
      const locationInfo = await getLocationInfo(latitude, longitude, realIP);

      // Obtener detalles reales del dispositivo
      const deviceDetails = getRealDeviceDetails(latitude, longitude);
      deviceDetails.continent = locationInfo.continent;
      deviceDetails.region = locationInfo.region;

      // Generar datos mockeados
      const newEvent: IdentificationEvent = {
        id: generateId(),
        visitorId: generateId().toUpperCase(),
        ipAddress: locationInfo.ipAddress,
        countryCode: locationInfo.countryCode,
        country: locationInfo.country,
        city: locationInfo.city,
        requestId: generateRequestId(),
        date: dayjs().format("MM/DD/YYYY HH:mm:ss"),
        timestamp: Date.now(),
        details: deviceDetails,
      };

      // Agregar el nuevo evento
      setEvents((prevEvents) => {
        // Evitar duplicados basados en requestId
        const exists = prevEvents.some((e) => e.requestId === newEvent.requestId);
        if (exists) return prevEvents;

        const updated = [newEvent, ...prevEvents].slice(0, 100);
        saveEvents(updated);
        return updated;
      });

      // Log en consola
      console.log("=".repeat(80));
      console.log("📦 NUEVO EVENTO GENERADO:");
      console.log("=".repeat(80));
      console.log(JSON.stringify(newEvent, null, 2));
      console.log("=".repeat(80));
    } catch (err: any) {
      console.error("Error generating event:", err);
      if (err.code === 1) {
        setError(translations.errors.permissionDenied);
      } else if (err.code === 2) {
        setError(translations.errors.positionUnavailable);
      } else if (err.code === 3) {
        setError(translations.errors.timeout);
      } else {
        setError(err.message || translations.errors.default);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar eventos y solicitar geolocalización automáticamente al montar el componente
  useEffect(() => {
    // Prevenir doble ejecución (React Strict Mode en desarrollo)
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Cargar eventos guardados primero
    const savedEvents = loadEvents();
    setEvents(savedEvents);

    // Luego solicitar geolocalización automáticamente
    handleReloadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hacer clic automáticamente en el primer registro cuando el tour llegue al paso 13
  // Y abrir el modal cuando llegue al paso 14
  useEffect(() => {
    console.log("🔍 Device Information Tour Effect:", {
      isTourActive,
      currentStep,
      stepsLength: steps.length,
      eventsLength: events.length,
      currentStepData: steps[currentStep]
    });

    if (!isTourActive || steps.length === 0 || events.length === 0) {
      console.log("❌ Condiciones no cumplidas:", {
        isTourActive,
        stepsLength: steps.length,
        eventsLength: events.length
      });
      return;
    }

    const currentStepData = steps[currentStep];
    if (!currentStepData) {
      console.log("❌ No hay currentStepData");
      return;
    }

    console.log("✅ Condiciones cumplidas, procesando paso:", currentStep, currentStepData.id);

    // Paso 14 (device-information-first-row): Solo hacer clic, NO abrir el modal
    if (currentStepData.id === "device-information-first-row") {
      console.log("📝 Paso 14 (índice", currentStep, "): Seleccionando primer registro (NO abrir modal)...");
      // Prevenir que el clic abra el modal temporalmente
      // Hacer clic en el elemento, pero el modal NO debe abrirse todavía
      setTimeout(() => {
        const firstRow = document.querySelector('[data-tour-id="tour-device-information-first-row"]');
        if (firstRow) {
          console.log("🖱️ Haciendo clic en el primer registro (sin abrir modal)");
          // NO hacer clic aquí, solo preparar para el siguiente paso
          // El clic se hará en el paso 15
        } else {
          console.log("⚠️ No se encontró el primer registro");
        }
      }, 100);
    }

    // Paso 15 (device-information-modal): Abrir el modal cuando llegue a este paso
    if (currentStepData.id === "device-information-modal") {
      console.log("📝 Paso 15 (índice", currentStep, "): Abriendo modal...", events[0]);
      console.log("🔧 Llamando a setSelectedEvent con:", events[0]?.visitorId);

      // Primero hacer clic en el registro para que se seleccione
      setTimeout(() => {
        const firstRow = document.querySelector('[data-tour-id="tour-device-information-first-row"]');
        if (firstRow) {
          console.log("🖱️ Haciendo clic en el primer registro para abrir modal");
          (firstRow as HTMLElement).click();
        }
      }, 100);

      // Luego forzar la apertura del modal inmediatamente
      setSelectedEvent(events[0]);
      console.log("✅ setSelectedEvent llamado en paso 15");

      // Verificar múltiples veces que el modal esté abierto
      const checkModal = () => {
        const modal = document.querySelector('[data-tour-id="tour-device-information-modal"]');
        console.log("🔍 Verificando modal en DOM:", modal ? "✅ encontrado" : "❌ no encontrado");
        if (!modal && events.length > 0) {
          console.log("⚠️ Modal no encontrado, abriendo...");
          setSelectedEvent(events[0]);
        } else if (modal) {
          console.log("✅ Modal encontrado en el DOM");
        }
      };

      // Verificar inmediatamente
      setTimeout(checkModal, 200);
      // Verificar después de un delay
      setTimeout(checkModal, 600);
      // Verificar una vez más
      setTimeout(checkModal, 1200);
    }
  }, [isTourActive, currentStep, steps, events]);

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2" data-tour-id="tour-device-information">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-dark dark:text-white">
              {translations.pageTitle}
            </h2>
            <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
              {translations.subtitle(events.length)}
            </p>
          </div>
          <button
            onClick={handleReloadData}
            disabled={isLoading}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? translations.reloadButton.loading : translations.reloadButton.default}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* Events Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow
                className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:font-semibold [&>th]:text-dark [&>th]:dark:text-white"
                data-tour-id="tour-device-information-table"
              >
                <TableHead className="min-w-[200px]">{translations.table.visitorId}</TableHead>
                <TableHead className="min-w-[180px]">{translations.table.ipAddress}</TableHead>
                <TableHead className="min-w-[200px]">{translations.table.requestId}</TableHead>
                <TableHead className="min-w-[180px]">{translations.table.date}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-dark-6 dark:text-dark-6">
                    {translations.table.empty}
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event, index) => {
                  const isFirstRow = index === 0;
                  const currentStepData = steps[currentStep];
                  const isStep14 = isTourActive && currentStepData?.id === "device-information-first-row";

                  return (
                    <TableRow
                      key={event.id}
                      onClick={() => {
                        // En el paso 14, NO abrir el modal todavía
                        if (isStep14 && isFirstRow) {
                          console.log("🚫 Previniendo apertura del modal en paso 14");
                          return;
                        }
                        setSelectedEvent(event);
                      }}
                      className="cursor-pointer transition-colors hover:bg-gray-2 dark:hover:bg-dark-3"
                      data-tour-id={isFirstRow ? "tour-device-information-first-row" : undefined}
                    >
                      <TableCell className="font-medium text-dark dark:text-white">
                        {event.visitorId}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl" title={event.country || translations.common.unknown}>
                            {getCountryFlag(event.countryCode)}
                          </span>
                          <span className="font-mono text-sm text-dark dark:text-white">{event.ipAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-dark dark:text-white">
                        {event.requestId}
                      </TableCell>
                      <TableCell className="text-dark dark:text-white">
                        {event.date}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal */}
      {selectedEvent && (
        <DeviceDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          allEvents={events}
        />
      )}
    </div>
  );
}
