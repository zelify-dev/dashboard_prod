"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentOrganizationId,
  getOnboardingStatus,
  parseOnboardingStatusPayload,
  type OnboardingSectionPercents,
} from "@/lib/onboarding-api";

type OnboardingStatusContextValue = {
  percents: OnboardingSectionPercents;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const defaultPercents: OnboardingSectionPercents = {
  kyb: null,
  aml: null,
  technical: null,
};

const OnboardingStatusContext = createContext<OnboardingStatusContextValue | null>(null);

export function OnboardingStatusProvider({ children }: { children: ReactNode }) {
  const [percents, setPercents] = useState<OnboardingSectionPercents>(defaultPercents);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const orgId = getCurrentOrganizationId();
    if (!orgId) {
      setPercents(defaultPercents);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await getOnboardingStatus(orgId);
      setPercents(parseOnboardingStatusPayload(raw));
    } catch {
      setPercents(defaultPercents);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => {
      void refresh();
    };
    window.addEventListener("onboardingStatusUpdated", handler);
    return () => window.removeEventListener("onboardingStatusUpdated", handler);
  }, [refresh]);

  const value = useMemo(
    () => ({ percents, loading, error, refresh }),
    [percents, loading, error, refresh]
  );

  return (
    <OnboardingStatusContext.Provider value={value}>{children}</OnboardingStatusContext.Provider>
  );
}

export function useOnboardingStatus(): OnboardingStatusContextValue {
  const ctx = useContext(OnboardingStatusContext);
  if (!ctx) {
    return {
      percents: defaultPercents,
      loading: false,
      error: null,
      refresh: async () => {},
    };
  }
  return ctx;
}
