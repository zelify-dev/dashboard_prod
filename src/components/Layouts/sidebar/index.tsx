"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getNavData } from "./data";
import { ArrowLeftIcon, ChevronUp, Lock } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { useTour } from "@/contexts/tour-context";

export function Sidebar() {
  const pathname = usePathname();
  const isOnboardingEnabled = false;
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const translations = useUiTranslations();
  const { isTourActive, currentStep, steps } = useTour();

  // Determinar si el sidebar es el target del paso actual
  const isSidebarTarget =
    isTourActive &&
    steps.length > 0 &&
    currentStep < steps.length &&
    (steps[currentStep]?.target === "tour-sidebar" ||
      steps[currentStep]?.target === "tour-products-section" ||
      steps[currentStep]?.target === "tour-product-auth" ||
      steps[currentStep]?.target === "tour-auth-authentication" ||
      steps[currentStep]?.target === "tour-geolocalization");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const NAV_DATA = getNavData(translations);
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
        return item.items.some((subItem) => {
          // Check if subItem has nested items
          if ("items" in subItem && subItem.items && subItem.items.length > 0) {
            const subItemKey = `${itemKey}-${subItem.title}`;
            return subItem.items.some((nestedItem) => {
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
          } else if (subItem.url && subItem.url === pathname) {
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
          "tour-geolocalization",
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
                target === "tour-geolocalization" ||
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
          "tour-geolocalization",
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
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile
            ? "fixed bottom-0 top-0 z-50"
            : cn("sticky top-0 h-screen", !isTourActive && "z-30"),
          isOpen ? "w-full" : "w-0",
          isSidebarTarget ? "z-[102]" : isTourActive && !isMobile ? "z-0" : "",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
        style={{
          zIndex: isSidebarTarget
            ? 102
            : isTourActive && !isMobile
              ? 0
              : undefined,
        }}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className="px-0 py-2.5 min-[850px]:py-0"
            >
              <Logo />
            </Link>

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
                <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => {
                      const itemKey = `${section.label}-${item.title}`;
                      const isItemExpanded = expandedItems.includes(itemKey);
                      const isItemActive =
                        ("url" in item && item.url === pathname) ||
                        item.items.some((subItem) => {
                          if (subItem.url && subItem.url === pathname)
                            return true;
                          if ("items" in subItem && subItem.items) {
                            return subItem.items.some(
                              (nestedItem) => nestedItem.url === pathname,
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
                                onClick={() => toggleExpanded(itemKey)}
                              >
                                {item.title === "AI" || item.title === "IA" ? (
                                  <img
                                    src="/images/iconAlaiza.svg"
                                    alt={item.title}
                                    className="size-6 shrink-0 rounded-full"
                                  />
                                ) : (
                                  <item.icon
                                    className="size-6 shrink-0 text-blue-600 dark:text-blue-400"
                                    aria-hidden="true"
                                  />
                                )}

                                <span className="text-left flex-1">
                                  {item.title}
                                </span>

                                <ChevronUp
                                  className={cn(
                                    "ml-auto rotate-180 transition-transform duration-200",
                                    isItemExpanded && "rotate-0",
                                  )}
                                  aria-hidden="true"
                                />
                              </MenuItem>

                              {isItemExpanded && (
                                <ul
                                  className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                  role="menu"
                                >
                                  {item.items.map((subItem) => {
                                    const subItemKey = `${itemKey}-${subItem.title}`;
                                    const isSubItemExpanded =
                                      expandedItems.includes(subItemKey);
                                    const hasNestedItems =
                                      "items" in subItem &&
                                      subItem.items &&
                                      subItem.items.length > 0;
                                    const isSubItemActive = hasNestedItems
                                      ? subItem.items!.some(
                                          (nestedItem) =>
                                            nestedItem.url === pathname,
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
                                                  .subItems.geolocalization
                                              ? "tour-geolocalization"
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
                                                {subItem.items.map(
                                                  (nestedItem) => (
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
                                                  ),
                                                )}
                                              </ul>
                                            )}
                                          </div>
                                        ) : subItem.url ? (
                                          <MenuItem
                                            as="link"
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
                                                      .geolocalization
                                                  ? "tour-geolocalization"
                                                  : subItem.title ===
                                                      translations.sidebar
                                                        .menuItems.subItems
                                                        .deviceInformation
                                                    ? "tour-device-information"
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
                              const isDisabled =
                                isSectionOnboarding && !isOnboardingEnabled;

                              if (isDisabled) {
                                return (
                                  <div className="flex w-full items-center gap-3 rounded-lg px-3.5 py-3 font-medium text-dark-4 opacity-60 transition-all duration-200 hover:cursor-not-allowed dark:text-dark-6">
                                    <item.icon
                                      className="size-6 shrink-0 text-blue-600 dark:text-blue-400"
                                      aria-hidden="true"
                                    />

                                    <span className="flex-1 text-left">
                                      {item.title}
                                    </span>

                                    <div
                                      className="group relative ml-2"
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

                              return (
                                <MenuItem
                                  className="flex items-center gap-3 py-3"
                                  as="link"
                                  href={href}
                                  isActive={pathname === href}
                                >
                                  <item.icon
                                    className="size-6 shrink-0 text-blue-600 dark:text-blue-400"
                                    aria-hidden="true"
                                  />

                                  <span className="text-left flex-1">
                                    {item.title}
                                  </span>

                                  {isSectionOnboarding && (
                                    <div
                                      className="group relative ml-2"
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
                                  )}
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
