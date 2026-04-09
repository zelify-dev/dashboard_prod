import { AuthError, fetchWithAuth, getStoredOrganization } from "@/lib/auth-api";

export type InternationalTransferUser = {
  id: string;
  full_name?: string;
  email?: string;
};

export type InternationalTransferItem = {
  id: string;
  transaction_id: string;
  from_organization_id: string;
  to_organization_id: string;
  from_user_id?: string;
  to_user_id?: string;
  recipient_country?: string;
  recipient_bank?: string;
  recipient_account?: string;
  recipient_name?: string;
  sent_amount?: string;
  sent_currency?: string;
  received_amount?: string;
  received_currency?: string;
  fx_rate?: string;
  note?: string;
  created_at?: string;
  from_user?: InternationalTransferUser | null;
  to_user?: InternationalTransferUser | null;
  [key: string]: unknown;
};

export function getActiveOrganizationId(): string | null {
  const org = getStoredOrganization();
  return org?.id ?? null;
}

export async function listInternationalTransfers(
  organizationId?: string,
): Promise<InternationalTransferItem[]> {
  const orgId = organizationId ?? getActiveOrganizationId();
  if (!orgId) {
    throw new AuthError(
      "No hay organización activa. Inicia sesión de nuevo.",
      401,
      {},
    );
  }

  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/transfers/international`,
    { method: "GET" },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AuthError(
      (data as any)?.message ?? "Error al obtener transferencias internacionales",
      res.status,
      data,
    );
  }

  return (Array.isArray(data) ? data : []) as InternationalTransferItem[];
}

