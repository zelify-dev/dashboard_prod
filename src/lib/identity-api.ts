/**
 * API de identidad / verificación (stats por país).
 * Requiere Authorization: Bearer <access_token>. Org se toma del token (ORG_ADMIN/OWNER).
 */
import { fetchWithAuth, AuthError } from "@/lib/auth-api";

export type VerificationStatsItem = {
  country_code: string;
  country_label: string;
  status: string;
  verified_count: number;
  pending_count: number;
  failed_count: number;
};

export type VerificationStatsResponse = {
  items: VerificationStatsItem[];
};

/** GET /api/identity/verification-stats — tabla de verificación por país (verified / pending / failed). */
export async function getVerificationStats(): Promise<VerificationStatsResponse> {
  const res = await fetchWithAuth("/api/identity/verification-stats");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener estadísticas de verificación",
      res.status,
      data
    );
  }
  return data as VerificationStatsResponse;
}
