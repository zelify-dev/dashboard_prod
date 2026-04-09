import { AuthError, fetchWithAuth, getStoredOrganization } from "@/lib/auth-api";

export type UserTransactionCounterparty = {
  id: string;
  full_name?: string;
  photo?: string | null;
  email?: string;
};

export type UserTransactionItem = {
  id: string;
  account_id: string;
  type: string;
  direction?: "IN" | "OUT" | string;
  amount: string;
  currency: string;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  balance_after?: string;
  created_at?: string;
  bank_name?: string;
  note?: string;
  counterparty?: UserTransactionCounterparty | null;
  [key: string]: unknown;
};

export type UserTransactionHistoryResponse = {
  user_id: string;
  account_id?: string;
  items: UserTransactionItem[];
  total?: number;
  page?: number;
  limit?: number;
};

function getActiveOrganizationId(): string | null {
  const org = getStoredOrganization();
  return org?.id ?? null;
}

export async function getUserTransactionHistory(params: {
  organizationId?: string;
  userId: string;
  accountId?: string;
  page?: number;
  limit?: number;
}): Promise<UserTransactionHistoryResponse> {
  const orgId = params.organizationId ?? getActiveOrganizationId();
  if (!orgId) {
    throw new AuthError("No hay organización activa. Inicia sesión de nuevo.", 401, {});
  }
  if (!params.userId?.trim()) {
    throw new AuthError("userId es requerido para consultar el historial.", 400, {});
  }

  const query = new URLSearchParams();
  if (params.accountId?.trim()) query.set("account_id", params.accountId.trim());
  if (typeof params.page === "number") query.set("page", String(params.page));
  if (typeof params.limit === "number") query.set("limit", String(params.limit));

  const path = `/api/organizations/${encodeURIComponent(orgId)}/users/${encodeURIComponent(
    params.userId.trim(),
  )}/transactions${query.toString() ? `?${query.toString()}` : ""}`;

  const res = await fetchWithAuth(path, { method: "GET" });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AuthError(
      (data as any)?.message ?? "Error al obtener el historial de transacciones",
      res.status,
      data,
    );
  }

  const safe = (data ?? {}) as Partial<UserTransactionHistoryResponse>;
  return {
    user_id: String(safe.user_id ?? params.userId),
    account_id: safe.account_id ?? params.accountId,
    items: Array.isArray(safe.items) ? (safe.items as UserTransactionItem[]) : [],
    total: typeof safe.total === "number" ? safe.total : undefined,
    page: typeof safe.page === "number" ? safe.page : params.page,
    limit: typeof safe.limit === "number" ? safe.limit : params.limit,
  };
}

