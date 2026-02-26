"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div 
      className={`rounded-2xl bg-gray-50 p-4 dark:bg-gray-800 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
