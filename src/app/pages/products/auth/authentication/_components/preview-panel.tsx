"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { AuthConfig, ViewMode } from "./authentication-config";
import { GoogleIcon, FacebookIcon, AppleIcon } from "./oauth-icons";
import { useAuthTranslations } from "./use-auth-translations";
import { OTPInput } from "./otp-input";
import { CountrySelector, type Country } from "./country-selector";
import { ProgressIndicator } from "./progress-indicator";
import { SuccessAnimation } from "./success-animation";

import { useTour } from "@/contexts/tour-context";
import { useCTAButtonAnimations } from "@/hooks/use-cta-button-animations";

interface PreviewPanelProps {
  config: AuthConfig;
  updateConfig: (updates: Partial<AuthConfig>) => void;
}

function MobileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function WebIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

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

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

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
      const [r, g, b] = isDarkMode ? [255, 255, 255] : [94, 109, 136];

      for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
        for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = distance / maxDistance;
          const wavePhase = (normalizedDistance * waveFrequency - elapsed * waveSpeed) * Math.PI * 2;
          const pulse = (Math.cos(wavePhase) + 1) / 2;
          const edgeFade = Math.pow(1 - normalizedDistance, 1.4);
          const alpha = (0.06 + pulse * 0.45) * edgeFade;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.4 + pulse * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (time: number) => {
      render(time);
      animationRef.current = requestAnimationFrame(loop);
    };

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(performance.now());
    };

    resize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(resize);
      observer.observe(parent);
      resizeObserverRef.current = observer;
    }

    animationRef.current = requestAnimationFrame(loop);

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

export function PreviewPanel({ config, updateConfig }: PreviewPanelProps) {
  const { viewMode, serviceType, loginMethod, oauthProviders, registrationFields, customRegistrationFields, branding } = config;
  const translations = useAuthTranslations();
  const { isTourActive, currentStep, steps } = useTour();

  // Detectar si el preview está en modo dark (basado en la clase dark del contenedor)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Estados para el flujo de registro
  const [registerStep, setRegisterStep] = useState(1);
  // showSuccessAnimation state removed
  const [otpStatus, setOtpStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle'); // Status para OTP
  const [activeFieldStep5, setActiveFieldStep5] = useState<string | null>(null); // Campo activo en el paso 5
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    emailOTP: string;
    phoneCountry: string;
    phoneNumber: string;
    phoneOTP: string;
    username: string;
    password: string;
    showPassword: boolean;
    idNumber: string;
    birthDate: string;
    address: string;
    [key: string]: any; // Para campos personalizados
  }>({
    fullName: "",
    email: "",
    emailOTP: "",
    phoneCountry: "US",
    phoneNumber: "",
    phoneOTP: "",
    username: "",
    password: "",
    showPassword: false,
    idNumber: "",
    birthDate: "",
    address: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Verificar si el documento tiene la clase dark
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Observar cambios en la clase dark
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const currentBranding = branding.light;

  // Función helper para generar una versión más oscura del color
  const darkenColor = (color: string, amount: number = 0.3): string => {
    // Convertir hex a RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Oscurecer cada componente
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));

    // Convertir de vuelta a hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  // Función para generar color casi negro basado en el color del tema
  const getAlmostBlackColor = (color: string): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Mantener el matiz del color pero muy oscuro (casi negro)
    const factor = 0.15; // Muy oscuro pero manteniendo un poco del color original

    const newR = Math.max(0, Math.floor(r * factor));
    const newG = Math.max(0, Math.floor(g * factor));
    const newB = Math.max(0, Math.floor(b * factor));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const themeColor = currentBranding.customColorTheme;
  
  // Inicializar animaciones CTA con el color del tema
  useCTAButtonAnimations(themeColor);
  const darkThemeColor = darkenColor(themeColor, 0.4); // Más oscuro
  const almostBlackColor = getAlmostBlackColor(themeColor);
  const blackColor = '#000000';

  useEffect(() => {
    const styleId = "auth-preview-animations";
    let style = document.getElementById(styleId) as HTMLStyleElement;
    
    if (typeof document !== "undefined") {
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }
      
      // Convertir themeColor a RGB para usar en rgba
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 59, g: 130, b: 246 };
      };
      
      const rgb = hexToRgb(themeColor);
      
      style.textContent = `
        @keyframes halftonePulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.8; }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 4px 14px 0 rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4);
          }
          50% {
            box-shadow: 0 4px 20px 0 rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8), 0 0 30px 0 rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4);
          }
        }
        @keyframes pulse-ring {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        @keyframes shine-sweep {
          0% {
            transform: translateX(-100%) skewX(-15deg);
          }
          100% {
            transform: translateX(200%) skewX(-15deg);
          }
        }
        @keyframes bounce-arrow {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }
        @keyframes button-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.6;
            filter: brightness(1);
          }
          50% {
            opacity: 1;
            filter: brightness(1.3);
          }
        }
      `;
    }
  }, [themeColor]);

  // Inyectar estilos dinámicos para los placeholders
  useEffect(() => {
    const styleId = "auth-preview-placeholder-styles";
    let style = document.getElementById(styleId) as HTMLStyleElement;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `
      .auth-email-input::placeholder {
        color: ${themeColor};
        opacity: 0.6;
      }
      .auth-password-input::placeholder {
        color: ${themeColor};
        opacity: 0.6;
      }
    `;
  }, [themeColor]);

  const toggleViewMode = () => {
    updateConfig({ viewMode: viewMode === "mobile" ? "web" : "mobile" });
  };

  // Funciones de validación
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return /^[0-9]{10,15}$/.test(phone.replace(/\s/g, ""));
  };

  const validateFullName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateNumeric = (value: string): boolean => {
    return /^[0-9]+$/.test(value);
  };

  const validateDate = (value: string): boolean => {
    if (!value) return false;
    const time = Date.parse(value);
    return !Number.isNaN(time);
  };

  const validateUsername = (value: string): boolean => {
    // 3-30 chars, letras/números/._-, sin espacios
    return /^[a-zA-Z0-9._-]{3,30}$/.test(value);
  };

  const handleBack = () => {
    if (serviceType === "register") {
      setRegisterStep((prev) => {
        const next = Math.max(1, prev - 1);
        // Si volvemos desde OTP, limpiar el OTP y su estado
        if (prev === 2) {
          setFormData((data) => ({ ...data, emailOTP: "" }));
          setOtpStatus("idle");
        }
        if (prev === 4) {
          setFormData((data) => ({ ...data, phoneOTP: "" }));
          setOtpStatus("idle");
        }
        // Al salir del paso 5, cerrar acordeones activos
        if (prev === 5) {
          setActiveFieldStep5(null);
        }
        return next;
      });
      return;
    }

    // Login: si está en OAuth, volver a Email & Password para no tocar navegación externa
    if (loginMethod === "oauth") {
      updateConfig({ loginMethod: "email" });
    }
  };

  // Handlers para el flujo de registro
  const handleStep1Continue = () => {
    const errors: Record<string, string> = {};
    if (!validateFullName(formData.fullName)) {
      errors.fullName = "El nombre debe tener al menos 2 caracteres";
    }
    if (!validateEmail(formData.email)) {
      errors.email = "Correo electrónico inválido";
    }

    if (Object.keys(errors).length === 0) {
      setRegisterStep(2);
      setValidationErrors({});
    } else {
      setValidationErrors(errors);
    }
  };

  const handleStep2Verify = () => {
    if (formData.emailOTP.length === 6) {
      setOtpStatus('verifying');

      // VERIFICACIÓN QUEMADA: 202601
      const isValid = formData.emailOTP === '202601';

      if (isValid) {
        // FLUJO DE ÉXITO
        setTimeout(() => {
          setOtpStatus('success');
          // Esperar a que termine la animación de success (colapso + checkmark)
          setTimeout(() => {
            setOtpStatus('idle'); // Reset para el siguiente uso
            setRegisterStep(3);
          }, 3000); // 3s para ver el checkmark completo
        }, 1000); // 0.8s rayos + 0.2s buffer = 1.0s
      } else {
        // FLUJO DE ERROR
        setTimeout(() => {
          setOtpStatus('error');
          // Esperar 2s mostrando la X roja y luego resetear
          setTimeout(() => {
            setOtpStatus('idle');
            setFormData({ ...formData, emailOTP: '' }); // Limpiar campo para reintentar
          }, 2000);
        }, 1000);
      }
    }
  };

  const handleStep3Continue = () => {
    const errors: Record<string, string> = {};
    if (!validatePhone(formData.phoneNumber)) {
      errors.phoneNumber = "Número de teléfono inválido";
    }

    if (Object.keys(errors).length === 0) {
      setRegisterStep(4);
      setValidationErrors({});
    } else {
      setValidationErrors(errors);
    }
  };

  const handleStep4Verify = () => {
    if (formData.phoneOTP.length === 6) {
      setOtpStatus('verifying');

      // VERIFICACIÓN QUEMADA: 202601
      const isValid = formData.phoneOTP === '202601';

      if (isValid) {
        // FLUJO DE ÉXITO
        setTimeout(() => {
          setOtpStatus('success');
          // Esperar a que termine la animación de success (colapso + checkmark)
          setTimeout(() => {
            setOtpStatus('idle'); // Reset para el siguiente uso
            setRegisterStep(5);
          }, 3000); // 3s para ver el checkmark completo
        }, 1000); // 0.8s rayos + 0.2s buffer = 1.0s
      } else {
        // FLUJO DE ERROR
        setTimeout(() => {
          setOtpStatus('error');
          // Esperar 2s mostrando la X roja y luego resetear
          setTimeout(() => {
            setOtpStatus('idle');
            setFormData({ ...formData, phoneOTP: '' }); // Limpiar campo para reintentar
          }, 2000);
        }, 1000);
      }
    }
  };

  const handleStep5CreateAccount = () => {
    const errors: Record<string, string> = {};
    const enabledFields = registrationFields.filter((f) => f.enabled);

    // Campos obligatorios siempre
    if (!formData.password || !validatePassword(formData.password)) {
      errors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    // Validar campos habilitados (excluyendo fullName, email, phone que ya están validados)
    enabledFields.forEach((field) => {
      if (field.id === "fullName" || field.id === "email" || field.id === "phone") return;

      const value = (formData[field.id as keyof typeof formData] as string) ?? "";

      if (field.required && (!value || value.trim() === "")) {
        errors[field.id] = "Este campo es obligatorio";
        return;
      }

      // Validaciones por tipo de campo
      if (value && field.id === "idNumber" && !validateNumeric(value)) {
        errors.idNumber = "Solo números";
      }
      if (value && field.id === "birthDate" && !validateDate(value)) {
        errors.birthDate = "Fecha inválida";
      }
      if (value && field.id === "username" && !validateUsername(value)) {
        errors.username = "Usuario inválido";
      }
    });

    // Validar campos personalizados según tipo
    customRegistrationFields.forEach((field) => {
      const rawValue = (formData[field.id] as string) ?? "";
      const value = rawValue.toString();

      if (field.required && (!value || value.trim() === "")) {
        errors[field.id] = "Este campo es obligatorio";
        return;
      }
      if (!value) return;

      if ((field.type === "number" || field.type === "tel") && !validateNumeric(value.replace(/\s/g, ""))) {
        errors[field.id] = "Solo números";
      } else if (field.type === "email" && !validateEmail(value)) {
        errors[field.id] = "Correo electrónico inválido";
      } else if (field.type === "date" && !validateDate(value)) {
        errors[field.id] = "Fecha inválida";
      } else if (field.type === "select" && field.options?.length) {
        if (!field.options.includes(value)) {
          errors[field.id] = "Opción inválida";
        }
      }
    });

    if (Object.keys(errors).length === 0) {
      // Aquí se completaría el registro
      console.log("Registro completado", formData);
    } else {
      setValidationErrors(errors);
    }
  };

  const renderLoginPreview = () => {
    // SVG geométrico adaptado al color del tema
    const GeometricSVG = () => {
      // Generar un color más claro para el gradiente
      const lightenColor = (color: string, amount: number = 0.2): string => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
        const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
        const newB = Math.min(255, Math.floor(b + (255 - b) * amount));

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
      };

      const lightThemeColor = lightenColor(themeColor, 0.3);

      return (
        <div className="flex justify-center py-2">
          <svg
            id="Capa_2"
            data-name="Capa 2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 227.97 208.83"
            className="h-48 w-48 opacity-80"
          >
            <defs>
              <linearGradient id="geometric-gradient" x1="83.4" y1="-403.05" x2="138.41" y2="-403.05" gradientTransform="translate(0 -295.68) scale(1 -1)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={lightThemeColor} />
                <stop offset="1" stopColor={darkThemeColor} />
              </linearGradient>
              <linearGradient id="geometric-gradient-2" x1="82.4" y1="-404.48" x2="140.2" y2="-404.48" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-3" x1="81.65" y1="-406.1" x2="142.02" y2="-406.1" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-4" x1="81.13" y1="-407.88" x2="143.8" y2="-407.88" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-5" x1="80.92" y1="-409.88" x2="145.54" y2="-409.88" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-6" x1="80.48" y1="-410.75" x2="147.27" y2="-410.75" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-7" x1="76.73" y1="-411.26" x2="148.87" y2="-411.26" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-8" x1="72.75" y1="-411.69" x2="150.4" y2="-411.69" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-9" x1="68.53" y1="-412.03" x2="151.88" y2="-412.03" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-10" x1="64.05" y1="-412.26" x2="153.16" y2="-412.26" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-11" x1="59.34" y1="-412.37" x2="154.4" y2="-412.37" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-12" x1="54.37" y1="-412.33" x2="155.43" y2="-412.33" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-13" x1="49.14" y1="-412.1" x2="156.31" y2="-412.1" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-14" x1="43.65" y1="-411.65" x2="157.07" y2="-411.65" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-15" x1="37.91" y1="-410.96" x2="157.64" y2="-410.96" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-16" x1="31.95" y1="-410" x2="159.46" y2="-410" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-17" x1="25.75" y1="-408.75" x2="170.25" y2="-408.75" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-18" x1="19.4" y1="-407.14" x2="182.43" y2="-407.14" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-19" x1="12.95" y1="-405.19" x2="196.06" y2="-405.19" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-20" x1="6.42" y1="-402.81" x2="211.27" y2="-402.81" xlinkHref="#geometric-gradient" />
              <linearGradient id="geometric-gradient-21" x1="0" y1="-399.99" x2="227.97" y2="-399.99" xlinkHref="#geometric-gradient" />
            </defs>
            <g id="object">
              <g>
                <path fill="url(#geometric-gradient-9)" d="M88.26,132.16c-1.38,0-2.57-.36-3.44-1.09-1.59-1.33-1.85-3.72-.71-6.53l12.36-30.54c1.69-4.18,6.16-8.47,10.86-10.42,2.67-1.11,5.1-1.31,6.85-.57l21.74,9.18c1.49.63,2.34,1.84,2.48,3.5.31,3.9-3.41,9.31-8.65,12.6l-34.1,21.36c-2.65,1.66-5.25,2.51-7.39,2.51h0ZM111.8,83.36c-1.23,0-2.66.32-4.18.95-4.52,1.88-8.81,5.98-10.43,9.98l-12.36,30.54c-1.02,2.52-.85,4.52.48,5.63,1.95,1.64,5.84,1.06,9.9-1.49l34.1-21.36c5.71-3.58,8.53-8.78,8.28-11.87-.11-1.37-.78-2.32-2-2.84l-21.74-9.18c-.6-.25-1.3-.38-2.07-.38l.02.02Z" />
                <path fill="url(#geometric-gradient-8)" d="M87.49,135.9c-1.3,0-2.44-.32-3.33-.97-1.77-1.3-2.22-3.66-1.25-6.66l10.72-33.16c2.48-7.67,12.67-14.91,18.48-13.13l24.95,7.63c1.72.53,2.78,1.74,3.07,3.5.66,4.05-2.93,10.03-8.36,13.92l-35.67,25.53c-3.06,2.19-6.13,3.34-8.61,3.34h0ZM110.17,82.49c-5.52,0-13.69,6.38-15.79,12.86l-10.72,33.16c-.86,2.65-.52,4.7.96,5.78,2.28,1.66,6.7.71,11.01-2.38l35.67-25.53c5.93-4.24,8.57-9.94,8.04-13.15-.24-1.47-1.09-2.44-2.52-2.87l-24.95-7.63c-.53-.16-1.1-.24-1.71-.24h.01Z" />
                <path fill="url(#geometric-gradient-7)" d="M86.96,139.86c-1.21,0-2.28-.27-3.16-.82-1.95-1.23-2.6-3.63-1.84-6.76l8.65-35.75c2-8.25,12.54-16.77,19.12-15.44l28.36,5.71c1.98.4,3.27,1.6,3.74,3.49,1.05,4.25-2.29,10.66-7.93,15.24l-37.01,30.05c-3.43,2.78-7.05,4.3-9.93,4.3v-.02ZM108.3,81.73c-6.17,0-15.17,7.74-16.93,14.98l-8.65,35.75c-.67,2.77-.14,4.87,1.5,5.91,2.23,1.41,6.85.89,12.17-3.43l37.01-30.04c6.07-4.93,8.48-11.12,7.66-14.43-.39-1.56-1.47-2.57-3.12-2.9l-28.36-5.71c-.41-.08-.84-.12-1.28-.12h0Z" />
                <path fill="url(#geometric-gradient-6)" d="M86.79,144.08c-1.12,0-2.14-.23-3.01-.69-2.13-1.15-3.02-3.57-2.5-6.81l6.12-38.29c1.41-8.83,12.23-18.71,19.62-17.93l31.94,3.39c2.27.24,3.82,1.43,4.49,3.45,1.44,4.36-1.65,11.32-7.35,16.54l-38.06,34.9c-3.81,3.49-7.97,5.44-11.26,5.44h.01ZM106.18,81.11c-6.9,0-16.72,9.29-18,17.31l-6.12,38.29c-.46,2.89.28,5.02,2.09,5.99,2.6,1.4,7.74.51,13.35-4.64l38.06-34.9c6.14-5.63,8.26-12.3,7.13-15.72-.56-1.7-1.88-2.7-3.82-2.91l-31.94-3.39c-.25-.03-.5-.04-.76-.04h.01Z" />
                <path fill="url(#geometric-gradient-5)" d="M87,148.53c-1.02,0-1.97-.18-2.81-.56-2.33-1.05-3.48-3.47-3.23-6.82l3.06-40.71c.71-9.38,11.68-20.75,19.94-20.58l35.68.62c2.6.05,4.45,1.21,5.34,3.37,1.85,4.46-.93,11.96-6.61,17.83l-38.75,40.09c-4.16,4.3-8.88,6.77-12.63,6.77h0ZM103.8,80.65c-7.73,0-18.34,11.05-19,19.85l-3.06,40.71c-.23,3,.76,5.14,2.76,6.04,3.58,1.61,9.56-.87,14.55-6.03l38.75-40.09c6.19-6.41,7.93-13.39,6.45-16.98-.76-1.85-2.36-2.84-4.62-2.88l-35.68-.62h-.15Z" />
                <path fill="url(#geometric-gradient-4)" d="M87.64,153.18c-.91,0-1.77-.14-2.56-.43-2.56-.93-3.99-3.33-4.04-6.78l-.55-42.97c-.13-9.89,10.92-22.78,20.04-23.39l39.56-2.62.03.39-.03-.39c2.92-.19,5.16.96,6.3,3.24,2.31,4.61-.03,12.45-5.7,19.08l-39.01,45.59c-4.46,5.22-9.78,8.28-14.04,8.28ZM140.71,77.75c-.19,0-.39,0-.59.02l-39.56,2.62c-8.6.57-19.42,13.24-19.3,22.59l.55,42.97c.04,3.14,1.26,5.23,3.52,6.05,4.14,1.5,10.61-1.63,15.74-7.62l39.01-45.59c6.09-7.12,7.43-14.55,5.59-18.21-.93-1.86-2.64-2.83-4.96-2.83h0Z" />
                <path fill="url(#geometric-gradient-3)" d="M88.67,157.98c-.75,0-1.47-.09-2.15-.28-2.81-.78-4.56-3.15-4.94-6.68l-4.77-45.01c-1.1-10.35,9.86-24.88,19.88-26.34l43.53-6.38c3.31-.49,5.94.6,7.39,3.05,2.77,4.67.87,13-4.61,20.27l-38.76,51.39c-4.65,6.16-10.73,9.98-15.57,9.98h0ZM140.28,73.67l.06.39-43.53,6.38c-9.48,1.39-20.25,15.68-19.21,25.48l4.77,45.01c.34,3.23,1.85,5.3,4.36,6,4.76,1.32,11.7-2.55,16.88-9.41l38.76-51.39c5.3-7.02,7.17-15,4.57-19.39-1.3-2.19-3.58-3.12-6.6-2.67l-.06-.39h0Z" />
                <path fill="url(#geometric-gradient-8)" d="M90.33,162.92c-.58,0-1.14-.05-1.69-.16-3.09-.6-5.21-2.91-5.95-6.5l-9.64-46.76c-2.22-10.75,8.49-26.98,19.42-29.43l47.57-10.68c3.74-.84,6.8.15,8.62,2.78,3.24,4.7,1.87,13.5-3.34,21.4l-37.92,57.44c-4.79,7.26-11.56,11.91-17.06,11.91h0ZM140.12,69.77l.09.39-47.57,10.68c-10.37,2.33-20.92,18.31-18.82,28.5l9.64,46.76c.68,3.31,2.52,5.35,5.33,5.89,5.44,1.05,12.82-3.65,17.94-11.41l37.92-57.44c5.04-7.64,6.42-16.07,3.35-20.51-1.65-2.39-4.34-3.24-7.8-2.46l-.09-.39h.01Z" />
                <path fill="url(#geometric-gradient-9)" d="M92.58,167.96c-.36,0-.72-.02-1.07-.06-3.42-.37-5.94-2.58-7.09-6.25l-15.2-48.15c-1.55-4.91-.46-11.48,3-18.02,3.83-7.26,9.82-12.85,15.63-14.6l51.62-15.57.11.38-.11-.38c4.2-1.27,7.76-.41,10,2.41,3.81,4.79,3.05,13.81-1.88,22.44l-36.42,63.72c-4.84,8.46-12.33,14.07-18.59,14.08h0ZM143.05,65.54c-1.05,0-2.18.18-3.36.53l-51.62,15.57c-5.61,1.69-11.42,7.14-15.16,14.21-3.31,6.26-4.41,12.77-2.94,17.42l15.2,48.15c1.07,3.39,3.29,5.36,6.42,5.7,6.16.66,13.92-4.94,18.88-13.63l36.42-63.72c4.7-8.23,5.5-17.09,1.95-21.56-1.41-1.77-3.41-2.68-5.79-2.68h0Z" />
                <path fill="url(#geometric-gradient-10)" d="M95.46,173.04h-.23c-3.79-.08-6.77-2.16-8.39-5.88l-21.49-49.1c-2.11-4.81-1.64-11.54,1.27-18.47,3.49-8.3,9.69-14.98,16.17-17.44l55.62-21.06c4.69-1.78,8.79-1.1,11.54,1.92,4.36,4.77,4.27,14.17-.22,23.38l-34.14,70.16c-4.74,9.75-12.99,16.49-20.14,16.49h.01ZM138.56,61.47l.14.37-55.62,21.06c-6.29,2.38-12.31,8.9-15.72,17.01-2.83,6.72-3.29,13.23-1.27,17.84l21.49,49.1c1.52,3.47,4.18,5.34,7.69,5.41,6.91.13,14.98-6.46,19.64-16.04l34.14-70.16c4.34-8.93,4.48-17.97.34-22.5-2.52-2.76-6.31-3.37-10.68-1.71l-.14-.37h-.01Z" />
                <path fill="url(#geometric-gradient-11)" d="M99.13,178.11c-3.84,0-7.03-1.9-9.05-5.4l-28.54-49.51c-2.71-4.7-2.92-11.57-.59-18.85,2.98-9.31,9.26-17.12,16.4-20.38l59.53-27.19.16.36-.16-.36c5.21-2.38,9.92-1.93,13.26,1.27,5.01,4.79,5.66,14.29,1.66,24.2l-30.99,76.7c-4.33,10.71-12.9,18.58-20.84,19.13-.28.02-.56.03-.84.03h0ZM143.13,56.07c-1.84,0-3.84.47-5.93,1.43l-59.53,27.19c-6.94,3.17-13.06,10.79-15.97,19.9-2.26,7.07-2.07,13.72.52,18.22l28.54,49.51c2.04,3.53,5.2,5.25,9.15,4.98,7.65-.53,15.94-8.2,20.16-18.64l30.99-76.7c3.82-9.46,3.23-18.83-1.47-23.33-1.77-1.7-3.98-2.55-6.46-2.55h0Z" />
                <path fill="url(#geometric-gradient-12)" d="M103.6,183.08c-3.78,0-7.06-1.68-9.41-4.86l-36.38-49.3c-3.37-4.56-4.31-11.57-2.59-19.22,2.27-10.09,8.66-19.26,16.27-23.35l63.26-33.97c5.65-3.03,11.17-2.87,15.15.45,5.64,4.7,7.12,14.47,3.76,24.88l-26.88,83.27c-3.71,11.5-12.34,20.51-20.99,21.92-.75.12-1.48.18-2.2.18h0ZM134.93,52.73l.19.35-63.26,33.97c-7.42,3.99-13.66,12.95-15.88,22.82-1.67,7.43-.78,14.2,2.46,18.58l36.38,49.3c2.65,3.58,6.39,5.09,10.84,4.37,8.37-1.37,16.74-10.16,20.36-21.39l26.88-83.27c3.26-10.1,1.88-19.54-3.51-24.03-3.77-3.15-8.84-3.27-14.27-.36l-.19-.35h0Z" />
                <path fill="url(#geometric-gradient-13)" d="M108.9,187.9c-3.69,0-7.02-1.46-9.64-4.27l-45.05-48.36c-4.1-4.41-5.84-11.55-4.77-19.6,1.46-10.92,7.65-21.23,15.78-26.28l66.73-41.43.21.34-.21-.34c6.17-3.83,12.45-4.05,17.23-.59,6.32,4.57,8.7,14.54,6.08,25.41l-21.69,89.79c-2.94,12.18-11.47,22.38-20.74,24.81-1.34.35-2.66.53-3.94.53h.01ZM132.38,48.63l-66.73,41.43c-7.94,4.93-13.99,15.02-15.42,25.71-1.04,7.81.62,14.72,4.56,18.96l45.05,48.36c3.32,3.56,7.87,4.81,12.8,3.52,9-2.36,17.3-12.33,20.18-24.23l21.69-89.79c2.55-10.55.28-20.2-5.78-24.58-4.5-3.26-10.46-3.03-16.35.62h0Z" />
                <path fill="url(#geometric-gradient-14)" d="M115.13,192.47c-3.57,0-6.9-1.23-9.72-3.64l-54.55-46.58c-4.94-4.22-7.56-11.51-7.17-19.99.52-11.62,6.38-23.05,14.92-29.11l69.85-49.56.23.32-.23-.32c6.68-4.74,13.78-5.43,19.47-1.89,7.16,4.44,10.47,14.31,8.65,25.76l-15.31,96.14c-2.06,12.93-10.11,24.07-20.03,27.72-2.08.77-4.13,1.15-6.12,1.15h.01ZM140.11,40.26c-3.63,0-7.47,1.33-11.18,3.97l-69.85,49.56c-8.35,5.93-14.08,17.11-14.59,28.5-.37,8.24,2.14,15.3,6.9,19.36l54.54,46.58c4.17,3.56,9.51,4.39,15.05,2.35,9.66-3.56,17.51-14.45,19.52-27.11l15.31-96.14c1.77-11.12-1.4-20.69-8.29-24.96-2.27-1.41-4.79-2.11-7.42-2.11h0Z" />
                <path fill="url(#geometric-gradient-15)" d="M122.31,196.69c-3.4,0-6.66-1-9.6-2.98l-64.89-43.84c-5.9-3.99-9.5-11.42-9.87-20.41-.51-12.19,4.87-24.67,13.7-31.77l72.52-58.38c7.15-5.76,15.12-7.02,21.88-3.47,7.96,4.18,12.36,14.11,11.48,25.92l-7.63,102.22c-1,13.33-8.55,25.62-18.79,30.58-2.95,1.43-5.92,2.14-8.79,2.14h-.01ZM124.4,39.62l.25.31-72.52,58.38c-8.64,6.96-13.9,19.17-13.4,31.13.37,8.73,3.84,15.94,9.53,19.78l64.89,43.84c5.18,3.5,11.43,3.78,17.6.79,10-4.84,17.38-16.87,18.35-29.93l7.63-102.22c.86-11.48-3.38-21.12-11.06-25.16-6.46-3.4-14.12-2.16-21.02,3.39l-.25-.31h0Z" />
                <path fill="url(#geometric-gradient-16)" d="M130.5,200.48c-3.18,0-6.3-.77-9.24-2.32l-76.07-40.02c-7-3.68-11.72-11.27-12.93-20.82-1.61-12.63,3.15-26.06,12.12-34.23L119,35.22c7.56-6.88,16.46-8.85,24.41-5.39,8.85,3.84,14.44,13.75,14.6,25.86l1.45,107.89c.19,13.78-6.48,26.84-16.99,33.28-3.92,2.4-7.99,3.61-11.98,3.61h.01ZM119.26,35.52l.27.29L44.91,103.68c-8.79,8-13.45,21.16-11.87,33.54,1.18,9.29,5.75,16.66,12.52,20.22l76.07,40.02c6.37,3.35,13.63,2.9,20.43-1.27,10.27-6.3,16.79-19.09,16.61-32.6l-1.45-107.89c-.16-11.8-5.57-21.43-14.13-25.15-7.65-3.32-16.24-1.41-23.57,5.25l-.27-.29h.01Z" />
                <path fill="url(#geometric-gradient-17)" d="M139.62,203.67c-2.87,0-5.73-.54-8.47-1.63l-88.07-34.99c-8.28-3.29-14.27-11.01-16.44-21.2-2.8-13.12,1.12-27.08,10.23-36.42L112.89,31.41c7.77-7.98,17.88-10.85,27.02-7.69,9.97,3.45,16.72,13.01,18.06,25.57l12.05,113.01c1.48,13.85-4.26,27.88-14.61,35.74-4.9,3.72-10.37,5.63-15.79,5.63h0ZM113.15,31.69l.28.28L37.42,109.99c-8.92,9.16-12.76,22.84-10.02,35.71,2.12,9.92,7.93,17.44,15.96,20.63l88.07,34.99c7.66,3.04,16.22,1.62,23.49-3.9,10.14-7.7,15.75-21.45,14.3-35.03l-12.05-113.01c-1.31-12.25-7.86-21.56-17.53-24.9-8.85-3.06-18.64-.26-26.2,7.49l-.28-.28h0Z" />
                <path fill="url(#geometric-gradient-18)" d="M149.81,206.23c-2.45,0-4.92-.34-7.35-1.03l-100.87-28.61c-9.74-2.76-17.2-10.6-20.47-21.5-3.98-13.28-.9-27.97,8.03-38.34L105.74,27.96c7.98-9.26,19.07-13.14,29.65-10.4,11.07,2.87,19.26,12.22,21.9,25l24.28,117.4c2.89,13.99-1.58,28.51-11.67,37.89-5.9,5.48-12.95,8.37-20.1,8.37h0ZM106.04,28.23l.3.26L29.75,117.28c-8.76,10.16-11.78,24.57-7.88,37.59,3.19,10.64,10.45,18.28,19.93,20.97l100.87,28.61c9.25,2.62,18.98.02,26.69-7.16,9.89-9.2,14.27-23.43,11.43-37.15l-24.28-117.4c-2.58-12.48-10.55-21.6-21.33-24.4-10.29-2.67-21.07,1.12-28.85,10.15l-.3-.26h.01Z" />
                <path fill="url(#geometric-gradient-19)" d="M160.99,208c-1.89,0-3.79-.17-5.71-.52l-114.43-20.75c-11.42-2.07-20.57-9.96-25.11-21.64-5.17-13.31-3.03-28.62,5.58-39.94L97.5,25.02l.31.24-.31-.24c8.05-10.58,20.08-15.64,32.19-13.53,12.3,2.14,22.09,11.15,26.2,24.11l38.25,120.88c4.36,13.77,1.21,28.97-8.22,39.68-6.77,7.69-15.63,11.84-24.94,11.84h0ZM124.29,11.81c-9.96,0-19.47,4.89-26.16,13.69L21.95,125.63c-8.45,11.11-10.55,26.12-5.47,39.17,4.44,11.42,13.37,19.13,24.52,21.15l114.43,20.75c11.05,2,21.95-2.03,29.91-11.07,9.24-10.5,12.33-25.41,8.06-38.92l-38.25-120.88c-4.01-12.68-13.57-21.49-25.58-23.57-1.76-.31-3.52-.46-5.27-.46h-.01Z" />
                <path fill="url(#geometric-gradient-20)" d="M172.9,208.83c-1.07,0-2.13-.05-3.21-.14l-128.66-11.26c-13.13-1.15-24.51-9.2-30.44-21.54-6.45-13.42-5.36-28.83,2.89-41.22L88.1,22.68l.33.22-.33-.22c7.93-11.91,20.84-18.3,34.53-17.11,13.69,1.2,25.29,9.74,31.04,22.84l54.04,123.25c5.98,13.64,4.37,29-4.31,41.1-7.33,10.21-18.55,16.07-30.51,16.07h.01ZM119.38,6.23c-12.19,0-23.47,6.16-30.62,16.9L14.14,135.12c-8.1,12.16-9.16,27.28-2.84,40.44,5.81,12.08,16.94,19.97,29.79,21.09l128.67,11.26c12.85,1.12,25.19-4.71,33.01-15.6,8.51-11.87,10.09-26.94,4.23-40.32l-54.04-123.25c-5.63-12.84-16.99-21.2-30.38-22.37-1.07-.09-2.13-.14-3.19-.14h0Z" />
                <path fill="url(#geometric-gradient-21)" d="M185.75,208.63H42.24c-15.25,0-28.9-7.88-36.52-21.09-7.62-13.2-7.62-28.97,0-42.17L77.46,21.09C85.08,7.89,98.75,0,113.99,0h0c15.25,0,28.9,7.88,36.52,21.09l71.75,124.28c7.62,13.2,7.62,28.97,0,42.17s-21.28,21.09-36.52,21.09h.01ZM77.82,21.29l.34.2L6.41,145.77c-7.48,12.96-7.48,28.43,0,41.38,7.48,12.96,20.88,20.69,35.84,20.69h143.51c14.96,0,28.36-7.74,35.84-20.69,7.48-12.96,7.48-28.43,0-41.38L149.85,21.49C142.37,8.53,128.97.8,114.01.8s-28.36,7.74-35.84,20.69l-.34-.2h-.01Z" />
              </g>
            </g>
          </svg>
        </div>
      );
    };

    if (loginMethod === "oauth") {
      return (
        <div className="space-y-3">
          {/* Header con back y logo */}
          <div className="relative mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              &lt; {translations.preview.backButton}
            </button>
            {currentBranding.logo && (
              <div className="absolute left-1/2 -translate-x-1/2">
                <img src={currentBranding.logo} alt="Logo" className="h-8 max-w-full object-contain" />
              </div>
            )}
            <div className="w-12"></div> {/* Spacer para centrar el logo */}
          </div>

          {/* SVG Geométrico */}
          {/* SVG Geométrico - Reemplazado por GIF Animado */}
          <div className="relative -mb-16 flex justify-center z-0">
            <img
              src="/gift/ANIMACION%201.gif"
              alt="Connecting Animation"
              className="h-48 w-48 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
            />
          </div>

          {/* Tarjeta de login */}
          <div
            className="relative z-10 flex-1 overflow-hidden rounded-2xl p-5 backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.35)',
            }}
          >
            <h3 className="mb-1 text-2xl font-bold" style={{ color: themeColor }}>
              {translations.preview.loginTitle}
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              {translations.preview.welcomeBack}
            </p>
            <div className="space-y-2">
              {oauthProviders.includes("google") && (
                <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-stroke bg-white px-4 py-3 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 dark:active:bg-dark-3">
                  <GoogleIcon />
                  {translations.preview.providerAction} Google
                </button>
              )}
              {oauthProviders.includes("facebook") && (
                <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-stroke bg-white px-4 py-3 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 dark:active:bg-dark-3">
                  <FacebookIcon />
                  {translations.preview.providerAction} Facebook
                </button>
              )}
              {oauthProviders.includes("apple") && (
                <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-stroke bg-white px-4 py-3 text-sm font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 dark:active:bg-dark-3">
                  <AppleIcon />
                  {translations.preview.providerAction} Apple
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header con back y logo */}
        <div className="relative mb-3 flex flex-shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            &lt; {translations.preview.backButton}
          </button>
          {currentBranding.logo && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src={currentBranding.logo} alt="Logo" className="h-8 max-w-full object-contain" />
            </div>
          )}
          <div className="w-12"></div> {/* Spacer para centrar el logo */}
        </div>

        {/* SVG Geométrico - Reemplazado por GIF Animado */}
        <div className="relative -mb-16 flex-shrink-0 z-0 flex justify-center">
          <img
            src="/gift/ANIMACION%201.gif"
            alt="Connecting Animation"
            className="h-48 w-48 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
          />
        </div>

        {/* Tarjeta de login con fondo blanco translúcido (no afectada por custom color theme) */}
        {/* 
          Para ajustar la transparencia, modifica el valor en backgroundColor (último número):
          - 0.0 = completamente transparente
          - 0.2 = muy transparente
          - 0.35 = bastante transparente
          - 0.5 = medio transparente
          - 1.0 = completamente opaco
          
          Para ajustar el blur, cambia backdrop-blur-xl por:
          - backdrop-blur-sm (poco blur)
          - backdrop-blur-md (blur medio)
          - backdrop-blur-lg (blur alto)
          - backdrop-blur-xl (blur muy alto)
          - backdrop-blur-none (sin blur)
        */}
        <div
          className="relative z-10 flex-1 overflow-hidden rounded-2xl p-5 backdrop-blur-sm" //aqui modificar el blur 
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.35)', // AJUSTA ESTE VALOR (0.0 a 1.0) para cambiar transparencia
          }}
        >
          <h3 className="mb-1 text-2xl font-bold" style={{ color: themeColor }}>
            {translations.preview.loginTitle}
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {translations.preview.welcomeBack}
          </p>

          <div className="space-y-3">
            {loginMethod === "phone" && (
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: themeColor }}>
                  {translations.preview.phoneLabel}
                </label>
                <input
                  type="tel"
                  placeholder={translations.preview.phonePlaceholder}
                  className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-dark outline-none placeholder:text-gray-400 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:placeholder:text-gray-500"
                  style={{
                    '--tw-placeholder-opacity': '1',
                  } as React.CSSProperties & { '--tw-placeholder-opacity': string }}
                />
              </div>
            )}
            {loginMethod === "username" && (
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: themeColor }}>
                  {translations.preview.usernameLabel}
                </label>
                <input
                  type="text"
                  placeholder={translations.preview.usernamePlaceholder}
                  className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-dark outline-none placeholder:text-gray-400 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            )}
            {loginMethod === "email" && (
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: themeColor }}>
                  {translations.preview.emailLabel}
                </label>
                <input
                  type="email"
                  placeholder={translations.preview.emailPlaceholder}
                  className="auth-email-input w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: themeColor }}>
                {translations.preview.passwordLabel}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="auth-password-input w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            {/* Botón con animaciones de call to action constantes */}
            <button
              className="group relative w-full overflow-hidden rounded-xl border px-4 py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
              style={{
                background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                borderColor: themeColor,
                boxShadow: `0 4px 14px 0 ${themeColor}40`,
                animation: 'pulse-glow 2s ease-in-out infinite, button-pulse 2.5s ease-in-out infinite',
              }}
            >
              {/* Resplandor animado alrededor del botón */}
              <span 
                className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10"
                style={{
                  background: themeColor,
                  animation: 'pulse-ring 2s ease-in-out infinite',
                }}
              ></span>
              
              {/* Brillo que se mueve automáticamente */}
              <span 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10"
                style={{
                  animation: 'shine-sweep 2.5s linear infinite',
                }}
              ></span>
              
              {/* Capa de brillo adicional constante */}
              <span 
                className="absolute inset-0 rounded-xl -z-10"
                style={{
                  background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`,
                  animation: 'glow-pulse 2s ease-in-out infinite',
                }}
              ></span>
              
              <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}>
                {translations.preview.signInButton}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ animation: 'bounce-arrow 1.2s ease-in-out infinite' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
              
              {/* Efecto de brillo al hacer hover (adicional) */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
            </button>

            {/* OAuth Social Login Buttons (Secondary) */}
            {oauthProviders.length > 0 && (
              <div className="pt-2">
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
                  </div>
                  <span className="relative bg-white px-2 text-[10px] uppercase text-gray-400 dark:bg-transparent dark:text-gray-500">
                    {translations.preview.orContinueWith}
                  </span>
                </div>
                <div className="flex justify-center gap-3">
                  {oauthProviders.includes("google") && (
                    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                      <div className="scale-75"><GoogleIcon /></div>
                    </button>
                  )}
                  {oauthProviders.includes("facebook") && (
                    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                      <div className="scale-75"><FacebookIcon /></div>
                    </button>
                  )}
                  {oauthProviders.includes("apple") && (
                    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                      <div className="scale-75"><AppleIcon /></div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Link para crear cuenta */}
          <p className="mt-4 text-center text-sm">
            <button className="font-medium" style={{ color: themeColor }}>
              {translations.preview.orCreateAccount}
            </button>
          </p>
        </div>
      </div>
    );
  };

  const renderRegisterPreview = (isMobile: boolean = false) => {
    const enabledFields = registrationFields.filter((field) => field.enabled);
    const totalSteps = 5;
    const progressText = translations.preview.progressStep
      .replace("{current}", registerStep.toString())
      .replace("{total}", totalSteps.toString());

    const renderStepContent = () => {
      switch (registerStep) {
        case 1:
          return (
            <div className="space-y-3">
              <div>
                <h3 className="mb-1 text-base font-semibold text-dark dark:text-white">
                  {translations.preview.step1Title}
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-dark-6 dark:text-dark-6">
                  {translations.preview.step1Subtitle}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: themeColor }}>
                  {translations.registrationFields.fullName}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (validationErrors.fullName) {
                      setValidationErrors({ ...validationErrors, fullName: "" });
                    }
                  }}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-xs text-dark outline-none transition dark:text-white",
                    validationErrors.fullName
                      ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                      : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                  )}
                  placeholder={translations.registrationFields.fullName}
                />
                {validationErrors.fullName && (
                  <p className="mt-0.5 text-[10px] text-red-600 dark:text-red-400">{validationErrors.fullName}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: themeColor }}>
                  {translations.preview.emailLabel}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: "" });
                    }
                  }}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-xs text-dark outline-none transition dark:text-white",
                    validationErrors.email
                      ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                      : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                  )}
                  placeholder={translations.preview.emailPlaceholder}
                />
                {validationErrors.email && (
                  <p className="mt-0.5 text-[10px] text-red-600 dark:text-red-400">{validationErrors.email}</p>
                )}
              </div>
              <button
                onClick={handleStep1Continue}
                disabled={!formData.fullName || !formData.email}
                className="group relative w-full overflow-hidden rounded-lg border px-4 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: (!formData.fullName || !formData.email)
                    ? '#9BA2AF' 
                    : `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                  borderColor: (!formData.fullName || !formData.email) ? '#9BA2AF' : themeColor,
                  boxShadow: (!formData.fullName || !formData.email) ? 'none' : `0 4px 14px 0 ${themeColor}40`,
                  animation: (!formData.fullName || !formData.email) ? 'none' : 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                }}
              >
                {(!(!formData.fullName || !formData.email)) && (
                  <>
                    <span className="absolute inset-0 rounded-lg opacity-60 blur-md -z-10" style={{ background: themeColor, animation: 'cta-pulse-ring 2s ease-in-out infinite' }}></span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10" style={{ animation: 'cta-shine-sweep 2.5s linear infinite' }}></span>
                    <span className="absolute inset-0 rounded-lg -z-10" style={{ background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`, animation: 'cta-glow-pulse 2s ease-in-out infinite' }}></span>
                  </>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: (!formData.fullName || !formData.email) ? 'none' : 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  {translations.preview.continueButton}
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
              </button>
              <p className="text-center text-[10px] text-dark-6 dark:text-dark-6">
                {translations.preview.alreadyHaveAccount}{" "}
                <button className="font-medium text-primary">{translations.preview.signInLink}</button>
              </p>
            </div>
          );

        case 2:
          return (
            <div className="space-y-3">
              <div>
                <h3 className="mb-1 text-base font-semibold text-dark dark:text-white">
                  {translations.preview.step2Title}
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-dark-6 dark:text-dark-6">
                  {translations.preview.step2Subtitle} <span className="font-medium break-all">{formData.email}</span>
                </p>
              </div>
              <OTPInput
                length={6}
                value={formData.emailOTP}
                onChange={(value) => setFormData({ ...formData, emailOTP: value })}
                onComplete={handleStep2Verify}
                placeholder={translations.preview.otpPlaceholder}
                className="mb-2"
                themeColor={themeColor}
                status={registerStep === 2 ? otpStatus : 'idle'}
              />
              <button
                onClick={handleStep2Verify}
                disabled={formData.emailOTP.length !== 6}
                className="group relative w-full overflow-hidden rounded-lg border px-4 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: (formData.emailOTP.length !== 6)
                    ? '#9BA2AF' 
                    : `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                  borderColor: (formData.emailOTP.length !== 6) ? '#9BA2AF' : themeColor,
                  boxShadow: (formData.emailOTP.length !== 6) ? 'none' : `0 4px 14px 0 ${themeColor}40`,
                  animation: (formData.emailOTP.length !== 6) ? 'none' : 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                }}
              >
                {!(formData.emailOTP.length !== 6) && (
                  <>
                    <span className="absolute inset-0 rounded-lg opacity-60 blur-md -z-10" style={{ background: themeColor, animation: 'cta-pulse-ring 2s ease-in-out infinite' }}></span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10" style={{ animation: 'cta-shine-sweep 2.5s linear infinite' }}></span>
                    <span className="absolute inset-0 rounded-lg -z-10" style={{ background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`, animation: 'cta-glow-pulse 2s ease-in-out infinite' }}></span>
                  </>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: (formData.emailOTP.length !== 6) ? 'none' : 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  {translations.preview.verifyButton}
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
              </button>
              <p className="text-center text-[10px] text-dark-6 dark:text-dark-6">
                {translations.preview.didntReceiveCode}{" "}
                <button className="font-medium text-primary">{translations.preview.resendCode}</button>
              </p>
            </div>
          );

        case 3:
          return (
            <div className="space-y-3">
              <div>
                <h3 className="mb-1 text-base font-semibold text-dark dark:text-white">
                  {translations.preview.step3Title}
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-dark-6 dark:text-dark-6">
                  {translations.preview.step3Subtitle}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-28">
                  <CountrySelector
                    value={formData.phoneCountry}
                    onChange={(country) => setFormData({ ...formData, phoneCountry: country.code })}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, phoneNumber: e.target.value });
                      if (validationErrors.phoneNumber) {
                        setValidationErrors({ ...validationErrors, phoneNumber: "" });
                      }
                    }}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-xs text-dark outline-none transition dark:text-white",
                      validationErrors.phoneNumber
                        ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                        : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                    )}
                    placeholder={translations.preview.phoneNumberPlaceholder}
                  />
                  {validationErrors.phoneNumber && (
                    <p className="mt-0.5 text-[10px] text-red-600 dark:text-red-400">{validationErrors.phoneNumber}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleStep3Continue}
                disabled={!formData.phoneNumber}
                className="group relative w-full overflow-hidden rounded-lg border px-4 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: !formData.phoneNumber
                    ? '#9BA2AF' 
                    : `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                  borderColor: !formData.phoneNumber ? '#9BA2AF' : themeColor,
                  boxShadow: !formData.phoneNumber ? 'none' : `0 4px 14px 0 ${themeColor}40`,
                  animation: !formData.phoneNumber ? 'none' : 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                }}
              >
                {!!formData.phoneNumber && (
                  <>
                    <span className="absolute inset-0 rounded-lg opacity-60 blur-md -z-10" style={{ background: themeColor, animation: 'cta-pulse-ring 2s ease-in-out infinite' }}></span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10" style={{ animation: 'cta-shine-sweep 2.5s linear infinite' }}></span>
                    <span className="absolute inset-0 rounded-lg -z-10" style={{ background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`, animation: 'cta-glow-pulse 2s ease-in-out infinite' }}></span>
                  </>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: !formData.phoneNumber ? 'none' : 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  {translations.preview.continueButton}
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
              </button>
            </div>
          );

        case 4:
          return (
            <div className="space-y-3">
              <div>
                <h3 className="mb-1 text-base font-semibold text-dark dark:text-white">
                  {translations.preview.step4Title}
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-dark-6 dark:text-dark-6">
                  {translations.preview.step4Subtitle} <span className="font-medium">{formData.phoneNumber}</span>
                </p>
              </div>
              <OTPInput
                length={6}
                value={formData.phoneOTP}
                onChange={(value) => setFormData({ ...formData, phoneOTP: value })}
                onComplete={handleStep4Verify}
                placeholder={translations.preview.otpPlaceholder}
                className="mb-2"
                themeColor={themeColor}
                status={registerStep === 4 ? otpStatus : 'idle'}
              />
              <button
                onClick={handleStep4Verify}
                disabled={formData.phoneOTP.length !== 6}
                className="group relative w-full overflow-hidden rounded-lg border px-4 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: (formData.phoneOTP.length !== 6)
                    ? '#9BA2AF' 
                    : `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                  borderColor: (formData.phoneOTP.length !== 6) ? '#9BA2AF' : themeColor,
                  boxShadow: (formData.phoneOTP.length !== 6) ? 'none' : `0 4px 14px 0 ${themeColor}40`,
                  animation: (formData.phoneOTP.length !== 6) ? 'none' : 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                }}
              >
                {!(formData.phoneOTP.length !== 6) && (
                  <>
                    <span className="absolute inset-0 rounded-lg opacity-60 blur-md -z-10" style={{ background: themeColor, animation: 'cta-pulse-ring 2s ease-in-out infinite' }}></span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10" style={{ animation: 'cta-shine-sweep 2.5s linear infinite' }}></span>
                    <span className="absolute inset-0 rounded-lg -z-10" style={{ background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`, animation: 'cta-glow-pulse 2s ease-in-out infinite' }}></span>
                  </>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: (formData.phoneOTP.length !== 6) ? 'none' : 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  {translations.preview.verifyButton}
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
              </button>
              <p className="text-center text-[10px] text-dark-6 dark:text-dark-6">
                {translations.preview.didntReceiveCode}{" "}
                <button className="font-medium text-primary">{translations.preview.resendCode}</button>
              </p>
            </div>
          );

        case 5:
          // Función helper para renderizar campos con comportamiento de acordeón
          // IMPORTANTE: Esta función debe usar el valor actual de activeFieldStep5 del scope externo
          const renderAccordionField = (
            fieldId: string,
            label: string,
            isRequired: boolean,
            isActive: boolean,
            children: React.ReactNode,
            error?: string
          ) => {
            // Función para activar este campo (desactiva todos los demás automáticamente)
            const handleActivate = () => {
              // Siempre establecer el campo activo, esto automáticamente desactiva los demás
              setActiveFieldStep5(fieldId);
            };

            // Verificar que este campo es el único activo usando el estado actual
            // IMPORTANTE: Verificamos directamente activeFieldStep5 === fieldId
            // El parámetro isActive se pasa desde fuera pero lo ignoramos para evitar problemas de closure
            // Solo mostramos el campo como activo si activeFieldStep5 === fieldId Y activeFieldStep5 no es null
            const isCurrentlyActive = activeFieldStep5 !== null && activeFieldStep5 === fieldId;

            return (
              <div className="transition-all duration-300 ease-in-out">
                {isCurrentlyActive ? (
                  // Campo activo: label arriba + input completo
                  <>
                    <label className="mb-1.5 block text-sm font-semibold" style={{ color: themeColor }}>
                      {label}
                      {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    <div className="transition-all duration-300 ease-in-out">
                      {children}
                    </div>
                    {error && (
                      <p className="mt-0.5 text-[10px] text-red-600 dark:text-red-400">{error}</p>
                    )}
                  </>
                ) : (
                  // Campo inactivo: pastilla redonda con fondo redondeado
                  <div
                    onClick={handleActivate}
                    className="cursor-pointer rounded-full border border-stroke bg-gray-2 px-6 py-3 text-center transition-all duration-300 ease-in-out hover:bg-gray-3 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-3"
                    style={{
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <span className="text-sm font-semibold" style={{ color: themeColor }}>
                      {label}
                      {isRequired && <span className="text-red-500">*</span>}
                    </span>
                  </div>
                )}
              </div>
            );
          };

          return (
            <div className="flex min-h-0 flex-col gap-3">
              <div>
                <h3 className="mb-1 text-xl font-bold" style={{ color: themeColor }}>
                  {translations.preview.step5Title}
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  {translations.preview.step5Subtitle}
                </p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
                {/* 1. Nombre completo (siempre visible, no configurable, se llena con lo de la pantalla 1) */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold" style={{ color: themeColor }}>
                    {translations.registrationFields.fullName}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    readOnly
                    className="auth-register-input w-full rounded-lg border border-stroke bg-gray-2 px-3 py-2 text-xs text-dark outline-none opacity-60 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                {/* 2. Contraseña (siempre visible y obligatorio) */}
                {renderAccordionField(
                  "password",
                  translations.preview.passwordLabel,
                  true,
                  activeFieldStep5 === "password",
                  <div className="relative">
                    <input
                      type={formData.showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (validationErrors.password) {
                          setValidationErrors({ ...validationErrors, password: "" });
                        }
                      }}
                      onFocus={() => {
                        // Asegurar que solo este campo esté activo
                        setActiveFieldStep5("password");
                      }}
                      className={cn(
                        "auth-password-input w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-dark outline-none transition dark:text-white",
                        validationErrors.password
                          ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                          : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                      )}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, showPassword: !formData.showPassword });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-dark-6 hover:text-dark dark:text-dark-6"
                    >
                      {formData.showPassword ? translations.preview.hidePassword : translations.preview.showPassword}
                    </button>
                  </div>,
                  validationErrors.password
                )}

                {/* 3. Campos adicionales configurable (username, idNumber, birthDate, address) */}
                {enabledFields.find((f) => f.id === "username") &&
                  renderAccordionField(
                    "username",
                    translations.registrationFields.username,
                    enabledFields.find((f) => f.id === "username")?.required || false,
                    activeFieldStep5 === "username",
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => {
                        setFormData({ ...formData, username: e.target.value });
                        if (validationErrors.username) {
                          setValidationErrors({ ...validationErrors, username: "" });
                        }
                      }}
                      onFocus={() => setActiveFieldStep5("username")}
                      className={cn(
                        "auth-register-input w-full rounded-lg border px-3 py-2.5 text-sm text-dark outline-none transition dark:text-white",
                        validationErrors.username
                          ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                          : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                      )}
                      placeholder={translations.preview.usernamePlaceholder}
                    />,
                    validationErrors.username
                  )
                }

                {enabledFields.find((f) => f.id === "idNumber") &&
                  renderAccordionField(
                    "idNumber",
                    translations.registrationFields.idNumber,
                    enabledFields.find((f) => f.id === "idNumber")?.required || false,
                    activeFieldStep5 === "idNumber",
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.idNumber}
                      onChange={(e) => {
                        const next = e.target.value.replace(/[^0-9]/g, "");
                        setFormData({ ...formData, idNumber: next });
                        if (validationErrors.idNumber) {
                          setValidationErrors({ ...validationErrors, idNumber: "" });
                        }
                      }}
                      onFocus={() => setActiveFieldStep5("idNumber")}
                      className={cn(
                        "auth-register-input w-full rounded-lg border px-3 py-2.5 text-sm text-dark outline-none transition dark:text-white",
                        validationErrors.idNumber
                          ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                          : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                      )}
                      placeholder={translations.registrationFields.idNumber}
                    />,
                    validationErrors.idNumber
                  )
                }

                {enabledFields.find((f) => f.id === "birthDate") &&
                  renderAccordionField(
                    "birthDate",
                    translations.registrationFields.birthDate,
                    enabledFields.find((f) => f.id === "birthDate")?.required || false,
                    activeFieldStep5 === "birthDate",
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => {
                        setFormData({ ...formData, birthDate: e.target.value });
                        if (validationErrors.birthDate) {
                          setValidationErrors({ ...validationErrors, birthDate: "" });
                        }
                      }}
                      onFocus={() => setActiveFieldStep5("birthDate")}
                      className={cn(
                        "auth-register-input w-full rounded-lg border px-3 py-2.5 text-sm text-dark outline-none transition dark:text-white",
                        validationErrors.birthDate
                          ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                          : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                      )}
                    />,
                    validationErrors.birthDate
                  )
                }

                {enabledFields.find((f) => f.id === "address") &&
                  renderAccordionField(
                    "address",
                    translations.registrationFields.address,
                    enabledFields.find((f) => f.id === "address")?.required || false,
                    activeFieldStep5 === "address",
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (validationErrors.address) {
                          setValidationErrors({ ...validationErrors, address: "" });
                        }
                      }}
                      onFocus={() => setActiveFieldStep5("address")}
                      className={cn(
                        "auth-register-input w-full rounded-lg border px-3 py-2.5 text-sm text-dark outline-none transition dark:text-white",
                        validationErrors.address
                          ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                          : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                      )}
                      placeholder={translations.registrationFields.address}
                    />,
                    validationErrors.address
                  )
                }

                {/* Campos personalizados */}
                {customRegistrationFields.map((field) => {
                  const fieldId = `custom-${field.id}`;
                  const isActive = activeFieldStep5 === fieldId;

                  return renderAccordionField(
                    fieldId,
                    field.label || "Campo personalizado",
                    field.required || false,
                    isActive,
                    field.type === "textarea" ? (
                      <textarea
                        value={formData[field.id] || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (validationErrors[field.id]) {
                            setValidationErrors({ ...validationErrors, [field.id]: "" });
                          }
                        }}
                        onFocus={() => setActiveFieldStep5(fieldId)}
                        className={cn(
                          "auth-register-input w-full rounded-lg border px-3 py-2.5 text-sm text-dark outline-none transition dark:text-white",
                          validationErrors[field.id]
                            ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                            : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                        )}
                        placeholder={field.placeholder || ""}
                        rows={3}
                      />
                    ) : field.type === "select" ? (
                      <select
                        value={formData[field.id] || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (validationErrors[field.id]) {
                            setValidationErrors({ ...validationErrors, [field.id]: "" });
                          }
                        }}
                        onFocus={() => setActiveFieldStep5(fieldId)}
                        className={cn(
                          "w-full rounded-lg border px-3 py-2.5 text-sm text-dark outline-none transition dark:text-white",
                          validationErrors[field.id]
                            ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                            : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                        )}
                      >
                        <option value="">{field.placeholder || "Selecciona una opción"}</option>
                        {field.options?.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.id] || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (validationErrors[field.id]) {
                            setValidationErrors({ ...validationErrors, [field.id]: "" });
                          }
                        }}
                        onFocus={() => setActiveFieldStep5(fieldId)}
                        className={cn(
                          "auth-register-input w-full rounded-lg border px-3 py-2.5 text-sm text-dark outline-none transition dark:text-white",
                          validationErrors[field.id]
                            ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                            : "border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2"
                        )}
                        placeholder={field.placeholder || ""}
                      />
                    ),
                    validationErrors[field.id]
                  );
                })}
              </div>
              <button
                onClick={handleStep5CreateAccount}
                className="group relative w-full overflow-hidden rounded-xl border px-4 py-2.5 text-xs font-semibold text-white transition-all active:scale-[0.98]"
                style={{
                  background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                  borderColor: themeColor,
                  boxShadow: `0 4px 14px 0 ${themeColor}40`,
                  animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                }}
              >
                <span className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10" style={{ background: themeColor, animation: 'cta-pulse-ring 2s ease-in-out infinite' }}></span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10" style={{ animation: 'cta-shine-sweep 2.5s linear infinite' }}></span>
                <span className="absolute inset-0 rounded-xl -z-10" style={{ background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`, animation: 'cta-glow-pulse 2s ease-in-out infinite' }}></span>
                <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  {translations.preview.createAccountButton}
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
              </button>
              <p className="text-center text-[10px] leading-relaxed text-dark-6 dark:text-dark-6">
                {translations.preview.termsAndPrivacy}
              </p>
            </div>
          );

        default:
          return null;
      }
    };

    // SVG geométrico completo (mismo que login pero con IDs únicos)
    const GeometricSVG = () => {
      const lightenColor = (color: string, amount: number = 0.2): string => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
        const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
        const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
      };
      const lightThemeColor = lightenColor(themeColor, 0.3);
      const baseId = `reg-${registerStep}`;

      return (
        <div className="relative -mb-16 flex-shrink-0 z-0 flex justify-center">
          <img
            src="/gift/ANIMACION%201.gif"
            alt="Connecting Animation"
            className="h-48 w-48 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
          />
        </div>
      );
    };

    const content = (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header con back y logo */}
        <div className="relative mb-3 flex flex-shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            &lt; {translations.preview.backButton}
          </button>
          {currentBranding.logo && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src={currentBranding.logo} alt="Logo" className="h-8 max-w-full object-contain" />
            </div>
          )}
          <div className="w-12"></div> {/* Spacer para centrar el logo */}
        </div>

        {/* SVG Geométrico - Reemplazado por GIF Animado */}
        <div className="relative -mb-16 flex-shrink-0 z-0 flex justify-center">
          <img
            src="/gift/ANIMACION%201.gif"
            alt="Connecting Animation"
            className="h-48 w-48 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
          />
        </div>



        {/* Tarjeta con fondo blanco translúcido (no afectada por custom color theme) */}
        <div
          className="relative z-10 flex-1 overflow-hidden rounded-2xl p-5 backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.35)', // AJUSTA ESTE VALOR (0.0 a 1.0) para cambiar transparencia
          }}
        >
          <div className="flex h-full min-h-0 flex-col">
          {/* Indicador de progreso */}
          <div className="mb-4 flex-shrink-0">
            <ProgressIndicator
              current={registerStep}
              total={totalSteps}
              className="mb-1.5"
              onStepClick={(step) => setRegisterStep(step)}
              themeColor={themeColor}
            />
            <p className="text-center text-[10px] text-gray-600 dark:text-gray-400">{progressText}</p>
          </div>

          {/* Contenido del paso */}
          <div className="flex flex-1 min-h-0 flex-col gap-3">
            {renderStepContent()}
          </div>
          </div>
        </div>
      </div>
    );

    return content;
  };

  const previewContent = serviceType === "login" ? renderLoginPreview() : renderRegisterPreview(viewMode === "mobile");
  const isWebMode = viewMode === "web";
  const switchViewLabel = isWebMode ? translations.preview.switchToMobileView : translations.preview.switchToWebView;
  const prevServiceTypeRef = useRef<typeof serviceType>(serviceType);

  // Resetear el campo activo del paso 5 cuando cambia el paso
  // Por defecto, todos los campos están cerrados (null) excepto "Full Name" que siempre está visible
  useEffect(() => {
    // Siempre resetear a null cuando cambia el paso
    // Esto asegura que cuando se entra al paso 5, todos los campos estén cerrados
    setActiveFieldStep5(null);
    // Resetear también el estado del OTP
    setOtpStatus('idle');
  }, [registerStep]);

  // Resetear también cuando se cambia el serviceType a register
  useEffect(() => {
    if (serviceType === "register") {
      setActiveFieldStep5(null);
    }
  }, [serviceType]);

  // Inicializar / sincronizar campos personalizados sin reiniciar el preview
  useEffect(() => {
    if (serviceType !== "register") {
      prevServiceTypeRef.current = serviceType;
      return;
    }

    const isEnteringRegister = prevServiceTypeRef.current !== "register";
    prevServiceTypeRef.current = serviceType;

    if (isEnteringRegister) {
      // Solo resetear el flujo al entrar al modo register (no en cada cambio de campos)
      setRegisterStep(1);
      setActiveFieldStep5(null);
      const initialData: typeof formData = {
        fullName: "",
        email: "",
        emailOTP: "",
        phoneCountry: "US",
        phoneNumber: "",
        phoneOTP: "",
        username: "",
        password: "",
        showPassword: false,
        idNumber: "",
        birthDate: "",
        address: "",
      };
      customRegistrationFields.forEach((field) => {
        initialData[field.id] = "";
      });
      setFormData(initialData);
      setValidationErrors({});
      return;
    }

    // Ya estamos en register: mantener el paso actual y solo agregar/quitar keys de campos custom
    const allowedCustomIds = new Set(customRegistrationFields.map((f) => f.id));
    const baseKeys = new Set([
      "fullName",
      "email",
      "emailOTP",
      "phoneCountry",
      "phoneNumber",
      "phoneOTP",
      "username",
      "password",
      "showPassword",
      "idNumber",
      "birthDate",
      "address",
    ]);

    setFormData((prev) => {
      const next: typeof prev = { ...prev };
      customRegistrationFields.forEach((field) => {
        if (!(field.id in next)) {
          (next as any)[field.id] = "";
        }
      });
      Object.keys(next).forEach((key) => {
        if (baseKeys.has(key)) return;
        if (!allowedCustomIds.has(key)) {
          delete (next as any)[key];
        }
      });
      return next;
    });

    setValidationErrors((prev) => {
      const next: typeof prev = { ...prev };
      Object.keys(next).forEach((key) => {
        if (baseKeys.has(key)) return;
        if (!allowedCustomIds.has(key)) {
          delete next[key];
        }
      });
      return next;
    });
  }, [serviceType, customRegistrationFields]);

  // Cambiar automáticamente el modo de registro cuando el tour está en ese paso
  useEffect(() => {
    if (isTourActive && steps.length > 0) {
      const currentStepData = steps[currentStep];
      if (currentStepData && currentStepData.id === "auth-preview-register") {
        if (serviceType !== "register") {
          updateConfig({ serviceType: "register" });
        }
      }
      if (currentStepData && currentStepData.id === "auth-preview-otp") {
        if (serviceType !== "register") {
          updateConfig({ serviceType: "register" });
        }
        if (registerStep !== 2) {
          setRegisterStep(2);
          setFormData((prev) => ({
            ...prev,
            email: "alejandrollanganate@gmail.com",
            emailOTP: "123456",
          }));
        }
      }
    }
  }, [isTourActive, currentStep, steps, serviceType, registerStep, updateConfig]);

  if (viewMode === "mobile") {
    return (
      <div className="relative rounded-lg bg-transparent p-6 shadow-sm dark:bg-transparent scroll-mt-48" data-tour-id="tour-auth-preview">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark dark:text-white">
            {translations.preview.mobilePreviewTitle}
          </h2>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <button
              onClick={toggleViewMode}
              className="group rounded-full bg-gray-2 p-[5px] text-[#111928] outline-1 outline-primary focus-visible:outline dark:bg-dark-3 dark:text-current"
            >
              <span className="sr-only">
                {switchViewLabel}
              </span>

              <span aria-hidden className="relative flex gap-2.5">
                {/* Indicator */}
                <span className={cn(
                  "absolute h-[38px] w-[90px] rounded-full border border-gray-200 bg-white transition-all dark:border-none dark:bg-dark-2 dark:group-hover:bg-dark-3",
                  isWebMode && "translate-x-[100px]"
                )} />

                <span className="relative flex h-[38px] w-[90px] items-center justify-center gap-1.5 rounded-full">
                  <MobileIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{translations.preview.mobileLabel}</span>
                </span>
                <span className="relative flex h-[38px] w-[90px] items-center justify-center gap-1.5 rounded-full">
                  <WebIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{translations.preview.webLabel}</span>
                </span>
              </span>
            </button>
          </div>
        </div>
        <div className="relative -mx-6 w-[calc(100%+3rem)] py-20">
          <div className="absolute inset-0 overflow-hidden rounded-3xl" style={{ minHeight: "780px" }}>
            {/* Base gradient background */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 1) 50%, rgba(15, 23, 42, 0.95) 100%)"
                  : "linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 1) 50%, rgba(241, 245, 249, 0.95) 100%)",
              }}
            ></div>

            <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />
            <EdgeFadeOverlay isDarkMode={isDarkMode} />

            {/* Additional halftone layer */}
            <div
              className="absolute inset-0 rounded-3xl mix-blend-overlay"
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

          <div className="relative mx-auto max-w-[340px] z-10">
            {/* iPhone Frame */}
            <div className="relative mx-auto">
              {/* Outer frame with iPhone-like design */}
              <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
                {/* Screen - Fixed height container */}
                <div className="relative h-[680px] overflow-hidden rounded-[2.5rem] bg-white dark:bg-black m-0.5 flex flex-col">
                  {/* Success Animation - dentro del dispositivo */}
                  {/* Success Animation removed */}
                  {/* Status bar with Dynamic Island and icons aligned */}
                  <div className="relative flex items-center justify-between bg-white dark:bg-black px-6 pt-10 pb-2 flex-shrink-0">
                    {/* Left side - Time aligned with Dynamic Island */}
                    <div className="absolute left-6 top-4 flex items-center">
                      <span className="text-xs font-semibold text-black dark:text-white">9:41</span>
                    </div>

                    {/* Center - Dynamic Island */}
                    <div className="absolute left-1/2 top-3 -translate-x-1/2">
                      <div className="h-5 w-24 rounded-full bg-black dark:bg-white/20"></div>
                      {/* Speaker */}
                      <div className="absolute left-1/2 top-1/2 h-0.5 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800 dark:bg-white/30"></div>
                    </div>

                    {/* Right side - Signal and Battery aligned with Dynamic Island */}
                    <div className="absolute right-6 top-4 flex items-center gap-1.5">
                      <svg className="h-3 w-5" fill="none" viewBox="0 0 20 12">
                        <path
                          d="M1 8h2v2H1V8zm3-2h2v4H4V6zm3-2h2v6H7V4zm3-1h2v7h-2V3z"
                          fill="currentColor"
                          className="text-black dark:text-white"
                        />
                      </svg>
                      <div className="h-2.5 w-6 rounded-sm border border-black dark:border-white">
                        <div className="h-full w-4/5 rounded-sm bg-black dark:bg-white"></div>
                      </div>
                    </div>
                  </div>

                  {/* Content area - No scroll, fixed height */}
                  <div className={`flex-1 min-h-0 bg-white dark:bg-black px-5 ${serviceType === "register" ? "py-4" : "py-4 overflow-hidden"}`}>
                    <div className="h-full overflow-hidden">
                      {previewContent}
                    </div>
                  </div>

                  {/* Home indicator - Fixed at bottom */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-shrink-0">
                    <div className="h-1 w-32 rounded-full bg-black/30 dark:bg-white/30"></div>
                  </div>
                </div>

                {/* Side buttons */}
                <div className="absolute -left-1 top-24 h-12 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
                <div className="absolute -left-1 top-40 h-8 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
                <div className="absolute -right-1 top-32 h-10 w-1 rounded-r bg-gray-800 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          {translations.preview.webPreviewTitle}
        </h2>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <button
            onClick={toggleViewMode}
            className="group rounded-full bg-gray-2 p-[5px] text-[#111928] outline-1 outline-primary focus-visible:outline dark:bg-dark-3 dark:text-current"
          >
            <span className="sr-only">
              {switchViewLabel}
            </span>

            <span aria-hidden className="relative flex gap-2.5">
              {/* Indicator */}
              <span className={cn(
                "absolute h-[38px] w-[90px] rounded-full border border-gray-200 bg-white transition-all dark:border-none dark:bg-dark-2 dark:group-hover:bg-dark-3",
                isWebMode && "translate-x-[100px]"
              )} />

              <span className="relative flex h-[38px] w-[90px] items-center justify-center gap-1.5 rounded-full">
                <MobileIcon className="h-4 w-4" />
                <span className="text-xs font-medium">{translations.preview.mobileLabel}</span>
              </span>
              <span className="relative flex h-[38px] w-[90px] items-center justify-center gap-1.5 rounded-full">
                <WebIcon className="h-4 w-4" />
                <span className="text-xs font-medium">{translations.preview.webLabel}</span>
              </span>
            </span>
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-stroke bg-gray-50 p-8 dark:border-dark-3 dark:bg-dark-3">
        <div className="mx-auto max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-dark-2">
            {previewContent}
          </div>
        </div>
      </div>
    </div>
  );
}
