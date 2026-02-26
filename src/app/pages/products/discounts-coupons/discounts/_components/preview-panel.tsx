"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo, useRef } from "react";
import { AuthConfig } from "../../../auth/authentication/_components/authentication-config";
import Image from "next/image";
import { useDiscountsTranslations } from "./use-discounts-translations";
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

import { DiscountsConfigState, Plan } from "./discounts-config";

interface DiscountsPreviewPanelProps {
  config: DiscountsConfigState;
  updateConfig: (updates: Partial<DiscountsConfigState>) => void;
}

type PlanType = "free" | "premium";

export function DiscountsPreviewPanel({
  config,
  updateConfig,
}: DiscountsPreviewPanelProps) {
  const t = useDiscountsTranslations();
  const { viewMode, plans, promoCount, showHourField, branding } = config;

  // Detect dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Get dynamic branding based on theme
  const currentBranding = isDarkMode ? branding?.dark : branding?.light;
  const customColor = currentBranding?.customColorTheme || "#004492";
  
  // Helper function to darken color
  const darkenColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, ((num >> 16) & 0xFF) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };
  
  // Inicializar animaciones CTA
  useCTAButtonAnimations(customColor);

  // State to track selected plan and current step in the flow
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("free");
  const [step, setStep] = useState(8);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [mapPointer, setMapPointer] = useState({ x: 50, y: 50 });
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [promoStartDate, setPromoStartDate] = useState(() => {
    const now = new Date();
    return showHourField ? now.toISOString().slice(0, 16) : now.toISOString().slice(0, 10);
  });
  const [promoEndDate, setPromoEndDate] = useState(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return showHourField ? end.toISOString().slice(0, 16) : end.toISOString().slice(0, 10);
  });

  useEffect(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setPromoStartDate(showHourField ? now.toISOString().slice(0, 16) : now.toISOString().slice(0, 10));
    setPromoEndDate(showHourField ? end.toISOString().slice(0, 16) : end.toISOString().slice(0, 10));
  }, [showHourField]);

  const startDateInputRef = useRef<HTMLInputElement | null>(null);
  const endDateInputRef = useRef<HTMLInputElement | null>(null);

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const input = ref.current;
    if (!input) return;
    // Safari/Chrome support showPicker for date inputs; fallback to click.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybeShowPicker = (input as any).showPicker as undefined | (() => void);
    if (typeof maybeShowPicker === "function") {
      try {
        maybeShowPicker.call(input);
        return;
      } catch {
        // Fallback below
      }
    }
    input.focus();
    input.click();
  };

  const startParts = useMemo(() => {
    const raw = promoStartDate || "";
    const [datePart, timePart] = raw.split("T");
    const [yyyy = "", mm = "", dd = ""] = datePart.split("-");
    const hour = timePart ? timePart.slice(0, 5) : "";
    return { yyyy, mm, dd, hour };
  }, [promoStartDate]);

  const endParts = useMemo(() => {
    const raw = promoEndDate || "";
    const [datePart, timePart] = raw.split("T");
    const [yyyy = "", mm = "", dd = ""] = datePart.split("-");
    const hour = timePart ? timePart.slice(0, 5) : "";
    return { yyyy, mm, dd, hour };
  }, [promoEndDate]);

  // Auto-advance step 10 (loading) to step 11 (success)
  useEffect(() => {
    if (step === 10) {
      setLoadingProgress(0);
      const animTimer = setTimeout(() => {
        setLoadingProgress(100);
      }, 50);

      const navTimer = setTimeout(() => {
        setStep(11);
      }, 3050);

      return () => {
        clearTimeout(animTimer);
        clearTimeout(navTimer);
      };
    } else {
      setLoadingProgress(0);
    }
  }, [step]);

  const toggleViewMode = () => {
    updateConfig({ viewMode: viewMode === "mobile" ? "web" : "mobile" });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => Math.max(1, prev - 1));

  // Reusable Components
  const BackgroundGradient = () => (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        background: `linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.35) 100%)`,
      }}
    />
  );

  const Header = ({ showBack = false }: { showBack?: boolean }) => (
    <div className="pt-6 px-6 text-center shrink-0 relative flex items-center justify-center z-50">
      {showBack && (
        <button
          onClick={prevStep}
          className="absolute left-6 text-xs text-gray-500 hover:text-dark flex items-center"
        >
          &lt; {t.preview.back}
        </button>
      )}
      <div className="flex items-center justify-center">
        {currentBranding?.logo ? (
          <img
            src={currentBranding.logo}
            alt="Logo"
            className="h-8 w-auto object-contain max-w-[120px]"
          />
        ) : (
          <Image
            src="/images/logo/zelifyLogo_ligth.svg"
            alt="Zelify Logo"
            width={100}
            height={30}
            className="h-8 w-auto object-contain"
            priority
          />
        )}
      </div>
    </div>
  );

  const AnimatedGraphic = () => (
    <div className="relative w-48 h-48 flex items-center justify-center mb-0 shrink-0 z-10">
      <img
        src="/gift/ANIMACION 1.gif"
        alt={t.preview.map.heroAlt}
        className="w-full h-full object-contain opacity-80"
      />
    </div>
  );

  const MapBackground = () => (
    <div className="absolute inset-0 bg-[#1a2333] z-0 overflow-hidden">
      {/* Simulated Map Streets */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" width="100%" height="100%">
          <pattern
            id="street-pattern"
            x="0"
            y="0"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M50 0 L50 50 M0 50 L50 50"
              stroke="white"
              strokeWidth="1"
              fill="none"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#street-pattern)" />
          <path
            d="M0 100 L400 120 M100 0 L150 800"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M200 0 L250 800 M0 300 L400 350"
            stroke="white"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>
      {/* Place names (Simulated) */}
      <div className="absolute top-20 left-10 text-[10px] text-gray-500 rotate-90">
        Av. Portugal
      </div>
      <div className="absolute bottom-40 right-10 text-[10px] text-gray-500">
        IÑAQUITO
      </div>
    </div>
  );

  const ContinueButton = ({
    onClick = nextStep,
    text = t.preview.continue,
  }) => {
    const darkenColor = (hex: string, amount: number) => {
      const num = parseInt(hex.replace("#", ""), 16);
      const r = Math.max(0, ((num >> 16) & 0xFF) - amount);
      const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
      const b = Math.max(0, (num & 0xFF) - amount);
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    };
    
    const darkThemeColor = darkenColor(customColor, 30);
    const almostBlackColor = darkenColor(customColor, 80);
    const blackColor = darkenColor(customColor, 100);
    
    return (
      <button
        onClick={onClick}
        className="group relative w-[80%] mx-auto text-white rounded-2xl py-3.5 text-sm flex items-center pl-6 shadow-lg overflow-hidden transition-all active:scale-[0.98] z-20"
        style={{
          background: `linear-gradient(to right, ${customColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
          boxShadow: `0 4px 14px 0 ${customColor}40`,
          animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
        }}
      >
        {/* Resplandor animado alrededor del botón */}
        <span 
          className="absolute inset-0 rounded-2xl opacity-60 blur-md -z-10"
          style={{
            background: customColor,
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
          className="absolute inset-0 rounded-2xl -z-10"
          style={{
            background: `radial-gradient(circle at center, ${customColor}20 0%, transparent 70%)`,
            animation: 'cta-glow-pulse 2s ease-in-out infinite',
          }}
        ></span>
        
        <span className="relative z-10 mr-0" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
          {text}
        </span>
        <span className="absolute right-6 z-10 transition-transform group-hover:translate-x-1" style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}>
          &gt;
        </span>
        
        {/* Efecto de brillo al hacer hover */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
      </button>
    );
  };

  const SelectPlaceholder = ({ text }: { text: string }) => (
    <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer">
      <span className="text-xs text-gray-500">{text}</span>
      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        stroke="gray"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 1L5 5L9 1" />
      </svg>
    </div>
  );

  // Render Functions for each Step

  // Step 1: Plan Selection
  const renderStep1 = () => {
    const renderCard = (planKey: PlanType) => {
      const plan = plans?.find((p) => p.id === planKey) || plans?.[0];
      const isActive = selectedPlan === planKey;
      const planT =
        planKey === "free" ? t.preview.plans.free : t.preview.plans.premium;

      return (
        <div
          onClick={() => !isActive && setSelectedPlan(planKey)}
          className={cn(
            "rounded-[2rem] transition-all duration-500 ease-in-out relative overflow-hidden flex flex-col items-center shrink-0 cursor-pointer",
            isActive
              ? "w-[90%] h-[180px] border-[9px] border-white shadow-[0_0_20px_rgba(255,255,255,0.6)] z-10 py-6"
              : "w-[85%] h-[70px] z-0 justify-center translate-y-0 hover:bg-white/40",
          )}
          style={{
            background: isActive
              ? `linear-gradient(to right, ${customColor}, #000b1e)`
              : "rgba(189, 185, 185, 0.3)",
          }}
        >
          {/* Expanded Content */}
          <div
            className={cn(
              "w-full flex flex-col items-center transition-opacity duration-300 px-4",
              isActive
                ? "opacity-100 delay-150"
                : "opacity-0 absolute pointer-events-none",
            )}
          >
            <h3 className="text-xs text-white mb-0">{planT.title}</h3>
            <div className="flex items-center justify-center gap-1 mb-5">
              <span className="text-xl text-white">{plan.price}</span>
              <span className="text-xs text-white/70">
                {t.preview.perMonth}
              </span>
            </div>
            <div className="space-y-1.5 text-center w-full">
              {planT.features.slice(0, 4).map((feature, idx) => (
                <p key={idx} className="text-[9px] text-white/70 leading-tight">
                  {feature}
                </p>
              ))}
            </div>
          </div>

          {/* Collapsed Content */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
              isActive
                ? "opacity-0 pointer-events-none"
                : "opacity-100 delay-150",
            )}
          >
            <span
              className={cn(
                "text-white text-base tracking-wide",
                planKey === "premium" && "mt-6",
                planKey === "free" && "mb-3",
              )}
            >
              {planT.title}
            </span>
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full bg-white text-dark relative overflow-hidden font-sans">
        <BackgroundGradient />
        <Header />

        <div className="relative flex-1 flex flex-col items-center pt-2 pb-6 min-h-0 z-10 px-4">
          <div className="absolute top-[165px] z-50 flex flex-col items-center justify-center w-full pointer-events-none">
            <h2 className="text-2xl font-bold" style={{ color: customColor }}>
              {t.preview.planSelection.title}
            </h2>
            <p className="text-gray-500 font-medium tracking-wide text-xs">
              {t.preview.planSelection.subtitle}
            </p>
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center mt-8 mb-[-50px] shrink-0 z-0">
            <AnimatedGraphic />
          </div>

          <div
            className="relative z-10 flex-1 w-full overflow-hidden rounded-2xl p-5 backdrop-blur-sm flex flex-col"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.35)",
            }}
          >
            <div className="w-full flex-1 flex flex-col items-center justify-center -space-y-6 relative z-20">
              {renderCard("free")}
              {renderCard("premium")}
            </div>

            <div className="pt-4 shrink-0">
              <ContinueButton />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Step 2: Basic Information
  const renderStep2 = () => (
    <div className="flex flex-col h-full bg-white text-dark relative overflow-hidden font-sans">
      <BackgroundGradient />
      <Header showBack={true} />

      <div className="flex-1 flex flex-col items-center pt-4 px-2 pb-12 z-10">
        <div className="relative w-32 h-32 flex items-center justify-center min-h-[50px] mb-4 mt-8 shrink z-20">
          <AnimatedGraphic />
        </div>

        <div
          className="relative z-10 flex-1 w-full overflow-hidden rounded-2xl p-4 backdrop-blur-sm flex flex-col pt-6 min-h-0"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.35)",
          }}
        >
          <div className="flex flex-col items-center justify-center text-center w-full">
            <h2 className="text-2xl font-bold text-black mb-1">
              {t.preview.basicInfo.title}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              {t.preview.basicInfo.subtitle}
            </p>
          </div>

          <div className="w-full flex-1 flex flex-col bg-gray-50/50 p-6 rounded-2xl overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[#003366] text-sm font-medium">
                  {t.preview.basicInfo.businessNameLabel}
                </label>
                <input
                  type="text"
                  placeholder={t.preview.basicInfo.businessNamePlaceholder}
                  className="w-full p-3 rounded-xl bg-gray-200/80 border-none text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-[#003366]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[#003366] text-sm font-medium">
                  {t.preview.basicInfo.businessIdLabel}
                </label>
                <input
                  type="text"
                  placeholder={t.preview.basicInfo.businessIdPlaceholder}
                  className="w-full p-3 rounded-xl bg-gray-200/80 border-none text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-[#003366]"
                />
              </div>
            </div>

            <div className="mt-auto pt-4 shrink-0">
              <ContinueButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Location Map
  const renderStep3 = () => {
    return (
      <div className="flex flex-col h-full bg-white text-dark relative overflow-hidden font-sans">
        <Header showBack={true} />

        <div className="flex-1 px-4 pt-2 pb-6 flex items-center justify-center min-h-0">
          {/* Map Container - Rounded Card */}
          <div
            className="relative w-full h-[95%] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col items-center bg-[#1a2333]"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setMapPointer({ x, y });
            }}
          >
            {/* Map Background with Gradient */}
            <div className="absolute inset-0 z-0">
              <MapBackground />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, #000b1e, #044a95)`,
                  opacity: 0.2,
                }}
              />
            </div>

            {/* Address Input Overlay */}
            <div className="absolute top-8 left-6 right-6 z-20">
              <div className="bg-[#1a334d]/60 backdrop-blur-md rounded-xl p-3.5 flex items-center border border-white/5 shadow-lg">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="gray"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-3 text-gray-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span className="text-gray-300 text-sm font-light">
                  {t.preview.map.businessAddress}
                </span>
              </div>
            </div>

            {/* Interactive Pointer */}
            <div
              className="absolute transition-all duration-300 ease-out z-30"
              style={{
                left: `${mapPointer.x}%`,
                top: `${mapPointer.y}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="white"
                className="drop-shadow-lg"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                <circle cx="12" cy="9" r="2.5" fill="#1a334d" />
              </svg>
            </div>

            {/* Continue Button */}
            <div className="absolute bottom-6 left-0 right-0 z-20">
              <button
                onClick={nextStep}
                className="group relative w-[70%] mx-auto flex items-center justify-center bg-white text-[#001a33] rounded-2xl py-3.5 font-bold text-sm shadow-lg hover:bg-gray-100 transition-all active:scale-[0.98] overflow-hidden"
                style={{
                  boxShadow: `0 4px 14px 0 ${customColor}40`,
                  animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                }}
              >
                {/* Resplandor animado alrededor del botón */}
                <span 
                  className="absolute inset-0 rounded-2xl opacity-60 blur-md -z-10"
                  style={{
                    background: customColor,
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
                  className="absolute inset-0 rounded-2xl -z-10"
                  style={{
                    background: `radial-gradient(circle at center, ${customColor}20 0%, transparent 70%)`,
                    animation: 'cta-glow-pulse 2s ease-in-out infinite',
                  }}
                ></span>
                
                <span className="relative z-10 mr-0" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  {t.preview.continue}
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

  // Step 4: Address Details
  const renderStep4 = () => (
    <div className="flex flex-col h-full bg-white text-dark relative overflow-hidden font-sans">
      <Header showBack={true} />

      <div className="flex-1 px-4 pt-2 pb-6 flex items-center justify-center min-h-0">
        <div className="relative w-full h-[95%] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
          {/* Background Layer: Map + Gradient */}
          <div className="absolute inset-0 z-0">
            <MapBackground />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, #000b1e 0%, #044a95 100%)`,
                opacity: 0.9,
              }}
            />
          </div>

          {/* Content Layer */}
          <div className="relative z-10 w-full h-full px-6 flex flex-col text-white pt-14">
            <h2 className="text-sm font-normal mb-8 text-center text-white shrink-0 tracking-wide">
              {t.preview.addressDetails.title}
            </h2>

            <div
              className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="mb-6">
                <label className="text-white/70 text-xs block mb-1">
                  {t.preview.addressDetails.phoneLabel}
                </label>
                <div className="w-full bg-transparent border-b border-white/20 py-2 flex justify-between items-center cursor-pointer">
                  <span className="text-sm text-white font-medium">+52</span>
                  <span className="text-[10px] text-white/50">▼</span>
                </div>
              </div>

              <div className="flex gap-3 items-start mb-6">
                <div className="text-white shrink-0 mt-0.5">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm text-white leading-tight">
                    Oficina Matriz
                  </p>
                  <p className="text-[10px] text-white/60 mt-0.5">
                    Av. De Los Shyris 1154, Quito
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="text-white/70 text-xs block mb-2">
                    {t.preview.addressDetails.buildingLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.preview.addressDetails.buildingPlaceholder}
                    className="w-full bg-black/20 rounded-lg p-3 text-xs placeholder:text-white/30 text-white focus:ring-0 transition-colors outline-none backdrop-blur-sm h-10"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-xs block mb-2">
                    {t.preview.addressDetails.floorLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.preview.addressDetails.floorPlaceholder}
                    className="w-full bg-black/20 rounded-lg p-3 text-xs placeholder:text-white/30 text-white focus:ring-0 transition-colors outline-none backdrop-blur-sm h-10"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-white/70 text-xs block mb-2">
                  {t.preview.addressDetails.referenceLabel}
                </label>
                <textarea
                  placeholder={t.preview.addressDetails.referencePlaceholder}
                  className="w-full bg-black/20 rounded-lg p-3 text-xs placeholder:text-white/30 text-white resize-none focus:ring-0 transition-colors outline-none backdrop-blur-sm h-32"
                />
              </div>
            </div>

            <div className="pt-4 shrink-0 pb-8 mt-auto">
              <button
                onClick={nextStep}
                className="group relative w-full bg-white text-[#003366] rounded-xl py-3.5 font-bold text-sm shadow-lg hover:bg-gray-50 transition-all active:scale-[0.98] overflow-hidden"
                style={{
                  boxShadow: `0 4px 14px 0 ${customColor}40`,
                  animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                }}
              >
                {/* Resplandor animado alrededor del botón */}
                <span 
                  className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10"
                  style={{
                    background: customColor,
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
                    background: `radial-gradient(circle at center, ${customColor}20 0%, transparent 70%)`,
                    animation: 'cta-glow-pulse 2s ease-in-out infinite',
                  }}
                ></span>
                
                <span className="relative z-10" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                  {t.preview.continue}
                </span>
                
                {/* Efecto de brillo al hacer hover */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 5: Business Description
  const renderStep5 = () => (
    <div className="flex flex-col h-full bg-white text-dark relative overflow-hidden font-sans">
      <Header showBack={true} />

      {/* Animation Layer - Behind Gradient */}
      <div className="absolute top-10 left-0 right-0 flex justify-center z-0">
        <div className="w-64 h-64 flex items-center justify-center">
          <AnimatedGraphic />
        </div>
      </div>

      {/* Gradient Layer - Between Animation and Content */}
      <div className="absolute top-[25%] left-0 right-0 bottom-0 pointer-events-none z-0">
        <div
          className="relative z-10 w-full h-full overflow-hidden rounded-2xl p-5 backdrop-blur-sm flex flex-col pt-4"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 20%, rgba(255,255,255,0.9) 45%, #ffffff 60%)",
          }}
        />
      </div>

      {/* Content Layer - Above Gradient */}
      <div className="flex-1 flex flex-col items-center px-6 z-20 pt-[220px]">
        <h2 className="text-2xl font-bold text-[#003366] mb-1">
          {t.preview.description.title}
        </h2>
        <p className="text-gray-400 text-xs text-center max-w-[200px] mb-6">
          {t.preview.description.prompt}
        </p>
        <div className="w-full bg-gray-50 flex-1 p-6 rounded-2xl mb-4 flex flex-col shadow-sm">
          <label className="text-[#003366]/70 text-sm mb-2">
            {t.preview.description.label}
          </label>
          <textarea
            placeholder={t.preview.description.placeholder}
            className="flex-1 w-full bg-transparent border-none resize-none text-sm placeholder:text-gray-400 focus:ring-0 p-0 scrollbar-hide"
          />
          <div className="text-right text-xs text-[#0066cc]">0/180</div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-2 shrink-0 z-30">
        <ContinueButton />
      </div>
    </div>
  );

  // Step 6: Category Detection
  const renderStep6 = () => (
    <div className="flex flex-col h-full bg-white text-dark relative overflow-hidden font-sans">
      <Header showBack={true} />

      {/* Animation Layer */}
      <div className="absolute top-10 left-0 right-0 flex justify-center z-0">
        <div className="w-64 h-64 flex items-center justify-center">
          <AnimatedGraphic />
        </div>
      </div>

      <div className="absolute top-[30%] left-0 right-0 bottom-0 pointer-events-none z-0">
        <div
          className="relative z-10 w-full h-full overflow-hidden rounded-2xl p-5 backdrop-blur-sm flex flex-col pt-4"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 20%, rgba(255,255,255,0.9) 45%, #ffffff 60%)",
          }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 pt-[280px]">
        <p className="text-gray-400 text-xs text-center mb-2">
          {t.preview.categoryDetection.detected}
        </p>
        <h2 className="text-3xl font-bold text-[#003366] mb-10">
          {t.preview.categoryDetection.category}
        </h2>
        <div className="w-full space-y-3 mb-6">
          <button
            onClick={() => setStep(5)}
            className="group relative w-[60%] mx-auto text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-between px-6 shadow-lg overflow-hidden transition-all active:scale-[0.98]"
            style={{
              background: `linear-gradient(to right, ${customColor} 0%, ${darkenColor(customColor, 30)} 40%, ${darkenColor(customColor, 80)} 70%, ${darkenColor(customColor, 100)} 100%)`,
              boxShadow: `0 4px 14px 0 ${customColor}40`,
              animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
            }}
          >
            {/* Resplandor animado alrededor del botón */}
            <span 
              className="absolute inset-0 rounded-2xl opacity-60 blur-md -z-10"
              style={{
                background: customColor,
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
              className="absolute inset-0 rounded-2xl -z-10"
              style={{
                background: `radial-gradient(circle at center, ${customColor}20 0%, transparent 70%)`,
                animation: 'cta-glow-pulse 2s ease-in-out infinite',
              }}
            ></span>
            
            <span className="flex-1 text-center relative z-10" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
              {t.preview.categoryDetection.noTryAgain}
            </span>
            <span className="relative z-10" style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}>&gt;</span>
            
            {/* Efecto de brillo al hacer hover */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
          </button>
          <button
            onClick={nextStep}
            className="group relative w-[60%] mx-auto text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-between px-6 shadow-lg overflow-hidden transition-all active:scale-[0.98]"
            style={{
              background: `linear-gradient(to right, ${customColor} 0%, ${darkenColor(customColor, 30)} 40%, ${darkenColor(customColor, 80)} 70%, ${darkenColor(customColor, 100)} 100%)`,
              boxShadow: `0 4px 14px 0 ${customColor}40`,
              animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
            }}
          >
            {/* Resplandor animado alrededor del botón */}
            <span 
              className="absolute inset-0 rounded-2xl opacity-60 blur-md -z-10"
              style={{
                background: customColor,
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
              className="absolute inset-0 rounded-2xl -z-10"
              style={{
                background: `radial-gradient(circle at center, ${customColor}20 0%, transparent 70%)`,
                animation: 'cta-glow-pulse 2s ease-in-out infinite',
              }}
            ></span>
            
            <span className="flex-1 text-center relative z-10" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
              {t.preview.categoryDetection.yesContinue}
            </span>
            <span className="relative z-10" style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}>&gt;</span>
            
            {/* Efecto de brillo al hacer hover */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
          </button>
        </div>
      </div>
    </div>
  );

  // Step 7: Create Promo Inputs
  const renderStep7 = () => (
    <div className="flex flex-col h-full bg-white text-dark relative overflow-hidden font-sans">
      <Header showBack={true} />

      {/* Animation Layer */}
      <div className="absolute top-10 left-0 right-0 flex justify-center z-0">
        <div className="w-64 h-64 flex items-center justify-center">
          <AnimatedGraphic />
        </div>
      </div>

      {/* Gradient Layer */}
      <div className="absolute top-[30%] left-0 right-0 bottom-0 pointer-events-none z-0">
        <div
          className="relative z-10 w-full h-full overflow-hidden rounded-2xl p-5 backdrop-blur-sm flex flex-col pt-4"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 20%, rgba(255,255,255,0.9) 45%, #ffffff 60%)",
          }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center px-6 z-20 pt-[220px]">
        <h2 className="text-2xl font-bold text-[#003366] mb-1">
          {t.preview.createPromo.title}
        </h2>
        <p className="text-gray-400 text-xs text-center mb-8">
          {t.preview.createPromo.subtitle}
        </p>

        <div className="w-full space-y-4 flex-1">
          <div className="bg-gray-100 rounded-xl p-4 shadow-sm">
            <span className="text-[#004492] text-sm font-medium block">
              {t.preview.createPromo.fields.productName}
            </span>
          </div>
          <div className="bg-gray-100 rounded-xl p-4 shadow-sm">
            <span className="text-[#004492] text-sm font-medium block">
              {t.preview.createPromo.fields.price}
            </span>
          </div>
          <div className="bg-gray-100 rounded-xl p-4 shadow-sm">
            <span className="text-[#004492] text-sm font-medium block">
              {t.preview.createPromo.fields.clientProfile}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-2 shrink-0 z-30">
        <ContinueButton />
      </div>
    </div>
  );

  // Step 8: Promo Selection Stack
  const renderStep8 = () => {
    // Determine the layout for the carousel
    const count = promoCount || 3; // Assuming promoCount is available, default to 3

    // Helper to get visual offset (-1, 0, 1) handling wrap-around
    const getOffset = (index: number) => {
      let diff = index - activePromoIndex;
      // Handle wrapping for circular effect
      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;
      return diff;
    };

    const renderStackCards = () => {
      const cards = [];
      for (let i = 0; i < count; i++) {
        const offset = getOffset(i);

        // Only render the active card and its immediate neighbors (prev/next)
        // This limits the visible stack to 3 cards for visual clarity
        if (Math.abs(offset) > 1) continue;

        const isActive = offset === 0;

        // Base translation from center. Spacing between cards.
        const translateY = offset * 65; // Reduced from 90 for tighter stack
        const scale = isActive ? 1 : 0.85;
        const zIndex = isActive ? 20 : offset < 0 ? 11 : 10;
        const opacity = isActive ? 1 : 0.8;

        cards.push(
          <div
            key={i}
            onClick={() => setActivePromoIndex(i)}
            className={cn(
              "absolute left-0 right-0 mx-auto transition-all duration-500 ease-out cursor-pointer flex flex-col justify-center",
              isActive
                ? "w-[95%] h-[110px] rounded-[2rem] border-[6px] border-white shadow-[0_0_25px_rgba(255,255,255,0.6)]"
                : "w-[100%] h-[80px] rounded-[2rem] hover:bg-white/10",
            )}
            style={{
              top: "50%",
              transform: `translateY(calc(-50% + ${translateY}px)) scale(${scale})`,
              zIndex: zIndex,
              opacity: opacity,
              background: isActive
                ? `linear-gradient(to right, ${customColor}, #000b1e)`
                : "rgba(189, 185, 185, 0.3)",
            }}
          >
            {isActive ? (
              <div className="flex items-center px-4 gap-3">
                {/* Icon */}
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#003366"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18" />
                  </svg>
                </div>
                {/* Text */}
                <div className="flex flex-col text-white">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 mb-0.5">
                    {t.preview.hereWeGo.promoLabel} {i + 1}
                  </span>
                  <span className="text-[10px] text-blue-200">
                    {t.preview.hereWeGo.promoTagline}
                  </span>
                  <span className="text-sm font-bold leading-tight">
                    {t.preview.hereWeGo.promoTitle}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "flex items-center justify-center h-full transition-transform duration-300",
                  offset < 0 ? "-translate-y-4" : "translate-y-4",
                )}
              >
                <span className="text-white/60 font-bold text-xs tracking-widest uppercase">
                  {t.preview.hereWeGo.promoLabel} {i + 1}
                </span>
              </div>
            )}
          </div>,
        );
      }
      return cards;
    };

    return (
      <div className="flex flex-col h-full bg-white text-dark relative overflow-hidden font-sans">
        <Header showBack={true} />

        {/* Gradient Layer */}
        <div className="absolute top-[30%] left-0 right-0 bottom-0 pointer-events-none z-0">
          <div
            className="relative z-10 w-full h-full overflow-hidden rounded-2xl p-5 backdrop-blur-sm flex flex-col pt-4"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 20%, rgba(255,255,255,0.9) 45%, #ffffff 60%)",
            }}
          />
        </div>

        {/* Main Content Flex Container */}
        <div className="flex-1 flex flex-col items-center relative z-10 min-h-0 pt-4">
          {/* Animation - Flexible */}
          <div className="relative w-64 h-64 flex items-center justify-center shrink min-h-[120px] -mb-16 z-0">
            <AnimatedGraphic />
          </div>

          <div className="absolute top-[30%] left-0 right-0 bottom-0 pointer-events-none z-0">
            <div
              className="relative z-10 w-full h-full overflow-hidden rounded-2xl p-5 backdrop-blur-sm flex flex-col pt-4"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 20%, rgba(255,255,255,0.9) 45%, #ffffff 60%)",
              }}
            />
          </div>

          {/* Text and Carousel */}
          <div className="flex-1 w-full flex flex-col items-center justify-center z-20 px-6 pb-4">
            <h2 className="text-2xl mb-0 text-[#003366] text-center mt-4">
              <span className="font-light">
                {t.preview.hereWeGo.titleLight}
              </span>{" "}
              <span className="font-bold">{t.preview.hereWeGo.titleBold}</span>
            </h2>
            <p className="text-gray-400 text-xs text-center mb-6">
              {t.preview.hereWeGo.subtitle}
            </p>

            {/* Carousel Container */}
            <div className="relative w-full flex-1 min-h-[220px] flex items-center justify-center perspective-[1000px]">
              {renderStackCards()}
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 pt-4 shrink-0 z-30">
          <ContinueButton />
        </div>
      </div>
    );
  };

  // Step 9: Configure Promo (Previously Step 7)
  // Step 9: Configure Promo (Previously Step 7)
  const renderStep9 = () => (
    <div className="flex flex-col h-full bg-white text-dark relative overflow-hidden font-sans">
      <BackgroundGradient />
      <Header showBack={true} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-2 pb-6 z-10 min-h-0">
        {/* Main Card Container */}
        <div
          className="w-full relative flex flex-col rounded-[2.5rem] px-5 py-8 overflow-hidden max-h-full"
          style={{
            backgroundColor: "#f8f9fc",
          }}
        >
          {/* Content Scrollable */}
          <div
            className="flex-1 overflow-y-auto flex flex-col [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Title Section */}
            <div className="text-center mb-6 shrink-0">
              <h2 className="text-xl text-[#003366] mb-1">
                {t.preview.configurePromo.titleLight}{" "}
                <span className="font-bold">
                  {t.preview.configurePromo.titleBold}
                </span>
              </h2>
              <p className="text-gray-400 text-[11px] leading-tight">
                {t.preview.configurePromo.subtitle}
              </p>
            </div>

            {/* Promo Preview Card */}
            <div
              className="w-full rounded-[1.5rem] p-5 flex items-center justify-center gap-4 mb-6 shadow-md relative overflow-hidden shrink-0"
              style={{
                background: `linear-gradient(to right, ${customColor}, #000b1e)`,
              }}
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#003366"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gray-300 text-[10px] uppercase mb-0.5">
                  {t.preview.hereWeGo.promoTagline}
                </p>
                <p className="text-white text-xs font-bold leading-tight">
                  {t.preview.hereWeGo.promoTitle}
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-5">
              <div>
                <label className="text-gray-500 text-[10px] font-bold ml-1 mb-2 block text-left">
                  {t.preview.configurePromo.startDate}
                </label>
                <div className="flex gap-2">
                  {[
                    { key: "day", value: startParts.dd || t.preview.configurePromo.day },
                    { key: "month", value: startParts.mm || t.preview.configurePromo.month },
                    { key: "year", value: startParts.yyyy || t.preview.configurePromo.year },
                  ].map(({ key, value }) => (
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDatePicker(startDateInputRef)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openDatePicker(startDateInputRef);
                      }}
                      className="flex-1 bg-gray-200/80 rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-300/80 transition-colors"
                    >
                      <span className="text-xs text-gray-500">{value}</span>
                      <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 1L5 5L9 1" />
                      </svg>
                    </div>
                  ))}
                </div>
                {showHourField && (
                  <div className="flex mt-2">
                    <div className="w-1/3 pr-1">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => openDatePicker(startDateInputRef)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") openDatePicker(startDateInputRef);
                        }}
                        className="bg-gray-200/80 rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-300/80 transition-colors"
                      >
                        <span className="text-xs text-gray-500">
                          {startParts.hour || t.preview.configurePromo.hour}
                        </span>
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          fill="none"
                          stroke="#6b7280"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 1L5 5L9 1" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={startDateInputRef}
                  type={showHourField ? "datetime-local" : "date"}
                  value={promoStartDate}
                  onChange={(e) => setPromoStartDate(e.target.value)}
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                  aria-hidden="true"
                  tabIndex={-1}
                />
              </div>

              <div>
                <label className="text-gray-500 text-[10px] font-bold ml-1 mb-2 block text-left">
                  {t.preview.configurePromo.endDate}
                </label>
                <div className="flex gap-2">
                  {[
                    { key: "day", value: endParts.dd || t.preview.configurePromo.day },
                    { key: "month", value: endParts.mm || t.preview.configurePromo.month },
                    { key: "year", value: endParts.yyyy || t.preview.configurePromo.year },
                  ].map(({ key, value }) => (
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDatePicker(endDateInputRef)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openDatePicker(endDateInputRef);
                      }}
                      className="flex-1 bg-gray-200/80 rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-300/80 transition-colors"
                    >
                      <span className="text-xs text-gray-500">{value}</span>
                      <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 1L5 5L9 1" />
                      </svg>
                    </div>
                  ))}
                </div>
                {showHourField && (
                  <div className="flex mt-2">
                    <div className="w-1/3 pr-1">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => openDatePicker(endDateInputRef)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") openDatePicker(endDateInputRef);
                        }}
                        className="bg-gray-200/80 rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-300/80 transition-colors"
                      >
                        <span className="text-xs text-gray-500">
                          {endParts.hour || t.preview.configurePromo.hour}
                        </span>
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          fill="none"
                          stroke="#6b7280"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 1L5 5L9 1" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={endDateInputRef}
                  type={showHourField ? "datetime-local" : "date"}
                  value={promoEndDate}
                  onChange={(e) => setPromoEndDate(e.target.value)}
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                  aria-hidden="true"
                  tabIndex={-1}
                />
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-6 shrink-0">
            <button
              onClick={nextStep}
              className="group relative w-full text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-between px-6 shadow-lg overflow-hidden transition-all active:scale-[0.98]"
              style={{
                background: `linear-gradient(to right, ${customColor} 0%, ${darkenColor(customColor, 30)} 40%, ${darkenColor(customColor, 80)} 70%, ${darkenColor(customColor, 100)} 100%)`,
                boxShadow: `0 4px 14px 0 ${customColor}40`,
                animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
              }}
            >
              {/* Resplandor animado alrededor del botón */}
              <span 
                className="absolute inset-0 rounded-2xl opacity-60 blur-md -z-10"
                style={{
                  background: customColor,
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
                className="absolute inset-0 rounded-2xl -z-10"
                style={{
                  background: `radial-gradient(circle at center, ${customColor}20 0%, transparent 70%)`,
                  animation: 'cta-glow-pulse 2s ease-in-out infinite',
                }}
              ></span>
              
              <div className="flex-1 flex items-center justify-center relative z-10" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                <span>{t.preview.configurePromo.launchIt}</span>
              </div>
              <span className="absolute right-6 z-10 transition-transform group-hover:translate-x-1" style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}>
                &gt;
              </span>
              
              {/* Efecto de brillo al hacer hover */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 10: Launching (Previously Step 8)
  const renderStep10 = () => {
    const renderContent = (isOverlay: boolean) => (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center w-full">
        <h2
          className={`text-2xl font-bold mb-2 ${
            isOverlay ? "text-white" : "text-[#003366]"
          }`}
        >
          {t.preview.launching.title}
        </h2>
        <p
          className={`text-xs ${isOverlay ? "text-white/80" : "text-gray-400"}`}
        >
          {t.preview.launching.subtitle}
        </p>
        <div
          className={`w-64 h-2 rounded-full mt-8 overflow-hidden ${
            isOverlay ? "bg-white/20" : "bg-gray-200"
          }`}
        >
          {/* Overlay layer has full white bar that gets revealed */}
          {isOverlay && <div className="h-full w-full bg-white" />}
        </div>
      </div>
    );

    return (
      <div className="relative h-full w-full bg-white font-sans flex flex-col">
        <Header showBack={true} />
        <div className="flex-1 px-6 pb-6 pt-2 flex flex-col items-center justify-center min-h-0">
          {/* Card Container */}
          <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-xl bg-[#001a33]">
            {/* Base Layer */}
            <div className="absolute inset-0 z-10">{renderContent(false)}</div>

            {/* Overlay Layer (Clipped) */}
            <div
              className="absolute inset-0 z-20 overflow-hidden"
              style={{
                clipPath: `inset(0 ${100 - loadingProgress}% 0 0)`,
                transition: "clip-path 3s linear",
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(to right, ${customColor} 0%, #000b1e 100%)`,
                }}
              >
                {renderContent(true)}
              </div>
            </div>

            {/* Flush Edge Effect */}
            <div
              className="absolute top-0 bottom-0 w-20 z-20 pointer-events-none"
              style={{
                left: `${loadingProgress}%`,
                background:
                  "linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent)",
                transform: "translateX(-50%)",
                transition: "left 3s linear",
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Step 11: Success (Previously Step 9)
  const renderStep11 = () => (
    <div className="flex flex-col h-full bg-white text-dark relative overflow-hidden font-sans">
      <Header showBack={true} />
      <div className="flex-1 px-6 pb-6 pt-2 flex flex-col items-center justify-center min-h-0">
        <div
          className="w-full h-full rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center shadow-xl"
          style={{
            background: `linear-gradient(to bottom, ${customColor}, #000b1e)`,
          }}
        >
          <div className="mb-6">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t.preview.success.title}
          </h2>
          <p className="text-gray-300 text-xs">{t.preview.success.subtitle}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-stroke bg-white p-4 shadow-sm dark:border-dark-3 dark:bg-dark-2">
      {/* Encabezado del Preview */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark dark:text-white">
          {t.preview.previewHeader.title}
        </h3>
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1 dark:bg-dark-3">
          <button
            onClick={() => viewMode !== "mobile" && toggleViewMode()}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              viewMode === "mobile"
                ? "bg-white text-dark shadow-sm dark:bg-dark-2 dark:text-white"
                : "text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white",
            )}
          >
            <MobileIcon />
            <span>{t.preview.previewHeader.mobile}</span>
          </button>
          <button
            onClick={() => viewMode !== "web" && toggleViewMode()}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              viewMode === "web"
                ? "bg-white text-dark shadow-sm dark:bg-dark-2 dark:text-white"
                : "text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white",
            )}
          >
            <WebIcon />
            <span>{t.preview.previewHeader.web}</span>
          </button>
        </div>
      </div>

      {/* Área del dispositivo */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden bg-gray-50 py-8 dark:bg-dark-3/50 rounded-xl"
        data-tour-id="tour-discounts-preview"
      >
        <div
          className={cn(
            "relative mx-auto transition-all duration-500 ease-in-out",
            viewMode === "mobile" ? "w-[340px]" : "w-full max-w-4xl px-4",
          )}
        >
          {viewMode === "mobile" ? (
            /* Marco de iPhone */
            <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[3rem] border-[8px] border-dark-2 bg-white shadow-2xl dark:border-dark-3">
              <div className="absolute left-1/2 top-0 z-50 h-7 w-32 -translate-x-1/2 rounded-b-xl bg-black"></div>
              <div className="absolute left-0 top-2 z-40 flex w-full justify-between px-6 text-[17px] font-medium text-black">
                <span>9:41</span>
                <span />
              </div>

              {/* Contenido de la Pantalla */}
              <div
                className="h-full w-full overflow-hidden bg-white pt-8 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
                {step === 6 && renderStep6()}
                {step === 7 && renderStep7()}
                {step === 8 && renderStep8()}
                {step === 9 && renderStep9()}
                {step === 10 && renderStep10()}
                {step === 11 && renderStep11()}
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-1 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-black/20 z-50"></div>
            </div>
          ) : (
            /* Marco de Web Browser */
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-dark-3 dark:bg-dark-2">
              <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-dark-3 dark:bg-dark-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-green-400"></div>
                <div className="ml-2 flex-1 rounded-md bg-white px-2 py-0.5 text-xs text-gray-400 shadow-sm dark:bg-dark-2">
                  zelify.com/plans
                </div>
              </div>
              <div className="h-full w-full overflow-auto bg-white p-8">
                <div className="max-w-sm mx-auto border rounded-xl shadow-lg overflow-hidden h-[600px] relative">
                  {step === 1 && renderStep1()}
                  {step === 2 && renderStep2()}
                  {step === 3 && renderStep3()}
                  {step === 4 && renderStep4()}
                  {step === 5 && renderStep5()}
                  {step === 6 && renderStep6()}
                  {step === 7 && renderStep7()}
                  {step === 8 && renderStep8()}
                  {step === 9 && renderStep9()}
                  {step === 10 && renderStep10()}
                  {step === 11 && renderStep11()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
