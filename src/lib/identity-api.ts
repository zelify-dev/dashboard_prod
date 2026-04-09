/**
 * API de identidad / verificación (stats por país y detalle de usuario).
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

export type IdentityVerificationDetail = {
  userId: string;
  fullName: string;
  email: string;
  status: "APPROVED" | "REJECTED" | "PENDING";
  documentData: {
    fullName: string;
    documentNumber: string;
    dateOfBirth: string;
    dateOfExpiry: string;
    sex: string;
    nationality: string;
    countryCode: string;
    documentType: string;
  };
  images: {
    frontUrl: string;
    backUrl: string | null;
    selfieUrl: string | null;
  };
  scores: {
    ocrConfidence: number | null;
    facialMatchScore: number | null;
    livenessScore: number | null;
  };
  errors: string | null;
  verifiedAt: string | null;
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

/** 
 * GET /api/identity/verifications/users/{userId} — detalle de la verificación de un usuario.
 * Incluye datos de OCR e imágenes de S3.
 */
export async function getUserVerification(userId: string): Promise<IdentityVerificationDetail> {
  const res = await fetchWithAuth(`/api/identity/verifications/users/${encodeURIComponent(userId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener detalle de verificación",
      res.status,
      data
    );
  }
  return data as IdentityVerificationDetail;
}
