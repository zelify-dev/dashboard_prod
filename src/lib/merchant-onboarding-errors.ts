import { AuthError } from "@/lib/auth-api";
import type { MerchantOnboardingFormInput } from "@/lib/merchant-onboarding-validation";

type Lang = "es" | "en";

export type MerchantOnboardingErrorField = keyof MerchantOnboardingFormInput | null;

/** Mensaje listo para UI + campo asociado (si se pudo inferir). */
export type MerchantOnboardingErrorDisplay = {
  message: string;
  field: MerchantOnboardingErrorField;
};

const FIELD_KEYS_ORDER: (keyof MerchantOnboardingFormInput)[] = [
  "merchant_slug",
  "merchant_name",
  "merchant_description",
  "merchant_logo_url",
  "merchant_type",
  "organization_name",
  "fiscal_id",
  "company_legal_name",
  "country_code",
  "website",
  "industry",
  "admin_email",
  "admin_full_name",
  "admin_phone",
  "admin_username",
  "admin_password",
];

/** Intenta asociar un texto de error (API o formateado) a un campo del formulario. */
export function inferMerchantOnboardingFieldFromText(text: string): MerchantOnboardingErrorField {
  const t = text.toLowerCase();
  for (const key of FIELD_KEYS_ORDER) {
    if (t.includes(String(key))) {
      return key;
    }
  }
  if (
    /\bslug\b/.test(t) ||
    /identificador.*slug/.test(t) ||
    (t.includes("duplicate") && t.includes("country")) ||
    (t.includes("existe") && t.includes("país"))
  ) {
    return "merchant_slug";
  }
  if (
    (t.includes("email") || t.includes("correo")) &&
    (t.includes("registrado") || t.includes("registered") || t.includes("already") || t.includes("exist"))
  ) {
    return "admin_email";
  }
  if (t.includes("country") && (t.includes("code") || t.includes("país"))) {
    return "country_code";
  }
  return null;
}

function inferFieldFromAuthBody(body: unknown): MerchantOnboardingErrorField {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const parts: string[] = [];
  const msg = o.message;
  if (typeof msg === "string") parts.push(msg);
  if (Array.isArray(msg)) {
    for (const x of msg) {
      if (typeof x === "string") parts.push(x);
    }
  }
  const joined = parts.join(" ");
  return inferMerchantOnboardingFieldFromText(joined);
}

/**
 * Mensaje UX + campo para mostrar el error bajo el input correspondiente.
 * Usar en el catch del onboarding pasando el **`err` original** (para leer `body` del 400).
 */
export function getMerchantOnboardingErrorDisplay(
  err: unknown,
  lang: Lang = "es",
): MerchantOnboardingErrorDisplay {
  const message = formatMerchantOnboardingError(err, lang);
  let field = inferMerchantOnboardingFieldFromText(message);
  if (!field && err instanceof AuthError) {
    field = inferFieldFromAuthBody(err.body);
  }
  if (!field && err instanceof AuthError && typeof err.message === "string") {
    field = inferMerchantOnboardingFieldFromText(err.message);
  }
  return { message, field };
}

/** Reemplaza nombres de campo técnicos (snake_case) por etiquetas legibles si el API no devuelve mensaje ya redactado. */
function replaceTechnicalFieldNames(message: string, lang: Lang): string {
  const pairs: [string, string][] =
    lang === "es"
      ? [
          ["merchant_slug", "identificador (slug) del comercio"],
          ["country_code", "código de país"],
          ["admin_email", "correo del administrador"],
          ["admin_username", "usuario del administrador"],
          ["admin_full_name", "nombre del administrador"],
          ["admin_phone", "teléfono del administrador"],
          ["fiscal_id", "identificador fiscal"],
          ["organization_name", "nombre de la organización"],
          ["merchant_name", "nombre del comercio"],
          ["company_legal_name", "razón social"],
          ["merchant_description", "descripción"],
          ["merchant_logo_url", "URL del logo"],
          ["merchant_type", "tipo de comercio"],
        ]
      : [
          ["merchant_slug", "merchant URL identifier (slug)"],
          ["country_code", "country code"],
          ["admin_email", "admin email"],
          ["admin_username", "admin username"],
          ["admin_full_name", "admin full name"],
          ["admin_phone", "admin phone"],
          ["fiscal_id", "tax ID"],
          ["organization_name", "organization name"],
          ["merchant_name", "merchant name"],
          ["company_legal_name", "legal company name"],
          ["merchant_description", "description"],
          ["merchant_logo_url", "logo URL"],
          ["merchant_type", "merchant type"],
        ];

  let out = message;
  for (const [token, label] of pairs) {
    if (out.includes(token)) {
      out = out.split(token).join(label);
    }
  }
  // Palabra "slug" suelta (p. ej. "... y slug")
  if (/\bslug\b/i.test(out) && !out.includes(lang === "es" ? "identificador" : "identifier")) {
    out = out.replace(/\bslug\b/gi, lang === "es" ? "identificador (slug)" : "slug");
  }
  return out;
}

type Matcher = { test: (normalized: string) => boolean; es: string; en: string };

const ONBOARDING_MESSAGE_MATCHERS: Matcher[] = [
  {
    test: (m) =>
      (m.includes("country_code") || m.includes("country code")) &&
      m.includes("slug") &&
      (m.includes("existe") || m.includes("exist") || m.includes("duplicate") || m.includes("conflict")),
    es: "Ya existe un comercio con el mismo identificador (slug) para ese país. Cambia el slug o el código de país e inténtalo de nuevo.",
    en: "A merchant with the same URL identifier (slug) already exists for that country. Change the slug or country code and try again.",
  },
  {
    test: (m) =>
      m.includes("slug") &&
      (m.includes("en uso") || m.includes("in use") || m.includes("taken") || m.includes("not unique")),
    es: "Ese slug ya está en uso. Elige otro identificador.",
    en: "That slug is already in use. Choose another identifier.",
  },
  {
    test: (m) =>
      m.includes("email") &&
      (m.includes("existe") || m.includes("exist") || m.includes("already") || m.includes("registrado")),
    es: "Ese correo ya está registrado. Usa otro correo para el administrador.",
    en: "That email is already registered. Use another admin email.",
  },
];

/**
 * Mensaje UX para errores del POST /api/discounts/merchants/onboarding (Owner).
 * Prioriza mensajes claros para 409 / duplicados; evita mostrar nombres de campo en crudo cuando es posible.
 */
export function formatMerchantOnboardingError(err: unknown, lang: Lang = "es"): string {
  const fallback =
    lang === "es"
      ? "No se pudo crear el comercio. Revisa los datos e inténtalo de nuevo."
      : "Could not create the merchant. Check the data and try again.";

  if (!(err instanceof Error)) {
    return fallback;
  }

  const raw = err.message?.trim() ?? "";
  if (!raw) {
    return fallback;
  }

  const normalized = raw.toLowerCase();

  for (const row of ONBOARDING_MESSAGE_MATCHERS) {
    if (row.test(normalized)) {
      return lang === "es" ? row.es : row.en;
    }
  }

  if (err instanceof AuthError && err.statusCode === 409) {
    const softened = replaceTechnicalFieldNames(raw, lang);
    return (
      (lang === "es"
        ? "No se puede completar el registro (conflicto). "
        : "The registration could not be completed (conflict). ") + softened
    );
  }

  return replaceTechnicalFieldNames(raw, lang);
}
