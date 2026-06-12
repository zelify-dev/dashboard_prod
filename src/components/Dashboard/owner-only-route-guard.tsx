"use client";

import { getStoredRoles } from "@/lib/auth-api";
import { getDefaultDashboardPath, hasDashboardRole, DASHBOARD_ROLE } from "@/lib/dashboard-routing";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function OwnerOnlyRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasOwnerRole = hasDashboardRole(getStoredRoles(), DASHBOARD_ROLE.OWNER);

  useEffect(() => {
    if (!hasOwnerRole) {
      router.replace(getDefaultDashboardPath(getStoredRoles()));
    }
  }, [hasOwnerRole, router]);

  if (!hasOwnerRole) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
