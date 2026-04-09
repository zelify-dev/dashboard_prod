"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { createContext, useContext, useEffect, useState } from "react";

type SidebarState = "expanded" | "collapsed";

type SidebarContextType = {
  state: SidebarState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  toggleCollapse: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // Escuchar cambios de persistencia
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored === "true") setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);

  function toggleSidebar() {
    setIsOpen((prev) => !prev);
  }

  function toggleCollapse() {
    setIsCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("sidebar-collapsed", String(newVal));
      return newVal;
    });
  }

  return (
    <SidebarContext.Provider
      value={{
        state: isMobile ? (isOpen ? "expanded" : "collapsed") : (isCollapsed ? "collapsed" : "expanded"),
        isOpen,
        setIsOpen,
        isCollapsed,
        setIsCollapsed,
        isMobile,
        toggleSidebar,
        toggleCollapse,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
