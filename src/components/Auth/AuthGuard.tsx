"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Inicializar isMounted basado en si estamos en login (usar función de inicialización)
  const [isMounted, setIsMounted] = useState(() => {
    // En el cliente, verificar inmediatamente si estamos en login
    if (typeof window !== "undefined") {
      return window.location.pathname === "/login";
    }
    return false;
  });

  // Verificar si estamos en la página de login (verificar tanto pathname como window.location)
  // Priorizar window.location si pathname no está disponible (primer render del servidor)
  const getIsLoginPage = () => {
    // Primero verificar window.location si está disponible (más confiable en el cliente)
    if (typeof window !== "undefined" && window.location.pathname === "/login")
      return true;
    // Luego verificar pathname
    if (pathname === "/login") return true;
    return false;
  };

  const isLoginPage = getIsLoginPage();

  // Usar useLayoutEffect para ejecutar antes del render y evitar el flash del spinner
  useLayoutEffect(() => {
    if (isLoginPage) {
      setIsMounted(true);
    }
  }, [isLoginPage]);

  useEffect(() => {
    // Verificar autenticación inmediatamente
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const auth = localStorage.getItem("isAuthenticated");

        // Verificar si está autenticado en localStorage
        if (auth === "true") {
          // Usuario autenticado (demo o backend)
          setIsAuthenticated(true);
          setIsMounted(true);

          // Si está autenticado y está en la página de login, redirigir al home
          if (pathname === "/login") {
            router.replace("/");
          }
        } else {
          // No hay autenticación local
          setIsAuthenticated(false);
          setIsMounted(true);

          // Si no está autenticado y no está en la página de login, redirigir a login
          if (pathname !== "/login") {
            router.replace("/login");
          }
        }
      }
    };

    // Ejecutar inmediatamente
    checkAuth();

    // Escuchar cambios en localStorage (por si se hace logout en otra pestaña)
    const handleStorageChange = () => {
      checkAuth();
    };

    // Escuchar el evento personalizado que se dispara cuando se hace login
    const handleAuthChange = () => {
      // Forzar re-verificación inmediata
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authchange", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authchange", handleAuthChange);
    };
  }, [pathname, router]);

  // Si está en login, permitir renderizar inmediatamente sin verificar autenticación
  // Esto debe ir ANTES de verificar isMounted para evitar el spinner
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Si aún no está montado y NO estamos en login, mostrar loading
  if (!isMounted) {
    // Mostrar loading mientras se verifica
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar contenido (ya se redirigió)
  if (isAuthenticated === false) {
    return null;
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
}
