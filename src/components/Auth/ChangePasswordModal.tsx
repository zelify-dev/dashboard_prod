"use client";

/**
 * Modal obligatorio tras el login cuando el usuario tiene must_change_password.
 * Usa POST /api/auth/organizations/{orgId}/members/password/reset (current_password + new_password)
 * o POST /api/auth/password/change como alternativa. Tras 201 llama syncMe() para actualizar la sesión.
 */
import { useState } from "react";
import InputGroup from "@/components/FormElements/InputGroup";
import { PasswordIcon } from "@/assets/icons";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import {
  memberPasswordReset,
  authPasswordChange,
  syncMe,
  getStoredOrganization,
  AuthError,
} from "@/lib/auth-api";

const MIN_PASSWORD_LENGTH = 8;

type ChangePasswordModalProps = {
  onSuccess: () => void;
};

export function ChangePasswordModal({ onSuccess }: ChangePasswordModalProps) {
  const t = useUiTranslations();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strings = t.changePasswordRequired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(strings.errorMinLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(strings.errorMatch);
      return;
    }
    setSubmitting(true);
    try {
      const orgId = getStoredOrganization()?.id;
      if (orgId) {
        await memberPasswordReset(orgId, {
          current_password: currentPassword,
          new_password: newPassword,
        });
      } else {
        await authPasswordChange({
          current_password: currentPassword,
          new_password: newPassword,
        });
      }
      await syncMe();
      onSuccess();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : strings.errorMatch);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark dark:shadow-card">
        <h2 className="text-heading-5 font-bold text-dark dark:text-white">
          {strings.title}
        </h2>
        <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
          {strings.description}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <InputGroup
            label={strings.currentPasswordLabel}
            type="password"
            name="currentPassword"
            placeholder={strings.currentPasswordPlaceholder}
            value={currentPassword}
            handleChange={(e) => setCurrentPassword(e.target.value)}
            icon={<PasswordIcon />}
            iconPosition="left"
            required
            autoComplete="current-password"
          />
          <InputGroup
            label={strings.newPasswordLabel}
            type="password"
            name="newPassword"
            placeholder={strings.newPasswordPlaceholder}
            value={newPassword}
            handleChange={(e) => setNewPassword(e.target.value)}
            icon={<PasswordIcon />}
            iconPosition="left"
            required
            autoComplete="new-password"
          />
          <InputGroup
            label={strings.confirmPasswordLabel}
            type="password"
            name="confirmPassword"
            placeholder={strings.confirmPasswordPlaceholder}
            value={confirmPassword}
            handleChange={(e) => setConfirmPassword(e.target.value)}
            icon={<PasswordIcon />}
            iconPosition="left"
            required
            autoComplete="new-password"
          />

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
            >
              {submitting ? strings.submitting : strings.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
