"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listOrganizations, type OrganizationAdmin } from "@/lib/organizations-admin-api";
import { queryKeys } from "@/lib/query-keys";

export function useOwnerOrganizations() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.ownerOrganizations,
    queryFn: listOrganizations,
  });

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.ownerOrganizations });
  }, [queryClient]);

  return {
    organizations: (query.data ?? []) as OrganizationAdmin[],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : "",
    reload,
    setOrganizations: (updater: OrganizationAdmin[] | ((current: OrganizationAdmin[]) => OrganizationAdmin[])) => {
      queryClient.setQueryData<OrganizationAdmin[]>(queryKeys.ownerOrganizations, (current = []) =>
        typeof updater === "function" ? updater(current) : updater
      );
    },
  };
}
