"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { cn } from "@/lib/utils";
import { logout, getStoredUser } from "@/lib/auth-api";
import Link from "next/link";
import { useState } from "react";
import { LogOutIcon, SettingsIcon } from "./icons";

export function UserInfo() {
  const translations = useUiTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const user = typeof window !== "undefined" ? getStoredUser() : null;
  const USER = {
    name: user?.full_name ?? "Usuario",
    email: user?.email ?? "",
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    window.location.href = "/login";
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">{translations.userInfo.myAccount}</span>

        <div className="flex items-center gap-3">
          <span className="font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            {USER.name}
          </span>
          <ChevronUpIcon
            aria-hidden
            className={cn(
              "rotate-180 transition-transform",
              isOpen && "rotate-0",
            )}
            strokeWidth={1.5}
          />
        </div>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">{translations.userInfo.userInformation}</h2>

        <div className="flex items-center gap-2.5 px-5 py-3.5">
          <div className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {USER.name}
            </div>
            <div className="leading-none text-gray-6">{USER.email}</div>
          </div>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/pages/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              {translations.userInfo.accountSettings}
            </span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={handleLogout}
          >
            <LogOutIcon />

            <span className="text-base font-medium">{translations.userInfo.logOut}</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
