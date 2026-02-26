"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { BankAccountCountry } from "./bank-account-config";
import { useLanguage } from "@/contexts/language-context";
import { connectTranslations } from "./connect-translations";
import { useTour } from "@/contexts/tour-context";
import { useCTAButtonAnimations } from "@/hooks/use-cta-button-animations";

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
      const [r, g, b] = isDarkMode ? [255, 255, 255] : [70, 85, 110];
      const minAlpha = isDarkMode ? 0.06 : 0.1;
      const maxAlpha = isDarkMode ? 0.45 : 0.5;

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
          const alpha = (minAlpha + pulse * maxAlpha) * edgeFade;
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

interface Bank {
  id: string;
  name: string;
  logo?: string; // URL or path to logo
}

interface BankAccount {
  id: string;
  type: string;
  accountNumber: string;
  balance?: string;
  currency: string;
}

interface BankAccountPreviewPanelProps {
  country: BankAccountCountry;
  viewMode?: "mobile" | "web";
  onViewModeChange?: (mode: "mobile" | "web") => void;
  onBankSelected?: (selected: boolean) => void;
  branding?: {
    logo?: string;
    customColorTheme?: string;
    depositButtonType?: "slider" | "button";
  };
}

// Helper function to get bank logo URL - usa múltiples fuentes
const getBankLogoUrl = (
  bankName: string,
  country: BankAccountCountry,
): string => {
  // Mapa de URLs directas de logos (prioridad alta)
  const directLogos: Record<string, string> = {
    // México
    "BBVA México": "https://cdn.worldvectorlogo.com/logos/bbva-2.svg",
    "Banco Santander":
      "https://cdn.worldvectorlogo.com/logos/banco-santander-logo.svg",
    Banamex: "https://cdn.worldvectorlogo.com/logos/banamex-1.svg",
    "HSBC México": "https://cdn.worldvectorlogo.com/logos/hsbc-logo-2018-.svg",
    "Banco Azteca":
      "https://i.pinimg.com/1200x/31/7e/06/317e06872fa113652429b22ee1702a24.jpg",
    "Scotiabank México":
      "https://cdn.worldvectorlogo.com/logos/scotiabank-4.svg",

    // Brasil
    "Banco do Brasil":
      "https://cdn.worldvectorlogo.com/logos/banco-do-brasil-3.svg",
    "Itaú Unibanco": "https://cdn.worldvectorlogo.com/logos/itau-unibanco.svg",
    Bradesco: "https://cdn.worldvectorlogo.com/logos/bradesco.svg",
    "Santander Brasil":
      "https://cdn.worldvectorlogo.com/logos/banco-santander-logo.svg",
    "Banco Inter":
      "https://images.seeklogo.com/logo-png/47/1/banco-inter-logo-png_seeklogo-473118.png",
    Nubank: "https://cdn.worldvectorlogo.com/logos/nubank-logo.svg",

    // Colombia
    Bancolombia: "https://cdn.worldvectorlogo.com/logos/bancolombia.svg",
    "Banco de Bogotá":
      "https://cdn.worldvectorlogo.com/logos/logo-banco-de-bogota.svg",
    Davivienda: "https://cdn.worldvectorlogo.com/logos/logo-davivienda.svg",
    "Banco Popular":
      "https://images.seeklogo.com/logo-png/50/1/banco-popular-colombia-logo-png_seeklogo-508856.png",
    "BBVA Colombia": "https://cdn.worldvectorlogo.com/logos/bbva-2.svg",
    "Banco de Occidente":
      "https://cdn.worldvectorlogo.com/logos/logo-banco-de-occidente.svg",

    // Estados Unidos
    "Chase Bank": "https://cdn.worldvectorlogo.com/logos/chase.svg",
    "Bank of America":
      "https://cdn.worldvectorlogo.com/logos/bank-of-america.svg",
    "Wells Fargo": "https://cdn.worldvectorlogo.com/logos/wells-fargo.svg",
    Citibank: "https://cdn.worldvectorlogo.com/logos/citibank-4.svg",
    "US Bank": "https://cdn.worldvectorlogo.com/logos/us-bank-4.svg",
    "PNC Bank": "https://cdn.worldvectorlogo.com/logos/pnc.svg",
  };

  // Si tenemos un logo directo, usarlo
  if (directLogos[bankName]) {
    return directLogos[bankName];
  }

  // Mapa de dominios por banco para usar con Clearbit
  const bankDomains: Record<string, string> = {
    // México
    "Banco Santander": "santander.com.mx",
    Banamex: "banamex.com",
    "HSBC México": "hsbc.com.mx",
    "Banco Azteca": "bancoazteca.com.mx",
    "Scotiabank México": "scotiabank.com.mx",

    // Brasil
    "Banco do Brasil": "bb.com.br",
    "Itaú Unibanco": "itau.com.br",
    Bradesco: "bradesco.com.br",
    "Santander Brasil": "santander.com.br",
    "Banco Inter": "bancointer.com.br",
    Nubank: "nubank.com.br",

    // Colombia
    Bancolombia: "bancolombia.com",
    "Banco de Bogotá": "bancodebogota.com",
    Davivienda: "davivienda.com",
    "Banco Popular": "bancopopular.com.co",
    "Banco de Occidente": "bancodeoccidente.com.co",

    // Estados Unidos
    "Chase Bank": "chase.com",
    "Bank of America": "bankofamerica.com",
    "Wells Fargo": "wellsfargo.com",
    Citibank: "citi.com",
    "US Bank": "usbank.com",
    "PNC Bank": "pnc.com",
  };

  const domain = bankDomains[bankName];

  // Si tenemos el dominio, usar Clearbit (más confiable)
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }

  // Fallback: intentar construir URL desde el nombre del banco
  // Convertir nombre a formato de dominio básico
  const domainFromName = bankName
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

  // Intentar con Clearbit usando el dominio construido
  return `https://logo.clearbit.com/${domainFromName}.com`;
};

// Bank accounts examples by country
const bankAccountsByCountry: Record<BankAccountCountry, BankAccount[]> = {
  ecuador: [
    {
      id: "1",
      type: "Cuenta CLABE",
      accountNumber: "012345678901234567",
      balance: "$1,234.56",
      currency: "USD",
    },
    {
      id: "2",
      type: "Chequera",
      accountNumber: "****1234",
      balance: "$5,678.90",
      currency: "USD",
    },
  ],
  mexico: [
    {
      id: "1",
      type: "Cuenta CLABE",
      accountNumber: "012345678901234567",
      balance: "$12,345.67",
      currency: "MXN",
    },
    {
      id: "2",
      type: "Chequera",
      accountNumber: "****4567",
      balance: "$8,901.23",
      currency: "MXN",
    },
  ],
  brasil: [
    {
      id: "1",
      type: "Cuenta CLABE",
      accountNumber: "012345678901234567",
      balance: "R$ 3,456.78",
      currency: "BRL",
    },
    {
      id: "2",
      type: "Chequera",
      accountNumber: "****1234-5",
      balance: "R$ 9,012.34",
      currency: "BRL",
    },
  ],
  colombia: [
    {
      id: "1",
      type: "Cuenta CLABE",
      accountNumber: "012345678901234567",
      balance: "$4,567.89",
      currency: "COP",
    },
    {
      id: "2",
      type: "Chequera",
      accountNumber: "****12345678",
      balance: "$11,234.56",
      currency: "COP",
    },
  ],
  estados_unidos: [
    {
      id: "1",
      type: "Cuenta CLABE",
      accountNumber: "012345678901234567",
      balance: "$2,345.67",
      currency: "USD",
    },
    {
      id: "2",
      type: "Chequera",
      accountNumber: "****1234",
      balance: "$18,901.23",
      currency: "USD",
    },
  ],
};

// Banks / providers data by country
const banksByCountry: Record<BankAccountCountry, Bank[] | "coming_soon"> = {
  // For Ecuador we now show cooperatives instead of traditional banks.
  // Names are placeholders and should be verified against authoritative sources before production.
  ecuador: [
    {
      id: "ec-coop-jep",
      name: "Juventud Ecuatoriana Progresista",
      logo: "https://www.jep.coop/documents/20182/41979/JEP-Social.png",
    },
    {
      id: "ec-coop-jardin",
      name: "Jardín Azuayo",
      logo: "https://www.asociacioncge.com/wp-content/uploads/2023/05/LOGO-COOP-JARDIN-AZUAYO-1024x818.png",
    },
    {
      id: "ec-coop-alianza",
      name: "Alianza del Valle",
      logo: "https://play-lh.googleusercontent.com/oRckG6u4J-3iS_kn_Bh4nJzamqrBNqiJInNmAHFcnc3kjbgJoSstxMZs9Jp5jX_FdA",
    },
    {
      id: "ec-coop-cpn",
      name: "Policía Nacional",
      logo: "https://www.cpn.fin.ec/frontend/web/images/logo_cpn.jpg",
    },
    {
      id: "ec-coop-cacpeco",
      name: "CACPECO",
      logo: "https://www.cacpeco.com/wp-content/uploads/2025/06/cacpecologo.png",
    },
  ],
  mexico: [
    {
      id: "1",
      name: "BBVA México",
      logo: getBankLogoUrl("BBVA México", "mexico"),
    },
    {
      id: "2",
      name: "Banco Santander",
      logo: getBankLogoUrl("Banco Santander", "mexico"),
    },
    { id: "3", name: "Banamex", logo: getBankLogoUrl("Banamex", "mexico") },
    {
      id: "4",
      name: "HSBC México",
      logo: getBankLogoUrl("HSBC México", "mexico"),
    },
    {
      id: "5",
      name: "Banco Azteca",
      logo: getBankLogoUrl("Banco Azteca", "mexico"),
    },
    {
      id: "6",
      name: "Scotiabank México",
      logo: getBankLogoUrl("Scotiabank México", "mexico"),
    },
  ],
  brasil: [
    {
      id: "1",
      name: "Banco do Brasil",
      logo: getBankLogoUrl("Banco do Brasil", "brasil"),
    },
    {
      id: "2",
      name: "Itaú Unibanco",
      logo: getBankLogoUrl("Itaú Unibanco", "brasil"),
    },
    { id: "3", name: "Bradesco", logo: getBankLogoUrl("Bradesco", "brasil") },
    {
      id: "4",
      name: "Santander Brasil",
      logo: getBankLogoUrl("Santander Brasil", "brasil"),
    },
    {
      id: "5",
      name: "Banco Inter",
      logo: getBankLogoUrl("Banco Inter", "brasil"),
    },
    { id: "6", name: "Nubank", logo: getBankLogoUrl("Nubank", "brasil") },
  ],
  colombia: [
    {
      id: "1",
      name: "Bancolombia",
      logo: getBankLogoUrl("Bancolombia", "colombia"),
    },
    {
      id: "2",
      name: "Banco de Bogotá",
      logo: getBankLogoUrl("Banco de Bogotá", "colombia"),
    },
    {
      id: "3",
      name: "Davivienda",
      logo: getBankLogoUrl("Davivienda", "colombia"),
    },
    {
      id: "4",
      name: "Banco Popular",
      logo: getBankLogoUrl("Banco Popular", "colombia"),
    },
    {
      id: "5",
      name: "BBVA Colombia",
      logo: getBankLogoUrl("BBVA Colombia", "colombia"),
    },
    {
      id: "6",
      name: "Banco de Occidente",
      logo: getBankLogoUrl("Banco de Occidente", "colombia"),
    },
  ],
  estados_unidos: [
    {
      id: "1",
      name: "Chase Bank",
      logo: getBankLogoUrl("Chase Bank", "estados_unidos"),
    },
    {
      id: "2",
      name: "Bank of America",
      logo: getBankLogoUrl("Bank of America", "estados_unidos"),
    },
    {
      id: "3",
      name: "Wells Fargo",
      logo: getBankLogoUrl("Wells Fargo", "estados_unidos"),
    },
    {
      id: "4",
      name: "Citibank",
      logo: getBankLogoUrl("Citibank", "estados_unidos"),
    },
    {
      id: "5",
      name: "US Bank",
      logo: getBankLogoUrl("US Bank", "estados_unidos"),
    },
    {
      id: "6",
      name: "PNC Bank",
      logo: getBankLogoUrl("PNC Bank", "estados_unidos"),
    },
  ],
};

// Bank Logo Component with fallback
function BankLogo({ bank, className }: { bank: Bank; className?: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const defaultSize = "h-12 w-12";
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset states when logo changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [bank.logo]);

  // Check if image is already loaded after mount
  useEffect(() => {
    if (bank.logo && imgRef.current) {
      const img = imgRef.current;
      // Check if image is already loaded (cached)
      if (img.complete && img.naturalHeight !== 0 && !imageError) {
        setImageLoaded(true);
      }
    }
  }, [bank.logo, imageError]);

  if (!bank.logo || imageError) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-gray-2 dark:bg-dark-3",
          className || defaultSize,
        )}
      >
        <span className="text-lg font-bold text-primary">
          {bank.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-lg bg-white dark:bg-dark-3 overflow-hidden p-2",
        className || defaultSize,
      )}
    >
      <img
        ref={imgRef}
        src={bank.logo}
        alt={bank.name}
        className="h-full w-full object-contain"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(false);
        }}
      />
    </div>
  );
}

// Bank Logo Component con fallback para el stack de tarjetas
function BankLogoWithFallback({
  bank,
  themeColor,
  size,
}: {
  bank: Bank;
  themeColor: string;
  size: string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="flex items-center justify-center bg-white rounded-xl flex-shrink-0"
      style={{
        width: size,
        height: size,
        animation:
          "popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      }}
    >
      {bank.logo && !imageError ? (
        <img
          src={bank.logo}
          alt={bank.name}
          className="h-full w-full object-contain p-1"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-sm font-bold" style={{ color: themeColor }}>
          {bank.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

type Screen =
  | "banks"
  | "credentials"
  | "loading"
  | "success"
  | "wallet"
  | "deposit";

export function BankAccountPreviewPanel({
  country,
  viewMode = "mobile",
  onViewModeChange,
  onBankSelected,
  branding,
}: BankAccountPreviewPanelProps) {
  const { language } = useLanguage();
  const t = connectTranslations[language];
  const { isTourActive, currentStep, steps } = useTour();

  // Get current branding based on dark mode
  const currentBranding = branding || { customColorTheme: "#004492" };
  const [searchQuery, setSearchQuery] = useState("");
  const [currentScreen, setCurrentScreen] = useState<Screen>("banks");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [activeBankCard, setActiveBankCard] = useState<number>(0); // Estado para la tarjeta activa de bancos
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedAccountForDeposit, setSelectedAccountForDeposit] =
    useState<BankAccount | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeDepositAccountCard, setActiveDepositAccountCard] =
    useState<number>(0); // Estado para la tarjeta activa de cuentas en depósito
  const [slideProgress, setSlideProgress] = useState(0); // Progreso del slider (0-100)
  const [isSliding, setIsSliding] = useState(false); // Si el usuario está deslizando
  const [isTransferring, setIsTransferring] = useState(false); // Si está transfiriendo fondos
  const slideContainerRef = useRef<HTMLDivElement | null>(null); // Ref para el contenedor del slider
  const onViewModeChangeRef = useRef(onViewModeChange); // Ref para mantener referencia estable
  const viewModeRef = useRef(viewMode); // Ref para mantener referencia estable
  const onBankSelectedRef = useRef(onBankSelected); // Ref para mantener referencia estable

  // Actualizar refs cuando cambian
  useEffect(() => {
    onViewModeChangeRef.current = onViewModeChange;
    viewModeRef.current = viewMode;
    onBankSelectedRef.current = onBankSelected;
  }, [onViewModeChange, viewMode, onBankSelected]);

  // Helper functions for theme colors (similar to identity)
  const themeColor = currentBranding.customColorTheme || "#004492";
  
  // Inicializar animaciones CTA
  useCTAButtonAnimations(themeColor);

  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : "60, 80, 224";
  };

  const darkenColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };

  const lightenColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };

  const darkThemeColor = darkenColor(themeColor, 30);
  const almostBlackColor = darkenColor(themeColor, 80);
  const blackColor = darkenColor(themeColor, 100);

  // Add CSS animations
  useEffect(() => {
    const styleId = "bank-account-animations";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes loadingPulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes successScale {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes popIn {
          from { 
            opacity: 0; 
            transform: scale(0.5); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        @keyframes halftonePulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes balanceUpdate {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }

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

  const banksData = banksByCountry[country];
  const isComingSoon = banksData === "coming_soon" || country === "ecuador";
  const banks =
    isComingSoon && country !== "ecuador"
      ? []
      : banksData === "coming_soon"
        ? []
        : banksData;

  const filteredBanks = useMemo(() => {
    if (isComingSoon && country !== "ecuador") return [];
    if (!searchQuery.trim()) {
      return banks;
    }
    const query = searchQuery.toLowerCase();
    return banks.filter((bank) => bank.name.toLowerCase().includes(query));
  }, [banks, searchQuery, isComingSoon, country]);

  // Normalizar steps y banks para evitar cambios en el tamaño del array de dependencias
  const normalizedSteps = useMemo(
    () => (Array.isArray(steps) ? steps : []),
    [steps],
  );
  const normalizedBanks = useMemo(
    () => (Array.isArray(banks) ? banks : []),
    [banks],
  );

  // Reset screen when country changes
  useEffect(() => {
    setCurrentScreen("banks");
    setSelectedBank(null);
    setActiveBankCard(0);
    setUsername("");
    setPassword("");
    setSearchQuery("");
    setWalletBalance(0);
    setSelectedAccountForDeposit(null);
    setDepositAmount("");
    onBankSelected?.(false);
  }, [country, onBankSelected]);

  // Reset activeBankCard when filtered banks change
  useEffect(() => {
    if (filteredBanks.length > 0 && activeBankCard >= filteredBanks.length) {
      setActiveBankCard(0);
      setSelectedBank(null);
    }
  }, [filteredBanks.length, activeBankCard]);

  // Manejar el tour para mostrar la pantalla de credenciales y wallet
  useEffect(() => {
    if (
      isTourActive &&
      normalizedSteps.length > 0 &&
      currentStep < normalizedSteps.length
    ) {
      const currentStepData = normalizedSteps[currentStep];
      if (currentStepData?.target === "tour-connect-credentials") {
        // Asegurar que el viewMode esté en "mobile"
        if (viewModeRef.current !== "mobile" && onViewModeChangeRef.current) {
          onViewModeChangeRef.current("mobile");
        }
        // Seleccionar Banamex si está disponible
        const banamexBank = normalizedBanks.find(
          (bank) => bank.name === "Banamex",
        );
          if (banamexBank && currentScreen !== "credentials") {
            setSelectedBank(banamexBank);
            setCurrentScreen("credentials");
            setUsername(t.credentials.tourAutofillValue);
            setPassword(t.credentials.tourAutofillValue);
            onBankSelectedRef.current?.(true);
          } else if (currentScreen === "credentials") {
            // Asegurar que los inputs tengan valor de tour traducido
            if (username !== t.credentials.tourAutofillValue) {
              setUsername(t.credentials.tourAutofillValue);
            }
            if (password !== t.credentials.tourAutofillValue) {
              setPassword(t.credentials.tourAutofillValue);
            }
          }
      } else if (currentStepData?.target === "tour-connect-wallet") {
        // Asegurar que el viewMode esté en "mobile"
        if (viewModeRef.current !== "mobile" && onViewModeChangeRef.current) {
          onViewModeChangeRef.current("mobile");
        }
        // Seleccionar Banamex si está disponible y mostrar la vista de wallet
        const banamexBank = normalizedBanks.find(
          (bank) => bank.name === "Banamex",
        );
        if (banamexBank && currentScreen !== "wallet") {
          setSelectedBank(banamexBank);
          setCurrentScreen("wallet");
          onBankSelectedRef.current?.(true);
        }
      }
    }
  }, [
    isTourActive,
    currentStep,
    normalizedSteps,
    normalizedBanks,
    currentScreen,
    username,
    password,
    t.credentials.tourAutofillValue,
  ]);

  const handleBankSelect = (bank: Bank) => {
    // Don't allow selection if coming soon
    if (country === "ecuador") {
      return;
    }
    setSelectedBank(bank);
    setCurrentScreen("credentials");
    onBankSelected?.(true);
  };

  const handleLogin = () => {
    setLoadingProgress(0);
    setCurrentScreen("loading");
    // Simulate loading animation
    setTimeout(() => {
      setCurrentScreen("success");
      setTimeout(() => {
        setCurrentScreen("wallet");
      }, 2000);
    }, 3000);
  };

  // Efecto para la barra de progreso cuando estamos en loading
  useEffect(() => {
    if (currentScreen === "loading") {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // Si es transferencia, actualizar balance y volver directo a wallet
            if (isTransferring) {
              setTimeout(() => {
                const amount = parseFloat(depositAmount) || 0;
                setWalletBalance((prev) => prev + amount);
                setDepositAmount("");
                setSlideProgress(0);
                setIsTransferring(false);
                setCurrentScreen("wallet");
              }, 500);
            }
            return 100;
          }
          return prev + 2;
        });
      }, 60); // Actualizar cada 60ms para completar en ~3 segundos

      return () => clearInterval(interval);
    }
  }, [currentScreen, isTransferring, depositAmount]);

  const handleDeposit = () => {
    if (!selectedAccountForDeposit || !depositAmount) return;
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      setWalletBalance((prev) => prev + amount);
      setDepositAmount("");
      setSelectedAccountForDeposit(null);
      setCurrentScreen("wallet");
    }
  };

  // Render credentials screen
  const renderCredentialsScreen = () => {
    // SVG geométrico (forma organica2.svg) adaptado al customColorTheme
    const GeometricSVG = () => {
      const lightThemeColor = lightenColor(themeColor, 0.3);
      const baseId = "connect-credentials";

      return (
        <div className="flex justify-center py-1">
          <svg
            id={`Capa_2_${baseId}`}
            data-name="Capa 2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 215.02 215.02"
            className="h-32 w-32 opacity-80"
          >
            <defs>
              <linearGradient
                id={`connect-gradient-${baseId}`}
                x1="4.35"
                y1="612.77"
                x2="210.66"
                y2="612.77"
                gradientTransform="translate(0 720.29) scale(1 -1)"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor={lightThemeColor} />
                <stop offset="1" stopColor={darkThemeColor} />
              </linearGradient>
              <linearGradient
                id={`connect-gradient-2-${baseId}`}
                x1="5.57"
                y1="612.78"
                x2="209.46"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-3-${baseId}`}
                x1="20.99"
                y1="612.78"
                x2="194.05"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-4-${baseId}`}
                x1="0"
                y1="612.78"
                x2="215.02"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-5-${baseId}`}
                x1="17.91"
                y1="612.78"
                x2="197.11"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-6-${baseId}`}
                x1="7.41"
                y1="612.77"
                x2="207.62"
                y2="612.77"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-7-${baseId}`}
                x1="2.97"
                y1="612.78"
                x2="212.04"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-8-${baseId}`}
                x1="26.88"
                y1="612.78"
                x2="188.15"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-9-${baseId}`}
                x1=".65"
                y1="612.78"
                x2="214.38"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-10-${baseId}`}
                x1="13.07"
                y1="612.77"
                x2="201.95"
                y2="612.77"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-11-${baseId}`}
                x1="11.2"
                y1="612.78"
                x2="203.81"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-12-${baseId}`}
                x1="1.17"
                y1="612.78"
                x2="213.84"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-13-${baseId}`}
                x1="29.6"
                y1="612.77"
                x2="185.42"
                y2="612.77"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-14-${baseId}`}
                x1="2.1"
                y1="612.77"
                x2="212.92"
                y2="612.77"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-15-${baseId}`}
                x1="8.95"
                y1="612.78"
                x2="206.07"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-16-${baseId}`}
                x1="15.74"
                y1="612.78"
                x2="199.28"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-17-${baseId}`}
                x1=".19"
                y1="612.77"
                x2="214.85"
                y2="612.77"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-18-${baseId}`}
                x1="23.44"
                y1="612.78"
                x2="191.59"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-19-${baseId}`}
                x1="5.57"
                y1="612.78"
                x2="209.46"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
              <linearGradient
                id={`connect-gradient-20-${baseId}`}
                x1="20.99"
                y1="612.78"
                x2="194.05"
                y2="612.78"
                href={`#connect-gradient-${baseId}`}
              />
            </defs>
            <g id="object">
              <g>
                <path
                  fill={`url(#connect-gradient-9-${baseId})`}
                  d="M77.1,210.67l-.14-.25L4.35,77.11,137.91,4.37l.14.25,72.61,133.31-133.56,72.74h0ZM5.13,77.33l72.2,132.57,132.57-72.2L137.7,5.13S5.13,77.33,5.13,77.33Z"
                />
                <path
                  fill={`url(#connect-gradient-${baseId})`}
                  d="M141.77,209.45L5.57,141.77l.13-.25L73.26,5.58l136.2,67.68-.13.25-67.56,135.94h0ZM6.33,141.52l135.18,67.18,67.18-135.18L73.51,6.34,6.33,141.52h0Z"
                />
                <path
                  fill={`url(#connect-gradient-2-${baseId})`}
                  d="M43.66,194.05l-.04-.28L20.99,43.66l150.39-22.68.04.28,22.63,150.11-150.39,22.68h0ZM21.62,44.14l22.51,149.26,149.26-22.51-22.51-149.26L21.61,44.14h.01Z"
                />
                <path
                  fill={`url(#connect-gradient-5-${baseId})`}
                  d="M104.84,215.02l-.2-.21L0,104.83,110.18,0l.2.21,104.64,109.98-110.18,104.83h0ZM.8,104.86l104.05,109.36,109.36-104.05L110.16.81.8,104.86Z"
                />
                <path
                  fill={`url(#connect-gradient-6-${baseId})`}
                  d="M166.98,197.11l-149.07-30.13L48.04,17.91l149.07,30.13-30.13,149.07ZM18.58,166.55l147.96,29.9,29.9-147.96L48.48,18.59l-29.9,147.96Z"
                />
                <path
                  fill={`url(#connect-gradient-3-${baseId})`}
                  d="M68.23,207.63l-.11-.26L7.41,68.24,146.8,7.41l.11.26,60.71,139.13-139.39,60.83h0ZM8.15,68.53l60.37,138.35,138.35-60.37L146.5,8.16,8.15,68.53Z"
                />
                <path
                  fill={`url(#connect-gradient-4-${baseId})`}
                  d="M132.75,212.05l-.24-.15L2.97,132.75,82.26,2.97l.24.15,129.54,79.15-79.29,129.78h0ZM3.75,132.57l128.81,78.7,78.7-128.81L82.45,3.76,3.75,132.57Z"
                />
                <path
                  fill={`url(#connect-gradient-7-${baseId})`}
                  d="M36.36,188.15L26.88,36.36l151.79-9.48,9.48,151.79-151.79,9.48ZM27.47,36.89l9.41,150.66,150.66-9.41-9.41-150.66L27.47,36.89Z"
                />
                <path
                  fill={`url(#connect-gradient-8-${baseId})`}
                  d="M95.48,214.38l-.18-.22L.65,95.48l.22-.18L119.55.65l.18.22,94.65,118.68-.22.18-118.68,94.65h0ZM1.44,95.57l94.12,118.01,118.01-94.12L119.45,1.45,1.44,95.57h0Z"
                />
                <path
                  fill={`url(#connect-gradient-11-${baseId})`}
                  d="M158.95,201.96l-.27-.08L13.07,158.96l.08-.27L56.07,13.08l.27.08,145.61,42.92-.08.27-42.92,145.61h0ZM13.77,158.57l144.79,42.68,42.68-144.79L56.45,13.78,13.77,158.57h0Z"
                />
                <path
                  fill={`url(#connect-gradient-12-${baseId})`}
                  d="M59.65,203.82l-.09-.27L11.2,59.66l.27-.09L155.36,11.21l.09.27,48.36,143.89-.27.09-143.89,48.36h0ZM11.92,60.01l48.09,143.09,143.09-48.09L155.01,11.92,11.92,60.01Z"
                />
                <path
                  fill={`url(#connect-gradient-13-${baseId})`}
                  d="M123.54,213.85L1.17,123.55,91.47,1.18l122.37,90.3-90.3,122.37h0ZM1.96,123.43l121.46,89.63,89.63-121.46L91.59,1.97,1.96,123.43Z"
                />
                <path
                  fill={`url(#connect-gradient-14-${baseId})`}
                  d="M181.64,185.43l-152.04-3.78v-.28l3.78-151.76,152.04,3.78v.28l-3.78,151.76h0ZM30.18,181.09l150.91,3.75,3.75-150.91-150.91-3.75-3.75,150.91Z"
                />
                <path
                  fill={`url(#connect-gradient-15-${baseId})`}
                  d="M86.21,212.93L2.1,86.22,128.81,2.11l84.11,126.71-126.71,84.11ZM2.88,86.37l83.48,125.77,125.77-83.48L128.65,2.89,2.88,86.37Z"
                />
                <path
                  fill={`url(#connect-gradient-16-${baseId})`}
                  d="M150.52,206.08l-.26-.1L8.95,150.53,64.5,8.95l.26.1,141.31,55.45-55.55,141.58ZM9.68,150.21l140.52,55.14,55.14-140.52L64.82,9.69,9.68,150.21Z"
                />
                <path
                  fill={`url(#connect-gradient-19-${baseId})`}
                  d="M51.44,199.28l-.07-.28L15.74,51.44,163.58,15.74l.07.28,35.63,147.56-147.84,35.7ZM16.43,51.86l35.43,146.74,146.74-35.43L163.17,16.43S16.43,51.86,16.43,51.86Z"
                />
                <path
                  fill={`url(#connect-gradient-17-${baseId})`}
                  d="M114.22,214.85l-.21-.19L.19,114.22l.19-.21L100.82.19l.21.19,113.82,100.44-.19.21-100.44,113.82h0ZM.98,114.17l113.19,99.88,99.88-113.19L100.86.98.98,114.17h0Z"
                />
                <path
                  fill={`url(#connect-gradient-18-${baseId})`}
                  d="M174.57,191.59l-151.13-17.02.03-.28L40.46,23.44l151.13,17.02-.03.28-16.99,150.85ZM24.06,174.07l150,16.89,16.89-150L40.95,24.07l-16.89,150Z"
                />
                <path
                  fill={`url(#connect-gradient-9-${baseId})`}
                  d="M77.1,210.67l-.14-.25L4.35,77.11,137.91,4.37l.14.25,72.61,133.31-133.56,72.74h0ZM5.13,77.33l72.2,132.57,132.57-72.2L137.7,5.13S5.13,77.33,5.13,77.33Z"
                />
                <path
                  fill={`url(#connect-gradient-${baseId})`}
                  d="M141.77,209.45L5.57,141.77l.13-.25L73.26,5.58l136.2,67.68-.13.25-67.56,135.94h0ZM6.33,141.52l135.18,67.18,67.18-135.18L73.51,6.34,6.33,141.52h0Z"
                />
                <path
                  fill={`url(#connect-gradient-2-${baseId})`}
                  d="M43.66,194.05l-.04-.28L20.99,43.66l150.39-22.68.04.28,22.63,150.11-150.39,22.68h0ZM21.62,44.14l22.51,149.26,149.26-22.51-22.51-149.26L21.61,44.14h.01Z"
                />
              </g>
            </g>
          </svg>
        </div>
      );
    };

    return (
      <div className="flex h-full flex-col overflow-y-auto">
        {/* SVG Geométrico Reemplazado por GIF Animado */}
        <div className="relative flex-shrink-0 z-0 mb-2 flex justify-center">
          <img
            src="/gift/ANIMACION%201.gif"
            alt={t.loading.connectingAnimationAlt}
            className="h-32 w-32 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
          />
        </div>

        {/* Contenido principal */}
        <div className="relative z-10 flex-1 flex flex-col px-6 pb-4 min-h-0">
          {/* Título del banco */}
          <div className="text-center mb-1">
            <h2 className="text-lg font-bold" style={{ color: themeColor }}>
              {selectedBank?.name || t.credentials.bankNameFallback}
            </h2>
          </div>

          {/* Subtítulo */}
          <div className="text-center mb-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t.credentials.prompt}
            </p>
          </div>

          {/* Formulario */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Username */}
            <div>
              <label
                className="mb-1.5 block text-sm font-bold"
                style={{ color: almostBlackColor }}
              >
                {t.credentials.usernameLabel}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.credentials.usernamePlaceholder}
                className="block w-full rounded-lg border-0 py-2.5 px-4 text-sm text-dark placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ backgroundColor: "#D1D5DB" }}
                readOnly={
                  isTourActive &&
                  steps.length > 0 &&
                  currentStep < steps.length &&
                  steps[currentStep]?.target === "tour-connect-credentials"
                }
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="mb-1.5 block text-sm font-bold"
                style={{ color: almostBlackColor }}
              >
                {t.credentials.passwordLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.credentials.passwordPlaceholder}
                className="block w-full rounded-lg border-0 py-2.5 px-4 text-sm text-dark placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ backgroundColor: "#D1D5DB" }}
                readOnly={
                  isTourActive &&
                  steps.length > 0 &&
                  currentStep < steps.length &&
                  steps[currentStep]?.target === "tour-connect-credentials"
                }
              />
            </div>

            {/* Botón Login */}
            <div className="mt-2 pb-2">
              <button
                onClick={handleLogin}
                disabled={!username || !password}
                className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                style={{
                  background: !username || !password
                    ? '#9BA2AF' 
                    : `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                  borderColor: !username || !password ? '#9BA2AF' : themeColor,
                  boxShadow: !username || !password ? 'none' : `0 4px 14px 0 ${themeColor}40`,
                  animation: !username || !password ? 'none' : 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                  opacity: !username || !password ? 0.5 : 1,
                }}
              >
                {(!username || !password) ? null : (
                  <>
                    {/* Resplandor animado alrededor del botón */}
                    <span 
                      className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10"
                      style={{
                        background: themeColor,
                        animation: 'cta-pulse-ring 2s ease-in-out infinite',
                      }}
                    ></span>
                    
                    {/* Brillo que se mueve automáticamente */}
                    <span 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10"
                      style={{
                        animation: 'cta-shine-sweep 2.5s linear infinite',
                      }}
                    ></span>
                    
                    {/* Capa de brillo adicional constante */}
                    <span 
                      className="absolute inset-0 rounded-xl -z-10"
                      style={{
                        background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`,
                        animation: 'cta-glow-pulse 2s ease-in-out infinite',
                      }}
                    ></span>
                  </>
                )}
                
                <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: !username || !password ? 'none' : 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  {t.credentials.loginButton}
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ animation: !username || !password ? 'none' : 'cta-bounce-arrow 1.2s ease-in-out infinite' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
                
                {/* Efecto de brillo al hacer hover */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render loading screen
  const renderLoadingScreen = () => {
    const isComplete = loadingProgress >= 100;
    // Crear efecto de ondas más pronunciado en el borde del relleno
    const waveFrequency = 6; // Número de ondas
    const waveAmplitude = 8; // Amplitud de las ondas en píxeles

    // Calcular si el texto debe ser blanco basado en el progreso
    // El texto está aproximadamente en el 50% del ancho del contenedor
    // Cuando el gradiente llega al 40-50%, el texto debe cambiar a blanco
    const textShouldBeWhite = loadingProgress > 40;

    return (
      <div className="flex h-full flex-col relative overflow-hidden bg-white">
        {/* Card/div con gradiente que se va llenando */}
        <div
          className="relative rounded-3xl flex flex-col items-center justify-center overflow-hidden"
          style={{
            marginTop: "20px",
            marginLeft: "10px",
            marginRight: "10px",
            marginBottom: "80px",
            width: "calc(100% - 20px)",
            height: "calc(100% - 10px)",
            boxSizing: "border-box",
            padding: "40px 20px",
            position: "relative",
            backgroundColor: "#f3f4f6", // Fondo gris mientras se llena
          }}
        >
          {/* Fondo que se va llenando con efecto de onda desde el centro */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
              clipPath: (() => {
                // Avanzamos el clipPath 20% más allá del progreso real para que la máscara (gradiente)
                // sea la que determine el borde visual suave, ocultando el borde duro geométrico.
                const progress = loadingProgress + 20;
                let points = `0% 0%, `;

                // Crear efecto de onda desde el centro: los extremos (arriba/abajo) se llenan después
                for (let i = 0; i <= 50; i++) {
                  const y = (i / 50) * 100;
                  // Calcular cuánto se retrasa cada punto según su distancia del centro (50%)
                  const distanceFromCenter = Math.abs(y - 50) / 50; // 0 en centro, 1 en extremos
                  const delay = distanceFromCenter * 15; // Los extremos se retrasan hasta 15%
                  const adjustedProgress = Math.max(0, progress - delay);

                  // Agregar ondas suaves en el borde
                  const wave =
                    Math.sin(
                      (adjustedProgress / 100) * Math.PI * 5 +
                        (y / 100) * Math.PI * 3,
                    ) * 10;
                  const x = adjustedProgress + (wave / 100) * 12;
                  points += `${x}% ${y}%, `;
                }

                points += `0% 100%`;
                return `polygon(${points})`;
              })(),
              transition: "clip-path 0.05s linear",
              // Mascara de degradado ultra suave: 50% de ancho de desvanecimiento
              // El clipPath va adelante (+20%) para que nunca se vea el borde duro geométrico
              maskImage: `linear-gradient(to right, 
                rgba(0,0,0,1) 0%, 
                rgba(0,0,0,1) ${Math.max(0, loadingProgress - 50)}%, 
                rgba(0,0,0,0.9) ${Math.max(0, loadingProgress - 40)}%, 
                rgba(0,0,0,0.6) ${Math.max(0, loadingProgress - 25)}%, 
                rgba(0,0,0,0.3) ${Math.max(0, loadingProgress - 15)}%, 
                rgba(0,0,0,0) ${loadingProgress}%, 
                rgba(0,0,0,0) 100%
              )`,
              WebkitMaskImage: `linear-gradient(to right, 
                rgba(0,0,0,1) 0%, 
                rgba(0,0,0,1) ${Math.max(0, loadingProgress - 50)}%, 
                rgba(0,0,0,0.9) ${Math.max(0, loadingProgress - 40)}%, 
                rgba(0,0,0,0.6) ${Math.max(0, loadingProgress - 25)}%, 
                rgba(0,0,0,0.3) ${Math.max(0, loadingProgress - 15)}%, 
                rgba(0,0,0,0) ${loadingProgress}%, 
                rgba(0,0,0,0) 100%
              )`,
            }}
          />

          {/* Contenido - visible cuando está completo */}
          {isComplete && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 relative z-10">
              {/* Icono: Checkmark */}
              <svg
                className="h-24 w-24"
                style={{ color: "white" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                  style={{ transform: "rotate(-2deg)" }}
                />
              </svg>

              {/* Título principal */}
              <h2
                className="text-3xl font-bold leading-tight"
                style={{ color: "white" }}
              >
                {isTransferring
                  ? t.loading.transferCompleteTitle
                  : t.loading.linkingCompleteTitle}
              </h2>

              {/* Subtítulo */}
              <p
                className="text-base leading-relaxed"
                style={{ color: "white", opacity: 0.9 }}
              >
                {isTransferring
                  ? t.loading.transferCompleteDescription
                  : t.loading.linkingCompleteDescription}
              </p>
            </div>
          )}

          {/* Contenido mientras carga - texto y barra de progreso */}
          {!isComplete && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
              {/* Título con cambio letra por letra */}
              <h2 className="text-xl font-bold">
                {(isTransferring
                  ? t.loading.transferringFunds
                  : t.loading.connectingAccount
                )
                  .split("")
                  .map((char, index, array) => {
                    const charProgress = (index / array.length) * 100;
                    const isWhite = loadingProgress >= charProgress;
                    return (
                      <span
                        key={index}
                        style={{
                          color: isWhite ? "white" : almostBlackColor,
                          transition: "color 0.2s ease-out",
                        }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </span>
                    );
                  })}
              </h2>

              {/* Subtítulo con cambio letra por letra */}
              <p className="text-sm">
                {t.loading.pleaseWait
                  .split("")
                  .map((char, index, array) => {
                    const charProgress = (index / array.length) * 100;
                    const isWhite = loadingProgress >= charProgress;
                    return (
                      <span
                        key={index}
                        style={{
                          color: isWhite ? "rgba(255, 255, 255, 0.9)" : "#666",
                          transition: "color 0.2s ease-out",
                        }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </span>
                    );
                  })}
              </p>

              {/* Barra de progreso debajo del texto */}
              <div className="w-full max-w-xs mt-2">
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${loadingProgress}%`,
                      backgroundColor: "white",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render success screen
  const renderSuccessScreen = () => {
    const isApproved = true; // Por ahora siempre aprobado, se puede cambiar según la lógica

    return (
      <div className="flex h-full flex-col relative overflow-hidden bg-white">
        {/* Header con logo */}
        <div className="relative mb-3 flex flex-shrink-0 items-center justify-between px-6 pt-6 z-20">
          {currentBranding.logo && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <img
                src={currentBranding.logo}
                  alt={t.branding.logoLabel}
                className="h-8 max-w-full object-contain"
              />
            </div>
          )}
          <div className="w-full"></div> {/* Spacer para centrar el logo */}
        </div>

        {/* Card/div con gradiente (mismo que botón Continuar >) */}
        <div
          className="relative rounded-3xl flex flex-col items-center justify-center"
          style={{
            background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
            marginTop: "20px",
            marginLeft: "10px",
            marginRight: "10px",
            marginBottom: "80px",
            width: "calc(100% - 20px)",
            height: "calc(100% - 10px)",
            boxSizing: "border-box",
            padding: "40px 20px",
          }}
        >
          {/* Contenido centrado */}
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            {/* Icono: Visto (checkmark) o X */}
            {isApproved ? (
              <svg
                className="h-24 w-24"
                style={{ color: "white" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                  style={{ transform: "rotate(-2deg)" }}
                />
              </svg>
            ) : (
              <svg
                className="h-24 w-24"
                style={{ color: "white" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}

            {/* Título principal */}
            <h2
              className="text-3xl font-bold leading-tight"
              style={{ color: "white" }}
            >
              {isApproved ? t.success.linkedTitle : t.success.failedTitle}
            </h2>

            {/* Subtítulo */}
            <div className="flex flex-col items-center space-y-2">
              <p
                className="text-base leading-relaxed"
                style={{ color: "white", opacity: 0.9 }}
              >
                {isApproved
                  ? t.success.linkedDescription
                  : t.success.failedDescription}
              </p>
              {!isApproved && (
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "white", opacity: 0.9 }}
                >
                  {t.success.tryAgain}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render wallet screen
  const renderWalletScreen = () => {
    // Obtener código de moneda según el país
    const getCurrencyCode = (country: BankAccountCountry): string => {
      const currencyMap: Record<BankAccountCountry, string> = {
        mexico: "MXN",
        brasil: "BRL",
        colombia: "COP",
        estados_unidos: "USD",
        ecuador: "USD",
      };
      return currencyMap[country] || "USD";
    };

    const currencyCode = getCurrencyCode(country);

    return (
      <div className="flex h-full flex-col overflow-y-auto relative">
        {/* GIF Animado */}
        <div className="relative flex-shrink-0 z-0 mb-2 flex justify-center">
          <img
            src="/gift/ANIMACION%201.gif"
            alt={t.walletAnimationAlt}
            className="h-64 w-64 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
          />
        </div>

        {/* Tarjeta con blur que cubre parcialmente el GIF */}
        <div
          className="relative z-10 flex-1 flex flex-col rounded-2xl backdrop-blur-sm"
          style={{
            marginLeft: "15px",
            marginRight: "15px",
            marginBottom: "15px",
            padding: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.35)",
            marginTop: "-120px", // Cubre más del GIF
          }}
        >
          {/* Contenido de la tarjeta */}
          <div className="flex flex-col flex-1 space-y-4">
            {/* Título "Billetera" */}
            <div className="text-center">
              <h2
                className="text-xl font-bold"
                style={{ color: almostBlackColor }}
              >
                {t.wallet.title}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {t.wallet.desc}
              </p>
            </div>

            {/* Label "Balance total" - FUERA de la tarjeta, alineado a la izquierda */}
            <label
              className="text-sm font-medium"
              style={{ color: almostBlackColor, textAlign: "left" }}
            >
              {t.wallet.totalBalanceLabel}
            </label>

            {/* Tarjeta gris con balance y moneda */}
            <div
              className="rounded-xl p-1 flex items-center justify-between"
              style={{
                backgroundColor: "#E5E7EB", // Gris
              }}
            >
              {/* Balance a la izquierda con color del tema */}
              <span
                className="text-2xl font-normal"
                style={{ color: almostBlackColor }}
              >
                $
                {walletBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>

              {/* Badge de moneda a la derecha con gradiente */}
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                  color: "white",
                }}
              >
                {currencyCode}
              </span>
            </div>

            {/* Botón "Deposit funds" */}
            <button
              onClick={() => setCurrentScreen("deposit")}
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-4 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98]"
              style={{
                background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                borderColor: themeColor,
                boxShadow: `0 4px 14px 0 ${themeColor}40`,
                animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
              }}
            >
              {/* Resplandor animado alrededor del botón */}
              <span 
                className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10"
                style={{
                  background: themeColor,
                  animation: 'cta-pulse-ring 2s ease-in-out infinite',
                }}
              ></span>
              
              {/* Brillo que se mueve automáticamente */}
              <span 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10"
                style={{
                  animation: 'cta-shine-sweep 2.5s linear infinite',
                }}
              ></span>
              
              {/* Capa de brillo adicional constante */}
              <span 
                className="absolute inset-0 rounded-xl -z-10"
                style={{
                  background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`,
                  animation: 'cta-glow-pulse 2s ease-in-out infinite',
                }}
              ></span>
              
              <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                {t.wallet.depositButton}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
              
              {/* Efecto de brillo al hacer hover */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
            </button>

            {/* Tarjeta de banco conectado */}
            <div
              className="rounded-t-xl p-4 mt-auto"
              style={{
                background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
              }}
            >
              <div className="flex flex-col items-center space-y-2">
                {/* Chevron hacia arriba */}
                <svg
                  className="h-5 w-5"
                  style={{ color: "white" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                  />
                </svg>

                {/* Nombre del banco */}
                <h3
                  className="text-lg font-bold uppercase"
                  style={{ color: "white" }}
                >
                  {selectedBank?.name || t.connectedBankNameFallback}
                </h3>

                {/* Texto "Connected Bank" */}
                <p className="text-xs" style={{ color: "white", opacity: 0.9 }}>
                  {t.wallet.connectedBankLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render deposit screen
  const renderDepositScreen = () => {
    // Obtener código de moneda según el país
    const getCurrencyCode = (country: BankAccountCountry): string => {
      const currencyMap: Record<BankAccountCountry, string> = {
        mexico: "MXN",
        brasil: "BRL",
        colombia: "COP",
        estados_unidos: "USD",
        ecuador: "USD",
      };
      return currencyMap[country] || "USD";
    };

    const currencyCode = getCurrencyCode(country);

    // Funciones para manejar el deslizamiento
    const handleSlideStart = () => {
      if (isTransferring) return;
      setIsSliding(true);
    };

    const handleSlideMove = (clientX: number) => {
      if (!isSliding || isTransferring) return;

      const container = slideContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const sliderWidth = 48; // Ancho del slider circular
      const x = clientX - rect.left;
      const maxX = rect.width - sliderWidth; // Distancia máxima que puede recorrer
      const progress = Math.max(0, Math.min(100, (x / maxX) * 100));

      setSlideProgress(progress);

      // Si llega al 90% o más, iniciar transferencia
      if (progress >= 90 && !isTransferring) {
        setIsTransferring(true);
        setSlideProgress(100);
        setIsSliding(false);

        // Iniciar el flujo de transferencia
        const amount = parseFloat(depositAmount) || 0;
        setLoadingProgress(0);
        setCurrentScreen("loading");
        setIsTransferring(true);
      }
    };

    const handleSlideEnd = () => {
      setIsSliding(false);
      // Si no llegó al 90%, volver al inicio
      if (slideProgress < 90 && !isTransferring) {
        setSlideProgress(0);
      }
    };

    // Datos de ejemplo para las cuentas
    const depositAccounts = [
      {
        id: 1,
        name: t.deposit.accountTypePrimary,
        accountNumber: "012345678901234567",
        balance: 12345.67,
      },
      {
        id: 2,
        name: t.deposit.accountTypeSecondary,
        accountNumber: "",
        balance: 145.67,
      },
    ];

    return (
      <div className="flex h-full flex-col overflow-y-auto relative">
        {/* GIF Animado */}
        <div className="relative flex-shrink-0 z-0 mb-2 flex justify-center">
          <img
            src="/gift/ANIMACION%201.gif"
            alt={t.deposit.animationAlt}
            className="h-48 w-48 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
          />
        </div>

        {/* Tarjeta con blur que cubre parcialmente el GIF */}
        <div
          className="relative z-10 flex-1 flex flex-col rounded-2xl backdrop-blur-sm"
          style={{
            marginLeft: "15px",
            marginRight: "15px",
            marginBottom: "15px",
            padding: "16px",
            backgroundColor: "rgba(255, 255, 255, 0.35)",
            marginTop: "-100px", // Cubre menos del GIF para tener más espacio
          }}
        >
          {/* Contenido de la tarjeta */}
          <div className="flex flex-col flex-1 space-y-2">
            {/* Título y subtítulo */}
            <div className="text-center">
              <h2
                className="text-lg font-bold"
                style={{ color: almostBlackColor }}
              >
                {t.deposit.title}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {t.deposit.desc}
              </p>
            </div>

            {/* Label "Select Account" */}
            <label
              className="text-sm font-medium"
              style={{ color: almostBlackColor, textAlign: "left" }}
            >
              {t.deposit.selectAccount}
            </label>

            {/* Tarjetas de cuentas - Stack con efecto de corte */}
            <div
              className="relative flex flex-col items-center w-full"
              style={{
                isolation: "isolate",
                backgroundColor: "transparent",
                paddingTop: "20px",
              }}
            >
              {depositAccounts.map((account, index) => {
                const isActive = activeDepositAccountCard === index;
                const activeIndex = activeDepositAccountCard;

                // Lógica de Pirámide: La activa (Distancia 0) tiene el Z-Index más alto (50)
                const distanceFromActive = Math.abs(activeIndex - index);
                const zIndex = 50 - distanceFromActive;

                return (
                  <div
                    key={account.id}
                    className="relative w-full cursor-pointer flex items-center justify-center"
                    onClick={() => {
                      if (activeDepositAccountCard !== index) {
                        setActiveDepositAccountCard(index);
                      }
                    }}
                    style={{
                      borderRadius: "28px", // Todas las esquinas redondeadas igual que las de bancos
                      zIndex: zIndex,
                      marginTop: index === 0 ? "0px" : "-20px", // Primera sin margen, resto con -30px
                      height: isActive ? "70px" : "60px", // Altura fija: activa 70px, inactiva 60px (más compactas)
                      padding: "12px 20px", // Padding reducido verticalmente para hacerlas más compactas
                      backgroundColor: isActive ? undefined : "#E5E7EB", // Gris inactivo
                      color: isActive ? "white" : "#1F2937",
                      border: "5px solid #FFFFFF", // Borde blanco para efecto de mordida
                      
                      transform: isActive ? "scale(1.02)" : "scale(1)",
                      transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      ...(isActive
                        ? {
                            background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                          }
                        : {}),
                    }}
                  >
                    <div
                      className="flex items-center w-full"
                      style={{
                        gap: "16px",
                        justifyContent: "center",
                      }}
                    >
                      {/* Información de la cuenta */}
                      <div className="flex flex-col items-start flex-1">
                        <span
                          className={`${isActive ? "text-base font-semibold" : "text-sm font-medium"}`}
                          style={{
                            color: isActive ? "white" : "#1F2937",
                            textAlign: "center",
                          }}
                        >
                          {account.name}
                        </span>
                        {isActive && account.accountNumber && (
                          <span
                            className="text-xs mt-1"
                            style={{
                              color: "white",
                              opacity: 0.9,
                            }}
                          >
                            {account.accountNumber}
                          </span>
                        )}
                      </div>

                      {/* Balance y moneda a la derecha (solo visible cuando está activa) */}
                      {isActive && (
                        <div className="flex flex-col items-end">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "white" }}
                          >
                            $
                            {account.balance.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span
                            className="text-xs mt-1"
                            style={{ color: "white", opacity: 0.9 }}
                          >
                            {currencyCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Label "Amount" */}
            <label
              className="text-sm font-medium mt-2"
              style={{ color: almostBlackColor, textAlign: "left" }}
            >
              {t.deposit.amountLabel}
            </label>

            {/* Input de monto */}
            <input
              type="text"
              value={depositAmount}
              onChange={(e) => {
                const rawValue = e.target.value;
                // Permitir solo dígitos y un punto decimal.
                const sanitizedValue = rawValue
                  .replace(/[^\d.]/g, "")
                  .replace(/(\..*)\./g, "$1");
                setDepositAmount(sanitizedValue);
              }}
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              placeholder={t.deposit.amountPlaceholder}
              className="w-full rounded-xl p-3 text-base font-normal"
              style={{
                backgroundColor: "#E5E7EB",
                color: almostBlackColor,
                border: "none",
                textAlign: "center",
              }}
            />

            {/* Botón "Slide to confirm" o Botón fijo */}
            <div className="mt-auto pt-2">
              {(currentBranding.depositButtonType || "slider") === "slider" ? (
                // Slider para confirmar con animaciones CTA
                <div
                  ref={slideContainerRef}
                  className="group relative w-full rounded-full overflow-hidden"
                  style={{
                    background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                    height: "48px",
                    boxShadow: `0 4px 14px 0 ${themeColor}40`,
                    animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                  }}
                  onMouseDown={(e) => {
                    if (isTransferring) return;
                    handleSlideStart();
                    handleSlideMove(e.clientX);
                  }}
                  onMouseMove={(e) => {
                    if (isSliding && !isTransferring) {
                      handleSlideMove(e.clientX);
                    }
                  }}
                  onMouseUp={() => {
                    if (isSliding) {
                      handleSlideEnd();
                    }
                  }}
                  onMouseLeave={() => {
                    if (isSliding) {
                      handleSlideEnd();
                    }
                  }}
                  onTouchStart={(e) => {
                    if (isTransferring) return;
                    e.preventDefault();
                    handleSlideStart();
                    if (e.touches[0]) {
                      handleSlideMove(e.touches[0].clientX);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (isSliding && !isTransferring) {
                      e.preventDefault();
                      if (e.touches[0]) {
                        handleSlideMove(e.touches[0].clientX);
                      }
                    }
                  }}
                  onTouchEnd={() => {
                    if (isSliding) {
                      handleSlideEnd();
                    }
                  }}
                >
                  {/* Resplandor animado alrededor del slider */}
                  <span 
                    className="absolute inset-0 rounded-full opacity-60 blur-md -z-10"
                    style={{
                      background: themeColor,
                      animation: 'cta-pulse-ring 2s ease-in-out infinite',
                    }}
                  ></span>
                  
                  {/* Brillo que se mueve automáticamente */}
                  <span 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10"
                    style={{
                      animation: 'cta-shine-sweep 2.5s linear infinite',
                    }}
                  ></span>
                  
                  {/* Capa de brillo adicional constante */}
                  <span 
                    className="absolute inset-0 rounded-full -z-10"
                    style={{
                      background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`,
                      animation: 'cta-glow-pulse 2s ease-in-out infinite',
                    }}
                  ></span>

                  {/* Slider circular que se mueve */}
                  <div
                    className="absolute top-0 bottom-0 flex items-center justify-center rounded-full bg-white shadow-lg z-10"
                    style={{
                      width: "48px",
                      height: "48px",
                      left: `${Math.min(slideProgress, 100)}%`,
                      transform: `translateX(-${Math.min(slideProgress, 100)}%)`,
                      cursor: isTransferring
                        ? "default"
                        : isSliding
                          ? "grabbing"
                          : "grab",
                      transition: isSliding
                        ? "none"
                        : "left 0.3s ease-out, transform 0.3s ease-out",
                      userSelect: "none",
                    }}
                  >
                    <svg
                      className="h-5 w-5"
                      style={{ color: themeColor, animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>

                  {/* Texto "Slide to confirm" */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <span className="text-white font-medium text-sm" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                      {t.deposit.slideToConfirm}
                    </span>
                  </div>

                  {/* Efecto de brillo al hacer hover */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
                </div>
              ) : (
                // Botón fijo con animaciones CTA
                <button
                  onClick={() => {
                    if (!depositAmount || isTransferring) return;
                    const amount = parseFloat(depositAmount) || 0;
                    if (amount > 0) {
                      setLoadingProgress(0);
                      setCurrentScreen("loading");
                      setIsTransferring(true);
                    }
                  }}
                  disabled={!depositAmount || isTransferring}
                  className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-4 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                  style={{
                    background: !depositAmount || isTransferring
                      ? '#9BA2AF' 
                      : `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                    borderColor: !depositAmount || isTransferring ? '#9BA2AF' : themeColor,
                    boxShadow: !depositAmount || isTransferring ? 'none' : `0 4px 14px 0 ${themeColor}40`,
                    animation: !depositAmount || isTransferring ? 'none' : 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                    opacity: !depositAmount || isTransferring ? 0.5 : 1,
                  }}
                >
                  {(!depositAmount || isTransferring) ? null : (
                    <>
                      {/* Resplandor animado alrededor del botón */}
                      <span 
                        className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10"
                        style={{
                          background: themeColor,
                          animation: 'cta-pulse-ring 2s ease-in-out infinite',
                        }}
                      ></span>
                      
                      {/* Brillo que se mueve automáticamente */}
                      <span 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10"
                        style={{
                          animation: 'cta-shine-sweep 2.5s linear infinite',
                        }}
                      ></span>
                      
                      {/* Capa de brillo adicional constante */}
                      <span 
                        className="absolute inset-0 rounded-xl -z-10"
                        style={{
                          background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`,
                          animation: 'cta-glow-pulse 2s ease-in-out infinite',
                        }}
                      ></span>
                    </>
                  )}
                  
                  <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: !depositAmount || isTransferring ? 'none' : 'cta-glow-pulse 2s ease-in-out infinite' }}>
                    {t.deposit.slideToConfirm}
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      style={{ animation: !depositAmount || isTransferring ? 'none' : 'cta-bounce-arrow 1.2s ease-in-out infinite' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                  
                  {/* Efecto de brillo al hacer hover */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render banks list screen
  const renderBanksScreen = () => {
    // Configuración compartida para tarjetas verticales
    const VERTICAL_CARDS_BORDER_RADIUS = {
      active: 25,
      inactive: 16,
    };

    // Inicializar activeBankCard si es null
    if (filteredBanks.length > 0 && activeBankCard >= filteredBanks.length) {
      setActiveBankCard(0);
    }

    return (
      <div className="flex h-full flex-col px-6 py-6">
        {/* Título */}
        <div className="mb-2 text-center">
          <h2 className="mb-1 text-sm font-bold" style={{ color: themeColor }}>
            {t.pageTitle}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t.banksSubtitle}
          </p>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-[10px]">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-lg border border-stroke bg-white py-3 pl-10 pr-4 text-sm text-dark placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>
        </div>

        {/* Tarjetas de bancos - Stack con efecto de corte */}
        <div
          className="relative flex flex-col items-center flex-1 min-h-0 overflow-hidden"
          style={{ isolation: "isolate", backgroundColor: "transparent" }}
        >
          {filteredBanks.map((bank, index) => {
            const isActive = activeBankCard === index;
            const activeIndex = activeBankCard;

            // Variable para controlar la separación/solapamiento entre tarjetas
            const cardOverlap = 20; // Píxeles de solapamiento (puedes ajustar este valor: más = más solapamiento, menos = más separación)

            // Variable para controlar el redondeo de los bordes de las tarjetas
            const cardBorderRadius = 20; // Píxeles de borderRadius (puedes ajustar: más = más redondeado, menos = más cuadrado)

            // MAGIA: Z-Index Pirámide - La activa es el pico (Z=50). Las demás descienden según distancia
            const distanceFromActive = Math.abs(activeIndex - index);
            const zIndex = 50 - distanceFromActive;

            return (
              <div
                key={bank.id}
                className={`relative w-full cursor-pointer flex items-center justify-center transition-all duration-500 ${
                  isActive ? "shadow-lg" : ""
                }`}
                onClick={() => {
                  setActiveBankCard(index);
                  setSelectedBank(bank);
                }}
                style={{
                  borderRadius: `${cardBorderRadius}px`,
                  zIndex: zIndex,
                  marginTop: index === 0 ? "0px" : `-${cardOverlap}px`, // Primera sin margen negativo, resto con solapamiento controlado por cardOverlap
                  height: isActive ? "60px" : "65px", // Alturas aumentadas para ocupar más espacio
                  padding: isActive ? "20px 24px" : "16px 24px",
                  backgroundColor: isActive ? undefined : "#E5E7EB", // Gris inactivo
                  color: isActive ? "white" : "#1F2937",
                  border: "5px solid #FFFFFF", // Borde blanco grueso para efecto de corte
                  transform: isActive ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  ...(isActive
                    ? {
                        background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                      }
                    : {}),
                }}
              >
                <div
                  className="flex items-center w-full"
                  style={{
                    paddingLeft: isActive ? "14px" : "0",
                    paddingRight: "14px",
                  }}
                >
                  {/* Logo - solo visible cuando está activa, alineado a la izquierda */}
                  {isActive && (
                    <BankLogoWithFallback
                      bank={bank}
                      themeColor={themeColor}
                      size="36px"
                    />
                  )}

                  {/* Nombre del banco - siempre en una línea, separación fija de 10px del logo */}
                  <span
                    className={`${isActive ? "text-xs font-semibold" : "text-[10px] font-medium"}`}
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "visible",
                      marginLeft: isActive ? "10px" : "0",
                      flex: "1",
                      textAlign: isActive ? "left" : "center",
                    }}
                  >
                    {bank.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón Continuar */}
        <div className="mt-[10px] flex justify-center pb-4 flex-shrink-0">
          <button
            onClick={() => {
              if (selectedBank) {
                setCurrentScreen("credentials");
                onBankSelected?.(true);
              }
            }}
            disabled={!selectedBank}
            className="group relative flex items-center justify-between overflow-hidden rounded-lg border px-6 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: !selectedBank
                ? '#9BA2AF' 
                : `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
              borderColor: !selectedBank ? '#9BA2AF' : themeColor,
              boxShadow: !selectedBank ? 'none' : `0 4px 14px 0 ${themeColor}40`,
              animation: !selectedBank ? 'none' : 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
              minWidth: "200px",
              width: "auto",
            }}
          >
            {!!selectedBank && (
              <>
                <span className="absolute inset-0 rounded-lg opacity-60 blur-md -z-10" style={{ background: themeColor, animation: 'cta-pulse-ring 2s ease-in-out infinite' }}></span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10" style={{ animation: 'cta-shine-sweep 2.5s linear infinite' }}></span>
                <span className="absolute inset-0 rounded-lg -z-10" style={{ background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`, animation: 'cta-glow-pulse 2s ease-in-out infinite' }}></span>
              </>
            )}
            <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: !selectedBank ? 'none' : 'cta-glow-pulse 2s ease-in-out infinite' }}>
              {t.continueButton}
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ animation: !selectedBank ? 'none' : 'cta-bounce-arrow 1.2s ease-in-out infinite' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
          </button>
        </div>
      </div>
    );
  };

  // Render current screen content
  const renderScreenContent = () => {
    switch (currentScreen) {
      case "credentials":
        return renderCredentialsScreen();
      case "loading":
        return renderLoadingScreen();
      case "success":
        return renderSuccessScreen();
      case "wallet":
        return renderWalletScreen();
      case "deposit":
        return renderDepositScreen();
      default:
        return renderBanksScreen();
    }
  };

  // Mobile Preview only
  return (
    <div className="rounded-lg bg-transparent p-6 shadow-sm dark:bg-transparent">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-dark dark:text-white">
          {t.mobilePreviewTitle}
        </h2>
      </div>
      <div className="relative -mx-6 w-[calc(100%+3rem)] py-12">
        {/* Interactive animated background with halftone dots and glow */}
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl"
          style={{ minHeight: "850px" }}
        >
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

          {/* Additional animated halftone layer for depth */}
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
          <div
            className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]"
            data-tour-id={
              currentScreen === "credentials"
                ? "tour-connect-credentials"
                : currentScreen === "wallet"
                  ? "tour-connect-wallet"
                  : undefined
            }
          >
            <div className="relative h-[680px] overflow-hidden rounded-[2.5rem] bg-white dark:bg-black m-0.5 flex flex-col">
              {/* Mobile Header - Status Bar */}
              <div className="relative flex items-center justify-between bg-white dark:bg-black px-6 pt-10 pb-2 flex-shrink-0">
                <div className="absolute left-6 top-4 flex items-center">
                  <span className="text-xs font-semibold text-black dark:text-white">
                    9:41
                  </span>
                </div>
                <div className="absolute left-1/2 top-3 -translate-x-1/2">
                  <div className="h-5 w-24 rounded-full bg-black dark:bg-white/20"></div>
                  <div className="absolute left-1/2 top-1/2 h-0.5 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800 dark:bg-white/30"></div>
                </div>
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

              {/* Header con back y logo - oculto en success porque tiene su propio header */}
              {currentScreen !== "success" && (
                <div className="relative mb-3 flex flex-shrink-0 items-center justify-between px-6 pt-6">
                  <button
                    onClick={() => {
                      if (currentScreen !== "banks") {
                        setCurrentScreen("banks");
                        setSelectedBank(null);
                        setUsername("");
                        setPassword("");
                        onBankSelected?.(false);
                      }
                    }}
                    className="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    &lt; {t.backLabel.toLowerCase()}
                  </button>
                  {currentBranding.logo && (
                    <div className="absolute left-1/2 -translate-x-1/2">
                      <img
                        src={currentBranding.logo}
                        alt={t.branding.logoLabel}
                        className="h-8 max-w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="w-12"></div>{" "}
                  {/* Spacer para centrar el logo */}
                </div>
              )}

              {/* Content */}
              <div
                className={`flex-1 min-h-0 bg-white dark:bg-black overflow-hidden ${currentScreen === "success" ? "p-0" : ""}`}
                style={{ scrollbarWidth: "thin" }}
              >
                {renderScreenContent()}
              </div>

              {/* Mobile Bottom Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-shrink-0">
                <div className="h-1 w-32 rounded-full bg-black/30 dark:bg-white/30"></div>
              </div>
            </div>
            {/* Phone Frame Details */}
            <div className="absolute -left-1 top-24 h-12 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
            <div className="absolute -left-1 top-40 h-8 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
            <div className="absolute -right-1 top-32 h-10 w-1 rounded-r bg-gray-800 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
