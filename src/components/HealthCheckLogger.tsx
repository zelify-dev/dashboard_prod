"use client";

import { checkHealth } from "@/lib/auth-api";
import { useEffect } from "react";

/**
 * Al montar, llama GET /api/health y escribe el resultado en consola
 * para comprobar conexión con la API.
 */
export function HealthCheckLogger() {
  useEffect(() => {
    checkHealth().then((result) => {
      console.log("[Health Check] GET /api/health", result);
      if (!result.ok) {
        console.warn("[Health Check] API no disponible o error:", result.status, result.data);
      }
    });
  }, []);
  return null;
}
