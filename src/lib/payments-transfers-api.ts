import { AuthError, fetchWithAuth, getStoredOrganization } from "@/lib/auth-api";

export type InternalTransferContact = {
  id: string;
  type: string;
  user_id?: string;
  alias?: string;
  [key: string]: unknown;
};

export type InternalTransferItem = {
  id: string;
  organization_id: string;
  from_user_id?: string;
  to_user_id?: string;
  contact_id?: string;
  contact?: InternalTransferContact | null;
  created_by_user_id?: string;
  created_by_user?: { id: string; full_name?: string; email?: string } | null;
  amount?: string;
  currency?: string;
  note?: string;
  category?: string;
  from_account_id?: string;
  to_account_id?: string;
  transaction_id?: string;
  created_at?: string;
  from_user?: { id: string; full_name?: string; email?: string } | null;
  to_user?: { id: string; full_name?: string; email?: string } | null;
  [key: string]: unknown;
};

export type InterbankTransferContact = {
  id: string;
  type: string;
  full_name?: string;
  cedula?: string;
  email?: string;
  account_type?: string;
  institution?: string;
  account_number?: string;
  [key: string]: unknown;
};

export type InterbankTransferItem = {
  id: string;
  organization_id: string;
  contact_id?: string;
  contact?: InterbankTransferContact | null;
  created_by_user_id?: string;
  created_by_user?: { id: string; full_name?: string; email?: string } | null;
  amount?: string;
  currency?: string;
  commission?: string;
  status?: string;
  note?: string;
  scheduled_at?: string | null;
  created_at?: string;
  [key: string]: unknown;
};

function getActiveOrganizationId(): string | null {
  const org = getStoredOrganization();
  return org?.id ?? null;
}

export async function listInternalTransfers(organizationId?: string): Promise<InternalTransferItem[]> {
  const orgId = organizationId ?? getActiveOrganizationId();
  if (!orgId) throw new AuthError("No hay organización activa. Inicia sesión de nuevo.", 401, {});

  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/transfers/internal`,
    { method: "GET" },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AuthError(
      (data as any)?.message ?? "Error al obtener transferencias internas",
      res.status,
      data,
    );
  }
  return (Array.isArray(data) ? data : []) as InternalTransferItem[];
}

export async function listInterbankTransfers(organizationId?: string): Promise<InterbankTransferItem[]> {
  const orgId = organizationId ?? getActiveOrganizationId();
  if (!orgId) throw new AuthError("No hay organización activa. Inicia sesión de nuevo.", 401, {});

  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/transfers/interbank`,
    { method: "GET" },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AuthError(
      (data as any)?.message ?? "Error al obtener transferencias interbancarias",
      res.status,
      data,
    );
  }
  return (Array.isArray(data) ? data : []) as InterbankTransferItem[];
}

