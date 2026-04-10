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
  parseOnboardingStatusFull,
  type OnboardingModuleFlags,
  type OnboardingSectionPercents,
} from "@/lib/onboarding-api";

type OnboardingStatusContextValue = {
  percents: OnboardingSectionPercents;
  flags: OnboardingModuleFlags;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const defaultPercents: OnboardingSectionPercents = {
  kyb: null,
  aml: null,
  technical: null,
};

const defaultFlags: OnboardingModuleFlags = {
  kybLocked: false,
  amlLocked: false,
  technical: {
    diagram: false,
    securityPolicy: false,
    certifications: false,
    processDocumentation: false,
    developmentEnvironmentsLocked: false,
  },
};

const OnboardingStatusContext = createContext<OnboardingStatusContextValue | null>(null);

export function OnboardingStatusProvider({ children }: { children: ReactNode }) {
  const [percents, setPercents] = useState<OnboardingSectionPercents>(defaultPercents);
  const [flags, setFlags] = useState<OnboardingModuleFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const orgId = getCurrentOrganizationId();
    if (!orgId) {
      setPercents(defaultPercents);
      setFlags(defaultFlags);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await getOnboardingStatus(orgId);
      const { percents: p, flags: f } = parseOnboardingStatusFull(raw);
      setPercents(p);
      setFlags(f);
    } catch {
      setPercents(defaultPercents);
      setFlags(defaultFlags);
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
    () => ({ percents, flags, loading, error, refresh }),
    [percents, flags, loading, error, refresh]
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
      flags: defaultFlags,
      loading: false,
      error: null,
      refresh: async () => {},
    };
  }
  return ctx;
}
