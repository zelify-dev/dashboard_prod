"use client";

import { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  Monitor,
  Tablet,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Clock,
  User,
  Copy,
  CheckCircle2,
  ExternalLink,
  Wifi,
  Navigation2,
  AlertTriangle,
  Info,
  Search,
  RotateCcw
} from "lucide-react";
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
import { formatLocalDateTime } from "@/lib/date-utils";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useDeviceInfoTranslations } from "./use-device-info-translations";
import { useTour } from "@/contexts/tour-context";
import { cn } from "@/lib/utils";
import { getStoredOrganization, getStoredUser, getStoredRoles, AuthError } from "@/lib/auth-api";
import { 
  getDeviceInfoNow, 
  listSnapshots, 
  getSnapshotDetail,
  getOrganizationUser,
  type SnapshotListItem,
  type DeviceSnapshotDetail,
  type DeviceSnapshot 
} from "@/lib/device-info-api";
import { TEAM_ROLE, userHasRole, isOwner } from "@/app/organization/teams/_constants/team-roles";

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
  city?: string;
  detectedIp?: string;
  clientIp?: string;
  fingerprint?: string;
}

interface IdentificationEvent {
  id: string;
  visitorId: string;
  ipAddress: string;
  countryCode?: string;
  country?: string;
  city?: string;
  os?: string;
  requestId: string;
  date: string;
  timestamp: number;
  details?: DeviceDetails;
  userName?: string;
  userEmail?: string;
  userId?: string;
  userStatus?: string;
  impossibleTravel?: boolean;
}

const STORAGE_KEY = "device_info_events";

function snapshotListItemToEvent(s: SnapshotListItem): IdentificationEvent {
  const timestamp = new Date(s.created_at).getTime();
  return {
    id: s.id,
    visitorId: s.id,
    ipAddress: s.client_ip,
    requestId: s.id,
    date: dayjs(s.created_at).format("DD/MMM, HH:mm[h]"),
    timestamp,
    userName: s.user?.full_name,
    userEmail: s.user?.email,
    userId: s.user?.id,
    city: s.city,
    os: s.os,
    details: {
      browserName: s.browser || "Unknown",
      os: s.os || "Unknown",
      device: s.device_type,
      browserVersion: "",
      osVersion: "",
      userAgent: "—",
      confidence: 0,
      incognito: false,
      city: s.city,
      clientIp: s.client_ip,
      vpn: s.vpn_detected,
    },
  };
}

function snapshotDetailToEvent(s: DeviceSnapshotDetail): IdentificationEvent {
  const timestamp = new Date(s.created_at).getTime();
  return {
    id: s.id,
    visitorId: s.id,
    ipAddress: s.client_ip,
    requestId: s.id,
    date: dayjs(s.created_at).format("DD/MMM, HH:mm[h]"),
    timestamp,
    userName: s.user?.full_name,
    userEmail: s.user?.email,
    userId: s.user?.id,
    city: s.city,
    os: s.os,
    countryCode: s.country_code,
    details: {
      browserName: s.browser || "Unknown",
      os: s.os || "Unknown",
      device: s.device_type,
      browserVersion: "",
      osVersion: "",
      userAgent: s.user_agent,
      confidence: 100,
      incognito: false,
      latitude: s.lat,
      longitude: s.lng,
      vpn: s.vpn_detected,
      region: s.region,
      asnName: s.isp,
      timezone: s.timezone,
      detectedIp: s.detected_ip,
      clientIp: s.client_ip,
      fingerprint: s.fingerprint,
    },
  };
}

/** Convierte un DeviceSnapshot heredado del API anterior (si queda alguno) */
function snapshotToEvent(s: DeviceSnapshot, userName?: string, userEmail?: string): IdentificationEvent {
  const timestamp = new Date(s.created_at).getTime();
  return {
    id: s.id,
    visitorId: s.id,
    ipAddress: s.client_ip,
    requestId: s.id,
    date: formatLocalDateTime(timestamp),
    timestamp,
    userName: userName,
    userEmail: userEmail,
    details: {
      browserName: "—",
      browserVersion: "—",
      os: "—",
      osVersion: "—",
      device: s.device_type,
      userAgent: "—",
      confidence: 0,
      incognito: false,
      latitude: s.lat ?? undefined,
      longitude: s.lng ?? undefined,
      vpn: s.vpn_detected,
    },
  };
}

/** Componente pequeño para copiar IP al portapapeles */
function CopyableIP({ ip, translations }: { ip: string; translations: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex items-center gap-2">
      <span className="font-mono text-sm text-dark-3 dark:text-dark-6">
        {ip}
      </span>
      <button
        onClick={handleCopy}
        className="opacity-0 transition-opacity group-hover:opacity-100 p-1 hover:bg-gray-2 dark:hover:bg-dark-3 rounded"
        title={translations.common.copy}
      >
        {copied ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-dark-6" />
        )}
      </button>
    </div>
  );
}

/** Lógica para calcular distancia entre dos puntos (Haversine formula) */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/** Detectar Viaje Imposible */
function detectImpossibleTravel(events: IdentificationEvent[]): IdentificationEvent[] {
  if (events.length < 2) return events;
  
  // Clonar y ordenar por tiempo ascendente para procesar
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    if (prev.details?.latitude && prev.details?.longitude && curr.details?.latitude && curr.details?.longitude) {
      const distance = calculateDistance(
        prev.details.latitude, prev.details.longitude,
        curr.details.latitude, curr.details.longitude
      );
      
      const timeDiffHours = (curr.timestamp - prev.timestamp) / (1000 * 60 * 60);
      
      // Si la velocidad requerida es > 1000 km/h, es "Imposible"
      if (timeDiffHours > 0 && (distance / timeDiffHours) > 1000) {
        curr.impossibleTravel = true;
      }
    }
  }
  
  return sorted;
}

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
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "Unknown";
  } catch (error) {
    console.error("Error getting IP address:", error);
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
      ipAddress: ipAddress,
    };
  } catch (error) {
    console.error("Error getting location info:", error);
    return {
      ipAddress: ipAddress,
    };
  }
}

// Función para detectar información real del navegador
function getRealDeviceDetails(lat?: number, lng?: number): DeviceDetails {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (userAgent.includes("Edg/")) {
    browserName = "Edge";
    const match = userAgent.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }
  else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && !userAgent.includes("Edg/")) {
    browserName = "Safari";
    const match = userAgent.match(/Version\/(\d+(?:\.\d+)?)/);
    browserVersion = match ? match[1] : "Unknown";
  }
  else if (userAgent.includes("Chrome/") && !userAgent.includes("Edg/")) {
    browserName = "Chrome";
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }
  else if (userAgent.includes("Firefox/")) {
    browserName = "Firefox";
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }
  else if (userAgent.includes("Opera/") || userAgent.includes("OPR/")) {
    browserName = "Opera";
    const match = userAgent.match(/(?:Opera|OPR)\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }

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

  let incognito = false;
  try {
    if (browserName === "Safari") {
      try {
        localStorage.setItem("__test_incognito__", "1");
        localStorage.removeItem("__test_incognito__");
      } catch {
        incognito = true;
      }
    }
    if (browserName === "Chrome" || browserName === "Edge") {
      // @ts-ignore
      if (navigator.webdriver) {
        incognito = true;
      }
    }
  } catch {
    incognito = false;
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    browserName,
    browserVersion,
    os,
    osVersion,
    device,
    userAgent,
    confidence: 100,
    incognito,
    latitude: lat,
    longitude: lng,
    timezone,
    continent: "Unknown",
    region: "Unknown",
    asn: undefined,
    asnName: undefined,
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
  isLoading,
}: {
  event: IdentificationEvent;
  onClose: () => void;
  allEvents: IdentificationEvent[];
  isLoading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [showJSON, setShowJSON] = useState(false);
  const translations = useDeviceInfoTranslations();
  const t = translations.modal;
  const ht = translations.historyTable;

  const details = event.details || getRealDeviceDetails();
  const relatedEvents = allEvents.filter((e) => e.visitorId === event.visitorId);
  const firstSeen = relatedEvents.length > 0
    ? Math.min(...relatedEvents.map((e) => e.timestamp))
    : event.timestamp;

  const lastSeenAgo = dayjs(event.timestamp).fromNow();
  const firstSeenAgo = dayjs(firstSeen).fromNow();

  const { isTourActive, currentStep, steps } = useTour();
  const currentStepData = steps[currentStep];
  const isModalTarget = isTourActive && currentStepData?.target === "tour-device-information-modal";

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all animate-in fade-in duration-300",
        isModalTarget ? "z-[110]" : "z-[100]"
      )}
      onClick={(e) => {
        if (isModalTarget) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={cn(
        "relative w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-2 border border-stroke dark:border-dark-3 transition-all animate-in zoom-in-95 duration-500",
        isModalTarget && "z-[111]"
      )}>
        
        {event.impossibleTravel && (
          <div className="bg-red/10 border-b border-red/20 px-6 py-3 flex items-center gap-3 animate-pulse">
            <AlertTriangle className="h-5 w-5 text-red" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red uppercase tracking-wider">{t.impossibleTravel}</p>
              <p className="text-xs text-red/80">{t.impossibleTravelDesc}</p>
            </div>
          </div>
        )}

        <div className="sticky top-0 z-20 border-b border-stroke bg-white/100 px-8 py-6 dark:border-dark-3 dark:bg-dark-2">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-2 dark:bg-dark-3 shrink-0">
                {isLoading ? (
                  <div className="h-6 w-6 animate-pulse rounded-full bg-primary/20" />
                ) : details.device?.toLowerCase() === "mobile" ? (
                  <Smartphone className="h-6 w-6 text-primary" />
                ) : (
                  <Monitor className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark dark:text-white tracking-normal flex flex-wrap items-center gap-3">
                  {t.technicalRadiography}
                  {isLoading ? (
                    <div className="h-6 w-16 animate-pulse rounded-full bg-gray-2 dark:bg-dark-3" />
                  ) : details.vpn ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-red/10 px-2.5 py-1 text-[10px] font-bold uppercase text-red border border-red/10">
                      <ShieldAlert className="h-3 w-3" />
                      {t.vpn}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-green/10 px-2.5 py-1 text-[10px] font-bold uppercase text-green border border-green/10">
                      <ShieldCheck className="h-3 w-3" />
                      {t.safe}
                    </span>
                  )}
                </h2>
                <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-dark-6">
                  <span className="font-mono bg-gray-2 dark:bg-dark-3 px-1.5 py-0.5 rounded uppercase">{event.id.substring(0, 12)}...</span>
                  <span className="h-1 w-1 rounded-full bg-dark-6/30" />
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatLocalDateTime(event.timestamp)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowJSON(!showJSON)}
                className="flex items-center gap-2 rounded-xl border border-stroke px-4 py-2 text-xs font-semibold uppercase text-dark-6 tracking-wide bg-white hover:bg-gray-2 transition-all dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6 dark:hover:bg-dark-4 dark:hover:text-white"
              >
                {showJSON ? t.hideJson : t.showJson}
              </button>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-stroke bg-white text-dark-6 hover:bg-red hover:text-white transition-all dark:border-dark-3 dark:bg-dark-3"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-8 flex gap-8 border-b border-stroke dark:border-dark-3">
            <button
              onClick={() => setActiveTab("details")}
              className={cn(
                "pb-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-all",
                activeTab === "details"
                  ? "border-b-2 border-primary text-primary"
                  : "text-dark-6 hover:text-dark-3"
              )}
            >
              {t.detailsTab}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "pb-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-all",
                activeTab === "history"
                  ? "border-b-2 border-primary text-primary"
                  : "text-dark-6 hover:text-dark-3"
              )}
            >
              {t.historyTab(relatedEvents.length)}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-8 py-8" style={{ maxHeight: "calc(95vh - 220px)" }}>
          {activeTab === "details" ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700 pb-10">
              
              {/* Bloque A: Análisis de Conexión (Seguridad) */}
              <div className="rounded-2xl border border-stroke bg-white p-8 dark:border-dark-3 dark:bg-dark-3 shadow-sm lg:col-span-12">
                <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-[11px] font-bold uppercase text-dark-6 tracking-[0.2em] flex items-center gap-2 mb-2">
                       <ShieldAlert className="h-4 w-4 text-primary" />
                       Bloque A: Análisis de Conexión
                    </h3>
                    <p className="text-sm font-semibold text-dark-6">Auditoría técnica de la red y seguridad de la sesión.</p>
                  </div>
                  {details.vpn && (
                    <div className="flex items-center gap-3 rounded-xl bg-red/10 px-4 py-3 border border-red/20 animate-pulse">
                      <AlertTriangle className="h-5 w-5 text-red" />
                      <span className="text-xs font-bold text-red uppercase tracking-wider">⚠️ Este usuario está enmascarando su conexión</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-gray-2 p-5 dark:bg-dark-2">
                    <span className="text-[9px] font-bold text-dark-6 uppercase block mb-2">IP Declarada (Client)</span>
                    <p className="text-sm font-bold text-dark dark:text-white font-mono">{details.clientIp || event.ipAddress}</p>
                  </div>
                  <div className="rounded-xl bg-gray-2 p-5 dark:bg-dark-2">
                    <span className="text-[9px] font-bold text-dark-6 uppercase block mb-2">IP Real Detectada</span>
                    <p className="text-sm font-bold text-primary font-mono">{details.detectedIp || details.clientIp || "En análisis..."}</p>
                  </div>
                  <div className="rounded-xl bg-gray-2 p-5 dark:bg-dark-2">
                    <span className="text-[9px] font-bold text-dark-6 uppercase block mb-2">Proveedor (ISP)</span>
                    <p className="text-sm font-bold text-dark dark:text-white truncate" title={details.asnName}>{details.asnName || "—"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-2 p-5 dark:bg-dark-2">
                    <span className="text-[9px] font-bold text-dark-6 uppercase block mb-2">Zona Horaria</span>
                    <p className="text-sm font-bold text-dark dark:text-white">{details.timezone || "—"}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                   <div className="flex items-center gap-3 rounded-lg border border-stroke px-4 py-2 dark:border-dark-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        details.vpn ? "bg-red shadow-[0_0_8px_rgba(255,0,0,0.5)]" : "bg-green shadow-[0_0_8px_rgba(0,255,0,0.5)]"
                      )} />
                      <span className="text-[10px] font-bold uppercase text-dark-6">{details.vpn ? "VPN Detectada" : "Conexión Segura"}</span>
                   </div>
                   <div className="flex items-center gap-3 rounded-lg border border-stroke px-4 py-2 dark:border-dark-3">
                      <Info className="h-4 w-4 text-primary" />
                      <span className="text-[10px] font-bold uppercase text-dark-6">Confianza: {details.confidence}%</span>
                   </div>
                   {event.impossibleTravel && (
                      <div className="flex items-center gap-3 rounded-lg bg-red/5 border border-red/20 px-4 py-2">
                        <AlertTriangle className="h-4 w-4 text-red" />
                        <span className="text-[10px] font-bold uppercase text-red">Viaje Imposible</span>
                      </div>
                   )}
                </div>
              </div>

              {/* Bloque B & C Row */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                
                {/* Bloque B: Ubicación Geográfica */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <div className="flex-1 rounded-2xl border border-stroke bg-white p-2 dark:border-dark-3 dark:bg-dark-3 shadow-sm overflow-hidden min-h-[400px] relative">
                    <div className="absolute top-4 left-4 z-[10] flex flex-col gap-2">
                       <div className="flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur px-3 py-2 shadow-lg border border-stroke dark:bg-dark-2/90 dark:border-dark-3">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-dark dark:text-white">
                            Bloque B: {event.city || "—"}, {event.country || t.location}
                          </span>
                       </div>
                    </div>
                    <div className="h-full w-full rounded-xl overflow-hidden">
                      <LocationMap
                        latitude={details.latitude}
                        longitude={details.longitude}
                        city={event.city}
                        country={event.country}
                        ipAddress={event.ipAddress}
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque C: Hardware y Software */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="rounded-2xl border border-stroke bg-white p-8 dark:border-dark-3 dark:bg-dark-3 shadow-sm">
                    <h3 className="text-[11px] font-bold uppercase text-dark-6 tracking-[0.2em] flex items-center gap-2 mb-8">
                       <Smartphone className="h-4 w-4 text-primary" />
                       Bloque C: Hardware/Software
                    </h3>
                    
                    <div className="space-y-6">
                       <div>
                          <span className="text-[9px] font-bold text-dark-6 uppercase block mb-2">Navegador</span>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-dark dark:text-white">{details.browserName} {details.browserVersion}</p>
                            <ExternalLink className="h-4 w-4 text-dark-6 opacity-40" />
                          </div>
                       </div>
                       <div className="pt-6 border-t border-stroke dark:border-dark-3">
                          <span className="text-[9px] font-bold text-dark-6 uppercase block mb-2">Sistema Operativo</span>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-dark dark:text-white">{details.os} {details.osVersion}</p>
                            <Monitor className="h-4 w-4 text-dark-6 opacity-40" />
                          </div>
                       </div>
                       <div className="pt-6 border-t border-stroke dark:border-dark-3">
                          <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className="h-4 w-4 text-green" />
                            <span className="text-[9px] font-bold text-green uppercase tracking-wider">Fingerprint Unico</span>
                          </div>
                          <p className="font-mono text-[10px] break-all bg-gray-2 dark:bg-dark-2 p-4 rounded-xl text-dark-6 leading-relaxed border border-stroke dark:border-dark-3">
                            {details.fingerprint || event.visitorId}
                          </p>
                          <p className="mt-3 text-[9px] font-semibold text-dark-6 italic leading-relaxed">
                            💡 Si este fingerprint aparece en múltiples cuentas, podría indicar fraude multicuenta.
                          </p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <h3 className="mb-6 text-lg font-bold text-dark dark:text-white tracking-normal">{t.visitorHistoryTitle}</h3>
              <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none bg-gray-2 dark:bg-dark-3">
                      <TableHead className="py-4 px-6 text-[10px] font-semibold uppercase text-dark-6 tracking-wide">{ht.visitorId}</TableHead>
                      <TableHead className="py-4 px-6 text-[10px] font-semibold uppercase text-dark-6 tracking-wide">{ht.ipAddress}</TableHead>
                      <TableHead className="py-4 px-6 text-[10px] font-semibold uppercase text-dark-6 tracking-wide">ID / {ht.requestId}</TableHead>
                      <TableHead className="py-4 px-6 text-[10px] font-semibold uppercase text-dark-6 tracking-wide text-right">{ht.date}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-20 text-center">
                           <div className="flex flex-col items-center gap-2 grayscale brightness-50">
                             <Clock className="h-10 w-10 text-dark-6 opacity-20" />
                             <p className="text-sm font-bold text-dark-6 uppercase tracking-widest">{t.historyEmpty}</p>
                           </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      relatedEvents.map((e) => (
                        <TableRow key={e.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-3/50 transition-colors cursor-pointer group">
                          <TableCell className="py-4 px-6 font-mono text-xs font-bold text-dark dark:text-white group-hover:text-primary transition-colors">
                            {e.visitorId.substring(0, 12)}...
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-lg leading-none">{getCountryFlag(e.countryCode)}</span>
                              <span className="text-xs font-bold text-dark dark:text-white">{e.ipAddress}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-xs text-dark-6">{e.requestId.substring(0, 10)}...</TableCell>
                          <TableCell className="py-4 px-6 text-xs font-bold text-dark dark:text-white text-right">
                             {dayjs(e.timestamp).format("DD MMM, HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {showJSON && (
          <div className="border-t border-stroke p-8 bg-gray-2/30 dark:border-dark-3 dark:bg-dark-3/30 animate-in slide-in-from-bottom-2 duration-500">
            <div className="relative rounded-2xl bg-gray-2 px-6 py-6 dark:bg-dark-3 border border-stroke dark:border-dark-2">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[10px] font-semibold uppercase tracking-wider text-dark-6">Raw Event JSON Data</span>
                 <button
                    onClick={() => {
                       navigator.clipboard.writeText(JSON.stringify(event, null, 2));
                    }}
                    className="flex items-center gap-2 text-xs font-bold text-primary"
                 >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Data
                 </button>
              </div>
              <pre className="overflow-auto text-[10px] font-mono leading-relaxed text-dark-6 scrollbar-hide" style={{ maxHeight: "400px" }}>
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

  const [apiSnapshots, setApiSnapshots] = useState<DeviceSnapshot[] | null>(null);
  const [globalEvents, setGlobalEvents] = useState<IdentificationEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAggregating, setIsAggregating] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const org = typeof window !== "undefined" ? getStoredOrganization() : null;
  const currentUser = typeof window !== "undefined" ? getStoredUser() : null;
  const roles = typeof window !== "undefined" ? getStoredRoles() : [];
  
  const canViewOtherUsers =
    isOwner(roles) ||
    userHasRole(roles, TEAM_ROLE.ORG_ADMIN) ||
    userHasRole(roles, TEAM_ROLE.ZELIFY_TEAM);

  const orgId = org?.id ?? null;
  const currentUserId = currentUser?.id ?? null;

  const displayEvents: IdentificationEvent[] = (() => {
    let eventsList: IdentificationEvent[] = [];
    if (globalEvents.length > 0) {
      eventsList = globalEvents;
    } else if (apiSnapshots !== null) {
      eventsList = apiSnapshots.map(s => snapshotToEvent(s, undefined, undefined));
    } else {
      eventsList = events;
    }
    return detectImpossibleTravel(eventsList);
  })();

  const isApiMode = apiSnapshots !== null || globalEvents.length > 0;

  const fetchGlobalSnapshots = async (search?: string) => {
    if (!orgId) return;
    setIsAggregating(true);
    try {
      const res = await listSnapshots(orgId, { limit: 100, search });
      const mapped = res.items.map(s => snapshotListItemToEvent(s));
      setGlobalEvents(mapped);
    } catch (err) {
      console.error("Error fetching global snapshots:", err);
      setGlobalEvents([]);
    } finally {
      setIsAggregating(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    
    // Debounce manual simple
    const timer = setTimeout(() => {
      fetchGlobalSnapshots(searchTerm || undefined);
    }, 400);

    return () => clearTimeout(timer);
  }, [orgId, searchTerm]);

  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handleSelectEvent = async (event: IdentificationEvent) => {
    setSelectedEvent(event);
    if (!orgId) return;

    if (!event.details?.latitude) {
      setIsDetailLoading(true);
      try {
        const detail = await getSnapshotDetail(orgId, event.id);
        setSelectedEvent(snapshotDetailToEvent(detail));
      } catch (err) {
        console.error("Error fetching snapshot detail:", err);
      } finally {
        setIsDetailLoading(false);
      }
    }
  };

  const handleReloadData = async () => {
    setIsLoading(true);
    setError(null);
    setErrorApi(null);

    const orgIdNow = getStoredOrganization()?.id ?? null;
    const currentUserIdNow = getStoredUser()?.id ?? null;

    if (orgIdNow && currentUserIdNow) {
      try {
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
        const realIP = await getRealIPAddress();
        const coordinates = `${latitude},${longitude}`;
        await getDeviceInfoNow(realIP, coordinates, orgIdNow);
        fetchGlobalSnapshots();
        setSearchTerm("");
      } catch (err: unknown) {
        setErrorApi(err instanceof AuthError ? err.message : translations.errors.default);
      } finally {
        setIsLoading(false);
        return;
      }
    }

    try {
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
      const realIP = await getRealIPAddress();
      const locationInfo = await getLocationInfo(latitude, longitude, realIP);
      const deviceDetails = getRealDeviceDetails(latitude, longitude);
      deviceDetails.continent = locationInfo.continent;
      deviceDetails.region = locationInfo.region;

      const newEvent: IdentificationEvent = {
        id: generateId(),
        visitorId: generateId().toUpperCase(),
        ipAddress: locationInfo.ipAddress,
        countryCode: locationInfo.countryCode,
        country: locationInfo.country,
        city: locationInfo.city,
        requestId: generateRequestId(),
        date: formatLocalDateTime(Date.now()),
        timestamp: Date.now(),
        details: deviceDetails,
      };

      setEvents((prevEvents) => {
        const exists = prevEvents.some((e) => e.requestId === newEvent.requestId);
        if (exists) return prevEvents;
        const updated = [newEvent, ...prevEvents].slice(0, 100);
        saveEvents(updated);
        return updated;
      });
    } catch (err: any) {
      setError(err.message || translations.errors.default);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    const orgIdNow = getStoredOrganization()?.id;
    const currentUserIdNow = getStoredUser()?.id;
    if (!(orgIdNow && currentUserIdNow)) {
      setEvents(loadEvents());
      handleReloadData();
    }
  }, []);

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-dark-2 border border-stroke dark:border-dark-3" data-tour-id="tour-device-information">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-dark dark:text-white tracking-normal flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-primary" />
              {translations.pageTitle}
            </h2>
            <p className="mt-2 text-sm font-semibold text-dark-6 leading-relaxed">
              {translations.pageDescription}
            </p>
            <div className="mt-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-semibold uppercase text-primary border border-primary/20 tracking-wider">
                  {translations.subtitleGlobal(displayEvents.length)}
                </span>
            </div>
          </div>
          
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            {canViewOtherUsers && orgId && currentUserId && (
              <div className="relative group w-full sm:w-[360px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-6 group-focus-within:text-primary transition-colors">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder={translations.table.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-stroke bg-white pl-11 pr-4 py-3 text-sm font-bold text-dark transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-dark-3 dark:bg-dark-3 dark:text-white outline-none"
                />
              </div>
            )}
            <button
              onClick={handleReloadData}
              disabled={isLoading}
              className="group relative flex h-11 items-center justify-center gap-3 rounded-xl border border-stroke bg-white px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-dark shadow-sm transition-all hover:border-dark hover:bg-dark hover:text-white dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className={cn(
                "h-4 w-4 transition-all duration-500",
                isLoading ? "animate-spin text-primary group-hover:text-inherit" : "group-hover:rotate-180"
              )} />
              <span>{isLoading ? translations.reloadButton.loading : translations.reloadButton.default}</span>
            </button>
          </div>
        </div>

        {(error || errorApi) && (
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-red/20 bg-red/5 p-4 text-sm text-red animate-in slide-in-from-top-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="font-bold">{error || errorApi}</p>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-gray-2 dark:bg-dark-3">
                <TableHead className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-dark-6">{translations.table.user}</TableHead>
                <TableHead className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-dark-6">{translations.table.date}</TableHead>
                <TableHead className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-dark-6 text-center">{translations.table.device}</TableHead>
                <TableHead className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-dark-6">{translations.table.ipAddress}</TableHead>
                <TableHead className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-dark-6 text-center">{translations.table.risk}</TableHead>
                <TableHead className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-dark-6 text-right">{translations.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-2 dark:bg-dark-3">
                          <Smartphone className="h-8 w-8 text-dark-6 opacity-20" />
                       </div>
                        <p className="text-sm font-bold text-dark-6 uppercase tracking-[0.2em]">
                          {isAggregating ? translations.reloadButton.loading : translations.table.empty}
                        </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayEvents.map((event, index) => {
                  const isFirstRow = index === 0;
                  return (
                     <TableRow
                       key={event.id}
                       onClick={() => handleSelectEvent(event)}
                      className="group cursor-pointer border-b border-stroke hover:bg-gray-2/50 dark:border-dark-3 dark:hover:bg-dark-3/50 transition-all font-semibold"
                      data-tour-id={isFirstRow ? "tour-device-information-first-row" : undefined}
                    >
                      <TableCell className="py-6 px-6">
                        <div className="flex items-center gap-3">
                           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-2 text-dark-6 group-hover:bg-primary group-hover:text-white transition-all dark:bg-dark-3">
                              <User className="h-5 w-5" />
                           </div>
                           <div className="max-w-[140px] truncate">
                              <p className="text-sm font-semibold text-dark dark:text-white leading-none">{event.userName || translations.common.unknown}</p>
                              <p className="mt-1.5 text-[10px] font-semibold text-dark-6 truncate">{event.userEmail || "—"}</p>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 px-6">
                        <p className="text-xs font-bold text-dark dark:text-white uppercase leading-none">{event.date}</p>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-dark-6 uppercase tracking-wider">
                           <Clock className="h-3 w-3" />
                           {dayjs(event.timestamp).fromNow()}
                        </div>
                      </TableCell>
                      <TableCell className="py-6 px-6 text-center">
                         <div className="inline-flex flex-col items-center gap-1.5">
                            {event.details?.device?.toLowerCase() === "mobile" ? (
                              <Smartphone className="h-5 w-5 text-dark-6" />
                            ) : (
                              <Monitor className="h-5 w-5 text-dark-6" />
                            )}
                            <span className="text-[9px] font-bold uppercase text-dark-6 leading-tight">
                              {event.details?.os || "Desktop"}
                            </span>
                         </div>
                      </TableCell>
                      <TableCell className="py-6 px-6">
                        <div className="flex flex-col gap-1.5">
                           <CopyableIP ip={event.ipAddress} translations={translations} />
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-dark-6 uppercase tracking-wider">
                              <span>{getCountryFlag(event.countryCode)}</span>
                              <span className="max-w-[120px] truncate">{event.city || "—"}, {event.country || "—"}</span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 px-6 text-center">
                        <div className="flex justify-center">
                          {event.details?.vpn === undefined ? (
                            <div className="flex items-center gap-1 w-fit rounded-full bg-gray-2 px-2 py-1 text-[9px] font-bold uppercase text-dark-6 border border-stroke dark:bg-dark-3">
                              <Clock className="h-3 w-3" />
                              PENDING
                            </div>
                          ) : event.details?.vpn ? (
                            <div className="flex items-center gap-1 w-fit rounded-full bg-red/10 px-2 py-1 text-[9px] font-bold uppercase text-red border border-red/10">
                              <ShieldAlert className="h-3 w-3" />
                              VPN
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 w-fit rounded-full bg-green/10 px-2 py-1 text-[9px] font-bold uppercase text-green border border-green/10">
                              <ShieldCheck className="h-3 w-3" />
                              SAFE
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-6 px-6 text-right">
                         <button className="group/action inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-2 text-dark-6 shadow-sm transition-all hover:bg-primary hover:text-white dark:bg-dark-3 dark:hover:bg-primary">
                            <Search className="h-4.5 w-4.5 group-hover/action:scale-110 transition-transform" />
                         </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedEvent && (
        <DeviceDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          allEvents={displayEvents}
          isLoading={isDetailLoading}
        />
      )}
    </div>
  );
}
