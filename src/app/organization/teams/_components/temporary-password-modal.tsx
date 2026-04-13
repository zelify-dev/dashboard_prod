"use client";

import { useState } from "react";
import { useUiTranslations } from "@/hooks/use-ui-translations";

type TemporaryPasswordModalProps = {
  temporaryPassword: string;
  onSendEmail?: (temporaryPassword: string) => Promise<void>;
  onClose: () => void;
};

export function TemporaryPasswordModal({
  temporaryPassword,
  onSendEmail,
  onClose,
}: TemporaryPasswordModalProps) {
  const t = useUiTranslations();
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<"success" | "error" | null>(null);
  const m = t.membersManagement;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSendEmail = async () => {
    if (!onSendEmail) return;
    setSendingEmail(true);
    setEmailMessage(null);
    try {
      await onSendEmail(temporaryPassword);
      setEmailMessage("success");
    } catch {
      setEmailMessage("error");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark dark:shadow-card">
        <h2 className="text-heading-5 font-semibold text-dark dark:text-white">
          {m.tempPasswordTitle}
        </h2>
        <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
          {m.tempPasswordWarning}
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-stroke bg-gray-2/50 p-3 dark:border-dark-3 dark:bg-dark-2">
          <code className="min-w-0 flex-1 truncate font-mono text-sm text-dark dark:text-white">
            {temporaryPassword}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            {copied ? m.tempPasswordCopied : m.tempPasswordCopy}
          </button>
        </div>
        {onSendEmail && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-70"
            >
              {sendingEmail ? "…" : (m.sendEmailButton ?? "Send credentials by email")}
            </button>
            {emailMessage === "success" && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                {m.sendEmailSuccess ?? "Email sent successfully."}
              </p>
            )}
            {emailMessage === "error" && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {m.sendEmailError ?? "Failed to send email."}
              </p>
            )}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90"
          >
            {m.tempPasswordDone}
          </button>
        </div>
      </div>
    </div>
  );
}
