"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { TourModal } from "@/components/Tour/TourModal";
import { TourOverlay } from "@/components/Tour/TourOverlay";
import { TOUR_FEATURE_ENABLED } from "@/contexts/tour-context";
import { ScopesLoader } from "@/components/ScopesLoader";
import { ZendeskWidget } from "@/components/ZendeskWidget";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Rutas públicas: solo contenido, sin sidebar ni header
  const isPublicRoute = pathname === "/login" || pathname === "/register";

  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Si aún no está montado, mostrar el layout completo (no solo children)
  // Esto evita que se muestre el contenido sin sidebar/header
  if (!mounted) {
    return (
      <div className="flex min-h-screen">
        <ZendeskWidget />
        <ScopesLoader />
        <Sidebar />
        <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
          <Header />
            <main className="mx-auto w-full max-w-screen-2xl overflow-hidden p-2 md:p-4 2xl:p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <ZendeskWidget />
      <ScopesLoader />
      <Sidebar />
      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header />

          <main className="mx-auto w-full max-w-screen-2xl overflow-hidden p-2 md:p-4 2xl:p-6">
          {children}
        </main>
      </div>
      {TOUR_FEATURE_ENABLED && (
        <>
          <TourModal />
          <TourOverlay />
        </>
      )}
    </div>
  );
}

