/**
 * API de administración de organizaciones (solo OWNER).
 * GET /api/organizations, GET/PATCH /api/organizations/:id, scopes.
 */
import { fetchWithAuth, AuthError } from "@/lib/auth-api";

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
  zcoins?: string;
  url_log?: string | null;
  color_a?: string | null;
  color_b?: string | null;
  created_at?: string;
  updated_at?: string;
  scopes?: string[];
  organization_type?: string;
};

export type ListOrganizationsResponse = {
  organizations: OrganizationAdmin[];
};

export type CreateOrganizationBody = {
  name: string;
  status?: string;
};

export type UpdateOrganizationBody = {
  name?: string;
  status?: string;
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

/** GET /api/organizations — listado de todas las organizaciones (solo OWNER). */
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
  const parsed = data as ListOrganizationsResponse;
  return Array.isArray(parsed.organizations) ? parsed.organizations : [];
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
  return data as OrganizationAdmin;
}

/** POST /api/organizations — crear organización (solo OWNER). */
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
  return data as OrganizationAdmin;
}

/** PATCH /api/organizations/:id — actualizar organización (name, status). */
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
  return data as OrganizationAdmin;
}

/** GET /api/organizations/:id/scopes — listar scopes de la organización. */
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

/** POST /api/organizations/:id/scopes — agregar scopes (bulk). */
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

/** DELETE /api/organizations/:id/scopes/:scope — eliminar un scope (scope URL-encoded). */
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

/** Codifica scope para DELETE (ej: auth.authentication.* → auth.authentication.%2A). */
export function encodeScopeForUrl(scope: string): string {
  return encodeURIComponent(scope);
}
