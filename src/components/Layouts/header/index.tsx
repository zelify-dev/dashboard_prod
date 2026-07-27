"use client";

import { SearchIcon } from "@/assets/icons";
import zelifyLogoDark from "@/assets/logos/zelifyLogo_dark.svg";
import zelifyLogoLight from "@/assets/logos/zelifyLogo_ligth.svg";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { LanguageToggleSwitch } from "./language-toggle";
// import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { TOUR_FEATURE_ENABLED, useTour } from "@/contexts/tour-context";
import { getStoredOrganization, fetchWithAuth } from "@/lib/auth-api";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const translations = useUiTranslations();
  const { openModal, isTourActive } = useTour();

  const [environment, setEnvironment] = useState<string | null>(null);

  useEffect(() => {
    const org = getStoredOrganization();
    if (!org?.id) return;

    fetchWithAuth(`/api/organizations/${org.id}/environment`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.environment) {
          setEnvironment(data.environment);
        }
      })
      .catch((err) => console.error("Error cargando entorno en header", err));
  }, []);

  return (
    <header className={`sticky top-0 flex items-center justify-between border-b border-stroke bg-white px-4 py-2 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-8 ${isTourActive ? "z-[110]" : "z-30"}`}>
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden"
      >
        <MenuIcon />
        <span className="sr-only">{translations.header.toggleSidebar}</span>
      </button>

      {isMobile && (
        <Link href={"/"} className="ml-2 max-[430px]:hidden min-[375px]:ml-4">
          <div className="relative h-8 w-24">
            <Image
              src={zelifyLogoLight}
              fill
              className="dark:hidden"
              alt="Zelify logo"
              role="presentation"
              quality={100}
            />
            <Image
              src={zelifyLogoDark}
              fill
              className="hidden dark:block"
              alt="Zelify logo"
              role="presentation"
              quality={100}
            />
          </div>
        </Link>
      )}

      <div className="max-xl:hidden flex items-center gap-3">
        <h1 className="mb-0.5 text-lg font-light text-dark leading-none tracking-tight">
          {translations.header.title}
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        {TOUR_FEATURE_ENABLED && (
          <button
            type="button"
            onClick={openModal}
            className="rounded-lg border border-stroke bg-white px-3.5 py-1.5 text-xs font-bold text-dark transition-all hover:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
          >
            Tour
          </button>
        )}
        <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder={translations.header.searchPlaceholder}
            className="flex w-full items-center gap-3.5 rounded-xl border border-gray-200 bg-gray-100 py-1.5 pl-[48px] pr-4 outline-none transition-all focus-visible:border-primary text-xs font-light text-dark"
          />

          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 max-[1015px]:size-4 size-4" />
        </div>

        {/* <ThemeToggleSwitch /> */}

        {environment && (
          <div className="rounded-xl bg-gray-100 p-[3px] flex items-center relative text-[10px] font-light select-none cursor-default opacity-95 h-[30px] border border-gray-200">
            {/* Sliding Indicator background */}
            <span
              className={`absolute h-[22px] w-[84px] rounded-lg transition-all duration-300 ${
                environment === "PRODUCTION" ? "translate-x-[84px] bg-zelify-midnight" : "translate-x-0 bg-white border border-gray-200"
              }`}
            />
            {/* Options */}
            <span
              className={`relative z-10 w-[84px] h-[22px] flex items-center justify-center transition-colors duration-300 ${
                environment === "SANDBOX"
                  ? "text-amber-600 font-normal"
                  : "text-gray-400"
              }`}
            >
              Sandbox
            </span>
            <span
              className={`relative z-10 w-[84px] h-[22px] flex items-center justify-center transition-colors duration-300 ${
                environment === "PRODUCTION"
                  ? "text-white font-normal"
                  : "text-gray-400"
              }`}
            >
              Producción
            </span>
          </div>
        )}

        <LanguageToggleSwitch />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
