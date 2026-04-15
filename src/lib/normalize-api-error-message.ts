/**
 * Unifica el texto de error del body JSON del API.
 *
 * Nest **ValidationPipe** suele devolver `message` como **string[]**;
 * **BadRequestException** (u otros) del servicio suele usar **string**.
 * En ambos casos el front debe mostrar un único texto legible.
 */
export function messageFromApiErrorBody(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const raw = (data as { message?: unknown }).message;

  if (typeof raw === "string") {
    const s = raw.trim();
    return s || fallback;
  }

  if (Array.isArray(raw) && raw.length > 0) {
    const parts = raw
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) return parts.join(" ");
  }

  return fallback;
}
