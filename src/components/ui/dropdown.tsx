"use client";

import { createPortal } from "react-dom";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";
import { SetStateActionType } from "@/types/set-state-action-type";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type DropdownContextType = {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdownContext must be used within a Dropdown");
  }
  return context;
}

type DropdownProps = {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: SetStateActionType<boolean>;
};

export function Dropdown({ children, isOpen, setIsOpen }: DropdownProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    } else {
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  function handleClose() {
    setIsOpen(false);
  }

  function handleOpen() {
    setIsOpen(true);
  }

  return (
    <DropdownContext.Provider value={{ isOpen, handleOpen, handleClose, containerRef }}>
      <div ref={containerRef} className="relative inline-block" onKeyDown={handleKeyDown}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

type DropdownContentProps = {
  align?: "start" | "end" | "center";
  className?: string;
  children: React.ReactNode;
};

export function DropdownContent({
  children,
  align = "center",
  className,
}: DropdownContentProps) {
  const { isOpen, handleClose, containerRef } = useDropdownContext();
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const contentRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) handleClose();
  });

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const menuElement = contentRef.current;
    const menuHeight = menuElement?.offsetHeight || 280;
    const menuWidth = menuElement?.offsetWidth || 200;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < menuHeight && rect.top > menuHeight;

    let top = openUpwards ? rect.top - menuHeight - 8 : rect.bottom + 8;
    // Asegurar que no se salga del tope de la pantalla
    if (top < 12) top = 12;

    let left = rect.left;
    if (align === "end") {
      left = rect.right - menuWidth;
    } else if (align === "center") {
      left = rect.left + rect.width / 2 - menuWidth / 2;
    }

    // Ajustar límites de pantalla horizontales
    left = Math.max(12, Math.min(left, window.innerWidth - menuWidth - 12));

    setCoords({ top, left });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    // Recalcular posición después de un frame para tener la altura real cargada
    const frameId = requestAnimationFrame(updatePosition);

    const handleScrollOrResize = () => updatePosition();
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const contentMarkup = (
    <div
      ref={contentRef}
      role="menu"
      aria-orientation="vertical"
      style={coords ? { top: `${coords.top}px`, left: `${coords.left}px` } : { visibility: "hidden" }}
      className={cn(
        "fixed z-[99999] pointer-events-auto rounded-2xl shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95",
        className,
      )}
    >
      {children}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(contentMarkup, document.body);
  }

  return null;
}

type DropdownTriggerProps = React.HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function DropdownTrigger({ children, className }: DropdownTriggerProps) {
  const { handleOpen, isOpen } = useDropdownContext();

  return (
    <button
      className={className}
      onClick={handleOpen}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      data-state={isOpen ? "open" : "closed"}
    >
      {children}
    </button>
  );
}

export function DropdownClose({ children }: PropsWithChildren) {
  const { handleClose } = useDropdownContext();

  return <div onClick={handleClose}>{children}</div>;
}
