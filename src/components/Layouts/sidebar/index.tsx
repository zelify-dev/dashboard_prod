"use client";

import type React from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ZENDESK_SUPPORT_MENU_HREF, openZendeskWidget } from "@/lib/zendesk-widget";
import { getNavData } from "./data";
import { ArrowLeftIcon, ChevronUp, Lock } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { useTour } from "@/contexts/tour-context";
import {
  getStoredRoles,
  getStoredOrganizationScopes,
  getStoredOrganization,
  getOrganizationScopes,
  setStoredOrganizationScopes,
} from "@/lib/auth-api";
import { isOwner, userHasRole, TEAM_ROLE } from "@/app/organization/teams/_constants/team-roles";

/** Tipo mínimo para ítems del menú (getNavData devuelve items: unknown[]). */
interface NavSubItem {
  title?: string;
  url?: string;
  items?: NavSubItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const isOnboardingEnabled = true;
  const { setIsOpen, isOpen, isMobile, toggleSidebar, isCollapsed, toggleCollapse } = useSidebarContext();
  const translations = useUiTranslations();
  const { isTourActive, currentStep, steps } = useTour();

  const [organizationScopes, setOrganizationScopes] = useState<string[] | null>(() =>
    getStoredOrganizationScopes()
  );

  // Escuchar cuando otro componente (ej. panel-dashboard) carga scopes
  useEffect(() => {
    const handler = (e: CustomEvent<string[]>) => {
      setOrganizationScopes(e.detail ?? []);
    };
    window.addEventListener("organizationScopesUpdated", handler as EventListener);
    return () => window.removeEventListener("organizationScopesUpdated", handler as EventListener);
  }, []);

  // Cargar scopes al montar (por si no estamos en la home y panel-dashboard no corre)
  useEffect(() => {
    const org = getStoredOrganization();
    console.log("[Sidebar] useEffect scopes — org en storage:", org ? { id: org.id, name: org.name } : null);
    if (!org?.id) {
      console.log("[Sidebar] No hay organización (org?.id). No se llama a GET /api/organizations/:id/scopes.");
      return;
    }
    const url = `/api/organizations/${org.id}/scopes`;
    console.log("[Sidebar] Llamando a GET", url, "…");
    getOrganizationScopes(org.id)
      .then((items) => {
        const scopeStrings = items.map((s) => s.scope);
        setStoredOrganizationScopes(scopeStrings);
        setOrganizationScopes(scopeStrings);
        console.log("[Sidebar] GET scopes OK:", scopeStrings.length, "scopes", scopeStrings);
      })
      .catch((err) => {
        console.warn("[Sidebar] Error al cargar scopes:", err);
        setStoredOrganizationScopes([]);
        setOrganizationScopes([]);
      });
  }, []);

  // Determinar si el sidebar es el target del paso actual
  const isSidebarTarget =
    isTourActive &&
    steps.length > 0 &&
    currentStep < steps.length &&
    (steps[currentStep]?.target === "tour-sidebar" ||
      steps[currentStep]?.target === "tour-products-section" ||
      steps[currentStep]?.target === "tour-product-auth" ||
      steps[currentStep]?.target === "tour-auth-authentication");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const roles = getStoredRoles();
  const isOwnerUser = isOwner(roles);
  const canSeeBranding =
    isOwnerUser ||
    userHasRole(roles, TEAM_ROLE.ORG_ADMIN) ||
    userHasRole(roles, TEAM_ROLE.ZELIFY_TEAM);
  const NAV_DATA = getNavData(translations, {
    isOwner: isOwnerUser,
    canSeeBranding,
    organizationScopes,
  });
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = (key: string) => {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  useEffect(() => {
    // Keep collapsible open, when it's subpage is active
    NAV_DATA.some((section) => {
      return section.items.some((item) => {
        const itemKey = `${section.label}-${item.title}`;
        return item.items.some((sub: unknown) => {
          const subItem = sub as NavSubItem;
          // Check if subItem has nested items
          if (subItem.items && subItem.items.length > 0) {
            const subItemKey = `${itemKey}-${subItem.title}`;
            return subItem.items.some((nested: unknown) => {
              const nestedItem = nested as NavSubItem;
              if (nestedItem.url && nestedItem.url === pathname) {
                if (!expandedItems.includes(itemKey)) {
                  setExpandedItems((prev) => [...prev, itemKey]);
                }
                if (!expandedItems.includes(subItemKey)) {
                  setExpandedItems((prev) => [...prev, subItemKey]);
                }
                return true;
              }
              return false;
            });
          }
          if (subItem.url && subItem.url === pathname) {
            if (!expandedItems.includes(itemKey)) {
              setExpandedItems((prev) => [...prev, itemKey]);
            }
            return true;
          }
          return false;
        });
      });
    });
  }, [pathname]);

  // Expandir automáticamente el dropdown cuando el tour está en ese paso
  useEffect(() => {
    if (isTourActive && steps.length > 0) {
      const currentStepData = steps[currentStep];
      if (currentStepData) {
        const target = currentStepData.target;
        const productTargets = [
          "tour-product-auth",
          "tour-device-information",
          "tour-product-aml",
          "tour-aml-validation-global-list",
          "tour-aml-validation-form",
          "tour-aml-validations-list",
          "tour-product-identity",
          "tour-identity-workflow",
          "tour-identity-workflow-config",
          "tour-identity-workflow-preview",
          "tour-product-connect",
          "tour-connect-bank-account-linking",
          "tour-connect-config",
          "tour-connect-preview",
          "tour-product-cards",
          "tour-cards-issuing-design",
          "tour-cards-design-editor",
          "tour-cards-preview",
          "tour-product-transfers",
          "tour-transfers-config",
          "tour-transfers-region-panel",
          "tour-transfers-preview",
          "tour-product-tx",
          "tour-tx-international-transfers",
          "tour-tx-config",
          "tour-tx-preview",
          "tour-product-ai",
          "tour-ai-alaiza",
          "tour-ai-alaiza-config",
          "tour-ai-alaiza-preview",
          "tour-ai-behavior-analysis",
          "tour-behavior-categories",
          "tour-behavior-branding",
          "tour-behavior-preview",
          "tour-ai-financial-education",
          "tour-financial-academy",
          "tour-financial-blogs",
          "tour-financial-preview",
          "tour-product-payments",
          "tour-payments-custom-keys",
          "tour-payments-qr",
          "tour-payments-preview",
          "tour-product-discounts",
          "tour-discounts-coupons",
          "tour-discounts-create",
          "tour-discounts-analytics",
        ];

        if (productTargets.includes(target)) {
          // Buscar el item correspondiente en los datos de navegación
          NAV_DATA.forEach((section) => {
            section.items.forEach((item) => {
              let shouldExpand = false;

              if (
                target === "tour-product-auth" ||
                target === "tour-device-information"
              ) {
                shouldExpand =
                  item.title === translations.sidebar.menuItems.auth;
              } else if (
                target === "tour-product-aml" ||
                target === "tour-aml-validation-global-list"
              ) {
                shouldExpand =
                  item.title === translations.sidebar.menuItems.aml;
              } else if (
                target === "tour-product-identity" ||
                target === "tour-identity-workflow"
              ) {
                shouldExpand =
                  item.title === translations.sidebar.menuItems.identity;
              } else if (
                target === "tour-product-connect" ||
                target === "tour-connect-bank-account-linking"
              ) {
                shouldExpand =
                  item.title === translations.sidebar.menuItems.connect;
              } else if (
                target === "tour-product-cards" ||
                target === "tour-cards-issuing-design" ||
                target === "tour-cards-design-editor" ||
                target === "tour-cards-preview" ||
                target === "tour-cards-transactions"
              ) {
                shouldExpand =
                  item.title === translations.sidebar.menuItems.cards;
              } else if (
                target === "tour-product-transfers" ||
                target === "tour-transfers-config"
              ) {
                shouldExpand =
                  item.title === translations.sidebar.menuItems.transfers;
              } else if (
                target === "tour-product-tx" ||
                target === "tour-tx-international-transfers"
              ) {
                shouldExpand = item.title === translations.sidebar.menuItems.tx;
              } else if (
                target === "tour-product-ai" ||
                target === "tour-ai-alaiza" ||
                target === "tour-ai-behavior-analysis" ||
                target === "tour-ai-financial-education"
              ) {
                shouldExpand = item.title === translations.sidebar.menuItems.ai;
              } else if (
                target === "tour-product-payments" ||
                target === "tour-payments-custom-keys" ||
                target === "tour-payments-qr"
              ) {
                shouldExpand =
                  item.title === translations.sidebar.menuItems.payments;
              } else if (
                target === "tour-product-discounts" ||
                target === "tour-discounts-list" ||
                target === "tour-discounts-coupons" ||
                target === "tour-discounts-create" ||
                target === "tour-discounts-analytics"
              ) {
                shouldExpand =
                  item.title ===
                  translations.sidebar.menuItems.discountsCoupons;
              }

              if (shouldExpand) {
                const itemKey = `${section.label}-${item.title}`;
                setExpandedItems((prev) => {
                  if (!prev.includes(itemKey)) {
                    return [...prev, itemKey];
                  }
                  return prev;
                });
              }
            });
          });
        }
      }
    }
  }, [isTourActive, currentStep, steps, translations, NAV_DATA]);

  // Scroll automático al elemento del sidebar cuando cambia el paso del tour
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isTourActive && steps.length > 0 && sidebarScrollRef.current) {
      const currentStepData = steps[currentStep];
      if (currentStepData) {
        const target = currentStepData.target;

        // Mapear targets del tour a data-tour-id del sidebar
        // Incluir todos los elementos que están en el sidebar (productos principales y sub-items)
        const sidebarTargets = [
          // Sección de productos
          "tour-products-section",
          // Productos principales
          "tour-product-auth",
          "tour-product-aml",
          "tour-product-identity",
          "tour-product-connect",
          "tour-product-cards",
          "tour-product-transfers",
          "tour-product-tx",
          "tour-product-ai",
          "tour-product-payments",
          "tour-product-discounts",
          // Sub-items de Auth
          "tour-auth-authentication",
          "tour-device-information",
          // Sub-items de AML
          "tour-aml-validation-global-list",
          "tour-aml-validations-list",
          "tour-aml-list-config",
          // Sub-items de Identity
          "tour-identity-workflow",
          "tour-identity-new-workflow-button",
          "tour-identity-workflow-config-country",
          "tour-identity-workflow-config-documents",
          // Sub-items de Connect
          "tour-connect-bank-account-linking",
          "tour-connect-config",
          "tour-connect-credentials",
          "tour-connect-wallet",
          // Sub-items de Cards
          "tour-cards-issuing-design",
          "tour-cards-config-branding",
          "tour-cards-create-design",
          "tour-cards-design-editor",
          "tour-cards-diligence",
          "tour-cards-diligence-create",
          "tour-cards-diligence-list",
          // Sub-items de Transfers
          "tour-transfers-config",
          "tour-transfers-branding",
          "tour-transfers-region-panel",
          // Sub-items de TX
          "tour-tx-international-transfers",
          "tour-tx-branding",
          "tour-tx-config",
          // Sub-items de AI
          "tour-ai-alaiza",
          "tour-ai-alaiza-config",
          "tour-ai-behavior-analysis",
          "tour-behavior-categories",
          "tour-behavior-branding",
          "tour-ai-financial-education",
          "tour-financial-academy",
          "tour-financial-blogs",
          // Sub-items de Payments
          "tour-payments-basic-services",
          "tour-payments-custom-keys",
          "tour-payments-custom-keys-config",
          "tour-payments-qr",
          "tour-payments-qr-config",
          // Sub-items de Discounts
          "tour-discounts-list",
          "tour-discounts-config-panel",
          "tour-discounts-coupons",
          "tour-discounts-create",
          "tour-discounts-coupon-detail",
          "tour-discounts-analytics",
        ];

        if (sidebarTargets.includes(target)) {
          // Esperar un poco para que el DOM se actualice (especialmente si se expandió un item)
          timeoutId = setTimeout(() => {
            const element = document.querySelector(
              `[data-tour-id="${target}"]`,
            ) as HTMLElement;
            if (element && sidebarScrollRef.current) {
              const scrollContainer = sidebarScrollRef.current;
              const containerRect = scrollContainer.getBoundingClientRect();
              const elementRect = element.getBoundingClientRect();

              // Verificar si el elemento está fuera de la vista o parcialmente visible
              const isAboveView = elementRect.top < containerRect.top;
              const isBelowView = elementRect.bottom > containerRect.bottom;
              const isPartiallyVisible =
                elementRect.top >= containerRect.top &&
                elementRect.bottom <= containerRect.bottom;

              // Si está fuera de la vista o solo parcialmente visible, hacer scroll
              if (isAboveView || isBelowView || !isPartiallyVisible) {
                // Calcular la posición relativa del elemento dentro del contenedor
                const relativeTop =
                  elementRect.top -
                  containerRect.top +
                  scrollContainer.scrollTop;
                const elementHeight = elementRect.height;
                const containerHeight = scrollContainer.clientHeight;

                // Centrar el elemento en la vista (con un pequeño offset para mejor visibilidad)
                const scrollTop =
                  relativeTop - containerHeight / 2 + elementHeight / 2 - 20;

                scrollContainer.scrollTo({
                  top: Math.max(
                    0,
                    Math.min(
                      scrollTop,
                      scrollContainer.scrollHeight - containerHeight,
                    ),
                  ),
                  behavior: "auto",
                });
              }
            }
          }, 350); // Delay para permitir que los items se expandan y el DOM se actualice
        }
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isTourActive, currentStep, steps, expandedItems]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        data-tour-id="tour-sidebar"
        className={cn(
          "overflow-hidden border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-dark",
          isMobile
            ? "fixed bottom-0 top-0 z-50"
            : cn("sticky top-0 h-screen", !isTourActive && "z-30"),
          isMobile 
            ? (isOpen ? "w-full" : "w-0") 
            : (isCollapsed ? "w-20" : "w-72"),
          isSidebarTarget ? "z-[102]" : isTourActive && !isMobile ? "z-0" : "",
        )}
        aria-label="Main navigation"
        aria-hidden={isMobile && !isOpen}
        inert={isMobile && !isOpen}
        style={{
          zIndex: isSidebarTarget
            ? 102
            : isTourActive && !isMobile
              ? 0
              : undefined,
        }}
      >
        <div className={cn(
          "flex h-full flex-col py-6 transition-all duration-300",
          isCollapsed && !isMobile ? "px-3" : "pl-[25px] pr-[7px]"
        )}>
          <div className={cn(
            "relative flex items-center pr-4.5",
            isCollapsed && !isMobile ? "justify-center pr-0" : "justify-between"
          )}>
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className={cn(
                "transition-all duration-300 flex items-center justify-center",
                isCollapsed && !isMobile ? "w-10 overflow-hidden" : "px-0 py-2.5 min-[850px]:py-0"
              )}
            >
              <Logo collapsed={isCollapsed && !isMobile} />
            </Link>

            {!isMobile && (
              <button
                onClick={toggleCollapse}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-stroke bg-white text-dark shadow-sm hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <svg
                  className={cn("h-4 w-4 transition-transform duration-300", isCollapsed ? "rotate-180" : "")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">
                  {translations.sidebar.closeMenu}
                </span>

                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div
            ref={sidebarScrollRef}
            className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10"
          >
            {NAV_DATA.map((section) => (
              <div
                key={section.label}
                className="mb-6"
                data-tour-id={
                  section.label === translations.sidebar.products
                    ? "tour-products-section"
                    : undefined
                }
              >
                {!isCollapsed || isMobile ? (
                  <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-dark-4 dark:text-dark-6">
                    {section.label}
                  </h2>
                ) : (
                  <div className="mb-5 h-px bg-stroke dark:bg-dark-3" />
                )}

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => {
                      const itemKey = `${section.label}-${item.title}`;
                      const IconComponent = item.icon as React.ComponentType<{
                        className?: string;
                        "aria-hidden"?: boolean | string;
                      }>;
                      const isItemExpanded = expandedItems.includes(itemKey);
                      const isItemActive =
                        ("url" in item && item.url === pathname) ||
                        item.items.some((sub: unknown) => {
                          const subItem = sub as NavSubItem;
                          if (subItem.url && subItem.url === pathname)
                            return true;
                          if (subItem.items) {
                            return subItem.items.some(
                              (nested: unknown) => (nested as NavSubItem).url === pathname,
                            );
                          }
                          return false;
                        });

                      return (
                        <li
                          key={item.title}
                          data-tour-id={
                            item.title === translations.sidebar.menuItems.auth
                              ? "tour-product-auth"
                              : item.title ===
                                  translations.sidebar.menuItems.aml
                                ? "tour-product-aml"
                                : item.title ===
                                    translations.sidebar.menuItems.identity
                                  ? "tour-product-identity"
                                  : item.title ===
                                      translations.sidebar.menuItems.connect
                                    ? "tour-product-connect"
                                    : item.title ===
                                        translations.sidebar.menuItems.cards
                                      ? "tour-product-cards"
                                      : item.title ===
                                          translations.sidebar.menuItems
                                            .transfers
                                        ? "tour-product-transfers"
                                        : item.title ===
                                            translations.sidebar.menuItems.tx
                                          ? "tour-product-tx"
                                          : item.title ===
                                              translations.sidebar.menuItems.ai
                                            ? "tour-product-ai"
                                            : item.title ===
                                                translations.sidebar.menuItems
                                                  .payments
                                              ? "tour-product-payments"
                                              : item.title ===
                                                  translations.sidebar.menuItems
                                                    .discountsCoupons
                                                ? "tour-product-discounts"
                                                : undefined
                          }
                        >
                          {item.items.length ? (
                            <div>
                              <MenuItem
                                isActive={isItemActive}
                                title={item.title}
                                onClick={() => isCollapsed ? toggleCollapse() : toggleExpanded(itemKey)}
                              >
                                {item.title.toUpperCase().includes("AI") || item.title.toUpperCase().includes("IA") ? (
                                  <img
                                    src="/images/iconAlaiza.svg"
                                    alt={item.title}
                                    className="size-6 shrink-0 rounded-full object-contain"
                                  />
                                ) : (
                                  <IconComponent
                                    className="size-6 shrink-0 text-blue-600 dark:text-blue-400"
                                    aria-hidden="true"
                                  />
                                )}

                                <span className={cn(
                                  "text-left flex-1 transition-opacity duration-300",
                                  isCollapsed && !isMobile ? "hidden" : "block"
                                )}>
                                  {item.title}
                                </span>

                                <ChevronUp
                                  className={cn(
                                    "ml-auto rotate-180 transition-all duration-200",
                                    isItemExpanded && "rotate-0",
                                    isCollapsed && !isMobile ? "hidden" : "block"
                                  )}
                                  aria-hidden="true"
                                />
                              </MenuItem>

                              {isItemExpanded && !isCollapsed && (
                                <ul
                                  className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                  role="menu"
                                >
                                  {item.items.map((sub: unknown) => {
                                    const subItem = sub as NavSubItem;
                                    const subItemKey = `${itemKey}-${subItem.title}`;
                                    const isSubItemExpanded =
                                      expandedItems.includes(subItemKey);
                                    const hasNestedItems =
                                      subItem.items &&
                                      subItem.items.length > 0;
                                    const isSubItemActive = hasNestedItems
                                      ? (subItem.items ?? []).some(
                                          (nested: unknown) =>
                                            (nested as NavSubItem).url === pathname,
                                        )
                                      : subItem.url === pathname;

                                    return (
                                      <li
                                        key={subItem.title}
                                        role="none"
                                        data-tour-id={
                                          subItem.title ===
                                          translations.sidebar.menuItems
                                            .subItems.authentication
                                            ? "tour-auth-authentication"
                                            : subItem.title ===
                                                  translations.sidebar.menuItems
                                                    .subItems.deviceInformation
                                                ? "tour-device-information"
                                                : subItem.title ===
                                                    translations.sidebar
                                                      .menuItems.subItems
                                                      .validationGlobalList
                                                  ? "tour-aml-validation-global-list"
                                                  : subItem.title ===
                                                      translations.sidebar
                                                        .menuItems.subItems
                                                        .workflow
                                                    ? "tour-identity-workflow"
                                                    : subItem.title ===
                                                        translations.sidebar
                                                          .menuItems.subItems
                                                          .bankAccountLinking
                                                      ? "tour-connect-bank-account-linking"
                                                      : subItem.title ===
                                                          translations.sidebar
                                                            .menuItems.subItems
                                                            .design
                                                        ? "tour-cards-issuing-design"
                                                        : subItem.title ===
                                                            translations.sidebar
                                                              .menuItems
                                                              .subItems
                                                              .transactions
                                                          ? undefined // "tour-cards-transactions" moved to page content
                                                          : subItem.title ===
                                                              translations
                                                                .sidebar
                                                                .menuItems
                                                                .subItems
                                                                .transfers
                                                            ? "tour-transfers-config"
                                                            : subItem.title ===
                                                                translations
                                                                  .sidebar
                                                                  .menuItems
                                                                  .subItems
                                                                  .internationalTransfers
                                                              ? "tour-tx-international-transfers"
                                                              : subItem.title ===
                                                                  translations
                                                                    .sidebar
                                                                    .menuItems
                                                                    .subItems
                                                                    .alaiza
                                                                ? "tour-ai-alaiza"
                                                                : subItem.title ===
                                                                    translations
                                                                      .sidebar
                                                                      .menuItems
                                                                      .subItems
                                                                      .behaviorAnalysis
                                                                  ? "tour-ai-behavior-analysis"
                                                                  : subItem.title ===
                                                                      translations
                                                                        .sidebar
                                                                        .menuItems
                                                                        .subItems
                                                                        .financialEducation
                                                                    ? "tour-ai-financial-education"
                                                                    : subItem.title ===
                                                                        translations
                                                                          .sidebar
                                                                          .menuItems
                                                                          .subItems
                                                                          .customKeys
                                                                      ? "tour-payments-custom-keys"
                                                                      : subItem.title ===
                                                                          translations
                                                                            .sidebar
                                                                            .menuItems
                                                                            .subItems
                                                                            .qr
                                                                        ? "tour-payments-qr"
                                                                        : subItem.title ===
                                                                            translations
                                                                              .sidebar
                                                                              .menuItems
                                                                              .subItems
                                                                              .coupons
                                                                          ? "tour-discounts-coupons"
                                                                          : subItem.title ===
                                                                              translations
                                                                                .sidebar
                                                                                .menuItems
                                                                                .subItems
                                                                                .discounts
                                                                            ? "tour-discounts-list"
                                                                            : subItem.title ===
                                                                                translations
                                                                                  .sidebar
                                                                                  .menuItems
                                                                                  .subItems
                                                                                  .createCoupon
                                                                              ? "tour-discounts-create"
                                                                              : subItem.title ===
                                                                                  translations
                                                                                    .sidebar
                                                                                    .menuItems
                                                                                    .subItems
                                                                                    .analyticsUsage
                                                                                ? "tour-discounts-analytics"
                                                                                : undefined
                                        }
                                      >
                                        {hasNestedItems ? (
                                          <div>
                                            <MenuItem
                                              isActive={isSubItemActive}
                                              title={subItem.title}
                                              onClick={() =>
                                                toggleExpanded(subItemKey)
                                              }
                                            >
                                              <span>{subItem.title}</span>
                                              <ChevronUp
                                                className={cn(
                                                  "ml-auto rotate-180 transition-transform duration-200",
                                                  isSubItemExpanded &&
                                                    "rotate-0",
                                                )}
                                                aria-hidden="true"
                                              />
                                            </MenuItem>
                                            {isSubItemExpanded && (
                                              <ul
                                                className="ml-6 mr-0 space-y-1.5 pb-[10px] pr-0 pt-2"
                                                role="menu"
                                              >
                                                {(subItem.items ?? []).map(
                                                  (nested: unknown) => {
                                                    const nestedItem = nested as NavSubItem;
                                                    return (
                                                      <li
                                                        key={nestedItem.title}
                                                        role="none"
                                                      >
                                                        {nestedItem.url ? (
                                                          <MenuItem
                                                            as="link"
                                                            href={nestedItem.url}
                                                            isActive={
                                                              pathname ===
                                                              nestedItem.url
                                                            }
                                                          >
                                                            <span>
                                                              {nestedItem.title}
                                                            </span>
                                                          </MenuItem>
                                                        ) : (
                                                          <div className="rounded-lg px-3.5 py-2 font-medium text-dark-4 opacity-50 dark:text-dark-6">
                                                            <span>
                                                              {nestedItem.title}
                                                            </span>
                                                          </div>
                                                        )}
                                                      </li>
                                                    );
                                                  },
                                                )}
                                              </ul>
                                            )}
                                          </div>
                                        ) : subItem.url ? (
                                          <MenuItem
                                            as="link"
                                            title={subItem.title}
                                            href={subItem.url}
                                            isActive={pathname === subItem.url}
                                            data-tour-id={
                                              subItem.title ===
                                              translations.sidebar.menuItems
                                                .subItems.authentication
                                                ? "tour-auth-authentication"
                                                : subItem.title ===
                                                    translations.sidebar
                                                      .menuItems.subItems
                                                      .deviceInformation
                                                  ? "tour-device-information"
                                                : subItem.title ===
                                                    translations.sidebar
                                                      .menuItems.subItems
                                                      .cardUsers
                                                  ? "tour-cards-users"
                                                  : undefined
                                            }
                                          >
                                            <span>{subItem.title}</span>
                                          </MenuItem>
                                        ) : (
                                          <div className="rounded-lg px-3.5 py-2 font-medium text-dark-4 opacity-50 dark:text-dark-6">
                                            <span>{subItem.title}</span>
                                          </div>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          ) : (
                            (() => {
                              const href =
                                "url" in item
                                  ? item.url + ""
                                  : "/" +
                                    item.title
                                      .toLowerCase()
                                      .split(" ")
                                      .join("-");

                              const isSectionOnboarding =
                                section.label ===
                                translations.sidebar.onboarding;
                              const isSupportContactLink =
                                href === ZENDESK_SUPPORT_MENU_HREF ||
                                href.startsWith("mailto:") ||
                                href.startsWith("tel:") ||
                                href.startsWith("sms:");
                              const isDisabled =
                                isSectionOnboarding &&
                                !isOnboardingEnabled &&
                                !isSupportContactLink;

                              if (isDisabled) {
                                return (
                                  <div 
                                    title={isCollapsed ? item.title : undefined}
                                    className={cn(
                                      "flex w-full items-center rounded-lg py-3 font-medium text-dark-4 opacity-60 transition-all duration-200 hover:cursor-not-allowed dark:text-dark-6",
                                      isCollapsed && !isMobile ? "justify-center px-0" : "px-3.5 gap-3"
                                    )}>
                                    <IconComponent
                                      className="size-6 shrink-0 text-blue-600 dark:text-blue-400"
                                      aria-hidden="true"
                                    />

                                    <span className={cn(
                                      "flex-1 text-left line-clamp-1 transition-opacity duration-300",
                                      isCollapsed && !isMobile ? "hidden" : "block"
                                    )}>
                                      {item.title}
                                    </span>

                                    <div
                                      className={cn(
                                        "group relative ml-2",
                                        isCollapsed && !isMobile ? "hidden" : "block"
                                      )}
                                      title={
                                        translations.sidebar.menuItems
                                          .lockedTooltip
                                      }
                                    >
                                      <Lock className="size-4 text-gray-400 dark:text-gray-500" />
                                      <div className="absolute right-full top-1/2 z-50 mr-2 hidden w-48 -translate-y-1/2 rounded bg-black/90 px-2 py-1 text-center text-xs text-white shadow-lg group-hover:block">
                                        {
                                          translations.sidebar.menuItems
                                            .lockedTooltip
                                        }
                                        <div className="absolute -right-1 top-1/2 -mt-1 h-2 w-2 rotate-45 bg-black/90"></div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              if (href === ZENDESK_SUPPORT_MENU_HREF) {
                                return (
                                  <MenuItem
                                    className="flex items-center gap-3 py-3"
                                    title={item.title}
                                    isActive={false}
                                    onClick={() => {
                                      openZendeskWidget();
                                      if (isMobile) toggleSidebar();
                                    }}
                                  >
                                    <IconComponent
                                      className="size-6 shrink-0 text-blue-600 dark:text-blue-400"
                                      aria-hidden="true"
                                    />

                                    <span className="text-left flex-1">
                                      {item.title}
                                    </span>
                                  </MenuItem>
                                );
                              }

                              return (
                                <MenuItem
                                  as="link"
                                  title={item.title}
                                  href={href}
                                  isActive={pathname === href}
                                >
                                  <IconComponent
                                    className="size-6 shrink-0 text-blue-600 dark:text-blue-400"
                                    aria-hidden="true"
                                  />

                                  <span className={cn(
                                    "text-left flex-1 transition-opacity duration-300",
                                    isCollapsed && !isMobile ? "hidden" : "block"
                                  )}>
                                    {item.title}
                                  </span>
                                </MenuItem>
                              );
                            })()
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
