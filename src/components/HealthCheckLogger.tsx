"use client";

import {
  checkHealth,
  getStoredOrganization,
  getOrganizationScopes,
  setStoredOrganizationScopes,
} from "@/lib/auth-api";
import { useEffect } from "react";

/**
 * Al montar: llama GET /api/health y, si hay org en sesión, GET /api/organizations/:id/scopes.
 * Resultados en consola y scopes guardados + evento para el Sidebar.
 */
export function HealthCheckLogger() {
  useEffect(() => {
    checkHealth().then((result) => {
      console.log("[Health Check] GET /api/health", result);
      if (!result.ok) {
        console.warn("[Health Check] API no disponible o error:", result.status, result.data);
      }
    });

    const org = getStoredOrganization();
    if (org?.id) {
      // Optimización: si ya tenemos los scopes en sesión, no los re-pedimos en cada montaje del logger
      // a menos que sea necesario (ej. tras login).
      const existingScopes = sessionStorage.getItem("organization_scopes");
      if (existingScopes) {
        console.log("[Health Check] Scopes ya presentes en sesión, omitiendo llamado.");
        return;
      }

      const path = `/api/organizations/${org.id}/scopes`;
      console.log("[Health Check] GET", path);
      getOrganizationScopes(org.id)
        .then((items) => {
          const scopeStrings = items.map((s) => s.scope);
          setStoredOrganizationScopes(scopeStrings);
          window.dispatchEvent(new CustomEvent("organizationScopesUpdated", { detail: scopeStrings }));
          console.log("[Health Check] GET scopes OK:", scopeStrings.length, scopeStrings);
        })
        .catch((err) => {
          console.warn("[Health Check] GET scopes error:", err);
          setStoredOrganizationScopes([]);
          window.dispatchEvent(new CustomEvent("organizationScopesUpdated", { detail: [] }));
        });
    }
  }, []);

  return null;
}
