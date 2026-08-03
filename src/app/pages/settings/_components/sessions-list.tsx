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
      className="!p-6"
    >
      <div className="mb-6 max-w-2xl">
        <h3 className="mb-1.5 text-sm font-medium text-dark flex items-center gap-2">
          <ShieldCheck className="text-zelify-midnight size-4" />
          Dispositivos autorizados
        </h3>
        <p className="text-xs font-light text-dark-6">
          Gestiona los dispositivos con acceso a tu cuenta. Cualquier actividad sospechosa puede ser mitigada cerrando la sesión de forma remota.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-light text-rose-600 flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-gray-50 border border-gray-100" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/40">
          <Globe className="mx-auto size-10 text-dark-6 opacity-20 mb-2" />
          <p className="text-xs font-light text-dark-6">No se detectaron otras sesiones activas.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((s) => {
            const isCurrent = s.id === currentSid;
            const uaInfo = parseUA(s.user_agent);
            const Icon = uaInfo.icon;

            return (
              <div
                key={s.id}
                className="group relative flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-zelify-midnight">
                      <Icon size={18} />
                    </div>
                    {/* Puntito verde de estado */}
                    <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" title="Sesión activa" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-dark">
                        {uaInfo.name}
                      </span>
                      {isCurrent && (
                        <span className="rounded-xl border border-gray-200/80 bg-white px-2 py-0.5 text-[9px] font-normal uppercase tracking-wider text-emerald-600">
                          Este dispositivo
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] font-light text-dark-6">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} strokeWidth={2} />
                        {s.ip || "IP Oculta"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} strokeWidth={2} />
                        {formatLocalDateTime(s.last_seen_at ?? s.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={revokingId === s.id}
                    onClick={() => handleRevoke(s.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 text-xs font-light text-dark transition active:scale-95 disabled:opacity-50"
                  >
                    {revokingId === s.id ? (
                      <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <LogOut size={14} />
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
