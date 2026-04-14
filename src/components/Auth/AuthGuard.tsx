"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AuthError, clearAuthSession, getAccessToken, getMe, getStoredRoles, getStoredUser } from "@/lib/auth-api";
import { ChangePasswordModal } from "@/components/Auth/ChangePasswordModal";
import { getDefaultDashboardPath } from "@/lib/dashboard-routing";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isValidatingRef = useRef(false);
  const lastValidationRef = useRef(0);

  // Inicializar isMounted basado en si estamos en login o register (usar función de inicialización)
  const [isMounted, setIsMounted] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      return path === "/login" || path === "/register";
    }
    return false;
  });

  // Verificar si estamos en la página de login (verificar tanto pathname como window.location)
  // Priorizar window.location si pathname no está disponible (primer render del servidor)
  const getIsLoginPage = () => {
    // Primero verificar window.location si está disponible (más confiable en el cliente)
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/login" || path === "/register") return true;
    }
    // Luego verificar pathname
    if (pathname === "/login" || pathname === "/register") return true;
    return false;
  };

  const isLoginPage = getIsLoginPage();

  const validateActiveSession = async (force = false) => {
    if (typeof window === "undefined" || isLoginPage) return;
    if (isValidatingRef.current) return;

    const auth = sessionStorage.getItem("isAuthenticated");
    const token = getAccessToken();
    if (auth !== "true" || !token) {
      setIsAuthenticated(false);
      setIsMounted(true);
      if (pathname !== "/login" && pathname !== "/register") {
        router.replace("/login");
      }
      return;
    }

    const now = Date.now();
    if (!force && now - lastValidationRef.current < 30_000) {
      return;
    }

    isValidatingRef.current = true;
    try {
      await getMe();
      lastValidationRef.current = now;
      setIsAuthenticated(true);
      setIsMounted(true);
    } catch (err) {
      if (err instanceof AuthError && (err.statusCode === 401 || err.statusCode === 403)) {
        clearAuthSession();
        setIsAuthenticated(false);
        setIsMounted(true);
        router.replace("/login");
        return;
      }

      // Si falla la red o hay un error no-auth, mantenemos la sesión local
      // para no expulsar al usuario por un problema transitorio.
      setIsAuthenticated(true);
      setIsMounted(true);
    } finally {
      isValidatingRef.current = false;
    }
  };

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
        const auth = sessionStorage.getItem("isAuthenticated");
        const token = getAccessToken();

        // Verificar si está autenticado en localStorage
        if (auth === "true" && token) {
          // Usuario autenticado (demo o backend)
          setIsAuthenticated(true);
          setIsMounted(true);

          // Si está autenticado y está en login o register, redirigir al home
          if (pathname === "/login" || pathname === "/register") {
            router.replace(getDefaultDashboardPath(getStoredRoles()));
          } else {
            void validateActiveSession(true);
          }
        } else {
          // No hay autenticación local
          setIsAuthenticated(false);
          setIsMounted(true);

          // Si no está autenticado y no está en login ni register, redirigir a login
          if (pathname !== "/login" && pathname !== "/register") {
            router.replace("/login");
          }
        }
      }
    };

    // Ejecutar inmediatamente
    checkAuth();

    // Escuchar cambios (authchange se dispara en login/logout en esta pestaña; sessionStorage no se comparte entre pestañas)
    const handleStorageChange = () => {
      checkAuth();
    };

    // Escuchar el evento personalizado que se dispara cuando se hace login
    const handleAuthChange = () => {
      // Forzar re-verificación inmediata
      checkAuth();
    };

    const handleWindowFocus = () => {
      if (pathname !== "/login" && pathname !== "/register") {
        void validateActiveSession();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && pathname !== "/login" && pathname !== "/register") {
        void validateActiveSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authchange", handleAuthChange);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authchange", handleAuthChange);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoginPage, pathname, router]);

  // Si está en login o register, permitir renderizar inmediatamente sin verificar autenticación
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

  // Si no está autenticado, mostrar loading mientras se redirige a /login (evita pantalla en blanco)
  if (isAuthenticated === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Si está autenticado, mostrar el contenido (o el modal de cambio de contraseña si aplica)
  const user = typeof window !== "undefined" ? getStoredUser() : null;
  const mustChangePassword = user?.must_change_password === true;

  if (mustChangePassword) {
    return (
      <ChangePasswordModal
        onSuccess={() => {
          // Sesión ya actualizada por changePassword(); forzar re-render para dejar de mostrar el modal.
          setRefreshKey((k) => k + 1);
        }}
      />
    );
  }

  return <>{children}</>;
}
