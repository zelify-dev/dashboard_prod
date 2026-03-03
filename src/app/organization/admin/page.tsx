"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { getStoredRoles } from "@/lib/auth-api";
import { isOwner } from "@/app/organization/teams/_constants/team-roles";
import {
  listOrganizations,
  createOrganization,
  type OrganizationAdmin,
} from "@/lib/organizations-admin-api";
import { AuthError } from "@/lib/auth-api";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";

const pageTitle = "Organization Admin";

export default function OrganizationAdminPage() {
  const t = useUiTranslations();
  const isOwnerUser = isOwner(getStoredRoles());
  const [organizations, setOrganizations] = useState<OrganizationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createStatus, setCreateStatus] = useState("ACTIVE");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchOrgs = useCallback(async () => {
    if (!isOwnerUser) return;
    setLoading(true);
    try {
      const list = await listOrganizations();
      setOrganizations(list);
    } catch {
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [isOwnerUser]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const filteredOrgs = organizations.filter((org) => {
    const matchSearch =
      !search ||
      org.name?.toLowerCase().includes(search.toLowerCase()) ||
      org.id?.toLowerCase().includes(search.toLowerCase()) ||
      org.fiscal_id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || org.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);
    try {
      await createOrganization({ name: createName.trim(), status: createStatus });
      setCreateModalOpen(false);
      setCreateName("");
      setCreateStatus("ACTIVE");
      fetchOrgs();
    } catch (err) {
      if (err instanceof AuthError) {
        setCreateError(err.message);
      } else {
        setCreateError("Error al crear la organización");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const title = t.sidebar?.menuItems?.subItems?.organizationAdmin ?? pageTitle;

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={title} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-heading-4 font-semibold text-dark dark:text-white">
          {title}
        </h1>
        <button
          type="button"
          onClick={() => {
            setCreateError("");
            setCreateModalOpen(true);
          }}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90"
        >
          Create organization
        </button>
      </div>

      <ShowcaseSection title={title} className="!p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search by name, ID, fiscal ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs rounded-lg border border-stroke bg-white px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stroke bg-gray-2/60 dark:border-dark-3 dark:bg-dark-2/80">
                <th className="px-4 py-3 font-medium text-dark dark:text-white">Business name</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">Org ID</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">Country / Currency</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">Fiscal ID</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">Status</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">Zcoins</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">Scopes</th>
                <th className="w-28 px-4 py-3 font-medium text-dark dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">
                    Loading…
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-dark-6 dark:text-dark-6">
                    No organizations found.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr
                    key={org.id}
                    className="border-b border-stroke dark:border-dark-3 dark:bg-dark-2/40"
                  >
                    <td className="px-4 py-3 text-dark dark:text-white">{org.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-dark-6 dark:text-dark-6">
                      {org.id}
                    </td>
                    <td className="px-4 py-3 text-dark dark:text-white">
                      {org.country ?? "—"} / {org.currency ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-dark dark:text-white">{org.fiscal_id ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          org.status === "ACTIVE"
                            ? "text-green-600 dark:text-green-400"
                            : "text-dark-6 dark:text-dark-6"
                        }
                      >
                        {org.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark dark:text-white">{org.zcoins ?? "0"}</td>
                    <td className="px-4 py-3 text-dark dark:text-white">
                      {org.scopes?.length ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/organization/admin/${org.id}`}
                        className="text-primary hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ShowcaseSection>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark dark:shadow-card">
            <h2 className="text-heading-5 font-semibold text-dark dark:text-white">
              Create organization
            </h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-gray-2/60 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2/80 dark:text-white"
                  placeholder="Organization name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  Status
                </label>
                <select
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-gray-2/60 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2/80 dark:text-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
              </div>
              {createError && (
                <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
              )}
              <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={createLoading}
                  className="rounded-lg border border-stroke px-4 py-2 text-sm dark:border-dark-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-70"
                >
                  {createLoading ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
