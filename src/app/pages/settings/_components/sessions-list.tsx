"use client";

import { useEffect, useState } from "react";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { 
  getSessions, 
  revokeSession, 
  getCurrentSessionId, 
  AuthError, 
  type SessionItem 
} from "@/lib/auth-api";
import { getAuthErrorMessage } from "@/lib/auth-error-messages";
import { formatLocalDateTime } from "@/lib/date-utils";
import { 
  Monitor, 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  MapPin, 
  Clock,
  ChevronRight
} from "lucide-react";

/**
 * Utilidad ligera para parsear el User-Agent y devolver iconos/texto amigable.
 */
function parseUA(ua: string | undefined) {
  if (!ua) return { name: "Desconocido", icon: Globe };
  const lower = ua.toLowerCase();
  
  let os = "Dispositivo";
  let browser = "Navegador";
  let Icon = Monitor;

  if (lower.includes("mac os")) os = "macOS";
  else if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("iphone") || lower.includes("ipad")) {
    os = "iOS";
    Icon = Smartphone;
  }
  else if (lower.includes("android")) {
    os = "Android";
    Icon = Smartphone;
  }
  else if (lower.includes("linux")) os = "Linux";

  if (lower.includes("chrome")) browser = "Chrome";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";
  else if (lower.includes("firefox")) browser = "Firefox";
  else if (lower.includes("edge")) browser = "Edge";

  return { name: `${os} • ${browser}`, icon: Icon };
}

export function SessionsList() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [currentSid, setCurrentSid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getSessions();
      const sid = getCurrentSessionId();
      setCurrentSid(sid);

      // Filtrar y ordenar: 
      // 1. "Este dispositivo" siempre primero
      // 2. Otros dispositivos ordenados por actividad más reciente (fecha descendente)
      const sortedSessions = list
        .filter(s => s.active !== false)
        .sort((a, b) => {
          if (a.id === sid) return -1;
          if (b.id === sid) return 1;
          
          const dateA = new Date(a.last_seen_at ?? a.created_at ?? 0).getTime();
          const dateB = new Date(b.last_seen_at ?? b.created_at ?? 0).getTime();
          return dateB - dateA;
        });

      setSessions(sortedSessions);
    } catch (e: any) {
      setError("No se pudieron cargar las sesiones de seguridad.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    if (sessionId === currentSid) {
      if (!confirm("Estás cerrando tú sesión actual en este dispositivo. ¿Deseas continuar?")) return;
    }
    
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e: any) {
      setError("Error al revocar la sesión. Por favor, intenta de nuevo.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <ShowcaseSection 
      title="Seguridad y Sesiones Activas" 
      className="!p-7"
    >
      <div className="mb-8 max-w-2xl">
        <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white flex items-center gap-2">
          <ShieldCheck className="text-primary size-5" />
          Dispositivos autorizados
        </h3>
        <p className="text-sm text-dark-6">
          Gestiona los dispositivos con acceso a tu cuenta. Cualquier actividad sospechosa puede ser mitigada cerrando la sesión de forma remota.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <div className="size-2 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-gray-2 dark:bg-dark-2" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-stroke border-dashed dark:border-dark-3">
          <Globe className="mx-auto size-12 text-dark-6 opacity-20 mb-3" />
          <p className="text-sm text-dark-6">No se detectaron otras sesiones activas.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s) => {
            const isCurrent = s.id === currentSid;
            const uaInfo = parseUA(s.user_agent);
            const Icon = uaInfo.icon;

            return (
              <div
                key={s.id}
                className={`group relative flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5 transition-all hover:shadow-sm ${
                  isCurrent 
                  ? "border-primary/30 bg-primary/[0.02] dark:bg-primary/[0.03]" 
                  : "border-stroke bg-white hover:border-primary/30 dark:border-dark-3 dark:bg-dark-2"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`flex size-12 items-center justify-center rounded-xl border transition-colors ${
                      isCurrent 
                      ? "border-primary/20 bg-primary/10 text-primary" 
                      : "border-stroke bg-gray-2 text-dark-6 group-hover:bg-primary/5 group-hover:text-primary dark:border-dark-3 dark:bg-dark-3"
                    }`}>
                      <Icon size={22} />
                    </div>
                    {/* Puntito verde integrado junto al icono */}
                    <div className="absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-white bg-green-500 dark:border-dark-2" title="Sesión activa" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-dark dark:text-white">
                        {uaInfo.name}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Este dispositivo
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dark-6">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} strokeWidth={2.5} />
                        {s.ip || "IP Oculta"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} strokeWidth={2.5} />
                        {formatLocalDateTime(s.last_seen_at ?? s.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={revokingId === s.id}
                    onClick={() => handleRevoke(s.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      isCurrent
                      ? "text-dark-6 hover:bg-gray-1 dark:text-dark-6 dark:hover:bg-dark-3"
                      : "text-red hover:bg-red/5"
                    } disabled:opacity-50`}
                  >
                    {revokingId === s.id ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <LogOut size={16} />
                    )}
                    {isCurrent ? "Cerrar sesión" : "Revocar acceso"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ShowcaseSection>
  );
}
