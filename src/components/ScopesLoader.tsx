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
    if (!org?.id) {
      return;
    }
    getOrganizationScopes(org.id)
      .then((items) => {
        const scopeStrings = items.map((s) => s.scope);
        setStoredOrganizationScopes(scopeStrings);
        window.dispatchEvent(new CustomEvent("organizationScopesUpdated", { detail: scopeStrings }));
      })
      .catch((err) => {
        console.warn("[ScopesLoader] GET scopes error:", err);
        setStoredOrganizationScopes([]);
        window.dispatchEvent(new CustomEvent("organizationScopesUpdated", { detail: [] }));
      });
  }, []);

  return null;
}
