"use client";

import { useState, useEffect } from "react";
import { getStoredOrganization } from "@/lib/auth-api";
import { CLIENT_ID } from "./keys-data";

/**
 * Client ID = Organization ID cuando el usuario está logueado; si no, el valor por defecto de keys-data.
 */
export function useClientId(): string {
  const [clientId, setClientId] = useState(CLIENT_ID);

  useEffect(() => {
    const org = getStoredOrganization();
    setClientId(org?.id ?? CLIENT_ID);
  }, []);

  return clientId;
}
