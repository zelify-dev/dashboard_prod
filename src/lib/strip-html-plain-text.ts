/**
 * Elimina fragmentos `<...>` típicos de HTML en campos pensados como texto plano antes de guardar.
 * Refuerzo en cliente frente a stored XSS; React ya escapa al renderizar `{texto}`.
 * El API debe seguir validando/sanitizando según política de seguridad.
 */
export function stripHtmlTagsFromPlainText(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}
