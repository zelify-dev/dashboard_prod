"use client";

import { useEffect, useState, useCallback } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { getStoredOrganization } from "@/lib/auth-api";
import {
  listDashboardMembers,
  type OrgUserListItem,
  type OrgUserStatus,
} from "@/lib/organization-users-api";

const LIMIT = 20;

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function RegisteredUsersContent() {
  const t = useUiTranslations();
  const m = t.membersManagement;
  const org = getStoredOrganization();
  const [items, setItems] = useState<OrgUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrgUserStatus | "">("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!org?.id) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    listDashboardMembers(org.id, {
      role_code: "USER_APP",
      page,
      limit: LIMIT,
      search: search || undefined,
      status: statusFilter || undefined,
    })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [org?.id, page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const breadcrumbLabel = t.sidebar.menuItems.subItems.registeredUsers;

  if (!org?.id) {
    return (
      <div className="mx-auto w-full max-w-[1400px]">
        <Breadcrumb pageName={breadcrumbLabel} />
        <p className="text-dark-6 dark:text-dark-6">Selecciona una organización.</p>
      </div>
    );
  }

  const statusBadgeClass = (status: OrgUserStatus) => {
    switch (status) {
      case "ACTIVE":
        return "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300";
      case "PENDING":
        return "rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
      default:
        return "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-dark-3 dark:text-dark-6";
    }
  };

  const getStatusLabel = (status: OrgUserStatus) =>
    status === "ACTIVE" ? m.statusActive : status === "PENDING" ? m.statusPending : m.statusDisabled;

  return (
    <>
      <Breadcrumb pageName={breadcrumbLabel} />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            placeholder={m.searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrgUserStatus | "");
              setPage(1);
            }}
            className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="">{m.filterStatus}</option>
            <option value="ACTIVE">{m.statusActive}</option>
            <option value="PENDING">{m.statusPending}</option>
            <option value="DISABLED">{m.statusDisabled}</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-3">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-dark-6 dark:text-dark-6">
                    {m.colEmail}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-dark-6 dark:text-dark-6">
                    {m.colFullName}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-dark-6 dark:text-dark-6">
                    {m.colStatus}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-dark-6 dark:text-dark-6">
                    {m.colCreatedAt}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-dark-6 dark:text-dark-6">
                    {m.colUpdatedAt}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-dark-3">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-dark-6 dark:text-dark-6">
                      Loading…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-dark-6 dark:text-dark-6">
                      {m.noMembers}
                    </td>
                  </tr>
                ) : (
                  items.map((user, index) => (
                    <tr
                      key={user.id}
                      className={
                        index % 2 === 0
                          ? "bg-white transition-colors hover:bg-gray-2/60 dark:bg-dark-2 dark:hover:bg-dark-3/60"
                          : "bg-gray-2/50 transition-colors hover:bg-gray-2 dark:bg-dark-2/80 dark:hover:bg-dark-3/80"
                      }
                    >
                      <td className="px-5 py-4 font-medium text-dark dark:text-white">
                        {user.email}
                      </td>
                      <td className="px-5 py-4 text-dark dark:text-white">{user.full_name}</td>
                      <td className="px-5 py-4">
                        <span className={statusBadgeClass(user.status)}>
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-dark-6 dark:text-dark-6">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-5 py-4 text-dark-6 dark:text-dark-6">
                        {formatDate(user.updated_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke bg-gray-2/40 px-5 py-3 dark:border-dark-3 dark:bg-dark-3/50">
              <p className="text-sm text-dark-6 dark:text-dark-6">
                <span className="font-medium text-dark dark:text-white">{total}</span>{" "}
                {total === 1 ? "user" : "users"}
                {totalPages > 1 && (
                  <> · Page {page} of {totalPages}</>
                )}
              </p>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-dark shadow-sm transition hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-dark shadow-sm transition hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
