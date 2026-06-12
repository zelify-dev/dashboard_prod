import { AuthError, fetchWithAuth } from "@/lib/auth-api";

export type RoleCatalogItem = {
  id: string;
  code: string;
  name?: string;
  description?: string;
};

type ListRolesResponse =
  | RoleCatalogItem[]
  | {
      roles?: RoleCatalogItem[];
      items?: RoleCatalogItem[];
    };

export async function listRoles(): Promise<RoleCatalogItem[]> {
  const res = await fetchWithAuth("/api/roles");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al listar roles",
      res.status,
      data
    );
  }

  if (Array.isArray(data)) return data as RoleCatalogItem[];
  const parsed = data as ListRolesResponse;
  if (parsed && typeof parsed === "object") {
    if ("roles" in parsed && Array.isArray(parsed.roles)) return parsed.roles;
    if ("items" in parsed && Array.isArray(parsed.items)) return parsed.items;
  }
  return [];
}
