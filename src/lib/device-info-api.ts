/**
 * API para dispositivos y geolocalización.
 * Base: NEXT_PUBLIC_AUTH_API_URL.
 * Rutas que requieren header x-org-id además de Authorization: Bearer <access_token>.
 */

import { AuthError, fetchWithAuth } from "@/lib/auth-api";

export type DeviceSnapshot = {
  id: string;
  client_ip: string;
  device_type: string;
  lat: number | null;
  lng: number | null;
  vpn_detected: boolean;
  created_at: string;
};

export type OrganizationUserWithDevices = {
  id: string;
  email?: string;
  full_name?: string;
  device_snapshots?: DeviceSnapshot[];
  [key: string]: unknown;
};

/** Respuesta de GET /api/device-info (registrar y obtener dispositivo/geolocalización "ahora"). */
export type DeviceInfoNowResponse = {
  coordinates?: { lat: number; lng: number };
  device?: Record<string, unknown>;
  geolocation?: Record<string, unknown>;
  [key: string]: unknown;
};

function headersWithOrg(organizationId: string): Record<string, string> {
  return { "x-org-id": organizationId };
}

/**
 * GET /api/organizations/{organizationId}/users/{userId}
 * Para admin: ver dispositivos y geolocalización de un usuario.
 * Headers: Authorization: Bearer <token>, x-org-id: organizationId
 */
export async function getOrganizationUser(
  organizationId: string,
  userId: string
): Promise<OrganizationUserWithDevices> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(organizationId)}/users/${encodeURIComponent(userId)}`,
    { headers: headersWithOrg(organizationId) }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener usuario",
      res.status,
      data
    );
  }
  return data as OrganizationUserWithDevices;
}

/**
 * GET /api/device-info?clientIp={ip}&coordinates={lat},{lng}
 * Registrar y obtener dispositivo/geolocalización del usuario logueado.
 * Headers: Authorization: Bearer <token>, x-org-id: organizationId
 */
export async function getDeviceInfoNow(
  clientIp: string,
  coordinates: string,
  organizationId: string
): Promise<DeviceInfoNowResponse> {
  const params = new URLSearchParams();
  params.set("clientIp", clientIp);
  params.set("coordinates", coordinates);
  const res = await fetchWithAuth(
    `/api/device-info?${params.toString()}`,
    { headers: headersWithOrg(organizationId) }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener información del dispositivo",
      res.status,
      data
    );
  }
  return data as DeviceInfoNowResponse;
}
