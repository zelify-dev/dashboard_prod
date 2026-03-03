"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  getOrganizationAdmin,
  updateOrganization,
  listOrganizationScopes,
  addOrganizationScopes,
  removeOrganizationScope,
  encodeScopeForUrl,
  type OrganizationAdmin,
  type ScopeItem,
} from "@/lib/organizations-admin-api";
import { AuthError } from "@/lib/auth-api";

const QUICK_GRANT_AUTH_FULL = [
  "auth.authentication.*",
  "auth.geolocation.*",
  "auth.device_information.*",
];

type TabId = "overview" | "branding" | "scopes";

export default function OrganizationAdminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [org, setOrg] = useState<OrganizationAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Edit name/status
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Scopes
  const [scopes, setScopes] = useState<ScopeItem[]>([]);
  const [scopesLoading, setScopesLoading] = useState(false);
  const [newScopeInput, setNewScopeInput] = useState("");
  const [addScopeLoading, setAddScopeLoading] = useState(false);
  const [removeScopeLoading, setRemoveScopeLoading] = useState<string | null>(null);

  const fetchOrg = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getOrganizationAdmin(id);
      setOrg(data);
      setEditName(data.name ?? "");
      setEditStatus(data.status ?? "ACTIVE");
    } catch (err) {
      if (err instanceof AuthError && err.statusCode === 404) {
        router.replace("/organization/admin");
      }
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchScopes = useCallback(async () => {
    if (!id) return;
    setScopesLoading(true);
    try {
      const list = await listOrganizationScopes(id);
      setScopes(list);
    } catch {
      setScopes([]);
    } finally {
      setScopesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  useEffect(() => {
    if (activeTab === "scopes") fetchScopes();
  }, [activeTab, fetchScopes]);

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setEditError("");
    setEditSaving(true);
    try {
      const updated = await updateOrganization(id, { name: editName.trim(), status: editStatus });
      setOrg(updated);
    } catch (err) {
      if (err instanceof AuthError) setEditError(err.message);
      else setEditError("Error al actualizar");
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddScopes = async (scopeList: string[]) => {
    if (!id || scopeList.length === 0) return;
    setAddScopeLoading(true);
    try {
      await addOrganizationScopes(id, scopeList.map((s) => s.trim().toLowerCase()).filter(Boolean));
      setNewScopeInput("");
      fetchScopes();
      fetchOrg();
    } finally {
      setAddScopeLoading(false);
    }
  };

  const handleAddScopeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const list = newScopeInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length > 0) handleAddScopes(list);
  };

  const handleRemoveScope = async (scope: string) => {
    if (!id) return;
    setRemoveScopeLoading(scope);
    try {
      await removeOrganizationScope(id, encodeScopeForUrl(scope));
      fetchScopes();
      fetchOrg();
    } finally {
      setRemoveScopeLoading(null);
    }
  };

  if (loading || !org) {
    return (
      <div className="mx-auto w-full max-w-[1000px]">
        <Breadcrumb pageName="Organization" />
        <p className="py-8 text-center text-dark-6 dark:text-dark-6">
          {loading ? "Loading…" : "Organization not found."}
        </p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "branding", label: "Branding" },
    { id: "scopes", label: "Scopes" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <Breadcrumb pageName="Organization" />
      <div className="mb-4 flex items-center gap-2 text-sm text-dark-6 dark:text-dark-6">
        <Link href="/organization/admin" className="text-primary hover:underline">
          Organization Admin
        </Link>
        <span>/</span>
        <span className="text-dark dark:text-white">{org.name}</span>
      </div>

      <div className="mb-6 flex border-b border-stroke dark:border-dark-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="rounded-xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="text-lg font-semibold text-dark dark:text-white">Overview</h2>
          <form onSubmit={handleSaveOverview} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full max-w-md rounded-lg border border-stroke bg-gray-2/60 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2/80 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full max-w-md rounded-lg border border-stroke bg-gray-2/60 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2/80 dark:text-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </div>
            <div className="grid gap-2 text-sm text-dark-6 dark:text-dark-6">
              <p>ID: <span className="font-mono text-dark dark:text-white">{org.id}</span></p>
              <p>Country: {org.country ?? "—"}</p>
              <p>Currency: {org.currency ?? "—"}</p>
              <p>Fiscal ID: {org.fiscal_id ?? "—"}</p>
              <p>Zcoins: {org.zcoins ?? "0"}</p>
              <p>Company legal name: {org.company_legal_name ?? "—"}</p>
              <p>Industry: {org.industry ?? "—"}</p>
            </div>
            {editError && <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>}
            <button
              type="submit"
              disabled={editSaving}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-70"
            >
              {editSaving ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "branding" && (
        <div className="rounded-xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="text-lg font-semibold text-dark dark:text-white">Branding</h2>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">Read-only. Edit via API if needed.</p>
          <div className="mt-4 space-y-4">
            <div>
              <span className="text-sm font-medium text-dark dark:text-white">Logo URL</span>
              <p className="text-sm text-dark-6 dark:text-dark-6 break-all">{org.url_log ?? "—"}</p>
              {org.url_log && (
                <img src={org.url_log} alt="Logo" className="mt-2 h-16 object-contain" />
              )}
            </div>
            <div className="flex gap-4">
              <div>
                <span className="text-sm font-medium text-dark dark:text-white">Color A</span>
                <div className="mt-1 flex items-center gap-2">
                  {org.color_a && (
                    <span
                      className="inline-block h-8 w-16 rounded border border-stroke"
                      style={{ backgroundColor: org.color_a }}
                    />
                  )}
                  <span className="text-sm text-dark-6 dark:text-dark-6">{org.color_a ?? "—"}</span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-dark dark:text-white">Color B</span>
                <div className="mt-1 flex items-center gap-2">
                  {org.color_b && (
                    <span
                      className="inline-block h-8 w-16 rounded border border-stroke"
                      style={{ backgroundColor: org.color_b }}
                    />
                  )}
                  <span className="text-sm text-dark-6 dark:text-dark-6">{org.color_b ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "scopes" && (
        <div className="rounded-xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="text-lg font-semibold text-dark dark:text-white">Scopes</h2>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            Product.subproduct.operation or product.subproduct.*
          </p>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-dark dark:text-white">Quick grant</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={addScopeLoading}
                onClick={() => handleAddScopes(QUICK_GRANT_AUTH_FULL)}
                className="rounded-lg border border-stroke px-3 py-1.5 text-sm dark:border-dark-3 disabled:opacity-70"
              >
                Grant Auth full
              </button>
            </div>
          </div>

          <form onSubmit={handleAddScopeSubmit} className="mt-4 flex gap-2">
            <input
              type="text"
              value={newScopeInput}
              onChange={(e) => setNewScopeInput(e.target.value)}
              placeholder="e.g. auth.authentication.* (comma or space separated)"
              className="flex-1 rounded-lg border border-stroke bg-gray-2/60 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2/80 dark:text-white"
            />
            <button
              type="submit"
              disabled={addScopeLoading}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm text-white disabled:opacity-70"
            >
              {addScopeLoading ? "Adding…" : "Add"}
            </button>
          </form>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-dark dark:text-white">Current scopes ({scopes.length})</p>
            {scopesLoading ? (
              <p className="text-sm text-dark-6 dark:text-dark-6">Loading…</p>
            ) : scopes.length === 0 ? (
              <p className="text-sm text-dark-6 dark:text-dark-6">No scopes.</p>
            ) : (
              <ul className="space-y-2">
                {scopes.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3"
                  >
                    <span className="font-mono text-dark dark:text-white">{item.scope}</span>
                    <button
                      type="button"
                      disabled={removeScopeLoading === item.scope}
                      onClick={() => handleRemoveScope(item.scope)}
                      className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                    >
                      {removeScopeLoading === item.scope ? "Removing…" : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
