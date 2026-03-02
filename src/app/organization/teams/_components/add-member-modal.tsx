/**
 * Modal para añadir miembro. Envía email, full_name y roles; el backend devuelve
 * la contraseña temporal. Las opciones de rol las define el padre: OWNER ve los 5 roles, ORG_ADMIN solo 3.
 */
import InputGroup from "@/components/FormElements/InputGroup";
import { EmailIcon, UserIcon } from "@/assets/icons";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { useState } from "react";

export type RoleOption = { value: string; label: string };

type AddMemberModalProps = {
  onClose: () => void;
  onAdd: (data: { fullName: string; email: string; role: string }) => void;
  roleOptions: RoleOption[];
  initialRole?: string;
  loading?: boolean;
  error?: string;
};

export function AddMemberModal({
  onClose,
  onAdd,
  roleOptions,
  initialRole,
  loading = false,
  error: externalError,
}: AddMemberModalProps) {
  const t = useUiTranslations();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const defaultRole = initialRole ?? roleOptions[0]?.value ?? "";
  const [role, setRole] = useState(defaultRole);
  const modalRef = useClickOutside<HTMLDivElement>(() => !loading && onClose());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ fullName, email, role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        className="w-full max-w-xl rounded-xl bg-white shadow-xl dark:bg-gray-dark dark:shadow-card"
      >
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h2 className="text-heading-5 font-semibold text-dark dark:text-white">
            {t.organizationTeams.addMemberModal.title}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
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
            <InputGroup
              label={t.organizationTeams.addMemberModal.emailLabel}
              type="email"
              name="email"
              placeholder={t.organizationTeams.addMemberModal.emailPlaceholder}
              value={email}
              handleChange={(e) => setEmail(e.target.value)}
              icon={<EmailIcon />}
              iconPosition="left"
              required
            />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {t.membersManagement.roleLabel}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-2/60 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-2/80 dark:text-white"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-dark-6 dark:text-dark-6">
                {t.organizationTeams.addMemberModal.passwordHelper}
              </p>
            </div>
          </div>

          {(externalError || loading) && (
            <div className="mt-3">
              {externalError && (
                <p className="text-sm text-red-600 dark:text-red-400">{externalError}</p>
              )}
              {loading && (
                <p className="text-sm text-dark-6 dark:text-dark-6">Creating…</p>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3 border-t border-stroke pt-5 dark:border-dark-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-stroke px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-70"
            >
              {t.organizationTeams.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
            >
              {t.organizationTeams.addMemberModal.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
