/**
 * Marcador de URL en getNavData: el sidebar abre el widget con {@link openZendeskWidget}.
 */
export const ZENDESK_SUPPORT_MENU_HREF = "__zendesk_widget__" as const;

type ZendeskGlobal = Window & {
  zE?: (...args: unknown[]) => void;
};

/** Abre el Web Widget / Messaging de Zendesk si el snippet ya cargó (o encola la acción). */
export function openZendeskWidget(): void {
  if (typeof window === "undefined") return;
  const zE = (window as ZendeskGlobal).zE;
  if (typeof zE !== "function") return;

  try {
    zE("webWidget", "open");
  } catch {
    try {
      zE("messenger", "open");
    } catch {
      /* noop */
    }
  }
}
