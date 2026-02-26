"use client";

import { useRef, useEffect, useState } from "react";



export type OTPStatus = 'idle' | 'verifying' | 'success' | 'error';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  themeColor?: string;
  status?: OTPStatus;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  placeholder = "0",
  className = "",
  themeColor,
  status = 'idle',
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState<string[]>(() =>
    value.split("").slice(0, length).concat(Array(length - value.length).fill(""))
  );

  // State to trigger the checkmark appearance after collapse
  const [showCheckmark, setShowCheckmark] = useState(false);


  useEffect(() => {
    if (status === 'success' || status === 'error') {
      // Wait for collapse animation (1000ms) then show result (check or X)
      const timer = setTimeout(() => {
        setShowCheckmark(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowCheckmark(false);
    }
  }, [status]);

  useEffect(() => {
    const newOtp = value.split("").slice(0, length).concat(Array(Math.max(0, length - value.length)).fill(""));
    setOtp(newOtp);

    const allFilled = newOtp.every((val) => val && val.trim() !== "");
    if (allFilled && status === 'idle' && themeColor) {
      inputRefs.current.forEach((input) => {
        if (input) {
          input.style.borderColor = '';
          input.style.boxShadow = '';
          input.style.color = '';
        }
      });
    }
  }, [value, length, status, themeColor]);

  const handleChange = (index: number, newValue: string) => {
    if (disabled || status !== 'idle') return;

    // Solo permitir números
    const numericValue = newValue.replace(/[^0-9]/g, "");
    if (numericValue.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    const otpString = newOtp.join("");
    onChange(otpString);

    // Mover al siguiente input si hay un valor
    if (numericValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Llamar onComplete si todos los campos están llenos
    if (otpString.length === length && onComplete) {
      onComplete(otpString);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (status !== 'idle') return;
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (status !== 'idle') {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length && i < length; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);
    const otpString = newOtp.join("");
    onChange(otpString);

    if (otpString.length === length && onComplete) {
      onComplete(otpString);
    }

    // Enfocar el siguiente input disponible
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <>
      {/* Estilos para la animación del haz de luz que recorre el borde progresivamente */}
      <style jsx global>{`
        @keyframes borderDash {
          0% {
            stroke-dashoffset: 140;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes drawCheck {
            0% { 
              stroke-dashoffset: 100;
              opacity: 0; 
            }
            100% { 
              stroke-dashoffset: 0;
              opacity: 1; 
            }
        }
        @keyframes drawX {
            0% { opacity: 0; transform: scale(0.5); }
            100% { opacity: 1; transform: scale(1); }
        }
        .otp-check-animate {
            animation: drawCheck 0.5s ease-out forwards;
        }
        .otp-error-animate {
            animation: drawX 0.4s ease-out forwards;
        }

      `}</style>
      <div className={`flex gap-1.5 justify-center ${className} relative h-10`}>
        {/* Usamos h-10 para mantener la altura durante el colapso absoluto si fuera necesario,
            pero aquí usamos transform, así que el contenedor sigue ocupando espacio. */}

        {Array.from({ length }).map((_, index) => {
          const hasValue = otp[index] && otp[index].trim() !== "";
          const allFieldsFilled = otp.every((val) => val && val.trim() !== "");
          // Solo aplicar el tema cuando hay valor PERO no cuando todos los campos están llenos (estado normal)
          // O cuando está en animación
          const shouldApplyTheme = hasValue && themeColor && !allFieldsFilled && status === 'idle';

          // Cálculo para centrar en estado success
          // width (40) + gap (6) = 46
          const itemWidthWithGap = 46;
          const centerIndex = (length - 1) / 2;

          // Lógica de "Card Stack Centrada":
          const translateX = (status === 'success' || status === 'error') ? (centerIndex - index) * itemWidthWithGap : 0;
          const isCollapsed = status === 'success' || status === 'error';

          return (
            <div
              key={index}
              className={`relative rounded-xl`}
              style={{
                width: '40px',
                height: '40px',
                transition: `transform 1s cubic-bezier(0.2, 0, 0, 1) ${index * 120}ms, opacity 0.5s ease-out ${index * 120 + 600}ms`, // Transición siempre activa para garantizar el efecto en reintentos
                transform: `translateX(${translateX}px) scale(${isCollapsed ? 1 : 1})`,
                zIndex: isCollapsed ? (length - index + 10) : 0, // El primero (0) tiene el z-index más alto
                opacity: isCollapsed && index !== 0 ? 0 : 1, // Solo el primero se mantiene visible
                boxShadow: status === 'success' && index === 0
                  ? `0 0 15px ${themeColor}, 0 0 30px ${themeColor}66`
                  : (status === 'error' && index === 0 ? `0 0 15px #EF4444, 0 0 30px #EF444466` : 'none'),
              }}
            >
              {(status === 'verifying' || isCollapsed) && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    zIndex: 1,
                  }}
                  width="40"
                  height="40"
                >
                  <rect
                    x="1"
                    y="1"
                    width="38"
                    height="38"
                    rx="8"
                    fill="none"
                    stroke={status === 'error' ? '#EF4444' : (themeColor || '#004492')}
                    strokeWidth="2"
                    strokeDasharray="140"
                    strokeDashoffset={isCollapsed ? 0 : 140} // Si collapsed (success/error), lleno. Si verifying, animando.
                    strokeLinecap="round"
                    style={{
                      animation: status === 'verifying' ? `borderDash 0.8s linear forwards` : 'none',
                      transition: 'stroke 0.3s ease'
                    }}
                  />
                </svg>
              )}

              {/* Checkmark overlay that appears inside the merged box */}
              {status === 'success' && showCheckmark && index === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={themeColor || '#004492'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path
                      d="M20 6L9 17L4 12"
                      className="otp-check-animate"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                      style={{
                        animation: 'drawCheck 0.5s ease-out forwards',
                      }}
                    />
                  </svg>
                </div>
              )}

              {/* Error X overlay */}
              {status === 'error' && showCheckmark && index === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="otp-error-animate">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
              )}

              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[index] || ""}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={disabled || status !== 'idle'}
                placeholder={
                  isCollapsed
                    ? ""
                    : placeholder.length > 1
                      ? (placeholder[index] ?? "")
                      : placeholder
                }
                className={`h-10 w-10 text-center text-base font-semibold rounded-lg border-2 border-[#D2D8E0] bg-gray-2 outline-none transition-all focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-2 relative`}
                style={{
                  borderColor: (status === 'verifying' || isCollapsed) && themeColor ? 'transparent' : (shouldApplyTheme ? themeColor : undefined),
                  color: (status === 'verifying' || isCollapsed) ? (status === 'error' ? '#EF4444' : themeColor) : (shouldApplyTheme ? themeColor : (hasValue ? undefined : undefined)),
                  boxShadow: (status === 'verifying' || isCollapsed) ? 'none' : (shouldApplyTheme ? `0 0 0 2px ${themeColor}33` : undefined),
                  opacity: isCollapsed && showCheckmark ? 0 : (isCollapsed ? 0.3 : 1), // Fade out text on success/error
                } as React.CSSProperties}
                onFocus={(e) => {
                  if (status !== 'idle') return;
                  const allFilled = otp.every((val) => val && val.trim() !== "");
                  // Si todos los campos están llenos, remover el estilo activo de todos los inputs
                  if (themeColor && !allFilled) {
                    e.currentTarget.style.borderColor = themeColor;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${themeColor}33`;
                    if (hasValue) e.currentTarget.style.color = themeColor;
                  }
                }}
                onBlur={(e) => {
                  const allFilled = otp.every((val) => val && val.trim() !== "");
                  // Si todos los campos están llenos, volver a estado normal (sin color del tema)
                  if (allFilled || status !== 'idle') {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.color = '';
                  } else if (hasValue && themeColor) {
                    // Mantener el color del tema si hay un valor pero no todos están llenos
                    e.currentTarget.style.borderColor = themeColor;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${themeColor}33`;
                    e.currentTarget.style.color = themeColor;
                  } else if (!hasValue) {
                    // Solo resetear si está vacío
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.color = '';
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
