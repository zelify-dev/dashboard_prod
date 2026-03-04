"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useIdentityWorkflowTranslations } from "./use-identity-translations";
import { getStoredOrganization, getStoredRoles } from "@/lib/auth-api";
import { listOrgUsers } from "@/lib/organization-users-api";
import type { OrgUserListItem } from "@/lib/organization-users-api";
import { isOwner, userHasRole, TEAM_ROLE } from "@/app/organization/teams/_constants/team-roles";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_SIZE = 20;

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { dateStyle: "short" });
  } catch {
    return "—";
  }
}

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

  if (!canSee || !org?.id) return null;

  return (
    <div className="mt-8">
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-dark dark:text-white">{usersT.title}</h2>
            <p className="text-sm text-dark-6 dark:text-dark-6">{usersT.subtitle}</p>
          </div>
          <div className="w-full sm:w-72">
            <label htmlFor="app-users-search" className="sr-only">
              {usersT.searchPlaceholder}
            </label>
            <input
              id="app-users-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={usersT.searchPlaceholder}
              className="w-full rounded-lg border border-stroke bg-gray-2/60 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2/80 dark:text-white dark:focus:border-primary"
            />
          </div>
        </div>
        {usersLoading ? (
          <p className="py-4 text-sm text-dark-6 dark:text-dark-6">Cargando…</p>
        ) : usersError ? (
          <p className="py-4 text-sm text-red-600 dark:text-red-400">{usersError}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke dark:border-dark-3">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">{usersT.email}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">{usersT.fullName}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">{usersT.status}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">{usersT.verificationStatus}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white">{usersT.verifiedAt}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-dark-6 dark:text-dark-6">
                      {usersT.emptyState}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-stroke dark:border-dark-3">
                      <td className="px-4 py-3 text-sm text-dark dark:text-white">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-dark dark:text-white">{u.full_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            u.status === "ACTIVE"
                              ? "inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                          }
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.identity_verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {usersT.verified}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {usersT.pending}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-6 dark:text-dark-6">
                        {u.identity_verified_at ? formatDate(u.identity_verified_at) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Paginación: siempre visible cuando hay datos o total > 0 */}
        {(usersTotal > 0 || users.length > 0) && (
          <div className="mt-3 flex flex-col gap-3 border-t border-stroke pt-3 dark:border-dark-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-dark-6 dark:text-dark-6">
              {usersT.showing}{" "}
              {usersTotal === 0 ? 0 : (usersPage - 1) * PAGE_SIZE + 1}–
              {Math.min(usersPage * PAGE_SIZE, usersTotal)} {usersT.pageOf} {usersTotal}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={usersPage <= 1 || usersLoading}
                onClick={() => setUsersPage((p) => p - 1)}
                className="rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 dark:border-dark-3 hover:bg-gray-2 dark:hover:bg-dark-3"
              >
                {usersT.previous}
              </button>
              <button
                type="button"
                disabled={usersPage * PAGE_SIZE >= usersTotal || usersLoading}
                onClick={() => setUsersPage((p) => p + 1)}
                className="rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 dark:border-dark-3 hover:bg-gray-2 dark:hover:bg-dark-3"
              >
                {usersT.next}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
