import {
  ADMIN_PASSWORD_MAX_LEN,
  ADMIN_PASSWORD_MIN_LEN,
  MERCHANT_DESCRIPTION_MAX_LEN,
  MERCHANT_SLUG_MAX_LEN,
  ORGANIZATION_NAME_MAX_LEN,
} from "@/lib/merchant-onboarding-limits";

/** Misma forma que el modal; definida aquí para evitar dependencia circular con el componente. */
export type MerchantOnboardingFormInput = {
  country_code: string;
  merchant_name: string;
  merchant_slug: string;
  merchant_description?: string;
  merchant_logo_url?: string;
  merchant_type?: string;
  organization_name?: string;
  fiscal_id?: string;
  company_legal_name?: string;
  website?: string;
  industry?: string;
  admin_full_name: string;
  admin_email: string;
  admin_phone?: string;
  admin_username?: string;
  admin_password?: string;
};

export type MerchantOnboardingValidationFailure = {
  ok: false;
  message: string;
  field: keyof MerchantOnboardingFormInput;
};

export type MerchantOnboardingValidationResult =
  | { ok: true }
  | MerchantOnboardingValidationFailure;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isProbablyAbsoluteUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const COPY = {
  es: {
    country: "El código de país debe ser exactamente 2 letras (ISO, p. ej. EC).",
    merchantName: "El nombre del comercio es obligatorio.",
    slug: "El identificador (slug) del comercio es obligatorio y solo puede usar letras, números y guiones.",
    slugTooLong: `El slug no puede superar ${MERCHANT_SLUG_MAX_LEN} caracteres.`,
    adminName: "El nombre completo del administrador es obligatorio.",
    adminEmail: "Introduce un correo electrónico válido (debe incluir @ y dominio).",
    logoUrl: "La URL del logo no es válida. Usa una dirección que empiece por http:// o https://",
    website: "La URL del sitio web no es válida. Usa http:// o https:// o deja el campo vacío.",
    descriptionTooLong: `La descripción no puede superar ${MERCHANT_DESCRIPTION_MAX_LEN} caracteres.`,
    organizationNameTooLong: `El nombre de la organización no puede superar ${ORGANIZATION_NAME_MAX_LEN} caracteres.`,
    adminPassword:
      "Si indicas contraseña, debe tener entre 8 y 128 caracteres e incluir al menos una letra y un número.",
  },
  en: {
    country: "Country code must be exactly 2 letters (ISO, e.g. EC).",
    merchantName: "Merchant name is required.",
    slug: "Merchant URL identifier (slug) is required and may only use letters, numbers, and hyphens.",
    slugTooLong: `The slug cannot exceed ${MERCHANT_SLUG_MAX_LEN} characters.`,
    adminName: "Admin full name is required.",
    adminEmail: "Enter a valid email address (must include @ and a domain).",
    logoUrl: "Logo URL is invalid. Use an address starting with http:// or https://",
    website: "Website URL is invalid. Use http:// or https:// or leave the field empty.",
    descriptionTooLong: `Description cannot exceed ${MERCHANT_DESCRIPTION_MAX_LEN} characters.`,
    organizationNameTooLong: `Organization name cannot exceed ${ORGANIZATION_NAME_MAX_LEN} characters.`,
    adminPassword:
      "If you set a password, it must be 8–128 characters and include at least one letter and one number.",
  },
} as const;

function slugPatternOk(slug: string): boolean {
  const s = slug.trim();
  if (!s) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
}

/** Misma idea que el DTO: letra + dígito, longitud 8–128 (solo si el usuario envía contraseña). */
function optionalAdminPasswordOk(raw: string): boolean {
  const p = raw.trim();
  if (!p) return true;
  if (p.length < ADMIN_PASSWORD_MIN_LEN || p.length > ADMIN_PASSWORD_MAX_LEN) return false;
  return /^(?=.*[A-Za-z])(?=.*\d).+$/.test(p);
}

/**
 * Validación del formulario de alta de comercio (Owner), sin depender del mensaje nativo del navegador.
 */
export function validateMerchantOnboardingForm(
  data: MerchantOnboardingFormInput,
  lang: "es" | "en",
): MerchantOnboardingValidationResult {
  const t = COPY[lang];

  const cc = data.country_code.trim().toUpperCase();
  if (!cc || !/^[A-Z]{2}$/.test(cc)) {
    return { ok: false, message: t.country, field: "country_code" };
  }

  if (!data.merchant_name.trim()) {
    return { ok: false, message: t.merchantName, field: "merchant_name" };
  }

  const slugTrim = data.merchant_slug.trim();
  if (!slugPatternOk(slugTrim)) {
    return { ok: false, message: t.slug, field: "merchant_slug" };
  }
  if (slugTrim.length > MERCHANT_SLUG_MAX_LEN) {
    return { ok: false, message: t.slugTooLong, field: "merchant_slug" };
  }

  const desc = data.merchant_description?.trim() ?? "";
  if (desc.length > MERCHANT_DESCRIPTION_MAX_LEN) {
    return { ok: false, message: t.descriptionTooLong, field: "merchant_description" };
  }

  const orgName = data.organization_name?.trim() ?? "";
  if (orgName.length > ORGANIZATION_NAME_MAX_LEN) {
    return { ok: false, message: t.organizationNameTooLong, field: "organization_name" };
  }

  if (!optionalAdminPasswordOk(data.admin_password ?? "")) {
    return { ok: false, message: t.adminPassword, field: "admin_password" };
  }

  if (!data.admin_full_name.trim()) {
    return { ok: false, message: t.adminName, field: "admin_full_name" };
  }

  const email = data.admin_email.trim();
  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, message: t.adminEmail, field: "admin_email" };
  }

  const logo = data.merchant_logo_url?.trim() ?? "";
  if (logo && !isProbablyAbsoluteUrl(logo)) {
    return { ok: false, message: t.logoUrl, field: "merchant_logo_url" };
  }

  const web = data.website?.trim() ?? "";
  if (web && !isProbablyAbsoluteUrl(web)) {
    return { ok: false, message: t.website, field: "website" };
  }

  return { ok: true };
}
