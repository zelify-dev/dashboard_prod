"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { LanguageProvider } from "@/contexts/language-context";
import { OnboardingStatusProvider } from "@/contexts/onboarding-status-context";
import { TourProvider } from "@/contexts/tour-context";
import { createAppQueryClient } from "@/lib/query-client";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "../../tamagui.config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createAppQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <ThemeProvider defaultTheme="light" attribute="class">
          <LanguageProvider>
            <TourProvider>
              <OnboardingStatusProvider>
                <SidebarProvider>
                  {children}
                  <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    toastOptions={{
                      classNames: {
                        toast: "zelify-toast",
                        title: "zelify-toast-title",
                        description: "zelify-toast-description",
                        success: "zelify-toast-success",
                        error: "zelify-toast-error",
                        warning: "zelify-toast-warning",
                        info: "zelify-toast-info",
                        closeButton: "zelify-toast-close",
                      },
                    }}
                  />
                </SidebarProvider>
              </OnboardingStatusProvider>
            </TourProvider>
          </LanguageProvider>
        </ThemeProvider>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
