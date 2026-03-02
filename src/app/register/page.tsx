"use client";

import { EmailIcon, PasswordIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { register as apiRegister, persistAuthSession, AuthError, syncMe } from "@/lib/auth-api";
import { getAuthErrorMessage } from "@/lib/auth-error-messages";

const LOGO_URLS = {
  dark: "https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/zelifyLogo_dark.svg",
  light:
    "https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/zelifyLogo_ligth.svg",
} as const;

const COLORS = {
  backgroundLight: "#f1f5f9",
  backgroundDark: "#001832",
  cardLight: "#ffffff",
  cardDark: "#0d1224",
  rightPanelBg: "rgb(170, 255, 59)",
  rightPanelBorderDark: "#04335A",
  buttonPrimaryLight: "#004195",
  buttonPrimaryLightHover: "#0a56c2",
  buttonPrimaryDark: "#66ff00",
  buttonPrimaryDarkHover: "#ffffff",
  errorBorder: "#dd2f2c",
} as const;

// Orden fijo: US, EC, MX, CO, CL (las etiquetas van en TRANSLATIONS)
const COUNTRY_CODES = ["US", "EC", "MX", "CO", "CL"] as const;

const INDUSTRY_OPTIONS = [
  "fintech",
  "banking",
  "neobank",
  "cooperative",
  "other",
] as const;

const TRANSLATIONS = {
  en: {
    title: "Create your account",
    subTitle: "Fill in the form to register your organization",
    sectionOrganization: "Organization",
    sectionYourDetails: "Your details",
    companyName: "Company name",
    country: "Country",
    legalName: "Legal company name",
    website: "Website",
    industry: "Industry",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    submit: "Create account",
    submitting: "Creating account...",
    back: "Back",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    rightTitle: "Create your account",
    rightSubtitle: "Dashboard Zelify",
    rightDesc: "Register your organization to access the dashboard.",
    reqField: "This field is required.",
    invalidEmail: "Enter a valid email address.",
    passwordMin: "Password must be at least 8 characters.",
    // Placeholders
    placeholderCompanyName: "Company name",
    placeholderLegalName: "Legal name (e.g. Acme Inc.)",
    placeholderWebsite: "https://example.com",
    placeholderFullName: "John Smith",
    placeholderEmail: "admin@company.com",
    placeholderPassword: "Min. 8 characters",
    // Countries (order: US, EC, MX, CO, CL)
    countries: { US: "United States", EC: "Ecuador", MX: "Mexico", CO: "Colombia", CL: "Chile" } as Record<string, string>,
    // Industries (solo 4 opciones)
    industries: { fintech: "Fintech", banking: "Banking", neobank: "Neobank", cooperative: "Cooperative", other: "Other" } as Record<string, string>,
  },
  es: {
    title: "Crear tu cuenta",
    subTitle: "Completa el formulario para registrar tu organización",
    sectionOrganization: "Organización",
    sectionYourDetails: "Tus datos",
    companyName: "Nombre de la empresa",
    country: "País",
    legalName: "Razón social",
    website: "Sitio web",
    industry: "Industria",
    fullName: "Nombre completo",
    email: "Correo electrónico",
    password: "Contraseña",
    submit: "Crear cuenta",
    submitting: "Creando cuenta...",
    back: "Volver",
    haveAccount: "¿Ya tienes cuenta?",
    signIn: "Iniciar sesión",
    rightTitle: "Crear tu cuenta",
    rightSubtitle: "Dashboard Zelify",
    rightDesc: "Registra tu organización para acceder al panel",
    reqField: "Este campo es obligatorio.",
    invalidEmail: "Ingresa un correo válido.",
    passwordMin: "La contraseña debe tener al menos 8 caracteres.",
    placeholderCompanyName: "Nombre de la empresa",
    placeholderLegalName: "Razón social (ej. Mi Empresa S.A.S.)",
    placeholderWebsite: "https://ejemplo.com",
    placeholderFullName: "Xavier Hernandez",
    placeholderEmail: "admin@empresa.com",
    placeholderPassword: "Mín. 8 caracteres",
    countries: { US: "Estados Unidos", EC: "Ecuador", MX: "México", CO: "Colombia", CL: "Chile" } as Record<string, string>,
    industries: { fintech: "Fintech", banking: "Banca", neobank: "Neobanco", cooperative: "Cooperativa", other: "Otro" } as Record<string, string>,
  },
};

export default function RegisterPage() {
  const [data, setData] = useState({
    organization_name: "",
    country: "US",
    company_legal_name: "",
    website: "",
    industry: "fintech",
    full_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem("zelify-language");
    if (stored === "en" || stored === "es") setLanguage(stored);
  }, []);

  useEffect(() => {
    const check = () =>
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const t = TRANSLATIONS[language];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /** Devuelve el mensaje de error para un campo (para validación en tiempo real). */
  const getFieldError = (name: string, d: typeof data): string => {
    switch (name) {
      case "organization_name":
        return !d.organization_name.trim() ? t.reqField : "";
      case "country":
        return !d.country || d.country.length !== 2 ? t.reqField : "";
      case "company_legal_name":
        return !d.company_legal_name.trim() ? t.reqField : "";
      case "website":
        return ""; // opcional
      case "industry":
        return !d.industry.trim() ? t.reqField : "";
      case "full_name":
        return !d.full_name.trim() ? t.reqField : "";
      case "email":
        if (!d.email) return t.reqField;
        if (!emailRegex.test(d.email)) return t.invalidEmail;
        return "";
      case "password":
        if (!d.password) return t.reqField;
        if (d.password.length < 8) return t.passwordMin;
        return "";
      default:
        return "";
    }
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!data.organization_name.trim()) err.organization_name = t.reqField;
    if (!data.country || data.country.length !== 2) err.country = t.reqField;
    if (!data.company_legal_name.trim()) err.company_legal_name = t.reqField;
    // website es opcional
    if (!data.industry.trim()) err.industry = t.reqField;
    if (!data.full_name.trim()) err.full_name = t.reqField;
    if (!data.email) err.email = t.reqField;
    else if (!emailRegex.test(data.email)) err.email = t.invalidEmail;
    if (!data.password) err.password = t.reqField;
    else if (data.password.length < 8) err.password = t.passwordMin;
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextData = { ...data, [name]: value };
    setData(nextData);
    setError("");
    const fieldError = getFieldError(name, nextData);
    setFormErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setError("");
    setEmailAlreadyExists(false);
    setLoading(true);
    try {
      const response = await apiRegister({
        organization_name: data.organization_name.trim(),
        country: data.country,
        company_legal_name: data.company_legal_name.trim(),
        website: data.website.trim(),
        industry: data.industry,
        full_name: data.full_name.trim(),
        email: data.email.trim(),
        password: data.password,
      });
      persistAuthSession(response);
      try {
        await syncMe();
      } catch {
        /* mantener datos del response */
      }
      window.location.href = "/";
    } catch (err) {
      if (err instanceof AuthError && err.statusCode === 409) {
        setError(getAuthErrorMessage(409, "register", language) || err.message);
        setEmailAlreadyExists(true);
      } else if (err instanceof AuthError) {
        const apiMsg = err.body && typeof err.body === "object" && "message" in err.body ? String((err.body as { message: unknown }).message) : undefined;
        setError(getAuthErrorMessage(err.statusCode, "register", language, apiMsg) || err.message);
        if (err.statusCode === 400 && err.body && typeof err.body === "object" && "errors" in err.body && Array.isArray((err.body as { errors: unknown }).errors)) {
          const errors = (err.body as { errors: Array<{ field?: string; message?: string }> }).errors;
          const byField: Record<string, string> = {};
          errors.forEach((e) => {
            if (e.field && e.message) byField[e.field] = e.message;
          });
          if (Object.keys(byField).length) setFormErrors((prev) => ({ ...prev, ...byField }));
        }
      } else {
        setError(err instanceof Error ? err.message : "Error en el registro");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-12 overflow-hidden"
      style={{
        background: isDarkMode
          ? "linear-gradient(160deg, #001832 0%, #000d1a 50%, #001832 100%)"
          : "linear-gradient(160deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)",
      }}
    >
      <Link
        href="/login"
        className="absolute top-6 left-6 z-50 rounded-lg border-2 border-dark/20 bg-white/90 px-3 py-2 font-semibold text-dark shadow-sm transition hover:scale-[1.02] hover:shadow dark:border-white/20 dark:bg-dark-2/90 dark:text-white"
      >
        {t.back}
      </Link>
      <button
        type="button"
        onClick={() => {
          const next = language === "en" ? "es" : "en";
          setLanguage(next);
          localStorage.setItem("zelify-language", next);
        }}
        className="absolute top-6 right-6 z-50 rounded-lg border-2 border-dark/20 bg-white/90 px-3 py-2 font-semibold text-dark shadow-sm transition hover:scale-[1.02] hover:shadow dark:border-white/20 dark:bg-dark-2/90 dark:text-white"
      >
        {language === "en" ? "EN" : "ES"}
      </button>

      <div className="relative z-10 w-full max-w-[1000px]">
        <div
          className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/5"
          style={{
            backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.cardLight,
          }}
        >
          <div className="flex flex-wrap">
            <div className="w-full xl:w-1/2">
              <div className="w-full p-6 sm:p-8 xl:p-10">
                <Link href="/" className="mb-8 inline-block">
                  <Image
                    className="hidden dark:block"
                    src={LOGO_URLS.dark}
                    alt="Logo"
                    width={176}
                    height={32}
                  />
                  <Image
                    className="dark:hidden"
                    src={LOGO_URLS.light}
                    alt="Logo"
                    width={176}
                    height={32}
                  />
                </Link>
                <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-dark dark:text-white sm:text-3xl">
                  {t.title}
                </h1>
                <p className="mb-8 text-sm text-dark-6 dark:text-dark-6">
                  {t.subTitle}
                </p>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div
                      className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                      style={{ borderColor: COLORS.errorBorder }}
                    >
                      {error}
                      {emailAlreadyExists && (
                        <p className="mt-2">
                          <Link href="/login" className="font-medium underline hover:no-underline">
                            {t.signIn}
                          </Link>
                        </p>
                      )}
                    </div>
                  )}

                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary dark:text-primary">
                    {t.sectionOrganization}
                  </p>
                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <InputGroup
                        type="text"
                        label={t.companyName}
                        name="organization_name"
                        placeholder={t.placeholderCompanyName}
                        value={data.organization_name}
                        handleChange={handleChange}
                        className={`[&_input]:rounded-xl [&_input]:py-3 ${formErrors.organization_name ? "[&_input]:border-red-500 focus:[&_input]:border-red-500" : ""}`}
                        required
                      />
                      {formErrors.organization_name && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.organization_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-body-sm font-medium text-dark dark:text-white">
                        {t.country}
                        <span className="ml-1 select-none text-red">*</span>
                      </label>
                      <select
                        name="country"
                        value={data.country}
                        onChange={handleChange}
                        className={`mt-3 w-full rounded-xl border border-stroke bg-gray-2 py-3 pl-4 pr-10 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-3 dark:bg-dark-2 dark:text-white ${formErrors.country ? "border-red-500" : ""}`}
                        aria-label={t.country}
                      >
                        {COUNTRY_CODES.map((code) => (
                          <option key={code} value={code}>
                            {t.countries[code]}
                          </option>
                        ))}
                      </select>
                      {formErrors.country && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.country}</p>
                      )}
                    </div>
                  </div>

                  <InputGroup
                    type="text"
                    label={t.legalName}
                    name="company_legal_name"
                    placeholder={t.placeholderLegalName}
                    value={data.company_legal_name}
                    handleChange={handleChange}
                    className={`mb-4 [&_input]:rounded-xl [&_input]:py-3 ${formErrors.company_legal_name ? "[&_input]:border-red-500 focus:[&_input]:border-red-500" : ""}`}
                    required
                  />
                  {formErrors.company_legal_name && (
                    <p className="mb-4 mt-1 text-sm text-red-500">{formErrors.company_legal_name}</p>
                  )}

                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <InputGroup
                        type="url"
                        label={t.website}
                        name="website"
                        placeholder={t.placeholderWebsite}
                        value={data.website}
                        handleChange={handleChange}
                        className="[&_input]:rounded-xl [&_input]:py-3"
                      />
                      {formErrors.website && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.website}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-body-sm font-medium text-dark dark:text-white">
                        {t.industry}
                        <span className="ml-1 select-none text-red">*</span>
                      </label>
                      <select
                        name="industry"
                        value={data.industry}
                        onChange={handleChange}
                        className={`mt-3 w-full rounded-xl border border-stroke bg-gray-2 py-3 pl-4 pr-10 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-3 dark:bg-dark-2 dark:text-white ${formErrors.industry ? "border-red-500" : ""}`}
                      >
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {t.industries[opt]}
                          </option>
                        ))}
                      </select>
                      {formErrors.industry && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.industry}</p>
                      )}
                    </div>
                  </div>

                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary dark:text-primary">
                    {t.sectionYourDetails}
                  </p>
                  <InputGroup
                    type="text"
                    label={t.fullName}
                    name="full_name"
                    placeholder={t.placeholderFullName}
                    value={data.full_name}
                    handleChange={handleChange}
                    className={`mb-4 [&_input]:rounded-xl [&_input]:py-3 ${formErrors.full_name ? "[&_input]:border-red-500 focus:[&_input]:border-red-500" : ""}`}
                    required
                  />
                  {formErrors.full_name && (
                    <p className="mb-4 mt-1 text-sm text-red-500">{formErrors.full_name}</p>
                  )}

                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <InputGroup
                        type="email"
                        label={t.email}
                        name="email"
                        placeholder={t.placeholderEmail}
                        value={data.email}
                        handleChange={handleChange}
                        icon={<EmailIcon />}
                        className={`[&_input]:rounded-xl [&_input]:py-3 ${formErrors.email ? "[&_input]:border-red-500 focus:[&_input]:border-red-500" : ""}`}
                        required
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <InputGroup
                        type="password"
                        label={t.password}
                        name="password"
                        placeholder={t.placeholderPassword}
                        value={data.password}
                        handleChange={handleChange}
                        icon={<PasswordIcon />}
                        className={`[&_input]:rounded-xl [&_input]:py-3 ${formErrors.password ? "[&_input]:border-red-500 focus:[&_input]:border-red-500" : ""}`}
                        required
                      />
                      {formErrors.password && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-4 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isDarkMode
                        ? COLORS.buttonPrimaryDark
                        : COLORS.buttonPrimaryLight,
                      color: isDarkMode ? "#000000" : "#ffffff",
                    }}
                  >
                    {loading ? t.submitting : t.submit}
                    {loading && (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent" />
                    )}
                  </button>
                </form>

                <p className="mt-8 text-center text-sm text-dark-6 dark:text-dark-6">
                  {t.haveAccount}{" "}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    {t.signIn}
                  </Link>
                </p>
              </div>
            </div>

            <div className="hidden w-full xl:block xl:w-1/2">
              <div
                className="flex h-full min-h-[520px] flex-col justify-center rounded-r-2xl px-10 py-14"
                style={{
                  backgroundColor: COLORS.rightPanelBg,
                  borderColor: isDarkMode ? COLORS.rightPanelBorderDark : "transparent",
                }}
              >
                <p className="mb-2 text-sm font-medium uppercase tracking-widest text-dark">
                  {t.rightTitle}
                </p>
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-dark">
                  {t.rightSubtitle}
                </h2>
                <p className="max-w-[320px] text-base leading-relaxed text-dark-4">
                  {t.rightDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
