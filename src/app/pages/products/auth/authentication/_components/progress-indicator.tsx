"use client";

interface ProgressIndicatorProps {
  current: number;
  total: number;
  className?: string;
  onStepClick?: (step: number) => void;
  themeColor?: string; // Color del tema personalizado
}

export function ProgressIndicator({ current, total, className = "", onStepClick, themeColor }: ProgressIndicatorProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber <= current;
        const isClickable = onStepClick !== undefined;
        
        return (
          <div
            key={index}
            onClick={() => isClickable && onStepClick?.(stepNumber)}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              isCompleted
                ? ""
                : "bg-gray-400 dark:bg-gray-500"
            } ${
              isClickable
                ? "cursor-pointer hover:opacity-80 active:scale-95"
                : ""
            }`}
            style={isCompleted ? { backgroundColor: themeColor || "#004492" } : undefined}
            title={isClickable ? `Ir al paso ${stepNumber}` : undefined}
          />
        );
      })}
    </div>
  );
}





