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

export type SnapshotListItem = {
  id: string;
  client_ip: string;
  device_type: string;
  browser: string;
  os: string;
  city: string;
  vpn_detected: boolean;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
};

export type ListSnapshotsResponse = {
  items: SnapshotListItem[];
  total: number;
  page: number;
  limit: number;
};

export type DeviceSnapshotDetail = {
  id: string;
  client_ip: string;
  detected_ip: string;
  device_type: string;
  browser: string;
  os: string;
  isp: string;
  timezone: string;
  city: string;
  region: string;
  country_code: string;
  lat: number;
  lng: number;
  vpn_detected: boolean;
  user_agent: string;
  fingerprint: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
};

function headersWithOrg(organizationId: string): Record<string, string> {
  return { "x-org-id": organizationId };
}

/**
 * GET /api/device-info/snapshots
 * Get global list of snapshots for an organization.
 */
export async function listSnapshots(
  organizationId: string,
  params: { page?: number; limit?: number; search?: string } = {}
): Promise<ListSnapshotsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.search) query.set("search", params.search);

  const res = await fetchWithAuth(
    `/api/device-info/snapshots?${query.toString()}`,
    { headers: headersWithOrg(organizationId) }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener snapshots",
      res.status,
      data
    );
  }
  return data as ListSnapshotsResponse;
}

/**
 * GET /api/device-info/snapshots/{snapshotId}
 * Get full radiography detail for a single snapshot.
 */
export async function getSnapshotDetail(
  organizationId: string,
  snapshotId: string
): Promise<DeviceSnapshotDetail> {
  const res = await fetchWithAuth(
    `/api/device-info/snapshots/${encodeURIComponent(snapshotId)}`,
    { headers: headersWithOrg(organizationId) }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener detalle del snapshot",
      res.status,
      data
    );
  }
  return data as DeviceSnapshotDetail;
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
