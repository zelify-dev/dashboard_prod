/**
 * API de administración global de organizaciones (solo OWNER).
 */
import type { OrganizationBranding, UpdateOrganizationBrandingPayload } from "@/lib/auth-api";
import { AuthError, fetchWithAuth, getOrganizationBranding, updateOrganizationBranding, uploadOrganizationLogo } from "@/lib/auth-api";

export type OrganizationAdmin = {
  id: string;
  name: string;
  status: string;
  country?: string;
  currency?: string;
  company_legal_name?: string;
  website?: string | null;
  industry?: string;
  fiscal_id?: string;
  swift?: string | null;
  default_daily_account_limit?: number | null;
  defaultDailyAccountLimit?: number | null;
  zcoins?: string;
  url_log?: string | null;
  color_a?: string | null;
  color_b?: string | null;
  created_at?: string;
  updated_at?: string;
  scopes?: string[];
  organization_type?: string | null;
  onboarding_verified?: boolean;
  onboarding_completed?: boolean;
  kyb_verified?: boolean;
};

export type ListOrganizationsResponse = {
  organizations?: OrganizationAdmin[];
  items?: OrganizationAdmin[];
};

export type CreateOrganizationBody = {
  name: string;
  status?: string;
  organization_type?: string;
  cliente?: {
    official_name: string;
    currency?: string;
    country_code?: string;
    fiscal_id?: string;
    institution_code?: string;
    swift_code?: string;
    local_address?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
};

export type UpdateOrganizationBody = {
  name?: string;
  status?: string;
  organization_type?: string;
  country?: string;
  currency?: string;
  company_legal_name?: string;
  website?: string | null;
  industry?: string;
  fiscal_id?: string;
  swift?: string | null;
  default_daily_account_limit?: number | null;
  defaultDailyAccountLimit?: number | null;
};

export type ScopeItem = {
  id: string;
  scope: string;
  created_at?: string;
  updated_at?: string;
};

export type ListScopesResponse = {
  scopes: ScopeItem[];
};

export type OrganizationConfig = {
  auth?: {
    app_registration_enabled?: boolean;
    otp_ttl_minutes?: number;
  };
  identity?: {
    allowed_document_types?: {
      national_id?: boolean;
      driver_license?: boolean;
      passport?: boolean;
    };
  };
  aml?: {
    screening_enabled?: boolean;
  };
  [key: string]: unknown;
};
export type OrganizationIdentityConfig = Record<string, unknown>;
export type UpdateOrganizationConfigPayload = Partial<OrganizationConfig>;

function parseOrganizationPayload(data: unknown): OrganizationAdmin {
  if (data && typeof data === "object" && "organization" in data) {
    return (data as { organization: OrganizationAdmin }).organization;
  }
  return data as OrganizationAdmin;
}

function parseOrganizationsListPayload(data: unknown): OrganizationAdmin[] {
  if (Array.isArray(data)) return data as OrganizationAdmin[];
  const parsed = data as ListOrganizationsResponse;
  if (Array.isArray(parsed.organizations)) return parsed.organizations;
  if (Array.isArray(parsed.items)) return parsed.items;
  return [];
}

/** GET /api/organizations — listado global de organizaciones. */
export async function listOrganizations(): Promise<OrganizationAdmin[]> {
  const res = await fetchWithAuth("/api/organizations");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar organizaciones",
      res.status,
      data
    );
  }
  return parseOrganizationsListPayload(data);
}

/** GET /api/organizations/:id — detalle de una organización. */
export async function getOrganizationAdmin(id: string): Promise<OrganizationAdmin> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener la organización",
      res.status,
      data
    );
  }
  return parseOrganizationPayload(data);
}

/** POST /api/organizations — crear organización. */
export async function createOrganization(body: CreateOrganizationBody): Promise<OrganizationAdmin> {
  const res = await fetchWithAuth("/api/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al crear la organización",
      res.status,
      data
    );
  }
  return parseOrganizationPayload(data);
}

/** PATCH /api/organizations/:id — actualizar información general de la organización. */
export async function updateOrganization(
  id: string,
  body: UpdateOrganizationBody
): Promise<OrganizationAdmin> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al actualizar la organización",
      res.status,
      data
    );
  }
  return parseOrganizationPayload(data);
}

/** GET /api/organizations/:id/branding. */
export async function getOrganizationAdminBranding(orgId: string): Promise<OrganizationBranding> {
  return getOrganizationBranding(orgId);
}

/** PATCH /api/organizations/:id/branding. */
export async function updateOrganizationAdminBranding(
  orgId: string,
  payload: UpdateOrganizationBrandingPayload
): Promise<OrganizationBranding> {
  return updateOrganizationBranding(orgId, payload);
}

/** POST /api/organizations/:id/branding/logo. */
export const uploadOrganizationAdminLogo = uploadOrganizationLogo;

/** GET /api/organizations/:id/scopes. */
export async function listOrganizationScopes(orgId: string): Promise<ScopeItem[]> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(orgId)}/scopes`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar scopes",
      res.status,
      data
    );
  }
  const parsed = data as ListScopesResponse;
  return Array.isArray(parsed.scopes) ? parsed.scopes : [];
}

/** POST /api/organizations/:id/scopes. */
export async function addOrganizationScopes(
  orgId: string,
  scopes: string[]
): Promise<{ added: number }> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(orgId)}/scopes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scopes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al agregar scopes",
      res.status,
      data
    );
  }
  return data as { added: number };
}

/** DELETE /api/organizations/:id/scopes/:scope. */
export async function removeOrganizationScope(
  orgId: string,
  scopeEncoded: string
): Promise<{ ok: boolean; removed?: number }> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/scopes/${scopeEncoded}`,
    { method: "DELETE" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al eliminar scope",
      res.status,
      data
    );
  }
  return data as { ok: boolean; removed?: number };
}

/** GET /api/organizations/:id/config. */
export async function getOrganizationConfig(orgId: string): Promise<OrganizationConfig> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(orgId)}/config`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener la configuración",
      res.status,
      data
    );
  }
  return data as OrganizationConfig;
}

/** PATCH /api/organizations/:id/config. */
export async function updateOrganizationConfig(
  orgId: string,
  payload: UpdateOrganizationConfigPayload
): Promise<OrganizationConfig> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(orgId)}/config`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al actualizar la configuración",
      res.status,
      data
    );
  }
  return data as OrganizationConfig;
}

/** GET /api/organizations/:id/config/identity. */
export async function getOrganizationIdentityConfig(
  orgId: string
): Promise<OrganizationIdentityConfig> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(orgId)}/config/identity`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener la configuración de identidad",
      res.status,
      data
    );
  }
  return data as OrganizationIdentityConfig;
}

/** PATCH /api/organizations/:id/config/identity. */
export async function updateOrganizationIdentityConfig(
  orgId: string,
  payload: OrganizationIdentityConfig
): Promise<OrganizationIdentityConfig> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(orgId)}/config/identity`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al actualizar la configuración de identidad",
      res.status,
      data
    );
  }
  return data as OrganizationIdentityConfig;
}

/** Codifica scope para DELETE (ej: auth.authentication.* → auth.authentication.%2A). */
export function encodeScopeForUrl(scope: string): string {
  return encodeURIComponent(scope);
}
