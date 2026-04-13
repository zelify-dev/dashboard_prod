"use client";

import { useState } from "react";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import type { OrgUserListItem } from "@/lib/organization-users-api";
import { TemporaryPasswordModal } from "./temporary-password-modal";

type ResetPasswordModalProps = {
  user: OrgUserListItem;
  onClose: () => void;
  onReset: (userId: string) => Promise<{ temporary_password: string }>;
  onSendEmail?: (userId: string, temporaryPassword: string) => Promise<void>;
};

export function ResetPasswordModal({ user, onClose, onReset, onSendEmail }: ResetPasswordModalProps) {
  const t = useUiTranslations();
  const m = t.membersManagement;
  const [step, setStep] = useState<"confirm" | "password">("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await onReset(user.id);
      setTempPassword(result.temporary_password);
      setStep("password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  if (step === "password") {
    return (
      <TemporaryPasswordModal
        temporaryPassword={tempPassword}
        onSendEmail={
          onSendEmail
            ? (temporaryPassword) => onSendEmail(user.id, temporaryPassword)
            : undefined
        }
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark dark:shadow-card">
        <h2 className="text-heading-5 font-semibold text-dark dark:text-white">
          {m.resetPasswordTitle}
        </h2>
        <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
          {m.resetPasswordConfirm}
        </p>
        <p className="mt-1 text-sm font-medium text-dark dark:text-white">{user.email}</p>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stroke px-4 py-2 text-sm dark:border-dark-3"
          >
            {t.organizationTeams.actions.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-70"
          >
            {loading ? "…" : m.resetPassword}
          </button>
        </div>
      </div>
    </div>
  );
}
