/**
 * Alinear con `src/modules/discounts/constants/merchant-onboarding-limits.ts` en el API Nest.
 */
/**
 * Slug — `@MaxLength(50)` + `@Matches` en OnboardMerchantDto.
 * (Algunos informes de QA pedían 20; el límite acordado con API es **50** + `maxLength` en el modal.)
 */
export const MERCHANT_SLUG_MAX_LEN = 50;

/** Descripción — `@MaxLength(5000)` en DTO (nombre en back: `MERCHANT_ONBOARDING_DESCRIPTION_MAX_LEN`). */
export const MERCHANT_ONBOARDING_DESCRIPTION_MAX_LEN = 5000;

/** Alias usado en el modal / validación. */
export const MERCHANT_DESCRIPTION_MAX_LEN = MERCHANT_ONBOARDING_DESCRIPTION_MAX_LEN;

/** Nombre de organización — `@MaxLength(200)` en DTO. */
export const ORGANIZATION_NAME_MAX_LEN = 200;

/** Contraseña admin opcional — `@MinLength(8)` `@MaxLength(128)` + complejidad en DTO. */
export const ADMIN_PASSWORD_MIN_LEN = 8;
export const ADMIN_PASSWORD_MAX_LEN = 128;
