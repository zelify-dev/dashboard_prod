/**
 * API de gestión de usuarios de la organización (Teams/Members).
 * Requiere Authorization: Bearer <access_token>.
 * Solo ORG_ADMIN puede crear/editar/deshabilitar/resetear.
 */
import { fetchWithAuth, AuthError } from "@/lib/auth-api";

export type OrgUserStatus = "ACTIVE" | "DISABLED";

export type OrgUser = {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  status: OrgUserStatus;
  must_change_password: boolean;
  created_at?: string;
  updated_at?: string;
  roles?: { id: string; code: string; name: string }[];
};

export type OrgUserListItem = {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  status: OrgUserStatus;
  must_change_password: boolean;
  created_at?: string;
  updated_at?: string;
  /** Incluir en el listado para mostrar la columna Team/Role sin llamar a detalle por usuario */
  roles?: { id: string; code: string; name: string }[];
};

export type ListOrgUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrgUserStatus;
};

export type ListOrgUsersResponse = {
  items: OrgUserListItem[];
  page: number;
  limit: number;
  total: number;
};

export type CreateOrgUserBody = {
  email: string;
  full_name: string;
  roles: string[];
};

export type CreateOrgUserResponse = {
  user: OrgUser;
  temporary_password: string;
  invite_token: string | null;
};

export type UpdateOrgUserBody = {
  full_name?: string;
  status?: OrgUserStatus;
};

export type AssignRolesBody = {
  role_codes: string[];
};

/** GET /api/organizations/{orgId}/users */
export async function listOrgUsers(
  orgId: string,
  params: ListOrgUsersParams = {}
): Promise<ListOrgUsersResponse> {
  const { page = 1, limit = 20, search, status } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));
  if (search) searchParams.set("search", search);
  if (status) searchParams.set("status", status);
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/users?${searchParams}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar usuarios",
      res.status,
      data
    );
  }
  return data as ListOrgUsersResponse;
}

/** POST /api/organizations/{orgId}/users */
export async function createOrgUser(
  orgId: string,
  body: CreateOrgUserBody
): Promise<CreateOrgUserResponse> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/users`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al crear usuario",
      res.status,
      data
    );
  }
  return data as CreateOrgUserResponse;
}

/** GET /api/organizations/{orgId}/users/{userId} */
export async function getOrgUser(
  orgId: string,
  userId: string
): Promise<OrgUser> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener usuario",
      res.status,
      data
    );
  }
  return data as OrgUser;
}

/** PATCH /api/organizations/{orgId}/users/{userId} */
export async function updateOrgUser(
  orgId: string,
  userId: string,
  body: UpdateOrgUserBody
): Promise<{ ok: boolean }> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al actualizar usuario",
      res.status,
      data
    );
  }
  return data as { ok: boolean };
}

/** POST /api/organizations/{orgId}/users/{userId}/roles */
export async function assignOrgUserRoles(
  orgId: string,
  userId: string,
  body: AssignRolesBody
): Promise<{ ok: boolean }> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}/roles`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al asignar roles",
      res.status,
      data
    );
  }
  return data as { ok: boolean };
}

/** DELETE /api/organizations/{orgId}/users/{userId}/roles/{roleId} */
export async function removeOrgUserRole(
  orgId: string,
  userId: string,
  roleId: string
): Promise<{ ok: boolean }> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`,
    { method: "DELETE" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al quitar rol",
      res.status,
      data
    );
  }
  return data as { ok: boolean };
}

/** POST /api/organizations/{orgId}/users/{userId}/reset-password */
export async function resetOrgUserPassword(
  orgId: string,
  userId: string
): Promise<{ ok: boolean; temporary_password: string }> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}/reset-password`,
    { method: "POST" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al restablecer contraseña",
      res.status,
      data
    );
  }
  return data as { ok: boolean; temporary_password: string };
}
