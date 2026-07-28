"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useIdentityWorkflowTranslations } from "./use-identity-translations";
import { getStoredOrganization, getStoredRoles } from "@/lib/auth-api";
import { listOrgUsers } from "@/lib/organization-users-api";
import type { OrgUserListItem } from "@/lib/organization-users-api";
import { isOwner, userHasRole, TEAM_ROLE } from "@/app/organization/teams/_constants/team-roles";
import { formatLocalDateOnly } from "@/lib/date-utils";
import { IdentityUserDetailDrawer } from "./identity-user-detail-drawer";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_SIZE = 20;

export function IdentityUsersAndStats() {
  const { appUsersTable: usersT } = useIdentityWorkflowTranslations();
  const org = getStoredOrganization();
  const roles = getStoredRoles();
  const canSee = isOwner(roles) || userHasRole(roles, TEAM_ROLE.ORG_ADMIN) || userHasRole(roles, TEAM_ROLE.ZELIFY_TEAM);

  const [users, setUsers] = useState<OrgUserListItem[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const prevSearchRef = useRef("");

  // Detalle del usuario (Drawer)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Al cambiar búsqueda, volver a página 1
  useEffect(() => {
    setUsersPage(1);
  }, [searchDebounced]);

  const fetchUsers = useCallback(async () => {
    if (!org?.id) return;
    const searchJustChanged = prevSearchRef.current !== searchDebounced;
    if (searchJustChanged) prevSearchRef.current = searchDebounced;
    const pageToUse = searchJustChanged ? 1 : usersPage;
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await listOrgUsers(org.id, {
        role_code: "USER_APP",
        page: pageToUse,
        limit: PAGE_SIZE,
        ...(searchDebounced ? { search: searchDebounced } : {}),
      });
      setUsers(res.items ?? []);
      setUsersTotal(res.total ?? 0);
    } catch {
      setUsers([]);
      setUsersError("Error al cargar usuarios.");
    } finally {
      setUsersLoading(false);
    }
  }, [org?.id, usersPage, searchDebounced]);

  useEffect(() => {
    if (canSee && org?.id) fetchUsers();
  }, [canSee, org?.id, fetchUsers]);

  const handleRowClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsDrawerOpen(true);
  };

  if (!canSee || !org?.id) return null;

  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-gray-100 bg-white py-5 px-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-light text-dark">{usersT.title}</h2>
            <p className="text-xs font-light text-dark-6">{usersT.subtitle}</p>
          </div>
          <div className="w-full sm:w-72">
            <label htmlFor="app-users-search" className="sr-only">
              {usersT.searchPlaceholder}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-6">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                id="app-users-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={usersT.searchPlaceholder}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs font-light text-dark outline-none transition focus:border-zelify-midnight"
              />
            </div>
          </div>
        </div>
        {usersLoading ? (
          <p className="py-4 text-xs font-light text-dark-6">Cargando...</p>
        ) : usersError ? (
          <p className="py-4 text-xs font-light text-red-600">{usersError}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-light uppercase tracking-wider text-dark-6">{usersT.email}</th>
                  <th className="px-4 py-3 text-left text-xs font-light uppercase tracking-wider text-dark-6">{usersT.fullName}</th>
                  <th className="px-4 py-3 text-left text-xs font-light uppercase tracking-wider text-dark-6">{usersT.status}</th>
                  <th className="px-4 py-3 text-left text-xs font-light uppercase tracking-wider text-dark-6">{usersT.verificationStatus}</th>
                  <th className="px-4 py-3 text-left text-xs font-light uppercase tracking-wider text-dark-6">{usersT.verifiedAt}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs font-light text-dark-6">
                      {usersT.emptyState}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const statusStyle = u.status === "ACTIVE"
                      ? "bg-zelify-midnight text-zelify-green"
                      : "bg-gray-100 text-dark-6 border border-gray-200/50";
                    return (
                      <tr
                        key={u.id}
                        onClick={() => handleRowClick(u.id)}
                        className="group cursor-pointer border-b border-gray-100 transition hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-3 text-sm font-normal text-dark">{u.email}</td>
                        <td className="px-4 py-3 text-sm font-light text-dark-6">{u.full_name || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider ${statusStyle}`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.identity_verified ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-zelify-midnight px-2.5 py-1 text-[10px] font-light uppercase tracking-wider text-zelify-green">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              {usersT.verified}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 border border-gray-200/50 px-2.5 py-1 text-[10px] font-light uppercase tracking-wider text-dark-6">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {usersT.pending}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-light text-dark-6">
                          {u.identity_verified_at ? formatLocalDateOnly(u.identity_verified_at) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Paginación: siempre visible cuando hay datos o total > 0 */}
        {(usersTotal > 0 || users.length > 0) && (
          <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-light text-dark-6">
              {usersT.showing}{" "}
              {usersTotal === 0 ? 0 : (usersPage - 1) * PAGE_SIZE + 1}–
              {Math.min(usersPage * PAGE_SIZE, usersTotal)} {usersT.pageOf} {usersTotal}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={usersPage <= 1 || usersLoading}
                onClick={() => setUsersPage((p) => p - 1)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-light text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {usersT.previous}
              </button>
              <button
                type="button"
                disabled={usersPage * PAGE_SIZE >= usersTotal || usersLoading}
                onClick={() => setUsersPage((p) => p + 1)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-light text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {usersT.next}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Detalle */}
      <IdentityUserDetailDrawer
        userId={selectedUserId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
