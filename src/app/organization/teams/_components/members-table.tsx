"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import type { OrgUserListItem, OrgUserStatus } from "@/lib/organization-users-api";

type MembersTableProps = {
  items: OrgUserListItem[];
  total: number;
  page: number;
  limit: number;
  search: string;
  statusFilter: OrgUserStatus | "";
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: OrgUserStatus | "") => void;
  onPageChange: (page: number) => void;
  onEdit: (user: OrgUserListItem) => void;
  onEditRoles: (user: OrgUserListItem) => void;
  onDisable: (user: OrgUserListItem) => void;
  onEnable: (user: OrgUserListItem) => void;
  onResetPassword: (user: OrgUserListItem) => void;
  loading?: boolean;
};

export function MembersTable({
  items,
  total,
  page,
  limit,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onEdit,
  onEditRoles,
  onDisable,
  onEnable,
  onResetPassword,
  loading = false,
}: MembersTableProps) {
  const t = useUiTranslations();
  const m = t.membersManagement;
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!openActionsId) return;

    const closeMenu = () => setOpenActionsId(null);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [openActionsId]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getRoleDisplay = (user: OrgUserListItem) => {
    if (user.roles?.length) {
      const roleNames = m.roleNames as Record<string, string> | undefined;
      return user.roles
        .map((r) => {
          const code = typeof r === "string" ? r : r.code;
          return roleNames?.[code] ?? code;
        })
        .join(", ");
    }
    return "—";
  };

  const toggleActions = (userId: string, event: MouseEvent<HTMLButtonElement>) => {
    if (openActionsId === userId) {
      setOpenActionsId(null);
      setMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      left: Math.max(12, rect.right - 192),
    });
    setOpenActionsId(userId);
  };

  const closeActions = () => {
    setOpenActionsId(null);
    setMenuPosition(null);
  };

  const activeUser = items.find((user) => user.id === openActionsId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder={m.searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs rounded-lg border border-stroke bg-white px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as OrgUserStatus | "")}
          className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        >
          <option value="">{m.filterStatus}</option>
          <option value="ACTIVE">{m.statusActive}</option>
          <option value="PENDING">{m.statusPending}</option>
          <option value="DISABLED">{m.statusDisabled}</option>
        </select>
      </div>

      <div className="relative overflow-visible rounded-xl border border-stroke dark:border-dark-3">
        <div className="relative overflow-x-auto overflow-y-visible">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80">
              <th className="px-4 py-3 font-medium text-dark dark:text-white">{m.colEmail}</th>
              <th className="px-4 py-3 font-medium text-dark dark:text-white">{m.colFullName}</th>
              <th className="px-4 py-3 font-medium text-dark dark:text-white">{m.colTeamRole}</th>
              <th className="px-4 py-3 font-medium text-dark dark:text-white">{m.colStatus}</th>
              <th className="w-24 px-4 py-3 font-medium text-dark dark:text-white">{m.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">
                  {m.noMembers}
                </td>
              </tr>
            ) : (
              items.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40"
                >
                  <td className="px-4 py-3 text-dark dark:text-white">{user.email}</td>
                  <td className="px-4 py-3 text-dark dark:text-white">{user.full_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-dark dark:text-white">{getRoleDisplay(user)}</span>
                    {user.must_change_password && (
                      <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        {m.pendingBadge}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.status === "ACTIVE"
                          ? "text-green-600 dark:text-green-400"
                          : user.status === "PENDING"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-dark-6 dark:text-dark-6"
                      }
                    >
                      {user.status === "ACTIVE"
                        ? m.statusActive
                        : user.status === "PENDING"
                          ? m.statusPending
                          : m.statusDisabled}
                    </span>
                  </td>
                  <td className="relative px-4 py-3">
                    <button
                      type="button"
                      onClick={(event) => toggleActions(user.id, event)}
                      className="rounded p-1 hover:bg-gray-100 dark:hover:bg-dark-3"
                      aria-label="Actions"
                    >
                      <svg className="h-5 w-5 text-dark-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-dark-6 dark:text-dark-6">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded border border-stroke px-3 py-1.5 text-sm disabled:opacity-50 dark:border-dark-3"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded border border-stroke px-3 py-1.5 text-sm disabled:opacity-50 dark:border-dark-3"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {openActionsId && menuPosition && activeUser && typeof document !== "undefined"
        ? createPortal(
            <>
              <div className="fixed inset-0 z-[9998]" aria-hidden onClick={closeActions} />
              <div
                className="fixed z-[9999] w-48 rounded-lg border border-stroke bg-white py-1 shadow-lg dark:border-dark-3 dark:bg-gray-dark"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-3"
                  onClick={() => {
                    onEdit(activeUser);
                    closeActions();
                  }}
                >
                  {m.edit}
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-3"
                  onClick={() => {
                    onEditRoles(activeUser);
                    closeActions();
                  }}
                >
                  {m.editRoles}
                </button>
                {activeUser.status === "ACTIVE" ? (
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-3"
                    onClick={() => {
                      onDisable(activeUser);
                      closeActions();
                    }}
                  >
                    {m.disable}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-3"
                    onClick={() => {
                      onEnable(activeUser);
                      closeActions();
                    }}
                  >
                    {m.enable}
                  </button>
                )}
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-3"
                  onClick={() => {
                    onResetPassword(activeUser);
                    closeActions();
                  }}
                >
                  {m.resetPassword}
                </button>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}
