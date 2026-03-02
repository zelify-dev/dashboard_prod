"use client";

import { useState, useEffect } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { UserIcon } from "@/assets/icons";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import type { OrgUser } from "@/lib/organization-users-api";
import type { OrgUserStatus } from "@/lib/organization-users-api";

type EditMemberModalProps = {
  user: OrgUser;
  onClose: () => void;
  onSave: (data: { full_name: string; status: OrgUserStatus }) => Promise<void>;
};

export function EditMemberModal({ user, onClose, onSave }: EditMemberModalProps) {
  const t = useUiTranslations();
  const m = t.membersManagement;
  const [fullName, setFullName] = useState(user.full_name);
  const [status, setStatus] = useState<OrgUserStatus>(user.status as OrgUserStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(user.full_name);
    setStatus((user.status as OrgUserStatus) || "ACTIVE");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSave({ full_name: fullName, status });
      onClose();
    } catch (err: unknown) {
      const message = err && typeof (err as Error).message === "string" ? (err as Error).message : m.errors.noPermission;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark dark:shadow-card">
        <h2 className="text-heading-5 font-semibold text-dark dark:text-white">
          {m.editMemberTitle}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <InputGroup
            label={t.organizationTeams.addMemberModal.fullNameLabel}
            type="text"
            name="fullName"
            placeholder={t.organizationTeams.addMemberModal.fullNamePlaceholder}
            value={fullName}
            handleChange={(e) => setFullName(e.target.value)}
            icon={<UserIcon />}
            iconPosition="left"
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {m.colStatus}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrgUserStatus)}
              className="w-full rounded-lg border border-stroke bg-gray-2/60 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2/80 dark:text-white"
            >
              <option value="ACTIVE">{m.statusActive}</option>
              <option value="DISABLED">{m.statusDisabled}</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
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
