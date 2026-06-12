"use client";

import { OwnerOnlyRouteGuard } from "@/components/Dashboard/owner-only-route-guard";
import { OrganizationAdministrationDetailClient } from "../_components/organization-administration-detail-client";

export default function OwnerOrganizationDetailPage() {
  return (
    <OwnerOnlyRouteGuard>
      <OrganizationAdministrationDetailClient />
    </OwnerOnlyRouteGuard>
  );
}
