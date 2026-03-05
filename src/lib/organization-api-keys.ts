/**
 * API de API Keys de la organización (Zelify Keys).
 * Base: NEXT_PUBLIC_AUTH_API_URL. Autenticación: Authorization: Bearer <access_token> (el mismo del login).
 *
 * ========== ESPECIFICACIÓN (BACKEND) ==========
 *
 * Base URL: NEXT_PUBLIC_AUTH_API_URL
 * Cabecera obligatoria: Authorization: Bearer <access_token>
 * (El mismo access_token que devuelve POST /api/auth/login. Si no se envía o está expirado,
 *  el backend responde "Se requiere organization_id en query o usuario autenticado".)
 *
 * Query opcional en todas las rutas: ?organization_id=<uuid>
 * Si el usuario solo pertenece a una organización no hace falta; el backend usa la org del usuario del token.
 * Si el front envía organization_id (ej. de getStoredOrganization().id), se puede añadir para evitar ambigüedad.
 *
 * --- 1) Listar API keys ---
 * GET /api/organization/api-keys
 * Query opcional: ?organization_id=<uuid>
 * Respuesta 200: { "api_keys": [ { "id", "api_key", "status", "created_at", "revoked_at", "last_used_at" }, ... ] }
 *
 * --- 2) Revelar secret ---
 * GET /api/organization/api-keys/{id}/secret
 * {id} = UUID de la API key.
 * Query opcional: ?organization_id=<uuid>
 * Respuesta 200: { "api_key": "...", "api_secret": "..." }
 *
 * --- 3) Rotar keys ---
 * POST /api/organization/api-keys/rotate
 * Body: {} (vacío o Content-Type: application/json)
 * Query opcional: ?organization_id=<uuid>
 * Respuesta 201: { "api_key": "...", "api_secret": "..." }
 *
 * --- 4) Revocar una key ---
 * POST /api/organization/api-keys/revoke
 * Body: { "id": "<uuid de la api key>" }
 * Query opcional: ?organization_id=<uuid>
 *
 * ==============================================
 *
 * Seguridad: el api_secret no se persiste; solo en memoria al revelar.
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

/** Enmascara api_key para mostrar (zk_****). */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 6) return "••••••••";
  return apiKey.slice(0, 4) + "••••••••••••••••";
}

function queryWithOrg(organizationId?: string | null): string {
  if (!organizationId) return "";
  return `?organization_id=${encodeURIComponent(organizationId)}`;
}

/** GET /api/organization/api-keys — listar API keys de la organización. */
export async function listApiKeys(organizationId?: string | null): Promise<ApiKeyItem[]> {
  const q = queryWithOrg(organizationId);
  const res = await fetchWithAuth(`/api/organization/api-keys${q}`);
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

/** GET /api/organization/api-keys/{id}/secret — revelar secret (bajo demanda). */
export async function getApiKeySecret(id: string, organizationId?: string | null): Promise<ApiKeySecretResponse> {
  const q = queryWithOrg(organizationId);
  const res = await fetchWithAuth(`/api/organization/api-keys/${encodeURIComponent(id)}/secret${q}`);
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

/** POST /api/organization/api-keys/rotate — rotar keys (revoca actuales y crea una nueva). */
export async function rotateApiKeys(organizationId?: string | null): Promise<ApiKeySecretResponse> {
  const q = queryWithOrg(organizationId);
  const res = await fetchWithAuth(`/api/organization/api-keys/rotate${q}`, {
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

/** POST /api/organization/api-keys/revoke — revocar una API key. */
export async function revokeApiKey(id: string, organizationId?: string | null): Promise<void> {
  const q = queryWithOrg(organizationId);
  const res = await fetchWithAuth(`/api/organization/api-keys/revoke${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al revocar API key",
      res.status,
      data
    );
  }
}
