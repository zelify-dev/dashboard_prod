"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getAuthErrorMessage } from "@/lib/auth-error-messages";
import { getSessions, revokeSession, AuthError, type SessionItem } from "@/lib/auth-api";
import { useEffect, useState } from "react";

import { formatLocalDateTime } from "@/lib/date-utils";

export function SessionsList() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [lang, setLang] = useState<"es" | "en">("es");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("preferredLanguage") : null;
    if (stored === "en" || stored === "es") setLang(stored);
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getSessions();
      setSessions(list);
    } catch (e) {
      setError(e instanceof AuthError ? getAuthErrorMessage(e.statusCode, "protected", lang) || e.message : e instanceof Error ? e.message : "Error al cargar sesiones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e) {
      setError(e instanceof AuthError ? getAuthErrorMessage(e.statusCode, "protected", lang) || e.message : e instanceof Error ? e.message : "Error al revocar sesión");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <ShowcaseSection title="Sesiones activas" className="!p-7">
      <p className="mb-4 text-sm text-dark-6 dark:text-dark-6">
        Dispositivos y sesiones donde has iniciado sesión. Puedes revocar cualquier sesión para cerrarla en ese dispositivo.
      </p>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="py-4 text-sm text-dark-6 dark:text-dark-6">
          No hay sesiones registradas o no se pudieron cargar.
        </p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stroke bg-gray-2 px-4 py-3 dark:border-dark-3 dark:bg-dark-2"
            >
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-medium text-dark dark:text-white">
                  {s.user_agent || s.id}
                </div>
                {s.ip && (
                  <div className="text-dark-6 dark:text-dark-6">IP: {s.ip}</div>
                )}
                <div className="mt-1 text-xs text-dark-6 dark:text-dark-6">
                  Última actividad: {formatLocalDateTime(s.last_seen_at ?? s.created_at)}
                </div>
              </div>
              <button
                type="button"
                disabled={revokingId === s.id}
                onClick={() => handleRevoke(s.id)}
                className="rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-50"
              >
                {revokingId === s.id ? "Revocando..." : "Revocar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </ShowcaseSection>
  );
}
