import "@/css/nata-sans.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import { AuthGuard } from "@/components/Auth/AuthGuard";
import { HealthCheckLogger } from "@/components/HealthCheckLogger";
import { DashboardLayout } from "@/components/Layouts/DashboardLayout";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Zelify Dashboard",
    default: "Zelify",
  },
  description:
    "Zelify dashboard.",
  icons: {
    icon: "/images/logo/logo-icon.svg",
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <HealthCheckLogger />
          <NextTopLoader color="#004492" showSpinner={false} />
          <AuthGuard>
            <DashboardLayout>{children}</DashboardLayout>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
