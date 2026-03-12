"use client";

import { useEffect } from "react";
import {
  getStoredOrganization,
  getOrganizationScopes,
  setStoredOrganizationScopes,
} from "@/lib/auth-api";

/**
 * Se monta cuando el usuario está autenticado (dentro de DashboardLayout).
 * Hace GET /api/organizations/:id/scopes y guarda en storage + dispara evento para el Sidebar.
 */
export function ScopesLoader() {
  useEffect(() => {
    const org = getStoredOrganization();
    console.log("[ScopesLoader] mount — org:", org ? { id: org.id, name: org.name } : null);
    if (!org?.id) {
      console.log("[ScopesLoader] Sin org.id, no se llama a scopes.");
      return;
    }
    const path = `/api/organizations/${org.id}/scopes`;
    console.log("[ScopesLoader] Llamando GET", path);
    getOrganizationScopes(org.id)
      .then((items) => {
        const scopeStrings = items.map((s) => s.scope);
        setStoredOrganizationScopes(scopeStrings);
        window.dispatchEvent(new CustomEvent("organizationScopesUpdated", { detail: scopeStrings }));
        console.log("[ScopesLoader] GET scopes OK:", scopeStrings.length, scopeStrings);
      })
      .catch((err) => {
        console.warn("[ScopesLoader] GET scopes error:", err);
        setStoredOrganizationScopes([]);
        window.dispatchEvent(new CustomEvent("organizationScopesUpdated", { detail: [] }));
      });
  }, []);

  return null;
}
