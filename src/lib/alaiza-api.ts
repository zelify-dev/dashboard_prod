/**
 * Capa de servicio para los endpoints de Alaiza en el API v2.
 *
 * Todos los endpoints requieren:
 * - x-api-key  : api_key de la organización
 * - x-api-secret : api_secret de la organización
 * - x-org-id   : UUID de la organización
 *
 * Cómo obtener las credenciales:
 * 1. listApiKeys(orgId) → obtener la lista de API keys activas
 * 2. getApiKeySecret(keyId, orgId) → obtener el secret de la clave activa
 * Luego pasar api_key y api_secret a las funciones de este módulo.
 */
import { getAuthBaseUrl, fetchWithAuth } from "@/lib/auth-api";
import type { AuthError } from "@/lib/auth-api";

const BASE = () => getAuthBaseUrl();

/** Construye los headers requeridos por los endpoints v2. */
function v2Headers(orgId: string, apiKey: string, apiSecret: string): Headers {
  const h = new Headers();
  h.set("Content-Type", "application/json");
  h.set("x-org-id", orgId);
  h.set("x-api-key", apiKey);
  h.set("x-api-secret", apiSecret);
  return h;
}

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export type AlaizaContextStatus = {
  has_answers: boolean;
  has_context: boolean;
};

export type AlaizaContextAnswers = {
  company_info: string;
  services_offered: string;
  goals: string;
};

export type AlaizaOrgContextRecord = {
  id: string;
  organization_id: string;
  context: string;
  max_input_length: number;
  max_output_length: number;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AlaizaConfigUpdate = {
  max_input_length?: number;
  max_output_length?: number;
};

// ─────────────────────────────────────────────
// Funciones de API
// ─────────────────────────────────────────────

/**
 * GET /api/v2/ai/org-context/status
 * Verifica si la organización ya llenó el formulario de contexto.
 */
export async function getAlaizaContextStatus(
  orgId: string,
  apiKey: string,
  apiSecret: string
): Promise<AlaizaContextStatus> {
  const url = `${BASE()}/api/v2/ai/org-context/status`;
  const res = await fetch(url, {
    method: "GET",
    headers: v2Headers(orgId, apiKey, apiSecret),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ?? "Error al obtener el estado del contexto de Alaiza"
    );
  }
  return data as AlaizaContextStatus;
}

/**
 * POST /api/v2/ai/org-context/answers
 * Guarda las 3 respuestas del formulario y dispara la generación del contexto IA.
 */
export async function saveAlaizaContextAnswers(
  orgId: string,
  apiKey: string,
  apiSecret: string,
  answers: AlaizaContextAnswers
): Promise<{ success: boolean; message: string }> {
  const url = `${BASE()}/api/v2/ai/org-context/answers`;
  const res = await fetch(url, {
    method: "POST",
    headers: v2Headers(orgId, apiKey, apiSecret),
    body: JSON.stringify(answers),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ?? "Error al guardar las respuestas de contexto"
    );
  }
  return data as { success: boolean; message: string };
}

/**
 * GET /api/v2/ai/org-context
 * Obtiene el contexto generado y la configuración de la organización.
 */
export async function getAlaizaOrgContext(
  orgId: string,
  apiKey: string,
  apiSecret: string
): Promise<AlaizaOrgContextRecord> {
  const url = `${BASE()}/api/v2/ai/org-context`;
  const res = await fetch(url, {
    method: "GET",
    headers: v2Headers(orgId, apiKey, apiSecret),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ?? "Error al obtener el contexto de Alaiza"
    );
  }
  return data as AlaizaOrgContextRecord;
}

/**
 * PUT /api/v2/ai/org-context/config
 * Actualiza los límites de longitud de entrada/salida de la organización.
 */
export async function updateAlaizaConfig(
  orgId: string,
  apiKey: string,
  apiSecret: string,
  config: AlaizaConfigUpdate
): Promise<AlaizaOrgContextRecord> {
  const url = `${BASE()}/api/v2/ai/org-context/config`;
  const res = await fetch(url, {
    method: "PUT",
    headers: v2Headers(orgId, apiKey, apiSecret),
    body: JSON.stringify(config),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ?? "Error al actualizar la configuración de Alaiza"
    );
  }
  return data as AlaizaOrgContextRecord;
}
