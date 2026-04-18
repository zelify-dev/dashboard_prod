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
  DEFAULT_ONBOARDING_VISIBILITY,
  getCurrentOrganizationId,
  getOnboardingVisibility,
  getOnboardingStatus,
  type OnboardingVisibility,
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
  visibility: OnboardingVisibility;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const defaultPercents: OnboardingSectionPercents = {
  kyb: null,
  aml: null,
  technical: null,
  businessPlan: null,
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
  const [visibility, setVisibility] = useState<OnboardingVisibility>(DEFAULT_ONBOARDING_VISIBILITY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const orgId = getCurrentOrganizationId();
    if (!orgId) {
      setPercents(defaultPercents);
      setFlags(defaultFlags);
      setDevelopmentEnvironments(defaultDevelopmentEnvironments);
      setVisibility(DEFAULT_ONBOARDING_VISIBILITY);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [statusResult, visibilityResult] = await Promise.allSettled([
        getOnboardingStatus(orgId),
        getOnboardingVisibility(orgId),
      ]);

      if (statusResult.status === "fulfilled") {
        const { percents: p, flags: f, developmentEnvironments: de } = parseOnboardingStatusFull(statusResult.value);
        setPercents(p);
        setFlags(f);
        setDevelopmentEnvironments(de);
      } else {
        setPercents(defaultPercents);
        setFlags(defaultFlags);
        setDevelopmentEnvironments(defaultDevelopmentEnvironments);
      }

      if (visibilityResult.status === "fulfilled") {
        setVisibility(visibilityResult.value);
      } else {
        setVisibility(DEFAULT_ONBOARDING_VISIBILITY);
      }
    } catch {
      setPercents(defaultPercents);
      setFlags(defaultFlags);
      setDevelopmentEnvironments(defaultDevelopmentEnvironments);
      setVisibility(DEFAULT_ONBOARDING_VISIBILITY);
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
    () => ({ percents, flags, developmentEnvironments, visibility, loading, error, refresh }),
    [percents, flags, developmentEnvironments, visibility, loading, error, refresh]
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
      visibility: DEFAULT_ONBOARDING_VISIBILITY,
      loading: false,
      error: null,
      refresh: async () => {},
    };
  }
  return ctx;
}
