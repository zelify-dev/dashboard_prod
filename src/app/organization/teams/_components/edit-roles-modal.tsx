"use client";

import { useState, useEffect } from "react";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import type { OrgUser } from "@/lib/organization-users-api";

export type RoleOption = { value: string; label: string };

type EditRolesModalProps = {
  user: OrgUser;
  roleOptions: RoleOption[];
  onClose: () => void;
  onSave: (roleCodes: string[]) => Promise<void>;
};

export function EditRolesModal({ user, roleOptions, onClose, onSave }: EditRolesModalProps) {
  const t = useUiTranslations();
  const m = t.membersManagement;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const codes = (user.roles ?? [])
      .map((role) => (typeof role === "string" ? role : role.code))
      .filter((code): code is string => typeof code === "string" && code.length > 0);
    setSelected(new Set(codes));
  }, [user]);

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSave(Array.from(selected));
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : m.errors.noPermission);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark dark:shadow-card">
        <h2 className="text-heading-5 font-semibold text-dark dark:text-white">
          {m.editRolesTitle}
        </h2>
        <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">{user.email}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {roleOptions.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(opt.value)}
                onChange={() => toggle(opt.value)}
                className="h-4 w-4 rounded border-stroke text-primary dark:border-dark-3"
              />
              <span className="text-sm text-dark dark:text-white">{opt.label}</span>
            </label>
          ))}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-stroke px-4 py-2 text-sm dark:border-dark-3">
              {t.organizationTeams.actions.cancel}
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-70">
              {t.settings?.save ?? "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
