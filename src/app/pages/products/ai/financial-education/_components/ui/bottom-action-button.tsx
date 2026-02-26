"use client";

import { useCTAButtonAnimations } from "@/hooks/use-cta-button-animations";

interface BottomActionButtonProps {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export function BottomActionButton({
  label,
  onClick,
  icon,
}: BottomActionButtonProps) {
  const themeColor = "#004492";
  useCTAButtonAnimations(themeColor);
  
  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-xl px-4 py-3.5 text-xs font-medium text-white transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1 overflow-hidden"
      style={{
        background: "linear-gradient(to right, #004492 0%, #003366 40%, #001122 70%, #000000 100%)",
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
      
      <span className="relative z-10 flex flex-col items-center justify-center gap-1" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
        {icon || (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-0.5"
            style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        )}
        {label}
      </span>
      
      {/* Efecto de brillo al hacer hover */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
    </button>
  );
}
