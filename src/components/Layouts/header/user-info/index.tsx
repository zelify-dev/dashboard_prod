"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { cn } from "@/lib/utils";
import { logout, getStoredUser, type AuthUser } from "@/lib/auth-api";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";

export function UserInfo() {
  const translations = useUiTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(typeof window !== "undefined" ? getStoredUser() : null);

  useEffect(() => {
    const handleUpdate = () => {
      setUser(getStoredUser());
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("user-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("user-updated", handleUpdate);
    };
  }, []);

  const rawPhotoUrl = (user as any)?.photo || (user as any)?.url_photo;
  const USER = {
    name: user?.full_name ?? "Usuario",
    email: user?.email ?? "",
    image: rawPhotoUrl ? `${rawPhotoUrl}${rawPhotoUrl.includes('?') ? '&' : '?'}t=${new Date().getTime()}` : null,
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
          <div className="relative size-8 overflow-hidden rounded-full border border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-3 flex items-center justify-center">
            {USER.image ? (
              <Image
                src={USER.image}
                fill
                alt="User"
                className="object-cover"
                quality={90}
                unoptimized={USER.image.startsWith("http")}
              />
            ) : (
              <UserIcon className="size-4 text-dark-6" />
            )}
          </div>
          <span className="text-xs font-bold text-dark dark:text-dark-6 max-[1024px]:sr-only">
            {USER.name}
          </span>
          <ChevronUpIcon
            aria-hidden
            className={cn(
              "rotate-180 transition-transform size-4",
              isOpen && "rotate-0",
            )}
            strokeWidth={2}
          />
        </div>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">{translations.userInfo.userInformation}</h2>

        <div className="flex items-center gap-2.5 px-5 py-3.5">
          <div className="relative size-10 overflow-hidden rounded-full border border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-3 flex items-center justify-center">
            {USER.image ? (
              <Image
                src={USER.image}
                fill
                alt="User"
                className="object-cover"
                quality={90}
                unoptimized={USER.image.startsWith("http")}
              />
            ) : (
              <UserIcon className="size-6 text-dark-6" />
            )}
          </div>
          <div className="space-y-0.5 text-sm font-medium">
            <div className="mb-1 leading-tight font-bold text-dark dark:text-white">
              {USER.name}
            </div>
            <div className="leading-tight text-xs text-gray-6">{USER.email}</div>
          </div>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/pages/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white transition-all"
          >
            <SettingsIcon className="size-4" />

            <span className="mr-auto text-xs font-bold">
              {translations.userInfo.accountSettings}
            </span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white transition-all"
            onClick={handleLogout}
          >
            <LogOutIcon className="size-4" />

            <span className="text-xs font-bold">{translations.userInfo.logOut}</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
