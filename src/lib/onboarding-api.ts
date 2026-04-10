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

/** Documento técnico anidado `{ uploaded: boolean }` (contrato App Runner). */
function docSlotUploaded(obj: Record<string, unknown>, key: string): boolean {
  const v = obj[key];
  if (!v || typeof v !== "object") return false;
  return (v as Record<string, unknown>).uploaded === true;
}

/** Ambientes de desarrollo: hay datos guardados si URLs, keys o updated_at. */
function developmentEnvironmentsHasData(de: Record<string, unknown>): boolean {
  const urls = de.development_urls;
  if (Array.isArray(urls) && urls.length > 0) return true;
  const keys = de.development_api_keys;
  if (typeof keys === "string" && keys.trim().length > 0) return true;
  if (de.updated_at != null && de.updated_at !== "") return true;
  return false;
}

/**
 * Interpreta la respuesta de GET .../onboarding/status.
 * Acepta claves planas o anidadas en `sections` (p. ej. kyb, aml, technical_documentation).
 * Si el backend no envía porcentajes numéricos, los deriva de `kyb_files`, `aml_files`,
 * `technical_documentation` y `development_environments` (contrato documentado).
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

  /** Forma oficial: kyb_files / aml_files con uploaded. */
  const kybFiles = data.kyb_files;
  if (kyb == null && kybFiles && typeof kybFiles === "object") {
    kyb = (kybFiles as Record<string, unknown>).uploaded === true ? 100 : 0;
  }
  const amlFiles = data.aml_files;
  if (aml == null && amlFiles && typeof amlFiles === "object") {
    aml = (amlFiles as Record<string, unknown>).uploaded === true ? 100 : 0;
  }

  /** Progreso técnico: 4 documentos + 1 slot ambientes = 5 partes (0–100). */
  const td = data.technical_documentation;
  if (technical == null && td && typeof td === "object") {
    const t = td as Record<string, unknown>;
    let done = 0;
    if (docSlotUploaded(t, "flow_diagram")) done += 1;
    if (docSlotUploaded(t, "security_policy")) done += 1;
    if (docSlotUploaded(t, "certifications")) done += 1;
    if (docSlotUploaded(t, "process_documentation")) done += 1;
    const de = data.development_environments;
    if (de && typeof de === "object" && developmentEnvironmentsHasData(de as Record<string, unknown>)) {
      done += 1;
    }
    technical = clampPercent((done / 5) * 100);
  }

  /** Solo ambientes guardados, sin bloque anterior (p. ej. falta technical_documentation en payload). */
  if (technical == null) {
    const deOnly = data.development_environments;
    if (deOnly && typeof deOnly === "object" && developmentEnvironmentsHasData(deOnly as Record<string, unknown>)) {
      technical = clampPercent(20);
    }
  }

  return { kyb, aml, technical };
}

/** Estado derivado de GET .../onboarding/status para deshabilitar campos ya completados tras recargar. */
export type OnboardingModuleFlags = {
  /** KYB: archivo ya enviado — no permitir otra subida salvo que el backend indique lo contrario. */
  kybLocked: boolean;
  amlLocked: boolean;
  technical: {
    diagram: boolean;
    securityPolicy: boolean;
    certifications: boolean;
    processDocumentation: boolean;
    developmentEnvironmentsLocked: boolean;
  };
};

function boolish(v: unknown): boolean {
  if (v === true) return true;
  if (v === false || v == null) return false;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    return s === "true" || s === "1" || s === "complete" || s === "completed" || s === "uploaded";
  }
  return false;
}

function lockedFromPercent(p: number | null, completeAt100: boolean): boolean {
  if (p == null) return false;
  return completeAt100 ? p >= 100 : p >= 100;
}

/**
 * Interpreta flags de bloqueo / “ya enviado”. Combina booleanos explícitos del API con porcentaje === 100.
 */
export function parseOnboardingModuleFlags(
  data: Record<string, unknown>,
  percents: OnboardingSectionPercents
): OnboardingModuleFlags {
  const root = data;

  const pickKybLocked = (): boolean => {
    const kybFiles = root.kyb_files;
    if (kybFiles && typeof kybFiles === "object") {
      if (boolish((kybFiles as Record<string, unknown>).uploaded)) return true;
    }
    if (boolish(root.kyb_locked)) return true;
    if (boolish(root.kyb_file_uploaded)) return true;
    if (boolish(root.kyb_uploaded)) return true;
    if (boolish(root.kyb_completed)) return true;
    if (boolish(root.kyb_file_received)) return true;
    if (boolish(root.kyb_has_file)) return true;
    const k = root.kyb;
    if (k && typeof k === "object") {
      const o = k as Record<string, unknown>;
      if (boolish(o.uploaded)) return true;
      if (boolish(o.file_uploaded)) return true;
      if (boolish(o.completed)) return true;
      if (boolish(o.locked)) return true;
    }
    const m = root.modules;
    if (m && typeof m === "object") {
      const ky = (m as Record<string, unknown>).kyb;
      if (ky && typeof ky === "object") {
        const o = ky as Record<string, unknown>;
        if (boolish(o.uploaded)) return true;
        if (boolish(o.completed)) return true;
      }
    }
    if (lockedFromPercent(percents.kyb, true)) return true;
    /** Si el backend solo envía porcentaje y ya hay progreso (>0), asumimos envío registrado (un solo ZIP). */
    if (percents.kyb != null && percents.kyb > 0) return true;
    return false;
  };

  const pickAmlLocked = (): boolean => {
    const amlFiles = root.aml_files;
    if (amlFiles && typeof amlFiles === "object") {
      if (boolish((amlFiles as Record<string, unknown>).uploaded)) return true;
    }
    if (boolish(root.aml_locked)) return true;
    if (boolish(root.aml_file_uploaded)) return true;
    if (boolish(root.aml_uploaded)) return true;
    if (boolish(root.aml_completed)) return true;
    if (boolish(root.aml_has_file)) return true;
    const a = root.aml;
    if (a && typeof a === "object") {
      const o = a as Record<string, unknown>;
      if (boolish(o.uploaded)) return true;
      if (boolish(o.file_uploaded)) return true;
      if (boolish(o.completed)) return true;
    }
    const m = root.modules;
    if (m && typeof m === "object") {
      const am = (m as Record<string, unknown>).aml;
      if (am && typeof am === "object") {
        const o = am as Record<string, unknown>;
        if (boolish(o.uploaded)) return true;
        if (boolish(o.completed)) return true;
      }
    }
    if (lockedFromPercent(percents.aml, true)) return true;
    if (percents.aml != null && percents.aml > 0) return true;
    return false;
  };

  const techRoot = (): Record<string, unknown> => {
    const td = root.technical_documentation;
    if (td && typeof td === "object") return td as Record<string, unknown>;
    const t = root.technical;
    if (t && typeof t === "object") return t as Record<string, unknown>;
    const m = root.modules;
    if (m && typeof m === "object") {
      const tech = (m as Record<string, unknown>).technical_documentation;
      if (tech && typeof tech === "object") return tech as Record<string, unknown>;
    }
    return {};
  };

  const fileLocked = (obj: Record<string, unknown>, keys: string[]): boolean => {
    for (const k of keys) {
      const v = obj[k];
      if (boolish(v)) return true;
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        if (boolish(o.uploaded)) return true;
        if (boolish(o.completed)) return true;
      }
    }
    return false;
  };

  const t = techRoot();
  const diagram = fileLocked(t, [
    "data_flow_diagram",
    "data_flow_diagram_uploaded",
    "diagram",
    "flow_diagram",
  ]);
  const securityPolicy = fileLocked(t, ["security_policy", "security_policy_uploaded"]);
  const certifications = fileLocked(t, ["certifications", "certifications_uploaded"]);
  const processDocumentation = fileLocked(t, ["process_documentation", "processes", "process_documentation_uploaded"]);

  let devLocked = false;
  if (boolish(root.development_environments_locked)) devLocked = true;
  if (boolish(root.development_environments_saved)) devLocked = true;
  const de = root.development_environments;
  if (de && typeof de === "object") {
    const o = de as Record<string, unknown>;
    if (boolish(o.saved)) devLocked = true;
    if (boolish(o.completed)) devLocked = true;
    if (developmentEnvironmentsHasData(o)) devLocked = true;
  }

  return {
    kybLocked: pickKybLocked(),
    amlLocked: pickAmlLocked(),
    technical: {
      diagram,
      securityPolicy,
      certifications,
      processDocumentation,
      developmentEnvironmentsLocked:
        devLocked || boolish(t.development_environments_saved),
    },
  };
}

/** Percents + flags en una sola pasada (misma respuesta GET). */
export function parseOnboardingStatusFull(data: Record<string, unknown>): {
  percents: OnboardingSectionPercents;
  flags: OnboardingModuleFlags;
} {
  const percents = parseOnboardingStatusPayload(data);
  const flags = parseOnboardingModuleFlags(data, percents);
  return { percents, flags };
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
