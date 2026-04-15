/**
 * Alinear con `src/modules/discounts/constants/commerce-input-limits.ts` en el API Nest
 * (`COMMERCE_MAX_*`). Si cambia el back, actualizar aquí también.
 */
export const COMMERCE_MAX_MONETARY_AMOUNT = 10_000_000;

/** Mismo valor que `COMMERCE_MAX_MONETARY_AMOUNT` (compat con imports existentes). */
export const MAX_MONETARY_INPUT = COMMERCE_MAX_MONETARY_AMOUNT;

export const COMMERCE_MAX_DISCOUNT_DESCRIPTION_LENGTH = 5000;

/** Alias histórico del dashboard; mismo valor que en el DTO de descuentos. */
export const DISCOUNT_DESCRIPTION_MAX_LEN = COMMERCE_MAX_DISCOUNT_DESCRIPTION_LENGTH;

export const COMMERCE_MAX_PRODUCT_DESCRIPTION_LENGTH = 5000;
