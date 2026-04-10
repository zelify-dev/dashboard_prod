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
  type ParsedDevelopmentEnvironments,
} from "@/lib/onboarding-api";

type OnboardingStatusContextValue = {
  percents: OnboardingSectionPercents;
  flags: OnboardingModuleFlags;
  /** Texto de URLs y API keys desde GET status (strings); null si no hay bloque o sin org */
  developmentEnvironments: ParsedDevelopmentEnvironments | null;
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

const defaultDevelopmentEnvironments: ParsedDevelopmentEnvironments | null = null;

const OnboardingStatusContext = createContext<OnboardingStatusContextValue | null>(null);

export function OnboardingStatusProvider({ children }: { children: ReactNode }) {
  const [percents, setPercents] = useState<OnboardingSectionPercents>(defaultPercents);
  const [flags, setFlags] = useState<OnboardingModuleFlags>(defaultFlags);
  const [developmentEnvironments, setDevelopmentEnvironments] = useState<ParsedDevelopmentEnvironments | null>(
    defaultDevelopmentEnvironments
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const orgId = getCurrentOrganizationId();
    if (!orgId) {
      setPercents(defaultPercents);
      setFlags(defaultFlags);
      setDevelopmentEnvironments(defaultDevelopmentEnvironments);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await getOnboardingStatus(orgId);
      const { percents: p, flags: f, developmentEnvironments: de } = parseOnboardingStatusFull(raw);
      setPercents(p);
      setFlags(f);
      setDevelopmentEnvironments(de);
    } catch {
      setPercents(defaultPercents);
      setFlags(defaultFlags);
      setDevelopmentEnvironments(defaultDevelopmentEnvironments);
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
    () => ({ percents, flags, developmentEnvironments, loading, error, refresh }),
    [percents, flags, developmentEnvironments, loading, error, refresh]
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
      developmentEnvironments: defaultDevelopmentEnvironments,
      loading: false,
      error: null,
      refresh: async () => {},
    };
  }
  return ctx;
}
