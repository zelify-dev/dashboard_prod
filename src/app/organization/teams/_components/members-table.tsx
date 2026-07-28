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

  const getStatusDisplay = (user: OrgUserListItem) => {
    if (user.status === "DISABLED") {
      return {
        label: m.statusDisabled,
        className: "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider bg-gray-100 text-dark-6 border border-gray-200/50",
      };
    }

    if (user.must_change_password) {
      return {
        label: m.pendingBadge,
        className: "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200/40",
      };
    }

    if (user.status === "PENDING") {
      return {
        label: m.statusPending,
        className: "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200/40",
      };
    }

    return {
      label: m.statusActive,
      className: "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider bg-zelify-midnight text-zelify-green",
    };
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

  const activeUser = items.find((user) => user.id === openActionsId) ?? null;  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder={m.searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-1.5 text-xs font-light text-dark placeholder:text-dark-6 focus:outline-none focus:border-gray-200"
        />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as OrgUserStatus | "")}
          className="rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-1.5 text-xs font-light text-dark focus:outline-none focus:border-gray-200"
        >
          <option value="">{m.filterStatus}</option>
          <option value="ACTIVE">{m.statusActive}</option>
          <option value="PENDING">{m.statusPending}</option>
          <option value="DISABLED">{m.statusDisabled}</option>
        </select>
      </div>

      <div className="relative overflow-visible border-b border-gray-100">
        <div className="relative overflow-x-auto overflow-y-visible">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-xs font-light uppercase tracking-wider text-dark-6">{m.colEmail}</th>
              <th className="px-4 py-3 text-xs font-light uppercase tracking-wider text-dark-6">{m.colFullName}</th>
              <th className="px-4 py-3 text-xs font-light uppercase tracking-wider text-dark-6">{m.colTeamRole}</th>
              <th className="px-4 py-3 text-xs font-light uppercase tracking-wider text-dark-6">{m.colStatus}</th>
              <th className="w-24 px-4 py-3 text-xs font-light uppercase tracking-wider text-dark-6">{m.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs font-light text-dark-6">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs font-light text-dark-6">
                  {m.noMembers}
                </td>
              </tr>
            ) : (
              items.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 transition hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 text-sm font-light text-dark-6">{user.email}</td>
                  <td className="px-4 py-3 text-sm font-normal text-dark">{user.full_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-light text-dark-6">{getRoleDisplay(user)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const statusDisplay = getStatusDisplay(user);
                      return (
                        <span className={statusDisplay.className}>
                          {statusDisplay.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="relative px-4 py-3">
                    <button
                      type="button"
                      onClick={(event) => toggleActions(user.id, event)}
                      className="rounded-lg p-1 hover:bg-gray-50 transition"
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
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <p className="text-xs font-light text-dark-6">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-light text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-light text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="fixed z-[9999] w-48 rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl animate-in fade-in duration-100"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-xs font-light text-dark-6 hover:bg-gray-50 hover:text-dark transition"
                  onClick={() => {
                    onEdit(activeUser);
                    closeActions();
                  }}
                >
                  {m.edit}
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-xs font-light text-dark-6 hover:bg-gray-50 hover:text-dark transition"
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
                    className="w-full px-4 py-2 text-left text-xs font-light text-dark-6 hover:bg-gray-50 hover:text-dark transition"
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
                    className="w-full px-4 py-2 text-left text-xs font-light text-dark-6 hover:bg-gray-50 hover:text-dark transition"
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
                  className="w-full px-4 py-2 text-left text-xs font-light text-dark-6 hover:bg-gray-50 hover:text-dark transition"
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
