"use client";

import { useEffect, useState } from "react";

interface SuccessAnimationProps {
  onComplete?: () => void;
  className?: string;
  relative?: boolean; // Si es true, usa posición relativa en lugar de fixed
  small?: boolean; // Si es true, usa un tamaño más pequeño
}

export function SuccessAnimation({ onComplete, className = "", relative = false, small = false }: SuccessAnimationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const styleId = "success-animation-styles";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes drawCheck {
          0% {
            stroke-dasharray: 0, 100;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dasharray: 100, 0;
            opacity: 1;
          }
        }
        .animate-draw-check {
          animation: drawCheck 0.6s ease-out forwards;
          stroke-dasharray: 0, 100;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onComplete) {
        setTimeout(onComplete, 300);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  const containerClass = relative
    ? `absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-[2.5rem] ${className}`
    : `fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`;

  const circleSize = small ? "h-12 w-12" : "h-20 w-20";
  const circleSize2 = small ? "h-10 w-10" : "h-16 w-16";
  const checkmarkSize = small ? "h-16 w-16" : "h-24 w-24";
  const iconSize = small ? "h-8 w-8" : "h-12 w-12";

  return (
    <div className={containerClass}>
      <div className="relative">
        {/* Círculos animados */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`absolute ${circleSize} animate-ping rounded-full bg-green-500 opacity-75`}></div>
          <div className={`absolute ${circleSize2} animate-ping rounded-full bg-green-500 opacity-50`} style={{ animationDelay: "200ms" }}></div>
        </div>

        {/* Checkmark */}
        <div className={`relative flex ${checkmarkSize} items-center justify-center rounded-full bg-green-500`}>
          <svg
            className={`${iconSize} text-white`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              className="animate-draw-check"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

