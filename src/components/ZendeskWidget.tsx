"use client";

import Script from "next/script";
import { useEffect } from "react";

const ZENDESK_SNIPPET_SRC =
  "https://static.zdassets.com/ekr/snippet.js?key=d5cd695b-4e08-4fee-b670-605aebce147f";

/**
 * Carga el widget de Zendesk solo en el árbol del dashboard (usuario ya autenticado).
 * Al salir (p. ej. a login), se oculta el launcher al desmontar.
 */
export function ZendeskWidget() {
  useEffect(() => {
    return () => {
      const w = window as Window & { zE?: (...args: unknown[]) => void };
      if (typeof w.zE !== "function") return;
      try {
        w.zE("webWidget", "hide");
      } catch {
        try {
          w.zE("messenger", "hide");
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  return (
    <Script
      id="ze-snippet"
      src={ZENDESK_SNIPPET_SRC}
      strategy="afterInteractive"
    />
  );
}
