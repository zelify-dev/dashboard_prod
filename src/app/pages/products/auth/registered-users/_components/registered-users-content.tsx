"use client";

import { useEffect, useState, useCallback } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { getStoredOrganization } from "@/lib/auth-api";
import {
  listRegisteredUsers,
  listDashboardMembers,
  listOrgUsers,
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

  const load = useCallback(async () => {
    if (!org?.id) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const filterParams = {
      page,
      limit: LIMIT,
      search: search || undefined,
      status: statusFilter || undefined,
    };

    try {
      // 1. Endpoint oficial: GET /api/users/registered
      let res = await listRegisteredUsers(org.id, filterParams);

      // 2. Si la lista viene vacía o no responde, intentar con fallback de miembros/usuarios genéricos
      if (!res.items || res.items.length === 0) {
        res = await listDashboardMembers(org.id, { ...filterParams, role_code: "USER_APP" });
      }
      if (!res.items || res.items.length === 0) {
        res = await listOrgUsers(org.id, filterParams);
      }
      if (!res.items || res.items.length === 0) {
        res = await listDashboardMembers(org.id, filterParams);
      }

      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch {
      try {
        const fallbackRes = await listOrgUsers(org.id, filterParams);
        setItems(fallbackRes.items || []);
        setTotal(fallbackRes.total || 0);
      } catch {
        setItems([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
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
        return "rounded-lg bg-zelify-midnight px-2.5 py-1 text-[10px] font-light uppercase text-zelify-green border border-zelify-black/30";
      case "PENDING":
        return "rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-light uppercase text-amber-600 border border-amber-100";
      default:
        return "rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-light uppercase text-dark-6 border border-gray-200";
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
            className="max-w-sm rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-light text-dark transition focus:border-zelify-midnight focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrgUserStatus | "");
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-light text-dark transition focus:border-zelify-midnight focus:outline-none"
          >
            <option value="">{m.filterStatus}</option>
            <option value="ACTIVE">{m.statusActive}</option>
            <option value="PENDING">{m.statusPending}</option>
            <option value="DISABLED">{m.statusDisabled}</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-transparent">
                  <th className="px-5 py-3 text-xs font-light uppercase tracking-wider text-dark-6">
                    {m.colEmail}
                  </th>
                  <th className="px-5 py-3 text-xs font-light uppercase tracking-wider text-dark-6">
                    {m.colFullName}
                  </th>
                  <th className="px-5 py-3 text-xs font-light uppercase tracking-wider text-dark-6">
                    {m.colStatus}
                  </th>
                  <th className="px-5 py-3 text-xs font-light uppercase tracking-wider text-dark-6">
                    {m.colCreatedAt}
                  </th>
                  <th className="px-5 py-3 text-xs font-light uppercase tracking-wider text-dark-6">
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
                  items.map((user) => (
                    <tr
                      key={user.id}
                      className="bg-white border-b border-gray-100 transition-colors hover:bg-gray-50"
                    >
                      <td className="px-5 py-3 font-normal text-dark">
                        {user.email}
                      </td>
                      <td className="px-5 py-3 font-light text-dark">{user.full_name}</td>
                      <td className="px-5 py-3">
                        <span className={statusBadgeClass(user.status)}>
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-light text-dark-6">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-5 py-3 font-light text-dark-6">
                        {formatDate(user.updated_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-5 py-3">
              <p className="text-sm font-light text-dark-6">
                <span className="font-normal text-dark">{total}</span>{" "}
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
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-light text-dark transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-light text-dark transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
