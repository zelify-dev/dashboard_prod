"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { LanguageProvider } from "@/contexts/language-context";
import { OnboardingStatusProvider } from "@/contexts/onboarding-status-context";
import { TourProvider } from "@/contexts/tour-context";
import { ThemeProvider } from "next-themes";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "../../tamagui.config";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <ThemeProvider defaultTheme="light" attribute="class">
        <LanguageProvider>
          <TourProvider>
            <OnboardingStatusProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </OnboardingStatusProvider>
          </TourProvider>
        </LanguageProvider>
      </ThemeProvider>
    </TamaguiProvider>
  );
}
