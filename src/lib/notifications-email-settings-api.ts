/**
 * Email sending domain / DNS — API v2 (`/api/v2/notifications/email/setting`).
 * Base: NEXT_PUBLIC_AUTH_API_URL (mismo origen que fetchWithAuth).
 */
import { AuthError, fetchWithAuth } from "@/lib/auth-api";

export type DnsRecordV2 = {
  id: string;
  category?: string;
  type: string;
  name: string;
  value: string;
  ttl?: number | null;
  priority?: number | null;
  status?: string;
};

export type DnsPublicByRecordV2 = {
  id: string;
  category?: string;
  type: string;
  name: string;
  lookup_fqdn?: string;
  matches_expected_configuration: boolean;
  expected_value?: string;
  expected_priority?: number | null;
  observed_txt?: string;
  observed_mx?: string;
  lookup_error?: string;
};

export type DnsPublicVerificationV2 = {
  checked_at: string;
  all_records_match_expected: boolean;
  by_record: DnsPublicByRecordV2[];
};

export type OrganizationEmailSettingV2 = {
  organization_id: string;
  domain: string;
  created_at: string;
  updated_at: string;
  dns_records: DnsRecordV2[];
  dns_public_verification: DnsPublicVerificationV2 | null;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/** Normaliza respuesta JSON (camelCase o snake_case). */
export function parseOrganizationEmailSettingV2(raw: unknown): OrganizationEmailSettingV2 {
  const o = asRecord(raw);
  const pickStr = (a: string, b: string) => {
    const v = o[a] ?? o[b];
    return typeof v === "string" ? v : "";
  };
  const rawRecords = o.dns_records ?? o.dnsRecords;
  const records: DnsRecordV2[] = Array.isArray(rawRecords)
    ? rawRecords.map((item) => {
        const r = asRecord(item);
        return {
          id: String(r.id ?? ""),
          category: typeof r.category === "string" ? r.category : undefined,
          type: String(r.type ?? ""),
          name: String(r.name ?? ""),
          value: String(r.value ?? ""),
          ttl: typeof r.ttl === "number" ? r.ttl : r.ttl === null ? null : undefined,
          priority: typeof r.priority === "number" ? r.priority : r.priority === null ? null : undefined,
          status: typeof r.status === "string" ? r.status : undefined,
        };
      })
    : [];

  let dns_public_verification: DnsPublicVerificationV2 | null = null;
  const rawVer = o.dns_public_verification ?? o.dnsPublicVerification;
  if (rawVer && typeof rawVer === "object") {
    const v = asRecord(rawVer);
    const byRaw = v.by_record ?? v.byRecord;
    const by_record: DnsPublicByRecordV2[] = Array.isArray(byRaw)
      ? byRaw.map((row) => {
          const b = asRecord(row);
          return {
            id: String(b.id ?? ""),
            category: typeof b.category === "string" ? b.category : undefined,
            type: String(b.type ?? ""),
            name: String(b.name ?? ""),
            lookup_fqdn: typeof b.lookup_fqdn === "string" ? b.lookup_fqdn : typeof b.lookupFqdn === "string" ? b.lookupFqdn : undefined,
            matches_expected_configuration: Boolean(
              b.matches_expected_configuration ?? b.matchesExpectedConfiguration,
            ),
            expected_value:
              typeof b.expected_value === "string"
                ? b.expected_value
                : typeof b.expectedValue === "string"
                  ? b.expectedValue
                  : undefined,
            expected_priority:
              typeof b.expected_priority === "number"
                ? b.expected_priority
                : typeof b.expectedPriority === "number"
                  ? b.expectedPriority
                  : b.expected_priority === null || b.expectedPriority === null
                    ? null
                    : undefined,
            observed_txt: typeof b.observed_txt === "string" ? b.observed_txt : typeof b.observedTxt === "string" ? b.observedTxt : undefined,
            observed_mx: typeof b.observed_mx === "string" ? b.observed_mx : typeof b.observedMx === "string" ? b.observedMx : undefined,
            lookup_error: typeof b.lookup_error === "string" ? b.lookup_error : typeof b.lookupError === "string" ? b.lookupError : undefined,
          };
        })
      : [];
    dns_public_verification = {
      checked_at: String(v.checked_at ?? v.checkedAt ?? ""),
      all_records_match_expected: Boolean(v.all_records_match_expected ?? v.allRecordsMatchExpected),
      by_record,
    };
  }

  return {
    organization_id: pickStr("organization_id", "organizationId"),
    domain: pickStr("domain", "domain"),
    created_at: pickStr("created_at", "createdAt"),
    updated_at: pickStr("updated_at", "updatedAt"),
    dns_records: records,
    dns_public_verification,
  };
}

/**
 * GET /api/v2/notifications/email/setting/:organizationId
 * @param verifyDns si true, añade ?verify_dns=true (consulta DNS público).
 * @returns null si 404 (sin configuración).
 */
export async function getOrganizationEmailSetting(
  organizationId: string,
  options?: { verifyDns?: boolean }
): Promise<OrganizationEmailSettingV2 | null> {
  const q = options?.verifyDns ? "?verify_dns=true" : "";
  const path = `/api/v2/notifications/email/setting/${encodeURIComponent(organizationId)}${q}`;
  const res = await fetchWithAuth(path, {
    headers: { "x-org-id": organizationId },
  });
  if (res.status === 404) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener la configuración de dominio",
      res.status,
      data
    );
  }
  return parseOrganizationEmailSettingV2(data);
}

export type CreateOrganizationEmailSettingPayload = {
  organization_id: string;
  domain: string;
};

/**
 * POST /api/v2/notifications/email/setting
 * 201: setting creado; 404 org; 409 ya existe.
 */
export async function createOrganizationEmailSetting(
  payload: CreateOrganizationEmailSettingPayload
): Promise<OrganizationEmailSettingV2> {
  const res = await fetchWithAuth(`/api/v2/notifications/email/setting`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-org-id": payload.organization_id,
    },
    body: JSON.stringify({
      organization_id: payload.organization_id,
      domain: payload.domain.trim(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al crear la configuración de dominio",
      res.status,
      data
    );
  }
  return parseOrganizationEmailSettingV2(data);
}
