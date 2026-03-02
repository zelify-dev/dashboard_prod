"use client";

import { EmailIcon, PasswordIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { login, persistAuthSession, AuthError, syncMe } from "@/lib/auth-api";
import { getAuthErrorMessage } from "@/lib/auth-error-messages";

// ============================================================================
// TRANSLATIONS
// ============================================================================
const TRANSLATIONS = {
  en: {
    welcome: "Welcome back",
    subWelcome: "Sign in to your account to access the dashboard.",
    email: "Email",
    password: "Password",
    signIn: "Sign In",
    signingIn: "Signing in...",
    back: "Back",
    backToHome: "Back to home",
    incCreds: "Incorrect credentials.",
    invalidEmail: "Email must contain '@' and a valid format.",
    reqEmail: "Email is required.",
    reqPassword: "Password is required.",
    placeholderEmail: "admin@company.com",
    placeholderPassword: "Enter your password",
    noAccount: "Don't have an account? ",
    createAccount: "Create your account",
  },
  es: {
    welcome: "Bienvenido de nuevo",
    subWelcome: "Inicia sesión en tu cuenta para acceder al panel.",
    email: "Correo electrónico",
    password: "Contraseña",
    signIn: "Iniciar sesión",
    signingIn: "Iniciando sesión...",
    back: "Volver",
    backToHome: "Volver al inicio",
    incCreds: "Credenciales incorrectas.",
    invalidEmail: "El correo debe contener '@' y un formato válido.",
    reqEmail: "El correo es obligatorio.",
    reqPassword: "La contraseña es obligatoria.",
    placeholderEmail: "admin@tuempresa.com",
    placeholderPassword: "Ingresa tu contraseña",
    noAccount: "¿No tienes cuenta? ",
    createAccount: "Crear cuenta",
  },
};

// ============================================================================
// CONSTANTS - Colors (Cambia estos colores fácilmente)
// ============================================================================
const COLORS = {
  // Background colors
  backgroundLight: "#f1f5f9", // Light mode background
  backgroundDark: "#001832", // Dark mode background

  // Card colors
  cardLight: "#ffffff", // Light mode card
  cardDark: "#0d1224", // Dark mode card

  // Right panel colors
  rightPanelBg: "rgb(170, 255, 59)", // Color verde del panel derecho
  rightPanelBorderDark: "#04335A", // Borde del panel derecho en dark mode

  // Button colors
  buttonPrimaryLight: "#004195", // Botón en light mode
  buttonPrimaryLightHover: "#0a56c2", // Hover del botón en light mode
  buttonPrimaryDark: "#66ff00", // Botón en dark mode (verde)
  buttonPrimaryDarkHover: "#ffffff", // Hover del botón en dark mode

  // Error colors
  errorBorder: "#dd2f2c", // Color del borde de error

  // Animation colors (para la animación halftone)
  halftoneLight: "rgb(12, 13, 14)", // Color de puntos en light mode
  halftoneDark: "rgba(255, 255, 255, 1)", // Color de puntos en dark mode
} as const;

// ============================================================================
// CONSTANTS - Logo URLs (Cambia las URLs de los logos aquí)
// ============================================================================
const LOGO_URLS = {
  dark: "https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/zelifyLogo_dark.svg",
  light:
    "https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/zelifyLogo_ligth.svg",
} as const;

function AnimatedHalftoneBackdrop({ isDarkMode }: { isDarkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(resize);
      observer.observe(parent);
      resizeObserverRef.current = observer;
    }

    let start = performance.now();
    const spacing = 26;
    const waveFrequency = 1.35;
    const waveSpeed = 0.35;

    const render = (time: number) => {
      const elapsed = (time - start) / 1000;
      const logicalWidth = canvas.width / dpr;
      const logicalHeight = canvas.height / dpr;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      const centerX = logicalWidth / 2;
      const centerY = logicalHeight / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      // Usar colores de las constantes - parsear rgba
      const halftoneColor = isDarkMode
        ? COLORS.halftoneDark
        : COLORS.halftoneLight;
      const rgbaMatch = halftoneColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const [r, g, b] = rgbaMatch
        ? [Number(rgbaMatch[1]), Number(rgbaMatch[2]), Number(rgbaMatch[3])]
        : [255, 255, 255];

      for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
        for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = distance / maxDistance;
          const wavePhase =
            (normalizedDistance * waveFrequency - elapsed * waveSpeed) *
            Math.PI *
            2;
          const pulse = (Math.cos(wavePhase) + 1) / 2;
          const edgeFade = Math.pow(1 - normalizedDistance, 1.4);
          const alpha = (0.06 + pulse * 0.45) * edgeFade;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.4 + pulse * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, [isDarkMode]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

function EdgeFadeOverlay({ isDarkMode }: { isDarkMode: boolean }) {
  const fadeColor = isDarkMode ? "rgba(8,11,25,1)" : "rgba(250,252,255,1)";
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-3xl"
      style={{
        background: `radial-gradient(circle at center, rgba(0,0,0,0) 60%, ${fadeColor} 100%)`,
      }}
    ></div>
  );
}

export default function LoginPage() {
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");

  // Load language preference (same key as dashboard: zelify-language)
  useEffect(() => {
    const storedLang = localStorage.getItem("zelify-language");
    if (storedLang === "en" || storedLang === "es") {
      setLanguage(storedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "es" : "en";
    setLanguage(newLang);
    localStorage.setItem("zelify-language", newLang);
  };

  // Validation State
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const t = TRANSLATIONS[language];

  /** Devuelve el mensaje de error para un campo (validación en tiempo real). */
  const getFieldError = (name: "email" | "password", d: { email: string; password: string }): string => {
    if (name === "email") {
      if (!d.email) return t.reqEmail;
      if (!d.email.includes("@") || !emailRegex.test(d.email)) return t.invalidEmail;
      return "";
    }
    if (name === "password") {
      return !d.password ? t.reqPassword : "";
    }
    return "";
  };

  // Detectar modo dark/light
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Agregar estilos de animación
  useEffect(() => {
    const styleId = "login-halftone-animations";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes halftonePulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.8; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    // Email validation
    if (!data.email) {
      newErrors.email = t.reqEmail;
      isValid = false;
    } else if (!data.email.includes("@") || !emailRegex.test(data.email)) {
      // Explicit check for @ as requested, though regex covers it
      newErrors.email = t.invalidEmail;
      isValid = false;
    }

    // Password validation (basic check)
    if (!data.password) {
      newErrors.password = t.reqPassword;
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: "email" | "password"; value: string };
    const nextData = { ...data, [name]: value };
    setData(nextData);
    setError("");
    const fieldError = getFieldError(name, nextData);
    setFormErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError("");
    setLoading(true);

    const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
    if (!authBaseUrl) {
      setLoading(false);
      setError(
        language === "en"
          ? "Auth API URL is not configured. Set NEXT_PUBLIC_AUTH_API_URL in .env"
          : "La URL de la API de auth no está configurada. Configura NEXT_PUBLIC_AUTH_API_URL en .env",
      );
      return;
    }

    try {
      const result = await login({
        email: data.email,
        password: data.password,
      });

      if ("access_token" in result) {
        persistAuthSession(result);
        try {
          await syncMe();
        } catch {
          /* mantener datos del response */
        }
        setLoading(false);
        window.location.href = "/";
        return;
      }

      setLoading(false);
      setError((result as { message?: string }).message || t.incCreds);
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      if (err instanceof AuthError) {
        setError(getAuthErrorMessage(err.statusCode, "login", language) || err.message);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : language === "en"
              ? "Connection error. Please try again."
              : "Error de conexión. Por favor intenta de nuevo.",
        );
      }
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-gray-2 px-4 overflow-hidden"
      style={{
        backgroundColor: isDarkMode
          ? COLORS.backgroundDark
          : COLORS.backgroundLight,
      }}
    >
      <div className="absolute top-6 left-6 z-50 transition-transform duration-300 hover:scale-105">
        <Link
          href="https://www.zelify.com"
          className="flex items-center justify-center rounded-lg border-2 border-dark px-3 py-1.5 font-bold text-dark dark:border-white dark:text-white bg-white/10 backdrop-blur-sm"
          aria-label={t.backToHome}
        >
          {t.back}
        </Link>
      </div>
      <div className="absolute top-6 right-6 z-50 transition-transform duration-300 hover:scale-105">
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center rounded-lg border-2 border-dark px-3 py-1.5 font-bold text-dark dark:border-white dark:text-white bg-white/10 backdrop-blur-sm"
        >
          {language === "en" ? "EN" : "ES"}
        </button>
      </div>

      {/* ======================================================================
          ANIMACIÓN DE FONDO - Aquí se aplica la animación halftone
          ====================================================================== */}
      <div className="absolute inset-0">
        {/* Base gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(0, 24, 50, 0.95) 0%, rgba(0, 8, 26, 1) 50%, rgba(0, 24, 50, 0.95) 100%)"
              : "linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 1) 50%, rgba(241, 245, 249, 0.95) 100%)",
          }}
        ></div>

        {/* ANIMACIÓN PRINCIPAL: Puntos halftone animados con efecto de onda */}
        <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />

        {/* Overlay con fade en los bordes */}
        <EdgeFadeOverlay isDarkMode={isDarkMode} />

        {/* Capa adicional de patrón halftone con animación de pulso */}
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            backgroundImage: isDarkMode
              ? `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1.2px, transparent 0)`
              : `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.12) 1.2px, transparent 0)`,
            backgroundSize: "28px 28px",
            opacity: 0.5,
            animation: "halftonePulse 8s ease-in-out infinite",
          }}
        ></div>
      </div>

      {/* CONTENEDOR PRINCIPAL - solo formulario */}
      <div className="relative z-10 w-full max-w-[440px]">
        <div
          className="rounded-[10px] shadow-1 dark:shadow-card"
          style={{
            backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.cardLight,
          }}
        >
          <div className="w-full p-4 sm:p-10">
                {/* LOGO #1 - Logo en la sección del formulario (izquierda) */}
                <div className="mb-10">
                  <Link href="/" className="inline-block">
                    <Image
                      className="hidden dark:block"
                      src={LOGO_URLS.dark}
                      alt="Zelify Logo"
                      width={176}
                      height={32}
                    />
                    <Image
                      className="dark:hidden"
                      src={LOGO_URLS.light}
                      alt="Zelify Logo"
                      width={176}
                      height={32}
                    />
                  </Link>
                </div>

                <h1 className="mb-2 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
                  {t.welcome}
                </h1>
                <p className="mb-8 text-sm text-dark-6 dark:text-dark-6">
                  {t.subWelcome}
                </p>

                <form onSubmit={handleSubmit}>
                  {/* Mensaje de error */}
                  {error && (
                    <div
                      className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20"
                      style={{
                        borderColor: isDarkMode
                          ? COLORS.errorBorder
                          : undefined,
                        color: isDarkMode ? COLORS.errorBorder : undefined,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <InputGroup
                    type="email"
                    label={t.email}
                    className={`mb-4 [&_input]:py-[15px] ${
                      formErrors.email
                        ? "[&_input]:border-red-500 focus:[&_input]:border-red-500"
                        : ""
                    }`}
                    placeholder={t.placeholderEmail}
                    name="email"
                    handleChange={handleChange}
                    value={data.email}
                    icon={<EmailIcon />}
                    required
                  />
                  {formErrors.email && (
                    <p className="mb-4 mt-[-10px] text-sm text-red-500">
                      {formErrors.email}
                    </p>
                  )}

                  <InputGroup
                    type="password"
                    label={t.password}
                    className={`mb-5 [&_input]:py-[15px] ${
                      formErrors.password
                        ? "[&_input]:border-red-500 focus:[&_input]:border-red-500"
                        : ""
                    }`}
                    placeholder={t.placeholderPassword}
                    name="password"
                    handleChange={handleChange}
                    value={data.password}
                    icon={<PasswordIcon />}
                    required
                  />
                  {formErrors.password && (
                    <p className="mb-5 mt-[-15px] text-sm text-red-500">
                      {formErrors.password}
                    </p>
                  )}

                  {/* Botón de login */}
                  <div className="mb-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg p-4 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isDarkMode
                          ? COLORS.buttonPrimaryDark
                          : COLORS.buttonPrimaryLight,
                        color: isDarkMode ? "#000000" : "#ffffff",
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.backgroundColor = isDarkMode
                            ? COLORS.buttonPrimaryDarkHover
                            : COLORS.buttonPrimaryLightHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode
                          ? COLORS.buttonPrimaryDark
                          : COLORS.buttonPrimaryLight;
                      }}
                    >
                      {loading ? (
                        <>
                          {t.signingIn}
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
                        </>
                      ) : (
                        t.signIn
                      )}
                    </button>
                  </div>

                  <p className="text-center text-sm text-dark-6 dark:text-dark-6">
                    {t.noAccount}
                    <Link href="/register" className="font-medium text-primary hover:underline">
                      {t.createAccount}
                    </Link>
                  </p>
                </form>
          </div>
        </div>
      </div>
    </div>
  );
}
