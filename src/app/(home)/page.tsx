"use client";
import { getStoredRoles } from "@/lib/auth-api";
import { getDefaultDashboardPath } from "@/lib/dashboard-routing";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {

  const router = useRouter();

  useEffect(() => {
    router.replace(getDefaultDashboardPath(getStoredRoles()));
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
