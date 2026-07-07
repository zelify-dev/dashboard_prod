"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { HexColorPicker } from "react-colorful";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { TEAM_ROLE } from "@/app/organization/teams/_constants/team-roles";
import type { BrandingLogoType } from "@/lib/auth-api";
import {
  addOrganizationScopes,
  encodeScopeForUrl,
  getOrganizationAdmin,
  getOrganizationAdminBranding,
  getOrganizationConfig,
  getOrganizationIdentityConfig,
  listOrganizationScopes,
  removeOrganizationScope,
  updateOrganization,
  updateOrganizationAdminBranding,
  updateOrganizationConfig,
  updateOrganizationIdentityConfig,
  uploadOrganizationAdminLogo,
  type OrganizationAdmin,
  type OrganizationConfig,
  type OrganizationIdentityConfig,
  type ScopeItem,
  type UpdateOrganizationConfigPayload,
} from "@/lib/organizations-admin-api";
import {
  batchAssignOrgUserRoles,
  batchRemoveOrgUserRoles,
  batchResetOrgUserPasswords,
  batchUpdateOrgUsersStatus,
  assignOrgUserRoles,
  createOrgUser,
  getOrgUser,
  removeOrgUserRole,
  resetOrgUserPassword,
  updateOrgUser,
  type BatchActionResponse,
  type OrgUser,
  type OrgUserListItem,
  type OrgUserStatus,
} from "@/lib/organization-users-api";
import {
  getApiKeySecret,
  listApiKeys,
  revokeApiKey,
  rotateApiKeys,
  type ApiKeyItem,
} from "@/lib/organization-api-keys";
import {
  getOnboardingStatus,
  parseBusinessPlanStatus,
  parseOnboardingStatusFull,
  postAmlFiles,
  postBusinessPlanFile,
  postKybFiles,
  postTechnicalDocumentation,
  putDevelopmentEnvironments,
  type DevelopmentEnvironmentsPayload,
  type BusinessPlanStatus,
} from "@/lib/onboarding-api";
import { useOwnerOrganizationMembers } from "@/hooks/use-owner-organization-members";
import { ORGANIZATION_COUNTRY_OPTIONS, ORGANIZATION_CURRENCY_OPTIONS, type SelectOption } from "@/lib/organization-form-options";
import {
  createIdentityWorkflow,
  deleteIdentityWorkflow,
  getActiveIdentityWorkflow,
  listIdentityWorkflows,
  updateIdentityWorkflow,
  type IdentityWorkflowBiometryMethod,
  type IdentityWorkflowDocumentType,
  type IdentityWorkflowItem,
} from "@/lib/organization-identity-workflows-api";
import { queryKeys } from "@/lib/query-keys";
import { listRoles, type RoleCatalogItem } from "@/lib/roles-api";
import { Dropdown, DropdownContent, DropdownTrigger, DropdownClose } from "@/components/ui/dropdown";

type DetailTabId =
  | "overview"
  | "general"
  | "branding"
  | "members"
  | "roles"
  | "scopes"
  | "workflows"
  | "identity"
  | "api-keys"
  | "onboarding";

type GeneralFormState = {
  name: string;
  status: string;
  organization_type: string;
  country: string;
  currency: string;
  company_legal_name: string;
  website: string;
  industry: string;
  fiscal_id: string;
  swift: string;
  default_daily_account_limit: string;
};

type BrandingFormState = {
  color_a: string;
  color_b: string;
};

type MemberCreateFormState = {
  full_name: string;
  email: string;
  roles: string[];
};

type OrganizationConfigFormState = {
  auth: {
    app_registration_enabled: boolean;
    otp_ttl_minutes: string;
  };
  identity: {
    national_id: boolean;
    driver_license: boolean;
    passport: boolean;
  };
  aml: {
    screening_enabled: boolean;
  };
};

type IdentityWorkflowFormState = {
  name: string;
  document_type: IdentityWorkflowDocumentType;
  biometry_method: IdentityWorkflowBiometryMethod;
  is_active: boolean;
};

type OnboardingState = {
  raw: Record<string, unknown> | null;
  percents: {
    kyb: number | null;
    aml: number | null;
    technical: number | null;
    businessPlan: number | null;
  };
  flags: {
    kybLocked: boolean;
    amlLocked: boolean;
    technical: {
      diagram: boolean;
      securityPolicy: boolean;
      certifications: boolean;
      processDocumentation: boolean;
      developmentEnvironmentsLocked: boolean;
    };
  };
  developmentEnvironments: {
    development_urls: string;
    api_keys: string;
  } | null;
  businessPlan: BusinessPlanStatus;
};

type MembersBatchAction = "activate" | "disable" | "assign-roles" | "remove-roles" | "reset-password";

const PAGE_TITLE = "Administracion de Organizaciones";
const DETAIL_TABS: Array<{ id: DetailTabId; label: string }> = [
  { id: "overview", label: "Resumen" },
  { id: "general", label: "Informacion General" },
  { id: "branding", label: "Marca" },
  { id: "members", label: "Miembros" },
  { id: "roles", label: "Roles" },
  { id: "scopes", label: "Permisos" },
  { id: "workflows", label: "Workflows de Identidad" },
  { id: "api-keys", label: "Claves API" },
  { id: "onboarding", label: "Onboarding" },
];
const SYSTEM_HIDDEN_ROLE_CODES = new Set([
  TEAM_ROLE.OWNER,
  TEAM_ROLE.ZELIFY_TEAM,
  "USER_APP",
]);
const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
const IDENTITY_DOCUMENT_OPTIONS: SelectOption[] = [
  { value: "identity_document", label: "identity_document - Documento de identidad" },
  { value: "driver_license", label: "driver_license - Licencia de conducir" },
  { value: "passport", label: "passport - Pasaporte" },
];
const IDENTITY_BIOMETRY_OPTIONS: SelectOption[] = [
  { value: "selfie_photo", label: "selfie_photo - Selfie con foto" },
  { value: "selfie_video", label: "selfie_video - Selfie con video" },
];

function buildDefaultWorkflowFormState(): IdentityWorkflowFormState {
  return {
    name: "",
    document_type: "identity_document",
    biometry_method: "selfie_photo",
    is_active: true,
  };
}

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = (status ?? "").trim().toUpperCase();
  if (normalized === "ACTIVE") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (normalized === "PENDING") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function prettifyJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-EC");
}

function roleCodeFromUnknown(role: string | { code?: string; name?: string }): string {
  return typeof role === "string" ? role : role.code ?? role.name ?? "";
}

function workflowDocumentLabel(value: IdentityWorkflowDocumentType): string {
  if (value === "driver_license") return "Licencia de conducir";
  if (value === "passport") return "Pasaporte";
  return "Documento de identidad";
}

function workflowBiometryLabel(value: IdentityWorkflowBiometryMethod): string {
  if (value === "selfie_video") return "Selfie video";
  return "Selfie foto";
}

function workflowStatusSummary(workflow: IdentityWorkflowItem | null): string {
  if (!workflow) return "No hay workflow configurado";
  return `${workflowDocumentLabel(workflow.document_type)} con ${workflowBiometryLabel(
    workflow.biometry_method
  )}`;
}

function memberBatchActionLabel(action: MembersBatchAction | null): string {
  if (action === "activate") return "Activar miembros";
  if (action === "disable") return "Desactivar miembros";
  if (action === "assign-roles") return "Asignar roles";
  if (action === "remove-roles") return "Remover roles";
  if (action === "reset-password") return "Resetear contraseñas";
  return "Accion batch";
}

function isValidAbsoluteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function withCacheBust(url: string | null | undefined, version: number): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("v", String(version));
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${version}`;
  }
}

function buildConfigFormState(config: OrganizationConfig | null | undefined): OrganizationConfigFormState {
  const auth =
    config?.auth && typeof config.auth === "object" ? (config.auth as Record<string, unknown>) : {};
  const identity =
    config?.identity && typeof config.identity === "object"
      ? (config.identity as Record<string, unknown>)
      : {};
  const allowedDocumentTypes =
    identity.allowed_document_types && typeof identity.allowed_document_types === "object"
      ? (identity.allowed_document_types as Record<string, unknown>)
      : {};
  const aml =
    config?.aml && typeof config.aml === "object" ? (config.aml as Record<string, unknown>) : {};

  return {
    auth: {
      app_registration_enabled: auth.app_registration_enabled === true,
      otp_ttl_minutes:
        typeof auth.otp_ttl_minutes === "number" ? String(auth.otp_ttl_minutes) : "",
    },
    identity: {
      national_id: allowedDocumentTypes.national_id !== false,
      driver_license: allowedDocumentTypes.driver_license !== false,
      passport: allowedDocumentTypes.passport === true,
    },
    aml: {
      screening_enabled: aml.screening_enabled === true,
    },
  };
}

function buildConfigPayload(form: OrganizationConfigFormState): UpdateOrganizationConfigPayload {
  return {
    auth: {
      app_registration_enabled: form.auth.app_registration_enabled,
      otp_ttl_minutes: form.auth.otp_ttl_minutes.trim()
        ? Number(form.auth.otp_ttl_minutes.trim())
        : undefined,
    },
    aml: {
      screening_enabled: form.aml.screening_enabled,
    },
  };
}

type OnboardingUploadedAsset = {
  label: string;
  uploaded: boolean;
  url?: string;
  s3Key?: string;
};

function readUploadedAsset(
  source: Record<string, unknown> | null | undefined,
  label: string
): OnboardingUploadedAsset {
  if (!source) return { label, uploaded: false };
  const uploaded = source.uploaded === true;
  const url = typeof source.url === "string" ? source.url : undefined;
  const s3Key = typeof source.s3_key === "string" ? source.s3_key : undefined;
  return { label, uploaded, url, s3Key };
}

function getOnboardingAssets(raw: Record<string, unknown> | null | undefined) {
  const root = raw ?? {};
  const kyb = readUploadedAsset(
    root.kyb_files && typeof root.kyb_files === "object"
      ? (root.kyb_files as Record<string, unknown>)
      : null,
    "KYB bundle"
  );
  const aml = readUploadedAsset(
    root.aml_files && typeof root.aml_files === "object"
      ? (root.aml_files as Record<string, unknown>)
      : null,
    "AML documentation"
  );
  const businessPlan = readUploadedAsset(
    root.business_plan && typeof root.business_plan === "object"
      ? (root.business_plan as Record<string, unknown>)
      : null,
    "Plan de negocio"
  );
  const technicalRoot =
    root.technical_documentation && typeof root.technical_documentation === "object"
      ? (root.technical_documentation as Record<string, unknown>)
      : {};
  const technicalAssets = [
    readUploadedAsset(
      technicalRoot.flow_diagram && typeof technicalRoot.flow_diagram === "object"
        ? (technicalRoot.flow_diagram as Record<string, unknown>)
        : null,
      "Flow diagram"
    ),
    readUploadedAsset(
      technicalRoot.security_policy && typeof technicalRoot.security_policy === "object"
        ? (technicalRoot.security_policy as Record<string, unknown>)
        : null,
      "Security policy"
    ),
    readUploadedAsset(
      technicalRoot.certifications && typeof technicalRoot.certifications === "object"
        ? (technicalRoot.certifications as Record<string, unknown>)
        : null,
      "Certifications"
    ),
    readUploadedAsset(
      technicalRoot.process_documentation && typeof technicalRoot.process_documentation === "object"
        ? (technicalRoot.process_documentation as Record<string, unknown>)
        : null,
      "Process documentation"
    ),
  ];
  const developmentRoot =
    root.development_environments && typeof root.development_environments === "object"
      ? (root.development_environments as Record<string, unknown>)
      : {};

  return {
    primary: [kyb, aml, businessPlan],
    technical: technicalAssets,
    development: {
      urls:
        typeof developmentRoot.development_urls === "string"
          ? developmentRoot.development_urls
          : Array.isArray(developmentRoot.development_urls)
            ? developmentRoot.development_urls.join("\n")
            : "",
      apiKeys:
        typeof developmentRoot.development_api_keys === "string"
          ? developmentRoot.development_api_keys
          : typeof developmentRoot.api_keys === "string"
            ? developmentRoot.api_keys
            : "",
      updatedAt:
        typeof developmentRoot.updated_at === "string"
          ? developmentRoot.updated_at
          : undefined,
    },
  };
}

export function OrganizationAdministrationDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const orgId = params.id;
  const tabQuery = searchParams.get("tab");
  const activeTab = (DETAIL_TABS.some((tab) => tab.id === tabQuery) ? tabQuery : "overview") as DetailTabId;

  const [flash, setFlash] = useState("");

  const [generalForm, setGeneralForm] = useState<GeneralFormState>({
    name: "",
    status: "ACTIVE",
    organization_type: "",
    country: "",
    currency: "",
    company_legal_name: "",
    website: "",
    industry: "",
    fiscal_id: "",
    swift: "",
    default_daily_account_limit: "",
  });
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const [brandingForm, setBrandingForm] = useState<BrandingFormState>({
    color_a: "#004492",
    color_b: "#0FADCF",
  });
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingUploading, setBrandingUploading] = useState<BrandingLogoType | null>(null);
  const [brandingError, setBrandingError] = useState("");
  const [brandingAssetVersion, setBrandingAssetVersion] = useState(() => Date.now());

  const [configForm, setConfigForm] = useState<OrganizationConfigFormState>({
    auth: {
      app_registration_enabled: false,
      otp_ttl_minutes: "",
    },
    identity: {
      national_id: true,
      driver_license: true,
      passport: false,
    },
    aml: {
      screening_enabled: false,
    },
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSubmitError, setConfigSubmitError] = useState("");

  const [identityConfigText, setIdentityConfigText] = useState("{}");
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identityError, setIdentityError] = useState("");
  const [workflowEditorOpen, setWorkflowEditorOpen] = useState(false);
  const [workflowEditingId, setWorkflowEditingId] = useState<string | null>(null);
  const [workflowForm, setWorkflowForm] = useState<IdentityWorkflowFormState>(
    buildDefaultWorkflowFormState()
  );
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [workflowActionLoading, setWorkflowActionLoading] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState("");

  const [scopesSaving, setScopesSaving] = useState(false);
  const [scopesError, setScopesError] = useState("");
  const [newScopesText, setNewScopesText] = useState("");

  const [membersSearch, setMembersSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<OrgUserStatus | "">("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("");
  const [membersPage, setMembersPage] = useState(1);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMemberDraft, setSelectedMemberDraft] = useState<OrgUser | null>(null);
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [memberActionError, setMemberActionError] = useState("");
  const [memberBatchAction, setMemberBatchAction] = useState<MembersBatchAction | null>(null);
  const [memberBatchOpen, setMemberBatchOpen] = useState(false);
  const [memberBatchLoading, setMemberBatchLoading] = useState(false);
  const [memberBatchError, setMemberBatchError] = useState("");
  const [memberBatchRoleCodes, setMemberBatchRoleCodes] = useState<string[]>([]);
  const [memberBatchResult, setMemberBatchResult] = useState<BatchActionResponse | null>(null);
  const [memberCreateOpen, setMemberCreateOpen] = useState(false);
  const [activeDropdownMemberId, setActiveDropdownMemberId] = useState<string | null>(null);
  const [memberCreateForm, setMemberCreateForm] = useState<MemberCreateFormState>({
    full_name: "",
    email: "",
    roles: [TEAM_ROLE.ORG_ADMIN],
  });
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const [apiKeysError, setApiKeysError] = useState("");
  const [apiKeyActionLoading, setApiKeyActionLoading] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});

  const [onboardingError, setOnboardingError] = useState("");
  const [onboardingActionLoading, setOnboardingActionLoading] = useState("");
  const [developmentUrls, setDevelopmentUrls] = useState("");
  const [developmentApiKeys, setDevelopmentApiKeys] = useState("");

  const organizationQuery = useQuery({
    queryKey: queryKeys.ownerOrganization(orgId),
    queryFn: () => getOrganizationAdmin(orgId),
    enabled: Boolean(orgId),
  });

  const rolesQuery = useQuery({
    queryKey: queryKeys.ownerRolesCatalog,
    queryFn: listRoles,
  });

  const brandingQuery = useQuery({
    queryKey: queryKeys.ownerOrganizationBranding(orgId),
    queryFn: () => getOrganizationAdminBranding(orgId),
    enabled: activeTab === "branding",
  });

  const configQuery = useQuery({
    queryKey: queryKeys.ownerOrganizationConfig(orgId),
    queryFn: () => getOrganizationConfig(orgId),
    enabled: activeTab === "overview",
  });

  const identityConfigQuery = useQuery({
    queryKey: queryKeys.ownerOrganizationIdentityConfig(orgId),
    queryFn: () => getOrganizationIdentityConfig(orgId),
    enabled: activeTab === "identity",
  });

  const identityWorkflowsQuery = useQuery({
    queryKey: queryKeys.ownerOrganizationIdentityWorkflows(orgId),
    queryFn: () => listIdentityWorkflows(orgId),
    enabled: activeTab === "workflows",
  });

  const activeIdentityWorkflowQuery = useQuery({
    queryKey: queryKeys.ownerOrganizationActiveIdentityWorkflow(orgId),
    queryFn: () => getActiveIdentityWorkflow(orgId),
    enabled: activeTab === "overview" || activeTab === "workflows",
  });

  const scopesQuery = useQuery({
    queryKey: queryKeys.ownerOrganizationScopes(orgId),
    queryFn: () => listOrganizationScopes(orgId),
    enabled: activeTab === "scopes" || activeTab === "overview",
  });

  const apiKeysQuery = useQuery({
    queryKey: queryKeys.ownerOrganizationApiKeys(orgId),
    queryFn: () => listApiKeys(orgId),
    enabled: activeTab === "api-keys",
  });

  const onboardingQuery = useQuery({
    queryKey: queryKeys.ownerOrganizationOnboarding(orgId),
    queryFn: async (): Promise<OnboardingState> => {
      const raw = (await getOnboardingStatus(orgId)) as Record<string, unknown>;
      const parsed = parseOnboardingStatusFull(raw);
      const businessPlan = parseBusinessPlanStatus(raw);
      return {
        raw,
        percents: parsed.percents,
        flags: parsed.flags,
        developmentEnvironments: parsed.developmentEnvironments,
        businessPlan,
      };
    },
    enabled: activeTab === "overview" || activeTab === "onboarding",
  });

  const selectedMemberQuery = useQuery({
    queryKey: queryKeys.ownerOrganizationMemberDetail(orgId, selectedMemberId),
    queryFn: () => getOrgUser(orgId, selectedMemberId),
    enabled: activeTab === "members" && Boolean(selectedMemberId),
  });

  const {
    members,
    total: membersTotal,
    limit: membersLimit,
    loading: membersLoading,
    error: membersError,
    reload: reloadMembers,
  } = useOwnerOrganizationMembers({
    orgId,
    enabled: activeTab === "members" || activeTab === "roles",
    page: membersPage,
    limit: 10,
    search: membersSearch || undefined,
    status: memberStatusFilter || undefined,
    role_code: memberRoleFilter || undefined,
  });

  const organization = organizationQuery.data ?? null;
  const organizationLoading = organizationQuery.isLoading;
  const organizationError =
    organizationQuery.error instanceof Error ? organizationQuery.error.message : "";
  const branding = brandingQuery.data ?? null;
  const brandingLoading = brandingQuery.isLoading;
  const brandingQueryError =
    brandingQuery.error instanceof Error ? brandingQuery.error.message : "";
  const config = configQuery.data ?? null;
  const configLoading = configQuery.isLoading;
  const configError =
    configQuery.error instanceof Error ? configQuery.error.message : "";
  const identityLoading = identityConfigQuery.isLoading;
  const identityQueryError =
    identityConfigQuery.error instanceof Error ? identityConfigQuery.error.message : "";
  const identityWorkflows = identityWorkflowsQuery.data ?? [];
  const identityWorkflowsLoading =
    identityWorkflowsQuery.isLoading || identityWorkflowsQuery.isFetching;
  const identityWorkflowsQueryError =
    identityWorkflowsQuery.error instanceof Error
      ? identityWorkflowsQuery.error.message
      : "";
  const activeIdentityWorkflow = activeIdentityWorkflowQuery.data ?? null;
  const activeIdentityWorkflowLoading =
    activeIdentityWorkflowQuery.isLoading || activeIdentityWorkflowQuery.isFetching;
  const activeIdentityWorkflowError =
    activeIdentityWorkflowQuery.error instanceof Error
      ? activeIdentityWorkflowQuery.error.message
      : "";
  const scopes = scopesQuery.data ?? [];
  const scopesLoading = scopesQuery.isLoading || scopesQuery.isFetching;
  const scopesQueryError =
    scopesQuery.error instanceof Error ? scopesQuery.error.message : "";
  const apiKeys = apiKeysQuery.data ?? [];
  const apiKeysLoading = apiKeysQuery.isLoading || apiKeysQuery.isFetching;
  const apiKeysQueryError =
    apiKeysQuery.error instanceof Error ? apiKeysQuery.error.message : "";
  const onboarding = onboardingQuery.data ?? null;
  const onboardingLoading = onboardingQuery.isLoading;
  const onboardingQueryError =
    onboardingQuery.error instanceof Error ? onboardingQuery.error.message : "";
  const selectedMember = selectedMemberDraft;
  const selectedMemberLoading = selectedMemberQuery.isLoading || selectedMemberQuery.isFetching;
  const selectedMemberError =
    selectedMemberQuery.error instanceof Error ? selectedMemberQuery.error.message : "";
  const rolesLoading = rolesQuery.isLoading;
  const rolesError = rolesQuery.error instanceof Error ? rolesQuery.error.message : "";
  const assignableRoles = useMemo<RoleCatalogItem[]>(
    () => (rolesQuery.data ?? []).filter((role) => !SYSTEM_HIDDEN_ROLE_CODES.has(role.code)),
    [rolesQuery.data]
  );

  const roleMatrix = useMemo(() => {
    const grouped: Record<string, OrgUserListItem[]> = {};
    members.forEach((member) => {
      const roleCodes = (member.roles ?? []).map(roleCodeFromUnknown);
      if (roleCodes.length === 0) {
        grouped.UNASSIGNED = [...(grouped.UNASSIGNED ?? []), member];
        return;
      }
      roleCodes.forEach((roleCode) => {
        grouped[roleCode] = [...(grouped[roleCode] ?? []), member];
      });
    });
    return grouped;
  }, [members]);

  const onboardingAssets = useMemo(() => getOnboardingAssets(onboarding?.raw), [onboarding?.raw]);

  const assignableRoleCodes = useMemo(() => assignableRoles.map((role) => role.code), [assignableRoles]);
  const selectedMembersOnPage = useMemo(
    () => members.filter((member) => selectedMemberIds.includes(member.id)),
    [members, selectedMemberIds]
  );
  const allMembersOnPageSelected =
    members.length > 0 && members.every((member) => selectedMemberIds.includes(member.id));

  const updateTab = (tab: DetailTabId) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tab);
    router.replace(`/owner/organizations/${orgId}?${next.toString()}`);
  };

  const fetchMemberDetail = useCallback(async (userId: string) => {
    setSelectedMemberId(userId);
    setTemporaryPassword(null);
  }, []);

  const closeMemberDrawer = () => {
    setSelectedMemberId("");
    setSelectedMemberDraft(null);
    setTemporaryPassword(null);
    setMemberActionError("");
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const toggleSelectAllMembersOnPage = () => {
    setSelectedMemberIds((current) =>
      allMembersOnPageSelected
        ? current.filter((id) => !members.some((member) => member.id === id))
        : Array.from(new Set([...current, ...members.map((member) => member.id)]))
    );
  };

  const openMemberBatchAction = (action: MembersBatchAction) => {
    setMemberBatchAction(action);
    setMemberBatchRoleCodes([]);
    setMemberBatchError("");
    setMemberBatchResult(null);
    setMemberBatchOpen(true);
  };

  const closeMemberBatchAction = () => {
    if (memberBatchLoading) return;
    setMemberBatchOpen(false);
    setMemberBatchAction(null);
    setMemberBatchRoleCodes([]);
    setMemberBatchError("");
    setMemberBatchResult(null);
  };

  useEffect(() => {
    if (!organization) return;
    setGeneralForm({
      name: organization.name ?? "",
      status: organization.status ?? "ACTIVE",
      organization_type: organization.organization_type ?? "",
      country: organization.country ?? "",
      currency: organization.currency ?? "",
      company_legal_name: organization.company_legal_name ?? "",
      website: organization.website ?? "",
      industry: organization.industry ?? "",
      fiscal_id: organization.fiscal_id ?? "",
      swift: organization.swift ?? "",
      default_daily_account_limit:
        organization.default_daily_account_limit != null
          ? String(organization.default_daily_account_limit)
          : organization.defaultDailyAccountLimit != null
            ? String(organization.defaultDailyAccountLimit)
            : "",
    });
  }, [organization]);

  useEffect(() => {
    setMemberCreateForm((current) => ({
      ...current,
      roles:
        current.roles.filter((role) => assignableRoles.some((item) => item.code === role)).length > 0
          ? current.roles.filter((role) => assignableRoles.some((item) => item.code === role))
          : assignableRoles[0]
            ? [assignableRoles[0].code]
            : [],
    }));
  }, [assignableRoles]);

  useEffect(() => {
    if (!branding) return;
    setBrandingForm({
      color_a: branding.color_a ?? "#004492",
      color_b: branding.color_b ?? "#0FADCF",
    });
  }, [branding]);

  useEffect(() => {
    if (!identityConfigQuery.data) return;
    setIdentityConfigText(prettifyJson(identityConfigQuery.data));
  }, [identityConfigQuery.data]);

  useEffect(() => {
    setConfigForm(buildConfigFormState(config));
  }, [config]);

  useEffect(() => {
    if (!onboarding) return;
    setDevelopmentUrls(onboarding.developmentEnvironments?.development_urls ?? "");
    setDevelopmentApiKeys(onboarding.developmentEnvironments?.api_keys ?? "");
  }, [onboarding]);

  useEffect(() => {
    if (!selectedMemberQuery.data) return;
    setSelectedMemberDraft(selectedMemberQuery.data);
  }, [selectedMemberQuery.data]);

  useEffect(() => {
    setSelectedMemberIds((current) => {
      const next = current.filter((id) => members.some((member) => member.id === id));
      if (next.length === current.length && next.every((id, index) => id === current[index])) {
        return current;
      }
      return next;
    });
  }, [members]);

  useEffect(() => {
    if (!flash) return;
    toast.success(flash);
    setFlash("");
  }, [flash]);

  const syncOrganizationCaches = useCallback(
    (updated: OrganizationAdmin) => {
      queryClient.setQueryData(queryKeys.ownerOrganization(orgId), updated);
      queryClient.setQueryData<OrganizationAdmin[]>(queryKeys.ownerOrganizations, (current = []) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      );
    },
    [orgId, queryClient]
  );

  const refreshOrganizationCaches = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.ownerOrganization(orgId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.ownerOrganizations }),
    ]);
  }, [orgId, queryClient]);

  const refreshBranding = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.ownerOrganizationBranding(orgId),
    });
  }, [orgId, queryClient]);

  const refreshIdentityConfig = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.ownerOrganizationIdentityConfig(orgId),
    });
  }, [orgId, queryClient]);

  const refreshIdentityWorkflows = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.ownerOrganizationIdentityWorkflows(orgId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.ownerOrganizationActiveIdentityWorkflow(orgId),
      }),
    ]);
  }, [orgId, queryClient]);

  const refreshScopes = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.ownerOrganizationScopes(orgId),
    });
  }, [orgId, queryClient]);

  const refreshApiKeys = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.ownerOrganizationApiKeys(orgId),
    });
  }, [orgId, queryClient]);

  const refreshOnboarding = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.ownerOrganizationOnboarding(orgId),
    });
  }, [orgId, queryClient]);

  const refreshConfig = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.ownerOrganizationConfig(orgId),
    });
  }, [orgId, queryClient]);

  const refreshSelectedMember = useCallback(async () => {
    if (!selectedMemberId) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.ownerOrganizationMemberDetail(orgId, selectedMemberId),
    });
  }, [orgId, queryClient, selectedMemberId]);

  const submitGeneralInfo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralSaving(true);
    setGeneralError("");
    try {
      const normalizedCountry = generalForm.country.trim().toUpperCase();
      const normalizedCurrency = generalForm.currency.trim().toUpperCase();
      const normalizedWebsite = generalForm.website.trim();
      const normalizedSwift = generalForm.swift.trim();
      const normalizedLimit = generalForm.default_daily_account_limit.trim();

      if (normalizedCountry && !/^[A-Z]{2}$/.test(normalizedCountry)) {
        throw new Error("Pais debe usar codigo ISO de 2 letras. Ejemplo: EC.");
      }
      if (normalizedCurrency && !/^[A-Z]{3}$/.test(normalizedCurrency)) {
        throw new Error("Moneda debe usar codigo ISO de 3 letras. Ejemplo: USD.");
      }
      if (normalizedWebsite && !isValidAbsoluteUrl(normalizedWebsite)) {
        throw new Error("Sitio web debe ser una URL valida completa. Ejemplo: https://zwippe.com");
      }
      if (normalizedLimit && Number.isNaN(Number(normalizedLimit))) {
        throw new Error("Limite diario por defecto debe ser numerico.");
      }

      const updated = await updateOrganization(orgId, {
        name: generalForm.name.trim(),
        status: generalForm.status.trim(),
        organization_type: generalForm.organization_type.trim() || undefined,
        country: normalizedCountry || undefined,
        currency: normalizedCurrency || undefined,
        company_legal_name: generalForm.company_legal_name.trim() || undefined,
        website: normalizedWebsite || null,
        industry: generalForm.industry.trim() || undefined,
        fiscal_id: generalForm.fiscal_id.trim() || undefined,
        swift: normalizedSwift || null,
        default_daily_account_limit: normalizedLimit ? Number(normalizedLimit) : null,
      });
      syncOrganizationCaches(updated);
      setFlash("Informacion general actualizada.");
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "No se pudo actualizar la informacion general.");
    } finally {
      setGeneralSaving(false);
    }
  };

  const submitBranding = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBrandingSaving(true);
    setBrandingError("");
    try {
      if (!HEX_REGEX.test(brandingForm.color_a.trim()) || !HEX_REGEX.test(brandingForm.color_b.trim())) {
        throw new Error("Los colores deben usar el formato #RRGGBB.");
      }
      const updated = await updateOrganizationAdminBranding(orgId, {
        color_a: brandingForm.color_a.trim(),
        color_b: brandingForm.color_b.trim(),
      });
      queryClient.setQueryData(queryKeys.ownerOrganizationBranding(orgId), updated);
      setFlash("Marca actualizada.");
    } catch (err) {
      setBrandingError(err instanceof Error ? err.message : "No se pudo actualizar la marca.");
    } finally {
      setBrandingSaving(false);
    }
  };

  const uploadBrandingAsset = async (type: BrandingLogoType, file: File | null) => {
    if (!file) return;
    setBrandingUploading(type);
    setBrandingError("");
    try {
      const updated = await uploadOrganizationAdminLogo(orgId, file, type);
      queryClient.setQueryData(queryKeys.ownerOrganizationBranding(orgId), updated);
      setBrandingAssetVersion(Date.now());
      setBrandingForm((current) => ({
        ...current,
        color_a: updated.color_a ?? current.color_a,
        color_b: updated.color_b ?? current.color_b,
      }));
      setFlash(`Archivo ${type} cargado correctamente.`);
    } catch (err) {
      setBrandingError(err instanceof Error ? err.message : "No se pudo cargar el archivo.");
    } finally {
      setBrandingUploading(null);
    }
  };

  const saveIdentityConfig = async () => {
    setIdentitySaving(true);
    setIdentityError("");
    try {
      const payload = JSON.parse(identityConfigText) as OrganizationIdentityConfig;
      const updated = await updateOrganizationIdentityConfig(orgId, payload);
      queryClient.setQueryData(queryKeys.ownerOrganizationIdentityConfig(orgId), updated);
      setIdentityConfigText(prettifyJson(updated));
      setFlash("Configuracion de identidad actualizada.");
    } catch (err) {
      setIdentityError(err instanceof Error ? err.message : "No se pudo actualizar la configuracion de identidad.");
    } finally {
      setIdentitySaving(false);
    }
  };

  const openCreateWorkflowEditor = () => {
    setWorkflowError("");
    setWorkflowEditingId(null);
    setWorkflowForm(buildDefaultWorkflowFormState());
    setWorkflowEditorOpen(true);
  };

  const openEditWorkflowEditor = (workflow: IdentityWorkflowItem) => {
    setWorkflowError("");
    setWorkflowEditingId(workflow.id);
    setWorkflowForm({
      name: workflow.name,
      document_type: workflow.document_type,
      biometry_method: workflow.biometry_method,
      is_active: workflow.is_active,
    });
    setWorkflowEditorOpen(true);
  };

  const closeWorkflowEditor = () => {
    setWorkflowEditorOpen(false);
    setWorkflowEditingId(null);
    setWorkflowError("");
    setWorkflowForm(buildDefaultWorkflowFormState());
  };

  const saveWorkflow = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWorkflowSaving(true);
    setWorkflowError("");
    try {
      const payload = {
        name: workflowForm.name.trim(),
        document_type: workflowForm.document_type,
        biometry_method: workflowForm.biometry_method,
        is_active: workflowForm.is_active,
      };
      if (!payload.name) {
        throw new Error("El nombre del workflow es obligatorio.");
      }
      if (workflowEditingId) {
        await updateIdentityWorkflow(orgId, workflowEditingId, payload);
        setFlash("Workflow de identidad actualizado.");
      } else {
        await createIdentityWorkflow(orgId, payload);
        setFlash("Workflow de identidad creado.");
      }
      await refreshIdentityWorkflows();
      closeWorkflowEditor();
    } catch (err) {
      setWorkflowError(
        err instanceof Error ? err.message : "No se pudo guardar el workflow de identidad."
      );
    } finally {
      setWorkflowSaving(false);
    }
  };

  const activateWorkflow = async (workflow: IdentityWorkflowItem) => {
    if (workflow.is_active) return;
    if (
      !window.confirm(
        `Activar "${workflow.name}"? Los otros workflows de esta organizacion quedaran inactivos automaticamente.`
      )
    ) {
      return;
    }
    setWorkflowActionLoading(workflow.id);
    setWorkflowError("");
    try {
      await updateIdentityWorkflow(orgId, workflow.id, {
        name: workflow.name,
        document_type: workflow.document_type,
        biometry_method: workflow.biometry_method,
        is_active: true,
      });
      await refreshIdentityWorkflows();
      setFlash("Workflow activado.");
    } catch (err) {
      setWorkflowError(
        err instanceof Error ? err.message : "No se pudo activar el workflow."
      );
    } finally {
      setWorkflowActionLoading(null);
    }
  };

  const removeWorkflow = async (workflow: IdentityWorkflowItem) => {
    if (
      !window.confirm(
        `Eliminar "${workflow.name}"? Esta accion es destructiva y no se puede deshacer.`
      )
    ) {
      return;
    }
    setWorkflowActionLoading(workflow.id);
    setWorkflowError("");
    try {
      await deleteIdentityWorkflow(orgId, workflow.id);
      if (workflowEditingId === workflow.id) {
        closeWorkflowEditor();
      }
      await refreshIdentityWorkflows();
      setFlash("Workflow eliminado.");
    } catch (err) {
      setWorkflowError(
        err instanceof Error ? err.message : "No se pudo eliminar el workflow."
      );
    } finally {
      setWorkflowActionLoading(null);
    }
  };

  const saveOrganizationConfig = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfigSaving(true);
    setConfigSubmitError("");
    try {
      const payload = buildConfigPayload(configForm);
      if (
        payload.auth?.otp_ttl_minutes != null &&
        Number.isNaN(payload.auth.otp_ttl_minutes)
      ) {
        throw new Error("El OTP TTL debe ser numerico.");
      }
      const updated = await updateOrganizationConfig(orgId, payload);
      queryClient.setQueryData(queryKeys.ownerOrganizationConfig(orgId), updated);
      if (updated.identity) {
        queryClient.setQueryData(
          queryKeys.ownerOrganizationIdentityConfig(orgId),
          updated.identity
        );
      }
      setFlash("Configuracion general actualizada.");
      await Promise.all([refreshConfig(), refreshIdentityConfig()]);
    } catch (err) {
      setConfigSubmitError(
        err instanceof Error ? err.message : "No se pudo actualizar la configuracion general."
      );
    } finally {
      setConfigSaving(false);
    }
  };

  const addScopes = async () => {
    const payload = newScopesText
      .split(/\r?\n|,/)
      .map((scope) => scope.trim())
      .filter(Boolean);
    if (payload.length === 0) return;
    setScopesSaving(true);
    setScopesError("");
    try {
      await addOrganizationScopes(orgId, payload);
      setNewScopesText("");
      await Promise.all([refreshScopes(), refreshOrganizationCaches()]);
      setFlash("Permisos agregados.");
    } catch (err) {
      setScopesError(err instanceof Error ? err.message : "No se pudieron agregar los permisos.");
    } finally {
      setScopesSaving(false);
    }
  };

  const deleteScope = async (scope: string) => {
    if (!window.confirm(`Eliminar el permiso "${scope}" de esta organizacion?`)) return;
    setScopesSaving(true);
    setScopesError("");
    try {
      await removeOrganizationScope(orgId, encodeScopeForUrl(scope));
      await Promise.all([refreshScopes(), refreshOrganizationCaches()]);
      setFlash("Permiso removido.");
    } catch (err) {
      setScopesError(err instanceof Error ? err.message : "No se pudo remover el permiso.");
    } finally {
      setScopesSaving(false);
    }
  };

  const submitCreateMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMemberActionLoading(true);
    setMemberActionError("");
    try {
      await createOrgUser(orgId, {
        email: memberCreateForm.email.trim(),
        full_name: memberCreateForm.full_name.trim(),
        roles: memberCreateForm.roles,
      });
      setMemberCreateOpen(false);
      setMemberCreateForm({
        full_name: "",
        email: "",
        roles: [TEAM_ROLE.ORG_ADMIN],
      });
      await reloadMembers();
      if (selectedMemberId) await refreshSelectedMember();
      setFlash("Miembro creado correctamente.");
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "No se pudo crear el miembro.");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const saveSelectedMember = async () => {
    if (!selectedMember) return;
    setMemberActionLoading(true);
    setMemberActionError("");
    try {
      await updateOrgUser(orgId, selectedMember.id, {
        full_name: selectedMember.full_name,
        status: selectedMember.status,
      });
      await refreshSelectedMember();
      await reloadMembers();
      setFlash("Perfil del miembro actualizado.");
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "No se pudo actualizar el perfil del miembro.");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const addRoleToSelectedMember = async (roleCode: string) => {
    if (!selectedMember) return;
    const currentRoles = (selectedMember.roles ?? []).map((role) => role.code);
    if (currentRoles.includes(roleCode)) return;
    setMemberActionLoading(true);
    setMemberActionError("");
    try {
      await assignOrgUserRoles(orgId, selectedMember.id, { role_codes: [roleCode] });
      await refreshSelectedMember();
      await reloadMembers();
      setFlash(`Rol ${roleCode} asignado.`);
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "No se pudo asignar el rol.");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const removeRoleFromSelectedMember = async (roleId: string, roleCode: string) => {
    if (!selectedMember) return;
    if (!window.confirm(`Remover el rol "${roleCode}" de ${selectedMember.full_name}?`)) return;
    setMemberActionLoading(true);
    setMemberActionError("");
    try {
      await removeOrgUserRole(orgId, selectedMember.id, roleId);
      await refreshSelectedMember();
      await reloadMembers();
      setFlash(`Rol ${roleCode} removido.`);
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "No se pudo remover el rol.");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const resetSelectedMemberPassword = async () => {
    if (!selectedMember) return;
    if (!window.confirm(`Resetear contrasena para ${selectedMember.email}?`)) return;
    setMemberActionLoading(true);
    setMemberActionError("");
    try {
      const result = await resetOrgUserPassword(orgId, selectedMember.id);
      setTemporaryPassword(result.temporary_password);
      setFlash("Contrasena temporal generada.");
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "No se pudo resetear la contrasena.");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const toggleMemberStatus = async (member: OrgUserListItem) => {
    const nextStatus: OrgUserStatus = member.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    if (!window.confirm(`¿Cambiar el estado de ${member.full_name} a ${nextStatus}?`)) return;
    setMemberActionLoading(true);
    setMemberActionError("");
    try {
      await updateOrgUser(orgId, member.id, {
        full_name: member.full_name,
        status: nextStatus,
      });
      setFlash(`El miembro ${member.full_name} fue actualizado.`);
      await reloadMembers();
      if (selectedMemberId === member.id) {
        await refreshSelectedMember();
      }
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "No se pudo actualizar el estado del miembro.");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const resetMemberPasswordDirectly = async (member: OrgUserListItem) => {
    if (!window.confirm(`¿Resetear contraseña para ${member.email}?`)) return;
    setMemberActionLoading(true);
    setMemberActionError("");
    try {
      const result = await resetOrgUserPassword(orgId, member.id);
      setSelectedMemberId(member.id);
      setTemporaryPassword(result.temporary_password);
      setFlash(`Contraseña temporal generada para ${member.full_name}.`);
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "No se pudo resetear la contraseña.");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const executeMemberBatchAction = async () => {
    if (!memberBatchAction || selectedMemberIds.length === 0) return;
    setMemberBatchLoading(true);
    setMemberBatchError("");
    try {
      let result: BatchActionResponse;
      if (memberBatchAction === "activate") {
        result = await batchUpdateOrgUsersStatus(orgId, {
          user_ids: selectedMemberIds,
          status: "ACTIVE",
        });
      } else if (memberBatchAction === "disable") {
        result = await batchUpdateOrgUsersStatus(orgId, {
          user_ids: selectedMemberIds,
          status: "DISABLED",
        });
      } else if (memberBatchAction === "assign-roles") {
        if (memberBatchRoleCodes.length === 0) {
          throw new Error("Selecciona al menos un rol para asignar.");
        }
        result = await batchAssignOrgUserRoles(orgId, {
          user_ids: selectedMemberIds,
          role_codes: memberBatchRoleCodes,
        });
      } else if (memberBatchAction === "remove-roles") {
        if (memberBatchRoleCodes.length === 0) {
          throw new Error("Selecciona al menos un rol para remover.");
        }
        result = await batchRemoveOrgUserRoles(orgId, {
          user_ids: selectedMemberIds,
          role_codes: memberBatchRoleCodes,
        });
      } else {
        result = await batchResetOrgUserPasswords(orgId, {
          user_ids: selectedMemberIds,
        });
      }

      setMemberBatchResult(result);
      await Promise.all([reloadMembers(), selectedMemberId ? refreshSelectedMember() : Promise.resolve()]);
      if (result.failed === 0) {
        setFlash(`Accion batch completada sobre ${result.succeeded} miembro(s).`);
      } else {
        toast.warning(
          `${result.succeeded} exitosos y ${result.failed} con error en la accion batch.`
        );
      }
      setSelectedMemberIds([]);
    } catch (err) {
      setMemberBatchError(
        err instanceof Error ? err.message : "No se pudo ejecutar la accion batch."
      );
    } finally {
      setMemberBatchLoading(false);
    }
  };

  const revealSecret = async (apiKeyId: string) => {
    setApiKeyActionLoading(apiKeyId);
    setApiKeysError("");
    try {
      const result = await getApiKeySecret(apiKeyId, orgId);
      setRevealedSecrets((current) => ({ ...current, [apiKeyId]: result.api_secret }));
    } catch (err) {
      setApiKeysError(err instanceof Error ? err.message : "No se pudo revelar el secreto.");
    } finally {
      setApiKeyActionLoading(null);
    }
  };

  const rotateKeys = async () => {
    if (!window.confirm("Rotar las API keys de esta organizacion? Las credenciales actuales pueden dejar de servir.")) return;
    setApiKeyActionLoading("rotate");
    setApiKeysError("");
    try {
      const result = await rotateApiKeys(orgId);
      setRevealedSecrets((current) => ({ ...current, rotated: result.api_secret }));
      await refreshApiKeys();
      setFlash("Claves API rotadas.");
    } catch (err) {
      setApiKeysError(err instanceof Error ? err.message : "No se pudieron rotar las claves API.");
    } finally {
      setApiKeyActionLoading(null);
    }
  };

  const revokeKey = async (apiKeyId: string) => {
    if (!window.confirm("Revocar esta API key?")) return;
    setApiKeyActionLoading(apiKeyId);
    setApiKeysError("");
    try {
      await revokeApiKey(apiKeyId, orgId);
      await refreshApiKeys();
      setFlash("API key revocada.");
    } catch (err) {
      setApiKeysError(err instanceof Error ? err.message : "No se pudo revocar la clave API.");
    } finally {
      setApiKeyActionLoading(null);
    }
  };

  const runOnboardingAction = async (action: string, callback: () => Promise<unknown>) => {
    setOnboardingActionLoading(action);
    setOnboardingError("");
    try {
      await callback();
      await refreshOnboarding();
      setFlash("Seccion de onboarding actualizada.");
    } catch (err) {
      setOnboardingError(err instanceof Error ? err.message : "No se pudo actualizar onboarding.");
    } finally {
      setOnboardingActionLoading("");
    }
  };

  const saveDevelopmentEnvironments = async () => {
    const payload: DevelopmentEnvironmentsPayload = {
      development_urls: developmentUrls,
      development_api_keys: developmentApiKeys,
    };
    await runOnboardingAction("development-environments", () =>
      putDevelopmentEnvironments(orgId, payload)
    );
  };

  if (organizationLoading) {
    return (
      <div className="mx-auto w-full max-w-[1440px]">
        <Breadcrumb pageName={PAGE_TITLE} />
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!organization || organizationError) {
    return (
      <div className="mx-auto w-full max-w-[1440px] space-y-4">
        <Breadcrumb pageName={PAGE_TITLE} />
        <ErrorAlert message={organizationError || "Organizacion no encontrada."} />
        <Link href="/owner/organizations" className="text-sm font-medium text-primary hover:underline">
          Volver al directorio global
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <Breadcrumb pageName={PAGE_TITLE} />

      <div className="flex flex-col gap-4 rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-dark dark:text-white">{organization.name}</h1>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(organization.status)}`}>
              {organization.status}
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {organization.organization_type || "Sin tipo"}
            </span>
          </div>
          <div className="font-mono text-xs text-dark-6 dark:text-dark-6">{organization.id}</div>
          <p className="max-w-3xl text-sm text-dark-6 dark:text-dark-6">
            Espacio exclusivo de OWNER. Los usuarios `ORG_ADMIN` no ven esta seccion y siguen restringidos al alcance de su propia organizacion.
          </p>
        </div>
        <Link
          href="/owner/organizations"
          className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
        >
          Volver al directorio
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-stroke pb-3 dark:border-dark-3">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => updateTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-primary text-white"
                : "border border-stroke text-dark hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ShowcaseSection title="Resumen" className="!p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Razon social" value={organization.company_legal_name || "N/A"} />
              <InfoItem label="Pais" value={organization.country || "N/A"} />
              <InfoItem label="Moneda" value={organization.currency || "N/A"} />
              <InfoItem label="Sitio web" value={organization.website || "N/A"} />
              <InfoItem label="Industria" value={organization.industry || "N/A"} />
              <InfoItem label="Identificacion fiscal" value={organization.fiscal_id || "N/A"} />
              <InfoItem label="SWIFT" value={organization.swift || "N/A"} />
              <InfoItem
                label="Limite diario por defecto"
                value={
                  organization.default_daily_account_limit != null
                    ? String(organization.default_daily_account_limit)
                    : organization.defaultDailyAccountLimit != null
                      ? String(organization.defaultDailyAccountLimit)
                      : "N/A"
                }
              />
              <InfoItem label="Creado" value={formatDate(organization.created_at)} />
              <InfoItem label="Actualizado" value={formatDate(organization.updated_at)} />
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="Snapshot Operativo" className="!p-6">
            <div className="space-y-4">
              <SnapshotRow label="Scopes asignados" value={String(organization.scopes?.length ?? scopes.length)} />
              <SnapshotRow label="Onboarding verificado" value={organization.onboarding_verified ? "Si" : "No"} />
              <SnapshotRow label="KYB verificado" value={organization.kyb_verified ? "Si" : "No"} />
              <SnapshotRow label="Plan de negocio" value={onboarding?.businessPlan.uploaded ? "Cargado" : "Pendiente"} />
              <SnapshotRow
                label="Workflow activo"
                value={
                  activeIdentityWorkflowLoading
                    ? "Cargando..."
                    : activeIdentityWorkflow?.name ?? "Sin workflow activo"
                }
              />
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="Configuracion General" className="!p-6 xl:col-span-2">
            <p className="mb-4 text-sm text-dark-6 dark:text-dark-6">
              Este bloque resume la configuracion actual de la organizacion. Para realizar cambios, usa las pestañas dedicadas de cada modulo.
            </p>
            {configLoading ? (
              <p className="text-sm text-dark-6 dark:text-dark-6">Cargando configuracion...</p>
            ) : configError ? (
              <ErrorAlert message={configError} />
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-3">
                  <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                    <div className="mb-4 text-sm font-medium text-dark dark:text-white">Autenticacion</div>
                    <div className="space-y-3 text-sm">
                      <div className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                        <div className="mb-1 text-dark-6 dark:text-dark-6">
                          Registro en app
                        </div>
                        <div className="font-medium text-dark dark:text-white">
                          {configForm.auth.app_registration_enabled ? "Habilitado" : "Deshabilitado"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                        <div className="mb-1 text-dark-6 dark:text-dark-6">
                          OTP TTL en minutos
                        </div>
                        <div className="font-medium text-dark dark:text-white">
                          {configForm.auth.otp_ttl_minutes || "No definido"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                    <div className="mb-4 text-sm font-medium text-dark dark:text-white">Identidad</div>
                    <div className="space-y-3 text-sm">
                      <div className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                        <div className="mb-1 text-dark-6 dark:text-dark-6">Estado de verificacion</div>
                        <div className="font-medium text-dark dark:text-white">
                          {activeIdentityWorkflowLoading
                            ? "Cargando..."
                            : activeIdentityWorkflow
                              ? activeIdentityWorkflow.name
                              : "No configurado"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                        <div className="mb-1 text-dark-6 dark:text-dark-6">Configuracion activa</div>
                        <div className="font-medium text-dark dark:text-white">
                          {activeIdentityWorkflowLoading
                            ? "Cargando..."
                            : workflowStatusSummary(activeIdentityWorkflow)}
                        </div>
                      </div>
                      <p className="text-xs text-dark-6 dark:text-dark-6">
                        Si necesitas definir o cambiar el flujo de verificacion, usa la pestaña
                        Workflows de Identidad.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                    <div className="mb-4 text-sm font-medium text-dark dark:text-white">AML</div>
                    <div className="space-y-4">
                      <div className="rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                        <div className="mb-1 text-dark-6 dark:text-dark-6">
                          Screening
                        </div>
                        <div className="font-medium text-dark dark:text-white">
                          {configForm.aml.screening_enabled ? "Habilitado" : "Deshabilitado"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300">
                  La edicion operativa de esta organizacion se hace desde sus pestañas
                  especializadas, especialmente Workflows de Identidad para verificacion.
                </div>
              </div>
            )}
          </ShowcaseSection>
        </div>
      ) : null}

      {activeTab === "general" ? (
        <ShowcaseSection title="Informacion General" className="!p-6">
          <form onSubmit={submitGeneralInfo} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Nombre de la organizacion" value={generalForm.name} onChange={(value) => setGeneralForm((current) => ({ ...current, name: value }))} required />
              <FormSelect label="Estado" value={generalForm.status} onChange={(value) => setGeneralForm((current) => ({ ...current, status: value }))} options={["ACTIVE", "DISABLED"]} />
              <FormSelect label="Tipo de organizacion" value={generalForm.organization_type} onChange={(value) => setGeneralForm((current) => ({ ...current, organization_type: value }))} options={["", "CLIENT", "MERCHANT"]} />
              <FormSelect label="Pais" value={generalForm.country} onChange={(value) => setGeneralForm((current) => ({ ...current, country: value }))} options={ORGANIZATION_COUNTRY_OPTIONS} />
              <FormSelect label="Moneda" value={generalForm.currency} onChange={(value) => setGeneralForm((current) => ({ ...current, currency: value }))} options={ORGANIZATION_CURRENCY_OPTIONS} />
              <FormField label="Identificacion fiscal" value={generalForm.fiscal_id} onChange={(value) => setGeneralForm((current) => ({ ...current, fiscal_id: value }))} />
              <FormField label="Razon social" value={generalForm.company_legal_name} onChange={(value) => setGeneralForm((current) => ({ ...current, company_legal_name: value }))} />
              <FormField label="Industria" value={generalForm.industry} onChange={(value) => setGeneralForm((current) => ({ ...current, industry: value }))} />
              <FormField label="SWIFT" value={generalForm.swift} onChange={(value) => setGeneralForm((current) => ({ ...current, swift: value }))} />
              <FormField label="Limite diario por defecto" value={generalForm.default_daily_account_limit} onChange={(value) => setGeneralForm((current) => ({ ...current, default_daily_account_limit: value }))} />
            </div>
            <FormField label="Sitio web" value={generalForm.website} onChange={(value) => setGeneralForm((current) => ({ ...current, website: value }))} />
            {generalError ? <ErrorAlert message={generalError} /> : null}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={generalSaving}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {generalSaving ? "Guardando..." : "Guardar informacion general"}
              </button>
            </div>
          </form>
        </ShowcaseSection>
      ) : null}

      {activeTab === "branding" ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ShowcaseSection title="Configuracion de Branding" className="!p-6">
            {brandingLoading ? (
              <p className="text-sm text-dark-6 dark:text-dark-6">Cargando branding...</p>
            ) : (
              <form onSubmit={submitBranding} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stroke bg-gray-1/60 px-4 py-4 dark:border-dark-3 dark:bg-dark-2/60">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-dark dark:text-white">
                      Paleta institucional
                    </div>
                    <p className="text-sm text-dark-6 dark:text-dark-6">
                      Define los colores base de la organizacion. Los logos se gestionan en el panel lateral.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <ColorChip label="Primario" value={brandingForm.color_a} />
                    <ColorChip label="Secundario" value={brandingForm.color_b} />
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <ColorField
                    label="Color primario"
                    value={brandingForm.color_a}
                    onChange={(value) =>
                      setBrandingForm((current) => ({ ...current, color_a: value }))
                    }
                  />
                  <ColorField
                    label="Color secundario"
                    value={brandingForm.color_b}
                    onChange={(value) =>
                      setBrandingForm((current) => ({ ...current, color_b: value }))
                    }
                  />
                </div>
                {brandingError || brandingQueryError ? <ErrorAlert message={brandingError || brandingQueryError} /> : null}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={brandingSaving}
                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {brandingSaving ? "Guardando..." : "Guardar marca"}
                  </button>
                </div>
              </form>
            )}
          </ShowcaseSection>

          <ShowcaseSection title="Carga de Logos" className="!p-6">
            <div className="space-y-4">
              <LogoUploadCard
                label="Logo principal"
                description="Acepta PNG. La vista previa usa un fondo oscuro de referencia para distinguir mejor el archivo cargado."
                src={withCacheBust(branding?.url_log, brandingAssetVersion)}
                loading={brandingUploading === "logo"}
                onChange={(file) => void uploadBrandingAsset("logo", file)}
              />
              <LogoUploadCard
                label="Logo para fondos oscuros"
                description="Acepta PNG. Este bloque mantiene un fondo oscuro de referencia para validar contraste y legibilidad."
                src={withCacheBust(branding?.url_log_dark, brandingAssetVersion)}
                loading={brandingUploading === "logoDark"}
                onChange={(file) => void uploadBrandingAsset("logoDark", file)}
              />
              <LogoUploadCard
                label="Logo para fondos claros"
                description="Acepta PNG. La vista previa tambien usa un fondo oscuro de referencia para que el logo se distinga con claridad."
                src={withCacheBust(branding?.url_log_light, brandingAssetVersion)}
                loading={brandingUploading === "logoLight"}
                onChange={(file) => void uploadBrandingAsset("logoLight", file)}
              />
              <LogoUploadCard
                label="Icono de la aplicacion"
                description="Acepta PNG. El fondo de referencia ayuda a verificar el icono aunque tenga zonas claras o transparentes."
                src={withCacheBust(branding?.url_icon, brandingAssetVersion)}
                loading={brandingUploading === "icon"}
                onChange={(file) => void uploadBrandingAsset("icon", file)}
              />
            </div>
          </ShowcaseSection>
        </div>
      ) : null}

      {activeTab === "members" ? (
        <div className="space-y-6">
          <ShowcaseSection title="Directorio de Miembros" className="!p-6">
            <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300">
              OWNER opera miembros de cualquier organizacion desde aqui. `ORG_ADMIN` mantiene una experiencia separada y limitada a su propia organizacion.
            </div>
            <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_180px_180px_auto]">
              <input
                type="search"
                value={membersSearch}
                onChange={(event) => {
                  setMembersSearch(event.target.value);
                  setMembersPage(1);
                }}
                placeholder="Buscar por email o nombre completo"
                className="rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
              <select
                value={memberStatusFilter}
                onChange={(event) => {
                  setMemberStatusFilter(event.target.value as OrgUserStatus | "");
                  setMembersPage(1);
                }}
                className="rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
              </select>
              <select
                value={memberRoleFilter}
                onChange={(event) => {
                  setMemberRoleFilter(event.target.value);
                  setMembersPage(1);
                }}
                className="rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="">Todos los roles locales</option>
                {assignableRoleCodes.map((roleCode) => (
                  <option key={roleCode} value={roleCode}>
                    {roleCode}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setMemberActionError("");
                  setMemberCreateOpen(true);
                }}
                className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-opacity-90"
              >
                Agregar miembro
              </button>
            </div>

            {membersError ? <ErrorAlert message={membersError} /> : null}
            {memberActionError ? <ErrorAlert message={memberActionError} /> : null}
            {rolesError ? <ErrorAlert message={rolesError} /> : null}

            <div className="mb-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-4 sm:grid-cols-3">
                <MemberKpiCard label="Seleccionados" value={String(selectedMemberIds.length)} hint="En esta pagina" />
                <MemberKpiCard label="Activos" value={String(members.filter((member) => member.status === "ACTIVE").length)} hint="Visibles" />
                <MemberKpiCard label="Admins" value={String(members.filter((member) => (member.roles ?? []).map(roleCodeFromUnknown).includes(TEAM_ROLE.ORG_ADMIN)).length)} hint="Visibles" />
              </div>
              <div className="rounded-xl border border-stroke bg-gray-1/60 p-4 dark:border-dark-3 dark:bg-dark-2/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-dark dark:text-white">
                      Acciones batch
                    </div>
                    <div className="text-xs text-dark-6 dark:text-dark-6">
                      Selecciona varios miembros para ejecutar cambios en lote.
                    </div>
                  </div>
                  <div className="text-sm font-medium text-dark dark:text-white">
                    {selectedMemberIds.length} seleccionado(s)
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={selectedMemberIds.length === 0} onClick={() => openMemberBatchAction("activate")} className="rounded-md border border-stroke px-3 py-2 text-xs font-medium text-dark transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:text-white">Activar</button>
                  <button type="button" disabled={selectedMemberIds.length === 0} onClick={() => openMemberBatchAction("disable")} className="rounded-md border border-stroke px-3 py-2 text-xs font-medium text-dark transition hover:border-amber-500 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:text-white">Desactivar</button>
                  <button type="button" disabled={selectedMemberIds.length === 0} onClick={() => openMemberBatchAction("assign-roles")} className="rounded-md border border-stroke px-3 py-2 text-xs font-medium text-dark transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:text-white">Asignar roles</button>
                  <button type="button" disabled={selectedMemberIds.length === 0} onClick={() => openMemberBatchAction("remove-roles")} className="rounded-md border border-stroke px-3 py-2 text-xs font-medium text-dark transition hover:border-rose-500 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:text-white">Remover roles</button>
                  <button type="button" disabled={selectedMemberIds.length === 0} onClick={() => openMemberBatchAction("reset-password")} className="rounded-md border border-stroke px-3 py-2 text-xs font-medium text-dark transition hover:border-rose-500 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:text-white">Resetear contraseña</button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
              <div className="overflow-x-auto min-h-[250px]">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-gray-2/70 dark:bg-dark-2/80">
                    <tr className="border-b border-stroke dark:border-dark-3">
                      <th className="px-4 py-3">
                        <input type="checkbox" checked={allMembersOnPageSelected} onChange={toggleSelectAllMembersOnPage} className="h-4 w-4 rounded accent-primary" />
                      </th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Miembro</th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Roles</th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Actualizado</th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando miembros...</td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay miembros que coincidan con los filtros actuales.</td>
                      </tr>
                    ) : (
                      members.map((member, index) => {
                        const isLastMember = index === members.length - 1 && members.length > 1;
                        return (
                          <tr key={member.id} className="border-b border-stroke transition hover:bg-gray-1/50 dark:border-dark-3 dark:hover:bg-dark-2/60">
                          <td className="px-4 py-4 align-top">
                            <input type="checkbox" checked={selectedMemberIds.includes(member.id)} onChange={() => toggleMemberSelection(member.id)} className="mt-1 h-4 w-4 rounded accent-primary" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {member.full_name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U"}
                              </div>
                              <div className="space-y-1">
                                <div className="font-medium text-dark dark:text-white">{member.full_name}</div>
                                <div className="text-xs text-dark-6 dark:text-dark-6">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(member.status)}`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex max-w-[260px] flex-wrap gap-2">
                              {(member.roles ?? []).length > 0 ? (
                                (member.roles ?? []).map((role) => (
                                  <RoleBadge key={`${member.id}-${roleCodeFromUnknown(role)}`} code={roleCodeFromUnknown(role)} />
                                ))
                              ) : (
                                <span className="text-sm text-dark-6 dark:text-dark-6">Sin roles</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-dark dark:text-white">
                            <div className="space-y-1">
                              <div>{formatDate(member.updated_at)}</div>
                              {member.must_change_password ? (
                                <div className="text-xs text-amber-600 dark:text-amber-300">
                                  Requiere cambio de contraseña
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Dropdown
                              isOpen={activeDropdownMemberId === member.id}
                              setIsOpen={(open) => setActiveDropdownMemberId(open ? member.id : null)}
                            >
                              <DropdownTrigger className="rounded-full p-1.5 hover:bg-gray-2 dark:hover:bg-dark-3 text-dark-6 dark:text-dark-6 hover:text-dark dark:hover:text-white transition">
                                <svg
                                  className="h-5 w-5 fill-current"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </DropdownTrigger>
                              <DropdownContent
                                align="end"
                                className={`bg-white border border-stroke dark:bg-gray-dark dark:border-dark-3 py-1.5 w-48 shadow-lg ${
                                  isLastMember ? "bottom-full mb-1 origin-bottom-right mt-0 top-auto" : ""
                                }`}
                              >
                                <DropdownClose>
                                  <button
                                    type="button"
                                    onClick={() => void fetchMemberDetail(member.id)}
                                    className="flex w-full items-center px-4 py-2 text-xs font-medium text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-dark-3"
                                  >
                                    Ver detalle / Editar
                                  </button>
                                </DropdownClose>
                                <DropdownClose>
                                  <button
                                    type="button"
                                    onClick={() => void toggleMemberStatus(member)}
                                    className="flex w-full items-center px-4 py-2 text-xs font-medium text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-dark-3"
                                  >
                                    {member.status === "ACTIVE" ? "Desactivar" : "Activar"}
                                  </button>
                                </DropdownClose>
                                <DropdownClose>
                                  <button
                                    type="button"
                                    onClick={() => void resetMemberPasswordDirectly(member)}
                                    className="flex w-full items-center px-4 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                  >
                                    Resetear contraseña
                                  </button>
                                </DropdownClose>
                              </DropdownContent>
                            </Dropdown>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-dark-6 dark:text-dark-6">
              <span>Pagina {membersPage} · Mostrando {members.length} de {membersTotal}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={membersPage <= 1}
                  onClick={() => setMembersPage((current) => Math.max(1, current - 1))}
                  className="rounded-md border border-stroke px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={membersPage * membersLimit >= membersTotal}
                  onClick={() => setMembersPage((current) => current + 1)}
                  className="rounded-md border border-stroke px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </ShowcaseSection>
        </div>
      ) : null}

      {activeTab === "roles" ? (
        <ShowcaseSection title="Distribucion de Roles" className="!p-6">
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
            Los grupos salen de miembros reales, pero los roles asignables ahora vienen de `GET /roles`, ocultando roles de sistema que no deben usarse en la operacion normal de OWNER.
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[...assignableRoleCodes, "OTHER", "UNASSIGNED"].map((roleCode) => {
              const users =
                roleCode === "OTHER"
                  ? members.filter((member) =>
                      (member.roles ?? []).map(roleCodeFromUnknown).some((code) => !assignableRoleCodes.includes(code))
                    )
                  : roleCode === "UNASSIGNED"
                    ? roleMatrix.UNASSIGNED ?? []
                    : roleMatrix[roleCode] ?? [];
              return (
                <div key={roleCode} className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-dark-6 dark:text-dark-6">{roleCode}</div>
                  <div className="mt-2 text-3xl font-semibold text-dark dark:text-white">{users.length}</div>
                  <div className="mt-3 space-y-2">
                    {users.slice(0, 4).map((member) => (
                      <button
                        key={`${roleCode}-${member.id}`}
                        type="button"
                        onClick={() => {
                          updateTab("members");
                          void fetchMemberDetail(member.id);
                        }}
                        className="block text-left text-sm text-primary hover:underline"
                      >
                        {member.full_name}
                      </button>
                    ))}
                    {users.length === 0 ? <div className="text-sm text-dark-6 dark:text-dark-6">Sin miembros</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </ShowcaseSection>
      ) : null}

      {activeTab === "scopes" ? (
        <ShowcaseSection title="Permisos" className="!p-6">
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <p className="text-sm text-dark-6 dark:text-dark-6">
                Agrega uno o varios permisos separados por comas o saltos de linea. Las eliminaciones piden confirmacion porque impactan de inmediato los productos habilitados.
              </p>
              <textarea
                value={newScopesText}
                onChange={(event) => setNewScopesText(event.target.value)}
                rows={8}
                placeholder={"auth.authentication.*\npayments.qr.*"}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
              {scopesError || scopesQueryError ? <ErrorAlert message={scopesError || scopesQueryError} /> : null}
              <button
                type="button"
                onClick={() => void addScopes()}
                disabled={scopesSaving}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {scopesSaving ? "Guardando..." : "Agregar permisos"}
              </button>
            </div>
            <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
              <div className="mb-3 text-sm font-medium text-dark dark:text-white">Permisos actuales ({scopes.length})</div>
              {scopesLoading ? (
                <p className="text-sm text-dark-6 dark:text-dark-6">Cargando scopes...</p>
              ) : scopes.length === 0 ? (
                <p className="text-sm text-dark-6 dark:text-dark-6">Aun no hay scopes asignados.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {scopes.map((scope) => (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => void deleteScope(scope.scope)}
                      className="rounded-full border border-stroke px-3 py-1.5 text-xs font-medium text-dark transition hover:border-rose-500 hover:text-rose-500 dark:border-dark-3 dark:text-white"
                    >
                      {scope.scope} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ShowcaseSection>
      ) : null}

      {activeTab === "workflows" ? (
        <div className="space-y-6">
          <ShowcaseSection title="Workflows de Identidad" className="!p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-3xl space-y-2 text-sm text-dark-6 dark:text-dark-6">
                <p>
                  Aqui defines como se verifican los usuarios de esta organizacion.
                </p>
                <p>
                  Puedes tener varios workflows guardados, pero solo uno puede estar activo al mismo tiempo.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateWorkflowEditor}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90"
              >
                Nuevo workflow
              </button>
            </div>

            {workflowError || identityWorkflowsQueryError || activeIdentityWorkflowError ? (
              <div className="mb-4">
                <ErrorAlert
                  message={
                    workflowError ||
                    identityWorkflowsQueryError ||
                    activeIdentityWorkflowError
                  }
                />
              </div>
            ) : null}

            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300">
              Workflow activo:{" "}
              <span className="font-medium">
                {activeIdentityWorkflowLoading
                  ? "Cargando..."
                  : activeIdentityWorkflow
                    ? `${activeIdentityWorkflow.name} · ${workflowDocumentLabel(activeIdentityWorkflow.document_type)} · ${workflowBiometryLabel(activeIdentityWorkflow.biometry_method)}`
                    : "No hay ninguno configurado"}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="bg-gray-2/70 dark:bg-dark-2/80">
                    <tr className="border-b border-stroke dark:border-dark-3">
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Workflow</th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Documento</th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Biometria</th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Creado</th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Actualizado</th>
                      <th className="px-4 py-3 font-medium text-dark dark:text-white">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {identityWorkflowsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">
                          Cargando workflows...
                        </td>
                      </tr>
                    ) : identityWorkflows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">
                          Esta organizacion todavia no tiene workflows. Crea el primero para definir su flujo de verificacion.
                        </td>
                      </tr>
                    ) : (
                      identityWorkflows.map((workflow) => (
                        <tr key={workflow.id} className="border-b border-stroke dark:border-dark-3">
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="font-medium text-dark dark:text-white">{workflow.name}</div>
                              <div className="font-mono text-xs text-dark-6 dark:text-dark-6">{workflow.id}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-dark dark:text-white">
                            {workflowDocumentLabel(workflow.document_type)}
                          </td>
                          <td className="px-4 py-4 text-dark dark:text-white">
                            {workflowBiometryLabel(workflow.biometry_method)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                workflow.is_active
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {workflow.is_active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-dark dark:text-white">{formatDate(workflow.created_at)}</td>
                          <td className="px-4 py-4 text-dark dark:text-white">{formatDate(workflow.updated_at)}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openEditWorkflowEditor(workflow)}
                                className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void activateWorkflow(workflow)}
                                disabled={workflow.is_active || workflowActionLoading === workflow.id}
                                className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium text-dark transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:text-white"
                              >
                                Activar
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeWorkflow(workflow)}
                                disabled={workflowActionLoading === workflow.id}
                                className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium text-dark transition hover:border-rose-500 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:text-white"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ShowcaseSection>

          {workflowEditorOpen ? (
            <div className="fixed inset-0 z-999 overflow-hidden">
              <div
                className="absolute inset-0 bg-black/45"
                onClick={closeWorkflowEditor}
              />
              <div className="absolute inset-y-0 right-0 flex w-full justify-end">
                <div className="h-full w-full max-w-[620px] overflow-y-auto bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
                  <div className="sticky top-0 z-10 border-b border-stroke bg-white px-6 py-5 dark:border-dark-3 dark:bg-gray-dark">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-[0.22em] text-dark-6 dark:text-dark-6">
                          Workflow de Identidad
                        </div>
                        <h2 className="mt-2 text-xl font-semibold text-dark dark:text-white">
                          {workflowEditingId ? "Editar Workflow" : "Crear Workflow"}
                        </h2>
                        <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                          Define el flujo de verificacion que usara esta organizacion.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeWorkflowEditor}
                        className="rounded-full border border-stroke px-3 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 p-6">
                    <form onSubmit={saveWorkflow} className="space-y-4">
                      <FormField
                        label="Nombre del workflow"
                        value={workflowForm.name}
                        onChange={(value) =>
                          setWorkflowForm((current) => ({ ...current, name: value }))
                        }
                        required
                      />
                      <FormSelect
                        label="Tipo de documento"
                        value={workflowForm.document_type}
                        onChange={(value) =>
                          setWorkflowForm((current) => ({
                            ...current,
                            document_type: value as IdentityWorkflowDocumentType,
                          }))
                        }
                        options={IDENTITY_DOCUMENT_OPTIONS}
                      />
                      <FormSelect
                        label="Metodo biometrico"
                        value={workflowForm.biometry_method}
                        onChange={(value) =>
                          setWorkflowForm((current) => ({
                            ...current,
                            biometry_method: value as IdentityWorkflowBiometryMethod,
                          }))
                        }
                        options={IDENTITY_BIOMETRY_OPTIONS}
                      />
                      <ToggleField
                        label="Dejar activo este workflow"
                        checked={workflowForm.is_active}
                        onChange={(checked) =>
                          setWorkflowForm((current) => ({ ...current, is_active: checked }))
                        }
                      />

                      <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                        <div className="mb-3 text-sm font-medium text-dark dark:text-white">
                          Payload resultante
                        </div>
                        <pre className="overflow-auto rounded-lg bg-dark px-4 py-4 text-xs text-white">
                          {prettifyJson({
                            name: workflowForm.name.trim(),
                            config: {
                              ocr: { document_type: workflowForm.document_type },
                              biometry: { method: workflowForm.biometry_method },
                            },
                            is_active: workflowForm.is_active,
                          })}
                        </pre>
                      </div>

                      {workflowError ? <ErrorAlert message={workflowError} /> : null}

                      <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
                        <button
                          type="button"
                          onClick={closeWorkflowEditor}
                          className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={workflowSaving}
                          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {workflowSaving
                            ? "Guardando..."
                            : workflowEditingId
                              ? "Guardar cambios"
                              : "Crear workflow"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}



      {activeTab === "api-keys" ? (
        <ShowcaseSection title="Claves API" className="!p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-dark-6 dark:text-dark-6">
              OWNER puede inspeccionar, revelar, rotar y revocar credenciales API de cualquier organizacion desde este modulo global.
            </p>
            <button
              type="button"
              onClick={() => void rotateKeys()}
              disabled={apiKeyActionLoading === "rotate"}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {apiKeyActionLoading === "rotate" ? "Rotando..." : "Rotar claves API"}
            </button>
          </div>
          {apiKeysError || apiKeysQueryError ? <ErrorAlert message={apiKeysError || apiKeysQueryError} /> : null}
          {revealedSecrets.rotated ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
              Nuevo secreto luego de la rotacion: <span className="font-mono">{revealedSecrets.rotated}</span>
            </div>
          ) : null}
          <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-2/70 dark:bg-dark-2/80">
                  <tr className="border-b border-stroke dark:border-dark-3">
                    <th className="px-4 py-3 font-medium text-dark dark:text-white">Clave</th>
                    <th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th>
                    <th className="px-4 py-3 font-medium text-dark dark:text-white">Creada</th>
                    <th className="px-4 py-3 font-medium text-dark dark:text-white">Ultimo uso</th>
                    <th className="px-4 py-3 font-medium text-dark dark:text-white">Secret</th>
                    <th className="px-4 py-3 font-medium text-dark dark:text-white">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeysLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">Cargando claves API...</td>
                    </tr>
                  ) : apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">No hay claves API registradas.</td>
                    </tr>
                  ) : (
                    apiKeys.map((apiKey) => (
                      <tr key={apiKey.id} className="border-b border-stroke dark:border-dark-3">
                        <td className="px-4 py-4 font-mono text-xs text-dark dark:text-white">{apiKey.api_key}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(apiKey.status)}`}>
                            {apiKey.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-dark dark:text-white">{formatDate(apiKey.created_at)}</td>
                        <td className="px-4 py-4 text-dark dark:text-white">{formatDate(apiKey.last_used_at)}</td>
                        <td className="px-4 py-4">
                          {revealedSecrets[apiKey.id] ? (
                            <code className="rounded bg-dark px-2 py-1 text-xs text-white">{revealedSecrets[apiKey.id]}</code>
                          ) : (
                            <span className="text-dark-6 dark:text-dark-6">Oculto</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void revealSecret(apiKey.id)}
                              disabled={apiKeyActionLoading === apiKey.id}
                              className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium text-dark transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-3 dark:text-white"
                            >
                              Revelar secreto
                            </button>
                            <button
                              type="button"
                              onClick={() => void revokeKey(apiKey.id)}
                              disabled={apiKeyActionLoading === apiKey.id}
                              className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium text-dark transition hover:border-rose-500 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-3 dark:text-white"
                            >
                              Revocar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </ShowcaseSection>
      ) : null}

      {activeTab === "onboarding" ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <ShowcaseSection title="Estado de Onboarding" className="!p-6">
            {onboardingLoading ? (
              <p className="text-sm text-dark-6 dark:text-dark-6">Cargando estado de onboarding...</p>
            ) : onboardingError || onboardingQueryError ? (
              <ErrorAlert message={onboardingError || onboardingQueryError} />
            ) : onboarding ? (
              <div className="space-y-4">
                <ProgressRow label="KYB" value={onboarding.percents.kyb} />
                <ProgressRow label="AML" value={onboarding.percents.aml} />
                <ProgressRow label="Documentacion tecnica" value={onboarding.percents.technical} />
                <ProgressRow label="Plan de negocio" value={onboarding.percents.businessPlan} />
                <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                  <div className="mb-3 text-sm font-medium text-dark dark:text-white">
                    Evidencia cargada disponible hoy
                  </div>
                  <div className="space-y-3">
                    {onboardingAssets.primary.map((asset) => (
                      <OnboardingAssetRow key={asset.label} asset={asset} />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                  <div className="mb-3 text-sm font-medium text-dark dark:text-white">
                    Bloques de documentacion tecnica
                  </div>
                  <div className="space-y-3">
                    {onboardingAssets.technical.map((asset) => (
                      <OnboardingAssetRow key={asset.label} asset={asset} />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                  <div className="mb-3 text-sm font-medium text-dark dark:text-white">
                    Ambientes de desarrollo
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="mb-1 text-dark-6 dark:text-dark-6">Ultima actualizacion</div>
                      <div className="text-dark dark:text-white">
                        {formatDate(onboardingAssets.development.updatedAt)}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-dark-6 dark:text-dark-6">URLs</div>
                      <pre className="overflow-auto rounded-lg bg-gray-2 px-3 py-2 text-xs text-dark dark:bg-dark-2 dark:text-white">
                        {onboardingAssets.development.urls || "No hay URLs guardadas"}
                      </pre>
                    </div>
                    <div>
                      <div className="mb-1 text-dark-6 dark:text-dark-6">Referencia de claves API</div>
                      <pre className="overflow-auto rounded-lg bg-gray-2 px-3 py-2 text-xs text-dark dark:bg-dark-2 dark:text-white">
                        {onboardingAssets.development.apiKeys || "No hay claves API guardadas"}
                      </pre>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
                  La evidencia actual del backend se limita a `uploaded`, `url`, `s3_key` y timestamps de ambientes. La metadata de auditoria como uploader, version o review status sigue dependiendo de una expansion backend.
                </div>
                <pre className="overflow-auto rounded-lg bg-dark px-4 py-4 text-xs text-white">{prettifyJson(onboarding.raw)}</pre>
              </div>
            ) : (
              <p className="text-sm text-dark-6 dark:text-dark-6">No hay datos de onboarding disponibles.</p>
            )}
          </ShowcaseSection>

          <ShowcaseSection title="Acciones de Onboarding" className="!p-6">
            <div className="space-y-5">
              <UploadBlock
                title="Archivos KYB"
                hint={onboarding?.flags.kybLocked ? "Backend reporta que KYB ya fue cargado o completado." : "Cargar un nuevo bundle KYB."}
                loading={onboardingActionLoading === "kyb"}
                onChange={(file) => file ? runOnboardingAction("kyb", () => postKybFiles(orgId, file)) : Promise.resolve()}
              />
              <UploadBlock
                title="Archivos AML"
                hint={onboarding?.flags.amlLocked ? "Backend reporta que AML ya fue cargado o completado." : "Cargar un nuevo bundle AML."}
                loading={onboardingActionLoading === "aml"}
                onChange={(file) => file ? runOnboardingAction("aml", () => postAmlFiles(orgId, file)) : Promise.resolve()}
              />
              <UploadBlock
                title="Plan de negocio"
                hint={onboarding?.businessPlan.uploaded ? "Ya existe un archivo de plan de negocio registrado." : "Cargar el documento de plan de negocio."}
                loading={onboardingActionLoading === "business-plan"}
                onChange={(file) => file ? runOnboardingAction("business-plan", () => postBusinessPlanFile(orgId, file)) : Promise.resolve()}
              />
              <TechnicalDocumentationBlock
                loading={onboardingActionLoading === "technical"}
                onSubmit={(files) => runOnboardingAction("technical", () => postTechnicalDocumentation(orgId, files))}
              />
              <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                <div className="text-sm font-medium text-dark dark:text-white">Ambientes de desarrollo</div>
                <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">Guarda URLs y claves API para el bloque tecnico del onboarding.</p>
                <div className="mt-4 grid gap-4">
                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-dark dark:text-white">URLs</span>
                    <textarea
                      value={developmentUrls}
                      onChange={(event) => setDevelopmentUrls(event.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-dark dark:text-white">Claves API</span>
                    <textarea
                      value={developmentApiKeys}
                      onChange={(event) => setDevelopmentApiKeys(event.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void saveDevelopmentEnvironments()}
                    disabled={onboardingActionLoading === "development-environments"}
                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {onboardingActionLoading === "development-environments" ? "Guardando..." : "Guardar ambientes"}
                  </button>
                </div>
              </div>
            </div>
          </ShowcaseSection>
        </div>
      ) : null}

      {memberCreateOpen ? (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
              <h2 className="text-lg font-semibold text-dark dark:text-white">Crear miembro</h2>
              <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                Usa `POST /organizations/:id/users` sobre la organizacion seleccionada.
              </p>
            </div>
            <form onSubmit={submitCreateMember} className="space-y-5 p-6">
              <FormField label="Nombre completo" value={memberCreateForm.full_name} onChange={(value) => setMemberCreateForm((current) => ({ ...current, full_name: value }))} required />
              <FormField label="Email" value={memberCreateForm.email} onChange={(value) => setMemberCreateForm((current) => ({ ...current, email: value }))} required />
              <div className="space-y-3">
                <div className="text-sm font-medium text-dark dark:text-white">Roles locales</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {assignableRoleCodes.map((roleCode) => {
                    const checked = memberCreateForm.roles.includes(roleCode);
                    return (
                      <label key={roleCode} className="flex items-center gap-3 rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setMemberCreateForm((current) => ({
                              ...current,
                              roles: event.target.checked
                                ? [...current.roles, roleCode]
                                : current.roles.filter((role) => role !== roleCode),
                            }));
                          }}
                        />
                        <span className="text-sm text-dark dark:text-white">{roleCode}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {rolesLoading ? <div className="text-sm text-dark-6 dark:text-dark-6">Cargando catalogo de roles...</div> : null}
              {memberActionError ? <ErrorAlert message={memberActionError} /> : null}
              <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
                <button
                  type="button"
                  onClick={() => setMemberCreateOpen(false)}
                  className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={memberActionLoading}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {memberActionLoading ? "Creando..." : "Crear miembro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {memberBatchOpen ? (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
              <h2 className="text-lg font-semibold text-dark dark:text-white">
                {memberBatchActionLabel(memberBatchAction)}
              </h2>
              <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                Se aplicara sobre {selectedMemberIds.length} miembro(s) seleccionados en esta pagina.
              </p>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                <div className="mb-3 text-sm font-medium text-dark dark:text-white">
                  Miembros seleccionados
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMembersOnPage.map((member) => (
                    <span key={member.id} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                      {member.full_name}
                    </span>
                  ))}
                </div>
              </div>

              {memberBatchAction === "assign-roles" || memberBatchAction === "remove-roles" ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-dark dark:text-white">Roles</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {assignableRoleCodes.map((roleCode) => {
                      const checked = memberBatchRoleCodes.includes(roleCode);
                      return (
                        <label key={roleCode} className="flex items-center gap-3 rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setMemberBatchRoleCodes((current) =>
                                event.target.checked
                                  ? Array.from(new Set([...current, roleCode]))
                                  : current.filter((item) => item !== roleCode)
                              )
                            }
                          />
                          <span className="text-sm text-dark dark:text-white">{roleCode}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {memberBatchAction === "reset-password" ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
                  Esta accion generara contraseñas temporales nuevas para los miembros seleccionados.
                </div>
              ) : null}

              {memberBatchError ? <ErrorAlert message={memberBatchError} /> : null}

              {memberBatchResult ? (
                <div className="space-y-4 rounded-xl border border-stroke p-4 dark:border-dark-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MemberKpiCard label="Procesados" value={String(memberBatchResult.processed)} />
                    <MemberKpiCard label="Exitosos" value={String(memberBatchResult.succeeded)} />
                    <MemberKpiCard label="Fallidos" value={String(memberBatchResult.failed)} />
                  </div>
                  <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="bg-gray-2/70 dark:bg-dark-2/80">
                          <tr className="border-b border-stroke dark:border-dark-3">
                            <th className="px-4 py-3 font-medium text-dark dark:text-white">Usuario</th>
                            <th className="px-4 py-3 font-medium text-dark dark:text-white">Estado</th>
                            <th className="px-4 py-3 font-medium text-dark dark:text-white">Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberBatchResult.results.map((result) => {
                            const member = selectedMembersOnPage.find((item) => item.id === result.user_id);
                            return (
                              <tr key={result.user_id} className="border-b border-stroke dark:border-dark-3">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-dark dark:text-white">
                                    {member?.full_name ?? result.user_id}
                                  </div>
                                  <div className="text-xs text-dark-6 dark:text-dark-6">
                                    {member?.email ?? result.user_id}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${result.ok ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"}`}>
                                    {result.ok ? "OK" : "Error"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-dark dark:text-white">
                                  {result.temporary_password ? (
                                    <span className="font-mono text-xs">{result.temporary_password}</span>
                                  ) : (
                                    result.message || "Sin observaciones"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
                <button
                  type="button"
                  onClick={closeMemberBatchAction}
                  className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                >
                  {memberBatchResult ? "Cerrar" : "Cancelar"}
                </button>
                {!memberBatchResult ? (
                  <button
                    type="button"
                    onClick={() => void executeMemberBatchAction()}
                    disabled={memberBatchLoading}
                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {memberBatchLoading ? "Procesando..." : memberBatchActionLabel(memberBatchAction)}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedMemberId ? (
        <div className="fixed inset-0 z-999 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={closeMemberDrawer}
          />
          <div className="absolute inset-y-0 right-0 flex w-full justify-end">
            <div className="h-full w-full max-w-[620px] overflow-y-auto bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
              <div className="sticky top-0 z-10 border-b border-stroke bg-white px-6 py-5 dark:border-dark-3 dark:bg-gray-dark">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-dark-6 dark:text-dark-6">
                      Detalle del miembro
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-dark dark:text-white">
                      {selectedMember?.full_name ?? "Cargando..."}
                    </h2>
                    <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
                      {selectedMember?.email ?? "Obteniendo informacion del miembro"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeMemberDrawer}
                    className="rounded-full border border-stroke px-3 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="space-y-6 p-6">
                {selectedMemberLoading ? (
                  <p className="text-sm text-dark-6 dark:text-dark-6">Cargando detalle del miembro...</p>
                ) : selectedMemberError ? (
                  <ErrorAlert message={selectedMemberError} />
                ) : !selectedMember ? (
                  <p className="text-sm text-dark-6 dark:text-dark-6">
                    No se pudo cargar el detalle del miembro seleccionado.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <MemberKpiCard label="Estado" value={selectedMember.status} />
                      <MemberKpiCard
                        label="Roles"
                        value={String((selectedMember.roles ?? []).length)}
                        hint="Asignados actualmente"
                      />
                    </div>

                    <div className="rounded-xl border border-stroke p-5 dark:border-dark-3">
                      <div className="mb-4 text-sm font-medium text-dark dark:text-white">
                        Perfil
                      </div>
                      <div className="grid gap-4">
                        <FormField
                          label="Nombre completo"
                          value={selectedMember.full_name}
                          onChange={(value) =>
                            setSelectedMemberDraft((current) =>
                              current ? { ...current, full_name: value } : current
                            )
                          }
                        />
                        <FormSelect
                          label="Estado"
                          value={selectedMember.status}
                          onChange={(value) =>
                            setSelectedMemberDraft((current) =>
                              current ? { ...current, status: value as OrgUserStatus } : current
                            )
                          }
                          options={["ACTIVE", "PENDING", "DISABLED"]}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-stroke p-5 dark:border-dark-3">
                      <div className="mb-2 text-sm font-medium text-dark dark:text-white">
                        Roles asignados
                      </div>
                      <p className="mb-4 text-xs text-dark-6 dark:text-dark-6">
                        Puedes remover o agregar roles directamente desde este panel.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedMember.roles ?? []).map((role) => (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => void removeRoleFromSelectedMember(role.id, role.code)}
                            className="rounded-full border border-stroke px-3 py-1.5 text-xs font-medium text-dark transition hover:border-rose-500 hover:text-rose-500 dark:border-dark-3 dark:text-white"
                          >
                            {role.code} ×
                          </button>
                        ))}
                        {(selectedMember.roles ?? []).length === 0 ? (
                          <span className="text-sm text-dark-6 dark:text-dark-6">
                            Sin roles asignados.
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {assignableRoleCodes
                          .filter(
                            (roleCode) =>
                              !(selectedMember.roles ?? []).some((role) => role.code === roleCode)
                          )
                          .map((roleCode) => (
                            <button
                              key={roleCode}
                              type="button"
                              onClick={() => void addRoleToSelectedMember(roleCode)}
                              className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white"
                            >
                              Asignar {roleCode}
                            </button>
                          ))}
                      </div>
                    </div>

                    {temporaryPassword ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
                        Contraseña temporal: <span className="font-mono">{temporaryPassword}</span>
                      </div>
                    ) : null}

                    {memberActionError ? <ErrorAlert message={memberActionError} /> : null}

                    <div className="flex flex-wrap gap-3 border-t border-stroke pt-4 dark:border-dark-3">
                      <button
                        type="button"
                        onClick={() => void saveSelectedMember()}
                        disabled={memberActionLoading}
                        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Guardar perfil
                      </button>
                      <button
                        type="button"
                        onClick={() => void resetSelectedMemberPassword()}
                        disabled={memberActionLoading}
                        className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark transition hover:border-rose-500 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-3 dark:text-white"
                      >
                        Resetear contraseña
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-dark-6 dark:text-dark-6">{label}</div>
      <div className="mt-2 text-sm font-medium text-dark dark:text-white">{value}</div>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
      <span className="text-sm text-dark-6 dark:text-dark-6">{label}</span>
      <span className="text-sm font-medium text-dark dark:text-white">{value}</span>
    </div>
  );
}

function MemberKpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-dark-6 dark:text-dark-6">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-dark dark:text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-dark-6 dark:text-dark-6">{hint}</div> : null}
    </div>
  );
}

function RoleBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      {code}
    </span>
  );
}

function ProgressRow({ label, value }: { label: string; value: number | null }) {
  const display = value == null ? "N/A" : `${value}%`;
  return (
    <div className="space-y-2 rounded-lg border border-stroke p-4 dark:border-dark-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-dark dark:text-white">{label}</span>
        <span className="text-sm text-dark-6 dark:text-dark-6">{display}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-2 dark:bg-dark-2">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }} />
      </div>
    </div>
  );
}

function OnboardingAssetRow({ asset }: { asset: OnboardingUploadedAsset }) {
  return (
    <div className="rounded-lg border border-stroke p-3 dark:border-dark-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-dark dark:text-white">{asset.label}</span>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            asset.uploaded
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {asset.uploaded ? "Cargado" : "Faltante"}
        </span>
      </div>
      <div className="mt-3 space-y-2 text-xs">
        <div>
          <span className="text-dark-6 dark:text-dark-6">URL: </span>
          {asset.url ? (
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="break-all text-primary hover:underline"
            >
              {asset.url}
            </a>
          ) : (
            <span className="text-dark dark:text-white">N/A</span>
          )}
        </div>
        <div>
          <span className="text-dark-6 dark:text-dark-6">Clave S3: </span>
          <span className="break-all text-dark dark:text-white">
            {asset.s3Key || "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
      {message}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-dark dark:text-white">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const normalized = HEX_REGEX.test(value) ? value : "#000000";

  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-dark dark:text-white">{label}</span>
      <div className="rounded-[18px] border border-stroke bg-white p-4 shadow-sm dark:border-dark-3 dark:bg-dark-2">
        <div className="grid gap-4 lg:grid-cols-[160px_1fr] lg:items-stretch">
          <div className="mx-auto w-full max-w-[160px]">
            <HexColorPicker
              color={normalized}
              onChange={(next) => onChange(next.toUpperCase())}
              style={{ width: "100%", height: 160 }}
            />
          </div>
          <div className="flex min-h-[160px] flex-col justify-between">
            <div
              className="h-18 rounded-2xl border border-stroke dark:border-dark-3"
              style={{
                background: `linear-gradient(135deg, ${normalized} 0%, ${normalized}CC 100%)`,
              }}
            />
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-stroke px-3 py-3 dark:border-dark-3">
              <div
                className="h-10 w-10 rounded-xl border border-stroke dark:border-dark-3"
                style={{ backgroundColor: normalized }}
              />
              <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value.toUpperCase())}
                placeholder="#004492"
                className="w-full bg-transparent text-sm font-medium text-dark outline-none dark:text-white"
              />
            </div>
            <p className="mt-3 text-xs text-dark-6 dark:text-dark-6">
              Selecciona el color o escribe el HEX.
            </p>
          </div>
        </div>
      </div>
    </label>
  );
}

function ColorChip({ label, value }: { label: string; value: string }) {
  const normalized = HEX_REGEX.test(value) ? value : "#000000";

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-stroke bg-white/80 px-3 py-2 shadow-sm dark:border-dark-3 dark:bg-dark-2/80">
      <span
        className="h-4 w-4 rounded-full border border-black/10"
        style={{ backgroundColor: normalized }}
      />
      <span className="text-sm font-medium text-dark dark:text-white">{label}</span>
      <span className="font-mono text-xs text-dark-6 dark:text-dark-6">{value}</span>
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | SelectOption>;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-dark dark:text-white">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
      >
        {options.map((option) => (
          <option
            key={typeof option === "string" ? option : option.value}
            value={typeof option === "string" ? option : option.value}
          >
            {typeof option === "string" ? option : option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-stroke px-4 py-3 dark:border-dark-3">
      <span className="text-sm text-dark dark:text-white">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-primary"
      />
    </label>
  );
}

function LogoUploadCard({
  label,
  description,
  src,
  loading,
  onChange,
}: {
  label: string;
  description: string;
  src?: string | null;
  loading: boolean;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
      <div className="mb-2 text-sm font-medium text-dark dark:text-white">{label}</div>
      <div className="mb-3 text-xs leading-5 text-dark-6 dark:text-dark-6">{description}</div>
      {src ? (
        <div className="mb-3 rounded-xl border border-slate-700/60 bg-slate-900 px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <img src={src} alt={label} className="h-16 w-auto max-w-[180px] object-contain" />
        </div>
      ) : (
        <div className="mb-3 rounded-xl border border-slate-700/60 bg-slate-900 px-4 py-5 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          No hay archivo cargado.
        </div>
      )}
      <input
        type="file"
        accept=".png,image/png"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
        className="block w-full text-sm text-dark-6 file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
      />
      {loading ? <div className="mt-2 text-xs text-dark-6 dark:text-dark-6">Cargando...</div> : null}
    </div>
  );
}

function UploadBlock({
  title,
  hint,
  loading,
  onChange,
}: {
  title: string;
  hint: string;
  loading: boolean;
  onChange: (file: File | null) => Promise<unknown>;
}) {
  return (
    <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
      <div className="text-sm font-medium text-dark dark:text-white">{title}</div>
      <div className="mt-1 text-sm text-dark-6 dark:text-dark-6">{hint}</div>
      <input
        type="file"
        onChange={(event) => {
          void onChange(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
        className="mt-3 block w-full text-sm text-dark-6 file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
      />
      {loading ? <div className="mt-2 text-xs text-dark-6 dark:text-dark-6">Cargando...</div> : null}
    </div>
  );
}

function TechnicalDocumentationBlock({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (files: {
    diagram?: File | null;
    securityPolicy?: File | null;
    certifications?: File | null;
    processDocumentation?: File | null;
  }) => Promise<unknown>;
}) {
  const [diagram, setDiagram] = useState<File | null>(null);
  const [securityPolicy, setSecurityPolicy] = useState<File | null>(null);
  const [certifications, setCertifications] = useState<File | null>(null);
  const [processDocumentation, setProcessDocumentation] = useState<File | null>(null);

  return (
    <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
      <div className="text-sm font-medium text-dark dark:text-white">Documentacion tecnica</div>
      <div className="mt-3 grid gap-3">
        <FilePicker label="Diagrama de flujo" onChange={setDiagram} />
        <FilePicker label="Politica de seguridad" onChange={setSecurityPolicy} />
        <FilePicker label="Certificaciones" onChange={setCertifications} />
        <FilePicker label="Documentacion de procesos" onChange={setProcessDocumentation} />
      </div>
      <button
        type="button"
        onClick={() => void onSubmit({ diagram, securityPolicy, certifications, processDocumentation })}
        disabled={loading || (!diagram && !securityPolicy && !certifications && !processDocumentation)}
        className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Cargando..." : "Enviar documentos tecnicos"}
      </button>
    </div>
  );
}

function FilePicker({
  label,
  onChange,
}: {
  label: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-dark dark:text-white">{label}</span>
      <input
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="block w-full text-sm text-dark-6 file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
      />
    </label>
  );
}
