"use client";

import { SearchIcon } from "@/assets/icons";
import zelifyLogoDark from "@/assets/logos/zelifyLogo_dark.svg";
import zelifyLogoLight from "@/assets/logos/zelifyLogo_ligth.svg";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import Image from "next/image";
import Link from "next/link";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { LanguageToggleSwitch } from "./language-toggle";
// import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { useTour } from "@/contexts/tour-context";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const translations = useUiTranslations();
  const { openModal, isTourActive } = useTour();

  return (
    <header className={`sticky top-0 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10 ${isTourActive ? "z-[110]" : "z-30"}`}>
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
        <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white">
          {translations.header.title}
        </h1>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary">
          Sandbox Mode
        </span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        <button
          onClick={openModal}
          className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-2 dark:border-stroke-dark dark:bg-gray-dark dark:text-white dark:hover:bg-dark-3"
        >
          Tour
        </button>
        <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder={translations.header.searchPlaceholder}
            className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
          />

          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
        </div>

        {/* <ThemeToggleSwitch /> */}

        <LanguageToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
