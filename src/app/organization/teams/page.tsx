"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { useEffect, useState, useCallback } from "react";
import { getStoredUser, getStoredOrganization, getStoredRoles } from "@/lib/auth-api";
import { userHasRole, TEAM_ROLE, getRoleByTeamId, getAssignableRoles, isOwner, isOrgAdminRole, toRoleCodes } from "./_constants/team-roles";
import {
  listDashboardMembers,
  createDashboardMember,
  getOrgUser,
  updateOrgUser,
  assignOrgUserRoles,
  resetOrgUserPassword,
  type OrgUserListItem,
  type OrgUser,
  type OrgUserStatus,
} from "@/lib/organization-users-api";
import { AuthError } from "@/lib/auth-api";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { TeamsList } from "./_components/teams-list";
import { AddMemberModal } from "./_components/add-member-modal";
import { TemporaryPasswordModal } from "./_components/temporary-password-modal";
import { MembersTable } from "./_components/members-table";
import { EditMemberModal } from "./_components/edit-member-modal";
import { EditRolesModal } from "./_components/edit-roles-modal";
import { ResetPasswordModal } from "./_components/reset-password-modal";

export type Team = {
  id: string;
  name: string;
  description: string;
  products: string[];
  members: TeamMember[];
  createdAt: string;
};

export type TeamMember = {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "member";
};

const DEFAULT_TEAMS = (
  t: ReturnType<typeof useUiTranslations>["organizationTeams"]["defaults"]
): Team[] => [
  {
    id: "1",
    name: t.teamName,
    description: t.teamDescription,
    products: [],
    members: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: t.teamNameBusiness,
    description: "",
    products: [],
    members: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: t.teamNameDevelopers,
    description: "",
    products: [],
    members: [],
    createdAt: new Date().toISOString(),
  },
];

export default function TeamsPage() {
  const translations = useUiTranslations();
  const org = getStoredOrganization();
  const currentUser = getStoredUser();
  // Roles pueden venir en sessionStorage (login/me) o dentro de user.roles; normalizamos a códigos
  const storedRoles = getStoredRoles();
  const userRoles = (currentUser as { roles?: string[] | Array<{ code: string }> } | null)?.roles;
  const rawRoles = (Array.isArray(storedRoles) && storedRoles.length > 0 ? storedRoles : (Array.isArray(userRoles) ? userRoles : [])) as string[] | Array<{ code: string }>;
  const roles = toRoleCodes(rawRoles);

  const [teams, setTeams] = useState<Team[]>(() => DEFAULT_TEAMS(translations.organizationTeams.defaults));
  const [members, setMembers] = useState<OrgUserListItem[]>([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [membersPage, setMembersPage] = useState(1);
  const [membersLimit] = useState(20);
  const [membersSearch, setMembersSearch] = useState("");
  const [membersStatus, setMembersStatus] = useState<OrgUserStatus | "">("");
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  // Roles: preferir los que devuelve la API de miembros (misma fuente que la tabla); si no, sesión
  const currentUserInList = members.find((m) => m.id === currentUser?.id);
  const rolesFromMembersApi = currentUserInList?.roles
    ? toRoleCodes(
        currentUserInList.roles as string[] | Array<{ code: string }>
      )
    : [];
  const rolesToUse =
    rolesFromMembersApi.length > 0 ? rolesFromMembersApi : roles;

  const isOrgAdmin = isOrgAdminRole(rolesToUse);
  const isOwnerUser = isOwner(rolesToUse);
  const canManageMembers = isOwnerUser || isOrgAdmin;
  const orgId = org?.id ?? "";

  const assignableRoleCodes = getAssignableRoles(rolesToUse);
  // ORG_ADMIN no puede asignar USER_APP. Solo mostramos USER_APP cuando el usuario es OWNER y NO tiene ORG_ADMIN.
  const roleCodesForUi =
    isOwnerUser && !isOrgAdmin
      ? assignableRoleCodes
      : assignableRoleCodes.filter((code) => code !== TEAM_ROLE.USER_APP);
  const roleOptions: { value: string; label: string }[] = roleCodesForUi.map((code) => ({
    value: code,
    label: translations.membersManagement.roleNames?.[code as keyof typeof translations.membersManagement.roleNames] ?? code,
  }));

  if (typeof window !== "undefined" && canManageMembers) {
    console.log("[Teams] Roles para opciones del dropdown", {
      rolesFromMembersApi,
      rolesFromSession: roles,
      rolesToUse,
      isOrgAdmin,
      isOwnerUser,
      assignableRoleCodes,
      roleCodesForUi,
      roleOptionsLabels: roleOptions.map((o) => o.label),
    });
  }

  const setSearchAndPage = (v: string) => { setMembersSearch(v); setMembersPage(1); };
  const setStatusAndPage = (v: OrgUserStatus | "") => { setMembersStatus(v); setMembersPage(1); };

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addInitialRole, setAddInitialRole] = useState<string | undefined>();
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    temporary_password: string;
    invite_token: string | null;
    recipientEmail?: string;
  } | null>(null);

  const [editUser, setEditUser] = useState<OrgUser | null>(null);
  const [editRolesUser, setEditRolesUser] = useState<OrgUser | null>(null);
  const [resetUser, setResetUser] = useState<OrgUserListItem | null>(null);

  /** Excluir USER_APP: en esta tabla solo mostramos miembros del dashboard. Los App Users se listan en otra tabla (Auth). */
  const hasAppUserRole = (user: OrgUserListItem) => {
    const codes = (user.roles ?? []).map((r) => (typeof r === "string" ? r : (r as { code?: string }).code ?? "").toUpperCase());
    return codes.includes(TEAM_ROLE.USER_APP);
  };

  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    setMembersLoading(true);
    try {
      const res = await listDashboardMembers(orgId, {
        page: membersPage,
        limit: membersLimit,
        search: membersSearch || undefined,
        status: membersStatus || undefined,
      });
      const withoutAppUsers = res.items.filter((u) => !hasAppUserRole(u));
      setMembers(withoutAppUsers);
      setMembersTotal(res.total);
    } catch {
      setMembers([]);
      setMembersTotal(0);
    } finally {
      setMembersLoading(false);
    }
  }, [orgId, membersPage, membersLimit, membersSearch, membersStatus]);

  useEffect(() => {
    if (canManageMembers && orgId) fetchMembers();
  }, [canManageMembers, orgId, fetchMembers]);

  useEffect(() => {
    const t = translations.organizationTeams.defaults;
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id === "1") return { ...team, name: t.teamName, description: t.teamDescription };
        if (team.id === "2") return { ...team, name: t.teamNameBusiness };
        if (team.id === "3") return { ...team, name: t.teamNameDevelopers };
        return team;
      })
    );
  }, [
    translations.organizationTeams.defaults.teamName,
    translations.organizationTeams.defaults.teamDescription,
    translations.organizationTeams.defaults.teamNameBusiness,
    translations.organizationTeams.defaults.teamNameDevelopers,
  ]);

  useEffect(() => {
    if (!currentUser || !isOrgAdmin) return;
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id !== "1") return team;
        const hasAdmin = team.members.some((m) => m.role === "admin");
        if (hasAdmin) return team;
        return {
          ...team,
          members: [
            {
              id: currentUser.id,
              fullName: currentUser.full_name,
              email: currentUser.email,
              role: "admin",
            },
          ],
        };
      })
    );
  }, [currentUser?.id, isOrgAdmin]);

  const openAddForTeam = (teamId: string) => {
    const role = getRoleByTeamId(teamId);
    setAddInitialRole(role && roleCodesForUi.includes(role) ? role : undefined);
    setAddError("");
    setAddModalOpen(true);
  };

  const handleAddMember = async (data: { fullName: string; email: string; role: string }) => {
    if (!orgId) return;
    setAddError("");
    setAddLoading(true);
    try {
      const res = await createDashboardMember(orgId, {
        email: data.email,
        full_name: data.fullName,
        roles: data.role ? [data.role] : undefined,
      });
      setAddModalOpen(false);
      setTempPasswordModal({
        temporary_password: res.temporary_password,
        invite_token: res.invite_token ?? null,
        recipientEmail: res.user?.email,
      });
      fetchMembers();
    } catch (err) {
      if (err instanceof AuthError) {
        const backendMessage = err.message;
        if (err.statusCode === 403) {
          setAddError(backendMessage || translations.membersManagement.errors.noPermission);
        } else if (err.statusCode === 409) {
          setAddError(translations.membersManagement.errors.emailExists);
        } else {
          setAddError(backendMessage || translations.membersManagement.errors.noPermission);
        }
      } else {
        setAddError(translations.membersManagement.errors.noPermission);
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditMemberSave = async (payload: { full_name: string; status: OrgUserStatus }) => {
    if (!orgId || !editUser) return;
    await updateOrgUser(orgId, editUser.id, payload);
    setEditUser(null);
    fetchMembers();
  };

  const handleEditRolesSave = async (roleCodes: string[]) => {
    if (!orgId || !editRolesUser) return;
    await assignOrgUserRoles(orgId, editRolesUser.id, { role_codes: roleCodes });
    setEditRolesUser(null);
    fetchMembers();
  };

  const handleDisable = async (user: OrgUserListItem) => {
    if (!orgId) return;
    setMembersError("");
    try {
      await updateOrgUser(orgId, user.id, { status: "DISABLED" });
      fetchMembers();
    } catch (err) {
      if (err instanceof AuthError && err.statusCode === 409) {
        setMembersError(translations.membersManagement.errors.lastAdmin);
      } else {
        setMembersError(err instanceof Error ? err.message : "Error al deshabilitar.");
      }
    }
  };

  const handleEnable = async (user: OrgUserListItem) => {
    if (!orgId) return;
    await updateOrgUser(orgId, user.id, { status: "ACTIVE" });
    fetchMembers();
  };

  const handleResetPassword = async (userId: string) => {
    if (!orgId) return { temporary_password: "" };
    const res = await resetOrgUserPassword(orgId, userId);
    return { temporary_password: res.temporary_password };
  };

  const openEdit = async (user: OrgUserListItem) => {
    if (!orgId) return;
    try {
      const full = await getOrgUser(orgId, user.id);
      setEditUser(full);
    } catch {
      setEditUser(null);
    }
  };

  const openEditRoles = async (user: OrgUserListItem) => {
    if (!orgId) return;
    try {
      const full = await getOrgUser(orgId, user.id);
      setEditRolesUser(full);
    } catch {
      setEditRolesUser(null);
    }
  };

  const m = translations.membersManagement;

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Breadcrumb pageName={translations.sidebar.menuItems.subItems.teams} />

      {canManageMembers && orgId ? (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-heading-4 font-semibold text-dark dark:text-white">
              {m.tableTitle}
            </h1>
            <button
              type="button"
              onClick={() => {
                setAddInitialRole(undefined);
                setAddError("");
                setAddModalOpen(true);
              }}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90"
            >
              {m.addMember}
            </button>
          </div>

          <ShowcaseSection title={m.tableTitle} className="!p-6">
            {membersError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {membersError}
              </div>
            )}
            <MembersTable
              items={members}
              total={membersTotal}
              page={membersPage}
              limit={membersLimit}
              search={membersSearch}
              statusFilter={membersStatus}
              onSearchChange={setSearchAndPage}
              onStatusFilterChange={setStatusAndPage}
              onPageChange={setMembersPage}
              onEdit={openEdit}
              onEditRoles={openEditRoles}
              onDisable={handleDisable}
              onEnable={handleEnable}
              onResetPassword={(u) => setResetUser(u)}
              loading={membersLoading}
            />
          </ShowcaseSection>
        </>
      ) : (
        <>
          {!canManageMembers && (
            <p className="mb-4 text-sm text-dark-6 dark:text-dark-6">{m.noPermission}</p>
          )}
          <TeamsList
            teams={teams}
            onAddMember={canManageMembers && orgId ? openAddForTeam : () => {}}
          />
        </>
      )}

      {addModalOpen && (
        <AddMemberModal
          onClose={() => setAddModalOpen(false)}
          onAdd={handleAddMember}
          roleOptions={roleOptions}
          initialRole={addInitialRole}
          loading={addLoading}
          error={addError}
        />
      )}

      {tempPasswordModal && (
        <TemporaryPasswordModal
          temporaryPassword={tempPasswordModal.temporary_password}
          inviteToken={tempPasswordModal.invite_token}
          recipientEmail={tempPasswordModal.recipientEmail}
          onClose={() => setTempPasswordModal(null)}
        />
      )}

      {editUser && (
        <EditMemberModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={handleEditMemberSave}
        />
      )}

      {editRolesUser && (
        <EditRolesModal
          user={editRolesUser}
          roleOptions={roleOptions}
          onClose={() => setEditRolesUser(null)}
          onSave={handleEditRolesSave}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onReset={handleResetPassword}
        />
      )}
    </div>
  );
}
