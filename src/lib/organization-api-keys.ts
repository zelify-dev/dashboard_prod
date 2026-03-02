/**
 * API de API Keys de la organización.
 * Usa la misma base (NEXT_PUBLIC_AUTH_API_URL) y Bearer token que auth-api.
 *
 * Seguridad:
 * - El secret (api_secret) NUNCA se persiste: solo en estado en memoria al revelar.
 * - Revelar secret solo bajo demanda (GET cuando el usuario hace clic en "Mostrar").
 */

import { AuthError, fetchWithAuth } from "@/lib/auth-api";

export type ApiKeyItem = {
  id: string;
  api_key: string;
  status: string;
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
};

export type ListApiKeysResponse = {
  api_keys: ApiKeyItem[];
};

export type ApiKeySecretResponse = {
  api_key: string;
  api_secret: string;
};

/** GET /api/organization/api-keys — listar API keys de la organización. */
export async function listApiKeys(): Promise<ApiKeyItem[]> {
  const res = await fetchWithAuth("/api/organization/api-keys");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar API keys",
      res.status,
      data
    );
  }
  const parsed = data as ListApiKeysResponse;
  return Array.isArray(parsed.api_keys) ? parsed.api_keys : [];
}

/** GET /api/organization/api-keys/{id}/secret — revelar secret (solo bajo demanda). */
export async function getApiKeySecret(id: string): Promise<ApiKeySecretResponse> {
  const res = await fetchWithAuth(`/api/organization/api-keys/${encodeURIComponent(id)}/secret`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener el secret",
      res.status,
      data
    );
  }
  return data as ApiKeySecretResponse;
}

/** POST /api/organization/api-keys/rotate — rotar keys (revoca las actuales y crea una nueva). */
export async function rotateApiKeys(): Promise<ApiKeySecretResponse> {
  const res = await fetchWithAuth("/api/organization/api-keys/rotate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status !== 201) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al rotar API keys",
      res.status,
      data
    );
  }
  return data as ApiKeySecretResponse;
}

/** Enmascara api_key para mostrar (zk_****). */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 6) return "••••••••";
  return apiKey.slice(0, 4) + "••••••••••••••••";
}
