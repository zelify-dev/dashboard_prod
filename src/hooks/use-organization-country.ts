"use client";

import { useState, useEffect, useMemo } from "react";
import { getStoredOrganization, getOrganization } from "@/lib/auth-api";
import type { OrganizationDetails } from "@/lib/auth-api";

/** Código de país normalizado (API puede devolver "EC" o "Ecuador"). */
export function toCountryCode(country: string | undefined): string | null {
  if (!country || typeof country !== "string") return null;
  const n = country.trim().toLowerCase();
  if (n === "ec" || n === "ecuador") return "EC";
  if (n === "mx" || n === "mexico" || n === "méxico") return "MX";
  if (n === "co" || n === "colombia") return "CO";
  if (n === "cl" || n === "chile") return "CL";
  if (n === "pe" || n === "peru" || n === "perú") return "PE";
  if (n === "us" || n === "united states" || n === "estados unidos") return "US";
  return null;
}

/** Nombre para mostrar del país a partir del código. */
export function countryCodeToName(code: string): string {
  const names: Record<string, string> = {
    EC: "Ecuador",
    MX: "Mexico",
    CO: "Colombia",
    CL: "Chile",
    PE: "Peru",
    US: "United States",
  };
  return names[code] ?? code;
}

/**
 * Para componentes de Identity Workflow que usan "ecuador" | "mexico" | "colombia".
 * Devuelve null si el país de la org no está soportado en ese flujo.
 */
export function toWorkflowCountryOption(countryCode: string | null): "ecuador" | "mexico" | "colombia" | null {
  if (!countryCode) return null;
  const upper = countryCode.toUpperCase();
  if (upper === "EC") return "ecuador";
  if (upper === "MX") return "mexico";
  if (upper === "CO") return "colombia";
  return null;
}

/**
 * Para componentes que usan región "ecuador" | "mexico" | "colombia" (servicios básicos, connect, etc.).
 */
export function toRegionOption(countryCode: string | null): "ecuador" | "mexico" | "colombia" | null {
  return toWorkflowCountryOption(countryCode);
}

/** Región ampliada para Servicios Básicos / Bank Account (incluye brasil y estados_unidos). */
export type ExtendedRegion = "ecuador" | "mexico" | "colombia" | "estados_unidos" | "brasil";

export function toExtendedRegion(countryCode: string | null): ExtendedRegion | null {
  if (!countryCode) return null;
  const upper = countryCode.toUpperCase();
  if (upper === "EC") return "ecuador";
  if (upper === "MX") return "mexico";
  if (upper === "CO") return "colombia";
  if (upper === "US") return "estados_unidos";
  if (upper === "BR") return "brasil";
  return null;
}

export interface UseOrganizationCountryResult {
  /** Código de país (EC, MX, CO, etc.) o null si no hay org o no se pudo resolver. */
  countryCode: string | null;
  /** Nombre para mostrar (Ecuador, Mexico, etc.). */
  countryName: string;
  /** Detalles completos de la organización. */
  organization: OrganizationDetails | null;
  /** true mientras se carga GET /api/organizations/:id. */
  loading: boolean;
  /** "ecuador" | "mexico" | "colombia" para workflows/región, o null si no aplica. */
  workflowCountry: "ecuador" | "mexico" | "colombia" | null;
  /** Región ampliada para servicios básicos / connect (incluye estados_unidos, brasil). */
  extendedRegion: ExtendedRegion | null;
}

/**
 * Hook que devuelve el país de la organización actual.
 * Usar para filtrar listas, preseleccionar país y mostrar solo opciones coherentes con la org.
 */
export function useOrganizationCountry(): UseOrganizationCountryResult {
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const orgId = typeof window !== "undefined" ? getStoredOrganization()?.id ?? null : null;

  useEffect(() => {
    if (!orgId) {
      setOrganization(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getOrganization(orgId)
      .then(setOrganization)
      .catch(() => setOrganization(null))
      .finally(() => setLoading(false));
  }, [orgId]);

  const countryCode = useMemo(() => toCountryCode(organization?.country), [organization?.country]);
  const countryName = useMemo(() => (countryCode ? countryCodeToName(countryCode) : ""), [countryCode]);
  const workflowCountry = useMemo(() => toWorkflowCountryOption(countryCode), [countryCode]);
  const extendedRegion = useMemo(() => toExtendedRegion(countryCode), [countryCode]);

  return {
    countryCode,
    countryName,
    organization,
    loading,
    workflowCountry,
    extendedRegion,
  };
}
