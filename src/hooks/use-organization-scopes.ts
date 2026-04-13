"use client";

import { useEffect, useState } from "react";
import { getStoredOrganizationScopes } from "@/lib/auth-api";

/**
 * Lista de scopes de la org en sesión (sessionStorage), actualizada al dispararse
 * `organizationScopesUpdated` (p. ej. tras ScopesLoader, sidebar o syncMe).
 */
export function useOrganizationScopes(): string[] | null {
  const [scopes, setScopes] = useState<string[] | null>(() =>
    typeof window !== "undefined" ? getStoredOrganizationScopes() : null,
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string[] | undefined>;
      if (Array.isArray(ce.detail)) setScopes(ce.detail);
      else setScopes(getStoredOrganizationScopes());
    };
    window.addEventListener("organizationScopesUpdated", handler as EventListener);
    return () => window.removeEventListener("organizationScopesUpdated", handler as EventListener);
  }, []);

  return scopes;
}
