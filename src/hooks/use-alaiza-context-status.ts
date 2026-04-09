"use client";

import { useState, useEffect, useCallback } from "react";
import { getStoredOrganization, getStoredRoles } from "@/lib/auth-api";
import { listApiKeys, getApiKeySecret } from "@/lib/organization-api-keys";
import { getAlaizaContextStatus, type AlaizaContextStatus } from "@/lib/alaiza-api";

export type AlaizaContextStatusResult = {
  /** true mientras se cargan las credenciales o el status */
  loading: boolean;
  /** Error al cargar (si aplica) */
  error: string | null;
  /** true si la organización ya llenó el formulario de preguntas */
  hasAnswers: boolean;
  /** true si ya existe un contexto de IA generado para esta org */
  hasContext: boolean;
  /**
   * true si el usuario tiene permiso para llenar el formulario.
   *
   * NOTA: La validación de roles está PREPARADA pero NO ACTIVADA.
   * Actualmente siempre es true para no bloquear a ningún usuario.
   *
   * Para activar el guard, descomenta la línea indicada abajo con
   * el comentario "// TODO: activar validación de roles".
   */
  canSubmit: boolean;
  orgId: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  /** Fuerza un re-fetch del status (llamar después de guardar respuestas) */
  refetch: () => void;
};

/**
 * Hook que verifica si la organización ya completó el formulario de contexto de Alaiza.
 * Carga las credenciales de la org (API key/secret) de forma segura y en memoria.
 */
export function useAlaizaContextStatus(): AlaizaContextStatusResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAnswers, setHasAnswers] = useState(false);
  const [hasContext, setHasContext] = useState(false);
  const [canSubmit, setCanSubmit] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiSecret, setApiSecret] = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  const refetch = useCallback(() => setFetchTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1. Obtener org del sessionStorage
        const org = getStoredOrganization();
        if (!org?.id) {
          setError("No hay organización en sesión.");
          setLoading(false);
          return;
        }
        setOrgId(org.id);

        // 2. Lógica de roles (PREPARADA, no activada)
        const roles = getStoredRoles();
        const isAuthorizedRole =
          roles.includes("OWNER") ||
          roles.includes("ORG_ADMIN") ||
          roles.includes("ADMIN");

        // TODO: activar validación de roles cuando esté listo
        // const resolvedCanSubmit = isAuthorizedRole;
        const resolvedCanSubmit = true; // ← permisivo temporalmente (ignorar isAuthorizedRole)
        void isAuthorizedRole; // evitar warning de variable no usada

        setCanSubmit(resolvedCanSubmit);

        // 3. Obtener la API key activa
        const keys = await listApiKeys(org.id);
        const activeKey = keys.find((k) => k.status === "active") ?? keys[0];
        if (!activeKey) {
          setError("No hay API keys activas para esta organización.");
          setLoading(false);
          return;
        }

        // 4. Obtener el secret (bajo demanda, en memoria)
        const secretData = await getApiKeySecret(activeKey.id, org.id);
        if (cancelled) return;

        setApiKey(secretData.api_key);
        setApiSecret(secretData.api_secret);

        // 5. Consultar el status del contexto de Alaiza
        const status = await getAlaizaContextStatus(org.id, secretData.api_key, secretData.api_secret);
        if (cancelled) return;

        setHasAnswers(status.has_answers);
        setHasContext(status.has_context);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Error al verificar el estado de Alaiza";
          setError(msg);
          console.error("[useAlaizaContextStatus]", msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [fetchTick]);

  return { loading, error, hasAnswers, hasContext, canSubmit, orgId, apiKey, apiSecret, refetch };
}
