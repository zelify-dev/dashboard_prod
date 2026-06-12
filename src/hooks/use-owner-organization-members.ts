"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listOrgUsers,
  type ListOrgUsersParams,
  type ListOrgUsersResponse,
  type OrgUserListItem,
} from "@/lib/organization-users-api";
import { queryKeys } from "@/lib/query-keys";

type UseOwnerOrganizationMembersParams = ListOrgUsersParams & {
  enabled?: boolean;
  orgId: string;
};

export function useOwnerOrganizationMembers({
  enabled = true,
  orgId,
  ...params
}: UseOwnerOrganizationMembersParams) {
  const queryClient = useQueryClient();
  const fallback: ListOrgUsersResponse = {
    items: [],
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    total: 0,
  };
  const query = useQuery({
    queryKey: queryKeys.ownerOrganizationMembers(orgId, params),
    queryFn: () => listOrgUsers(orgId, params),
    enabled: enabled && Boolean(orgId),
  });

  const reload = useCallback(async () => {
    if (!enabled || !orgId) return;
    await queryClient.invalidateQueries({
      queryKey: ["owner-organizations", orgId, "members"],
    });
  }, [enabled, orgId, queryClient]);

  const response = query.data ?? fallback;

  return {
    members: response.items as OrgUserListItem[],
    page: response.page,
    limit: response.limit,
    total: response.total,
    loading: query.isLoading || query.isFetching,
    error: query.error instanceof Error ? query.error.message : "",
    reload,
  };
}
