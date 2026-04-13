import { AuthError, fetchWithAuth } from "@/lib/auth-api";

export interface LogItem {
  id: string;
  service?: string;
  operation?: string;
  status_code?: number | string;
  request_id?: string;
  environment?: string;
  type?: string;
  organization_id?: string;
  api_key_id?: string | null;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

export interface GetLogsResponse {
  items: LogItem[];
  total: number;
  page: number;
  limit: number;
}

export interface GetLogsParams {
  page?: number;
  limit?: number;
  service?: string;
  operation?: string;
  environment?: string;
  type?: string;
  status_code?: number | string;
  request_id?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
}

function headersWithOrg(organizationId: string): Record<string, string> {
  return { "x-org-id": organizationId };
}

/**
 * GET /logs
 * Fetches paginated logs for an organization.
 */
export async function getLogs(
  organizationId: string,
  params: GetLogsParams = {}
): Promise<GetLogsResponse> {
  const query = new URLSearchParams();
  
  query.set("organization_id", organizationId);
  
  if (params.page !== undefined) query.set("page", params.page.toString());
  if (params.limit !== undefined) query.set("limit", params.limit.toString());
  else query.set("limit", "50"); // Default limit from contract
  
  if (params.service) query.set("service", params.service);
  if (params.operation) query.set("operation", params.operation);
  if (params.environment) query.set("environment", params.environment);
  if (params.type) query.set("type", params.type);
  if (params.status_code) query.set("status_code", params.status_code.toString());
  if (params.request_id) query.set("request_id", params.request_id);
  if (params.search) query.set("search", params.search);
  if (params.from_date) query.set("from_date", params.from_date);
  if (params.to_date) query.set("to_date", params.to_date);

  const res = await fetchWithAuth(
    `/api/logs?${query.toString()}`,
    { headers: headersWithOrg(organizationId) }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener logs",
      res.status,
      data
    );
  }

  return data as GetLogsResponse;
}
