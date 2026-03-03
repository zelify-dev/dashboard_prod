"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getStoredRoles } from "@/lib/auth-api";
import { isOwner } from "@/app/organization/teams/_constants/team-roles";

export default function OrganizationAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const roles = getStoredRoles();
  const isOwnerUser = isOwner(roles);

  useEffect(() => {
    if (!isOwnerUser) {
      router.replace("/organization/teams");
    }
  }, [isOwnerUser, router]);

  if (!isOwnerUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tienes permiso para acceder a esta sección.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
