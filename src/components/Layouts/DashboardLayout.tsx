"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { TourModal } from "@/components/Tour/TourModal";
import { TourOverlay } from "@/components/Tour/TourOverlay";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Verificar si estamos en la página de login
  const isLoginPage = pathname === "/login" ||
    (typeof window !== "undefined" && window.location.pathname === "/login");

  // No mostrar sidebar y header en la página de login
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Si aún no está montado, mostrar el layout completo (no solo children)
  // Esto evita que se muestre el contenido sin sidebar/header
  if (!mounted) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
          <Header />
          <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header />

        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
      <TourModal />
      <TourOverlay />
    </div>
  );
}

