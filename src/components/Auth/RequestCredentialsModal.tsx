"use client";

import { useState, useEffect } from "react";

import { createPortal } from "react-dom";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";

interface RequestCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: "en" | "es";
}

const MODAL_TRANSLATIONS = {
  en: {
    title: "Talk to our team",
    firstName: "First Name",
    lastName: "Last Name",
    companyName: "Company Name",
    companyEmail: "Company Email",
    country: "Country",
    selectCountry: "Select country",
    phoneNumber: "Phone Number",
    submitButton: "Request Credentials",
    termsText: "By submitting this form, you accept our",
    termsLink: "Terms of Service",
    and: "and",
    privacyLink: "Privacy Policy",
    successAlert: "Request sent successfully. We will contact you soon.",
    errorEmail: "Please enter a valid email",
    errorRequired: "This field is required",
    countries: {
      us: "United States",
      es: "Spain",
      mx: "Mexico",
      co: "Colombia",
      ar: "Argentina",
      cl: "Chile",
      pe: "Peru",
      ec: "Ecuador",
    },
    successTitle: "Request Sent",
    successMessage:
      "The credentials to access the platform have been sent to our team to validate your information.",
    close: "Close",
  },
  es: {
    title: "Habla con nuestro equipo",
    firstName: "Nombres",
    lastName: "Apellidos",
    companyName: "Nombre de la compañía",
    companyEmail: "Email de la compañía",
    country: "País",
    selectCountry: "Seleccionar país",
    phoneNumber: "Teléfono",
    submitButton: "Solicitar credenciales",
    termsText: "Al enviar este formulario, aceptas nuestros",
    termsLink: "Términos de Servicio",
    and: "y",
    privacyLink: "Política de Privacidad",
    successAlert:
      "Solicitud enviada con éxito. Nos pondremos en contacto contigo pronto.",
    errorEmail: "Ingresa un email válido",
    errorRequired: "Este campo es obligatorio",
    countries: {
      us: "Estados Unidos",
      es: "España",
      mx: "México",
      co: "Colombia",
      ar: "Argentina",
      cl: "Chile",
      pe: "Perú",
      ec: "Ecuador",
    },
    successTitle: "Solicitud Enviada",
    successMessage:
      "Las credenciales para ingresar a la plataforma han sido enviadas a nuestro equipo para validar tu información.",
    close: "Cerrar",
  },
};

const COUNTRIES = [
  { value: "us", label: "us" }, // Label will be dynamic
  { value: "es", label: "es" },
  { value: "mx", label: "mx" },
  { value: "co", label: "co" },
  { value: "ar", label: "ar" },
  { value: "cl", label: "cl" },
  { value: "pe", label: "pe" },
  { value: "ec", label: "ec" },
];

export default function RequestCredentialsModal({
  isOpen,
  onClose,
  language = "en",
}: RequestCredentialsModalProps) {
  const t = MODAL_TRANSLATIONS[language];

  // Dynamic countries list
  const countriesList = COUNTRIES.map((c) => ({
    value: c.value,
    label: t.countries[c.value as keyof typeof t.countries],
  }));
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    compania: "",
    emailCompania: "",
    pais: "",
    telefono: "",
  });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsSuccess(false); // Reset success state when reopening
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Update error message when language changes if an error is already present
  useEffect(() => {
    setEmailError((prev) => (prev ? t.errorEmail : ""));
  }, [language, t.errorEmail]);

  if (!mounted || !isOpen) return null;

  const validateEmail = (email: string) => {
    // Basic regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "telefono") {
      // Allow only numbers, max 10 digits, and format
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      const formattedValue = numericValue.match(/.{1,3}/g)?.join(" ") || "";
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "emailCompania") {
      // Real-time validation if error exists
      if (emailError) {
        if (validateEmail(value)) {
          setEmailError("");
        }
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "emailCompania") {
      if (!value) {
        setEmailError("");
        return;
      }
      if (!validateEmail(value)) {
        setEmailError(t.errorEmail);
      } else {
        setEmailError("");
      }
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, pais: value }));
    if (formErrors.pais) {
      setFormErrors((prev) => ({ ...prev, pais: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: Record<string, string> = {};
    if (!formData.nombres.trim()) errors.nombres = t.errorRequired;
    if (!formData.apellidos.trim()) errors.apellidos = t.errorRequired;
    if (!formData.compania.trim()) errors.compania = t.errorRequired;
    if (!formData.pais) errors.pais = t.errorRequired;
    if (!formData.telefono.trim()) errors.telefono = t.errorRequired;

    if (!formData.emailCompania) {
      errors.emailCompania = t.errorRequired;
    } else if (!validateEmail(formData.emailCompania)) {
      errors.emailCompania = t.errorEmail;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Also update standalone emailError state for consistency with existing logic
      if (errors.emailCompania) setEmailError(errors.emailCompania);
      return;
    }

    setLoading(true);

    try {
      const subject = "Nueva Solicitud de Credenciales - Zelify";

      const countryName =
        MODAL_TRANSLATIONS["es"].countries[
          formData.pais as keyof typeof MODAL_TRANSLATIONS.es.countries
        ] || formData.pais;

      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <div style="background-color: #ffffff; padding: 25px 40px; text-align: center; border-bottom: 4px solid #AAFF3B;">
            <img 
              src="https://wsrv.nl/?url=amazon-zelify-bucket.s3.us-east-1.amazonaws.com/zelifyLogo_ligth.svg&output=png" 
              alt="Zelify" 
              width="160"
              style="max-width: 160px; height: auto; display: block; margin: 0 auto; border: 0;"
            />
          </div>

          <!-- Main Content -->
          <div style="background-color: #f8fafc; padding: 40px;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 22px; font-weight: 700;">
              Nueva Solicitud de Credenciales
            </h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              El usuario <strong>${formData.nombres} ${formData.apellidos}</strong> de la empresa <strong>${formData.compania}</strong>, con correo <strong>${formData.emailCompania}</strong>, en el país <strong>${countryName} (${formData.pais})</strong> con número de teléfono <strong>${formData.telefono}</strong> está solicitando las credenciales.
            </p>

            <!-- Request Details Summary -->
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 20px;">
              <p style="font-size: 14px; color: #64748b; margin-bottom: 15px; font-weight: bold; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                Resumen de la solicitud:
              </p>
              <div style="font-size: 14px; color: #334155; line-height: 1.8;">
                <strong>Nombres:</strong> ${formData.nombres}<br/>
                <strong>Apellidos:</strong> ${formData.apellidos}<br/>
                <strong>Empresa:</strong> ${formData.compania}<br/>
                <strong>Email:</strong> ${formData.emailCompania}<br/>
                <strong>País:</strong> ${countryName} (${formData.pais})<br/>
                <strong>Teléfono:</strong> ${formData.telefono}
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #edf2f7; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Zelify. Todos los derechos reservados.</p>
          </div>
        </div>
      `;

      const emailToSend = process.env.NEXT_PUBLIC_MAIN_EMAIL_RECEIPT;
      const emailCC = process.env.NEXT_PUBLIC_CC_EMAIL_RECEIPT;

      const emailText = `
        ZELIFY - Nueva Solicitud de Credenciales
        
        El usuario ${formData.nombres} ${formData.apellidos} de la empresa ${formData.compania}, con correo ${formData.emailCompania}, en el país ${countryName} (${formData.pais}) con número de teléfono ${formData.telefono} está solicitando las credenciales.
        
        --------------------------------------------------
        Resumen de la solicitud:
        Nombres: ${formData.nombres}
        Apellidos: ${formData.apellidos}
        Empresa: ${formData.compania}
        Email: ${formData.emailCompania}
        País: ${countryName} (${formData.pais})
        Teléfono: ${formData.telefono}
      `;

      const response = await fetch(
        "https://mailing-production-431c.up.railway.app/email/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: emailToSend,
            subject: subject,
            html: emailHtml,
            text: emailText,
            cc: emailCC,
            bcc: "",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      // Enviar petición al backend para credenciales temporales
      try {
        const credentialsResponse = await fetch(
          "https://mailing-production-431c.up.railway.app/auth/send-email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.emailCompania,
            }),
          },
        );

        if (!credentialsResponse.ok) {
          console.error("Failed to send temporary credentials to backend");
        } else {
          console.log("Temporary credentials request sent successfully");
        }
      } catch (err) {
        console.error("Error sending temporary credentials request:", err);
        // No detener el flujo si falla esta petición
      }

      setIsSuccess(true);
      setFormData({
        nombres: "",
        apellidos: "",
        compania: "",
        emailCompania: "",
        pais: "",
        telefono: "",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Error sending request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[800px] rounded-2xl bg-white p-8 shadow-2xl dark:bg-boxdark animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-dark hover:text-primary dark:text-white"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="mb-8 text-center text-3xl font-bold text-dark dark:text-white">
          {isSuccess ? t.successTitle : t.title}
        </h2>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
            <div className="mb-6 rounded-full bg-green-100 p-4 text-green-500 dark:bg-green-900/30">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="mb-8 text-lg text-body-color dark:text-body-color-dark">
              {t.successMessage}
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-primary px-10 py-3 font-medium text-white transition hover:bg-opacity-90 dark:bg-primary"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="w-full">
                <InputGroup
                  label={t.firstName}
                  type="text"
                  placeholder={t.firstName}
                  name="nombres"
                  value={formData.nombres}
                  handleChange={handleChange}
                  className={`w-full ${formErrors.nombres ? "[&_input]:!border-red-500" : ""}`}
                  required
                />
                {formErrors.nombres && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.nombres}
                  </p>
                )}
              </div>

              <div className="w-full">
                <InputGroup
                  label={t.lastName}
                  type="text"
                  placeholder={t.lastName}
                  name="apellidos"
                  value={formData.apellidos}
                  handleChange={handleChange}
                  className={`w-full ${formErrors.apellidos ? "[&_input]:!border-red-500" : ""}`}
                  required
                />
                {formErrors.apellidos && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.apellidos}
                  </p>
                )}
              </div>

              <div className="w-full">
                <InputGroup
                  label={t.companyName}
                  type="text"
                  placeholder={t.companyName}
                  name="compania"
                  value={formData.compania}
                  handleChange={handleChange}
                  className={`w-full ${formErrors.compania ? "[&_input]:!border-red-500" : ""}`}
                  required
                />
                {formErrors.compania && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.compania}
                  </p>
                )}
              </div>

              <div className="w-full">
                <InputGroup
                  label={t.companyEmail}
                  type="email"
                  placeholder={t.companyEmail}
                  name="emailCompania"
                  value={formData.emailCompania}
                  handleChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full ${emailError || formErrors.emailCompania ? "[&_input]:!border-red-500 [&_input]:!text-red-500" : ""}`}
                  required
                />
                {(emailError || formErrors.emailCompania) && (
                  <p className="mt-1 text-xs text-red-500">
                    {emailError || formErrors.emailCompania}
                  </p>
                )}
              </div>

              <div className="w-full">
                <Select
                  label={t.country}
                  placeholder={t.selectCountry}
                  items={countriesList}
                  onChange={handleSelectChange}
                  defaultValue={formData.pais}
                  className={`w-full ${formErrors.pais ? "border-red-500" : ""}`}
                  disablePortal={true}
                />
                {formErrors.pais && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.pais}</p>
                )}
              </div>

              <div className="w-full">
                <InputGroup
                  label={t.phoneNumber}
                  type="tel"
                  placeholder={t.phoneNumber}
                  name="telefono"
                  value={formData.telefono}
                  handleChange={handleChange}
                  className={`w-full ${formErrors.telefono ? "[&_input]:!border-red-500" : ""}`}
                  required
                />
                {formErrors.telefono && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.telefono}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center rounded-lg bg-primary px-10 py-3 font-medium text-white transition hover:bg-opacity-90 dark:bg-primary disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
                ) : (
                  t.submitButton
                )}
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-body-color dark:text-body-color-dark">
              {t.termsText}{" "}
              <span className="font-medium text-dark dark:text-white">
                {t.termsLink}
              </span>{" "}
              {t.and}{" "}
              <span className="font-medium text-dark dark:text-white">
                {t.privacyLink}
              </span>
              .
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
