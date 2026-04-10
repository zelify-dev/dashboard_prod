/**
 * Onboarding de organización — rutas bajo /api/organizations/:organizationId/onboarding/*
 */
import { AuthError, fetchWithAuth, getStoredOrganization } from "@/lib/auth-api";

function onboardingBase(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/onboarding`;
}

export function getCurrentOrganizationId(): string | null {
  return getStoredOrganization()?.id ?? null;
}

/** GET /api/organizations/:organizationId/onboarding/status */
export async function getOnboardingStatus(organizationId: string): Promise<Record<string, unknown>> {
  const res = await fetchWithAuth(`${onboardingBase(organizationId)}/status`, {
    headers: { "x-org-id": organizationId },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "No se pudo obtener el estado de onboarding",
      res.status,
      data
    );
  }
  return data as Record<string, unknown>;
}

/** Porcentaje 0–100 o null si el backend no envía el dato. */
export type OnboardingSectionPercents = {
  kyb: number | null;
  aml: number | null;
  technical: number | null;
};

function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function num(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v)) return clampPercent(v);
  return null;
}

function fromNested(v: unknown): number | null {
  if (v && typeof v === "object" && "completion_percent" in v) {
    return num((v as { completion_percent: unknown }).completion_percent);
  }
  return null;
}

/**
 * Interpreta la respuesta de GET .../onboarding/status.
 * Acepta claves planas o anidadas en `sections` (p. ej. kyb, aml, technical_documentation).
 */
export function parseOnboardingStatusPayload(data: Record<string, unknown>): OnboardingSectionPercents {
  const pick = (keys: string[], nestedObj?: Record<string, unknown>): number | null => {
    const src = nestedObj ?? data;
    for (const k of keys) {
      const v = src[k];
      const p = num(v) ?? fromNested(v);
      if (p != null) return p;
    }
    return null;
  };

  let kyb = pick(["kyb", "kyb_completion_percent", "kyb_percent"]);
  let aml = pick(["aml", "aml_documentation", "aml_completion_percent", "aml_percent"]);
  let technical = pick([
    "technical",
    "technical_documentation",
    "technical_completion_percent",
    "documentation",
    "technical_percent",
  ]);

  const sections = data.sections;
  if (sections && typeof sections === "object") {
    const s = sections as Record<string, unknown>;
    kyb = kyb ?? pick(["kyb", "kyb_completion_percent"], s);
    aml = aml ?? pick(["aml", "aml_documentation", "aml_completion_percent"], s);
    technical =
      technical ??
      pick(["technical", "technical_documentation", "documentation", "development_environments"], s);
  }

  return { kyb, aml, technical };
}

/** URL del ítem del sidebar → clave de porcentaje (no aplica a soporte). */
export function onboardingPercentForPath(
  pathnameOrUrl: string,
  percents: OnboardingSectionPercents
): number | null {
  if (pathnameOrUrl.includes("/pages/onboarding/kyb")) return percents.kyb;
  if (pathnameOrUrl.includes("/pages/onboarding/aml-documentation")) return percents.aml;
  if (pathnameOrUrl.includes("/pages/onboarding/technical-documentation")) return percents.technical;
  return null;
}

/** Dispara recarga del estado en `OnboardingStatusProvider`. */
export function notifyOnboardingStatusUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("onboardingStatusUpdated"));
}

/** POST /api/organizations/:organizationId/onboarding/kyb-files — multipart, campo `file` */
export async function postKybFiles(organizationId: string, file: File): Promise<unknown> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetchWithAuth(`${onboardingBase(organizationId)}/kyb-files`, {
    method: "POST",
    body: form,
    headers: { "x-org-id": organizationId },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al subir la documentación KYB",
      res.status,
      data
    );
  }
  return data;
}

/** POST /api/organizations/:organizationId/onboarding/aml-files — multipart, campo `file` */
export async function postAmlFiles(organizationId: string, file: File): Promise<unknown> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetchWithAuth(`${onboardingBase(organizationId)}/aml-files`, {
    method: "POST",
    body: form,
    headers: { "x-org-id": organizationId },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al subir la documentación AML",
      res.status,
      data
    );
  }
  return data;
}

export type TechnicalDocumentationFiles = {
  diagram?: File | null;
  securityPolicy?: File | null;
  certifications?: File | null;
  processDocumentation?: File | null;
};

/** POST /api/organizations/:organizationId/onboarding/technical-documentation — multipart, archivos opcionales */
export async function postTechnicalDocumentation(
  organizationId: string,
  files: TechnicalDocumentationFiles
): Promise<unknown> {
  const form = new FormData();
  if (files.diagram) form.append("data_flow_diagram", files.diagram);
  if (files.securityPolicy) form.append("security_policy", files.securityPolicy);
  if (files.certifications) form.append("certifications", files.certifications);
  if (files.processDocumentation) form.append("process_documentation", files.processDocumentation);

  const res = await fetchWithAuth(`${onboardingBase(organizationId)}/technical-documentation`, {
    method: "POST",
    body: form,
    headers: { "x-org-id": organizationId },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al enviar la documentación técnica",
      res.status,
      data
    );
  }
  return data;
}

export type DevelopmentEnvironmentsPayload = {
  /** URLs de desarrollo (texto libre o una por línea) */
  development_urls?: string;
  /** API keys de desarrollo */
  api_keys?: string;
};

/** PUT /api/organizations/:organizationId/onboarding/development-environments */
export async function putDevelopmentEnvironments(
  organizationId: string,
  payload: DevelopmentEnvironmentsPayload
): Promise<unknown> {
  const res = await fetchWithAuth(`${onboardingBase(organizationId)}/development-environments`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-org-id": organizationId,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al guardar ambientes de desarrollo",
      res.status,
      data
    );
  }
  return data;
}
