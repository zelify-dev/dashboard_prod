import type { MerchantDiscount } from "@/lib/discounts-api";

/** Compara instantes ISO (datetime-local → ISO puede diferir en ms). */
function instantCloseEnough(a: string, b: string): boolean {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return false;
  return Math.abs(ta - tb) < 2000;
}

/**
 * En PATCH de descuento, si `valid_from` / `valid_until` no cambiaron respecto al servidor,
 * se omiten del body para poder editar nombre/estado de una promo caducada sin reenviar fechas
 * (misma regla que el back cuando el body no incluye `valid_until`).
 */
export function omitUnchangedDiscountDates<T extends { valid_from?: string; valid_until?: string }>(
  payload: T,
  previous: Pick<MerchantDiscount, "valid_from" | "valid_until">
): T {
  const out = { ...payload };
  if (
    out.valid_from !== undefined &&
    previous.valid_from != null &&
    String(previous.valid_from).length > 0 &&
    instantCloseEnough(out.valid_from, String(previous.valid_from))
  ) {
    delete out.valid_from;
  }
  if (
    out.valid_until !== undefined &&
    previous.valid_until != null &&
    String(previous.valid_until).length > 0 &&
    instantCloseEnough(out.valid_until, String(previous.valid_until))
  ) {
    delete out.valid_until;
  }
  return out;
}
