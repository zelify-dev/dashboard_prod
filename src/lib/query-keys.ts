import type { ListOrgUsersParams } from "@/lib/organization-users-api";

export const queryKeys = {
  ownerOrganizations: ["owner-organizations"] as const,
  ownerOrganization: (orgId: string) => ["owner-organizations", orgId] as const,
  ownerOrganizationBranding: (orgId: string) =>
    ["owner-organizations", orgId, "branding"] as const,
  ownerOrganizationConfig: (orgId: string) =>
    ["owner-organizations", orgId, "config"] as const,
  ownerOrganizationIdentityConfig: (orgId: string) =>
    ["owner-organizations", orgId, "identity-config"] as const,
  ownerOrganizationIdentityWorkflows: (orgId: string) =>
    ["owner-organizations", orgId, "identity-workflows"] as const,
  ownerOrganizationActiveIdentityWorkflow: (orgId: string) =>
    ["owner-organizations", orgId, "identity-workflows", "active"] as const,
  ownerOrganizationScopes: (orgId: string) =>
    ["owner-organizations", orgId, "scopes"] as const,
  ownerOrganizationMembers: (orgId: string, params: ListOrgUsersParams) =>
    [
      "owner-organizations",
      orgId,
      "members",
      params.page ?? 1,
      params.limit ?? 20,
      params.search ?? "",
      params.status ?? "",
      params.role_code ?? "",
    ] as const,
  ownerOrganizationMemberDetail: (orgId: string, userId: string) =>
    ["owner-organizations", orgId, "members", "detail", userId] as const,
  ownerOrganizationApiKeys: (orgId: string) =>
    ["owner-organizations", orgId, "api-keys"] as const,
  ownerOrganizationOnboarding: (orgId: string) =>
    ["owner-organizations", orgId, "onboarding"] as const,
  ownerRolesCatalog: ["owner-roles-catalog"] as const,
};
