"use client";

import { OwnerOnlyRouteGuard } from "@/components/Dashboard/owner-only-route-guard";
import { OrganizationAdministrationClient } from "./_components/organization-administration-client";

export default function OwnerOrganizationsPage() {
  return (
    <OwnerOnlyRouteGuard>
      <OrganizationAdministrationClient />
    </OwnerOnlyRouteGuard>
  );
}
