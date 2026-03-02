"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ZelifyKeysDataContextValue = {
  /** API Key actual (zk_...) para "Key Name" en Copy all. */
  apiKey: string | null;
  /** Secret revelado (solo en memoria); null si no se ha revelado. */
  apiSecret: string | null;
  setKeysData: (apiKey: string | null, apiSecret: string | null) => void;
};

const ZelifyKeysDataContext = createContext<ZelifyKeysDataContextValue | null>(null);

export function ZelifyKeysDataProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiSecret, setApiSecret] = useState<string | null>(null);

  const setKeysData = useCallback((key: string | null, secret: string | null) => {
    setApiKey(key);
    setApiSecret(secret);
  }, []);

  return (
    <ZelifyKeysDataContext.Provider value={{ apiKey, apiSecret, setKeysData }}>
      {children}
    </ZelifyKeysDataContext.Provider>
  );
}

export function useZelifyKeysData() {
  const ctx = useContext(ZelifyKeysDataContext);
  return ctx ?? { apiKey: null, apiSecret: null, setKeysData: () => {} };
}
