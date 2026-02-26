"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { LanguageProvider } from "@/contexts/language-context";
import { TourProvider } from "@/contexts/tour-context";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <LanguageProvider>
        <TourProvider>
        <SidebarProvider>{children}</SidebarProvider>
        </TourProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
