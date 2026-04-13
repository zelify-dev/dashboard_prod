"use client";

import { getStoredRoles } from "@/lib/auth-api";
import {
  getDashboardActorFromRoles,
  getDefaultDashboardPath,
  type DashboardActor,
} from "@/lib/dashboard-routing";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ActorRouteGuard({
  actor,
  children,
}: {
  actor: Exclude<DashboardActor, "unknown">;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentActor = getDashboardActorFromRoles(getStoredRoles());

  useEffect(() => {
    if (currentActor !== "unknown" && currentActor !== actor) {
      router.replace(getDefaultDashboardPath(getStoredRoles()));
    }
  }, [actor, currentActor, router]);

  if (currentActor !== actor) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

