"use client";

import React, { useEffect } from "react";

/**
 * Hook para inyectar animaciones de call-to-action en botones
 * Las animaciones se aplican globalmente y se pueden usar en cualquier botón
 */
export function useCTAButtonAnimations(themeColor: string = "#3b82f6") {
  useEffect(() => {
    const styleId = "cta-button-animations";
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
        @keyframes cta-pulse-glow {
          0%, 100% {
            box-shadow: 0 4px 14px 0 rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4);
          }
          50% {
            box-shadow: 0 4px 20px 0 rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8), 0 0 30px 0 rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4);
          }
        }
        @keyframes cta-pulse-ring {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        @keyframes cta-shine-sweep {
          0% {
            transform: translateX(-100%) skewX(-15deg);
          }
          100% {
            transform: translateX(200%) skewX(-15deg);
          }
        }
        @keyframes cta-bounce-arrow {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }
        @keyframes cta-button-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        @keyframes cta-glow-pulse {
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
}

/**
 * Props para el componente de botón con animaciones CTA
 */
export interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  themeColor?: string;
  darkThemeColor?: string;
  almostBlackColor?: string;
  blackColor?: string;
  children: React.ReactNode;
}

/**
 * Componente de botón con animaciones de call-to-action
 */
export function CTAButton({
  themeColor = "#3b82f6",
  darkThemeColor,
  almostBlackColor,
  blackColor = "#000000",
  children,
  className = "",
  style = {},
  disabled,
  ...props
}: CTAButtonProps) {
  useCTAButtonAnimations(themeColor);
  
  // Calcular colores si no se proporcionan
  const getDarkColor = (color: string) => {
    if (darkThemeColor) return darkThemeColor;
    // Convertir hex a RGB y oscurecer
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
  };
  
  const getAlmostBlack = (color: string) => {
    if (almostBlackColor) return almostBlackColor;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgb(${Math.max(0, Math.floor(r * 0.1))}, ${Math.max(0, Math.floor(g * 0.1))}, ${Math.max(0, Math.floor(b * 0.1))})`;
  };
  
  const finalDarkColor = getDarkColor(themeColor);
  const finalAlmostBlack = getAlmostBlack(themeColor);
  
  return (
    <button
      className={`group relative overflow-hidden rounded-xl border px-4 py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] ${className}`}
      style={{
        background: disabled 
          ? '#9BA2AF' 
          : `linear-gradient(to right, ${themeColor} 0%, ${finalDarkColor} 40%, ${finalAlmostBlack} 70%, ${blackColor} 100%)`,
        borderColor: disabled ? '#9BA2AF' : themeColor,
        boxShadow: disabled ? 'none' : `0 4px 14px 0 ${themeColor}40`,
        animation: disabled ? 'none' : 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      disabled={disabled}
      {...props}
    >
      {/* Resplandor animado alrededor del botón */}
      {!disabled && (
        <>
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
      
      <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: disabled ? 'none' : 'cta-glow-pulse 2s ease-in-out infinite' }}>
        {children}
      </span>
      
      {/* Efecto de brillo al hacer hover */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
    </button>
  );
}
