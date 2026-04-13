"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { AuthError } from "@/lib/auth-api";
import {
  createOrganizationEmailSetting,
  getOrganizationEmailSetting,
  type DnsRecordV2,
  type OrganizationEmailSettingV2,
} from "@/lib/notifications-email-settings-api";
import { Button } from "@/components/ui-elements/button";
import { useNotificationsTranslations } from "./use-notifications-translations";

type NotificationsDomainsPanelProps = {
  /** Sin scopes ni onboarding verificado (o carga de org): UI visible pero no editable */
  disabled?: boolean;
  organizationId: string | null;
};

function formatDateTime(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function recordStatusClass(status: string | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s.includes("verif") || s.includes("ok") || s === "active") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200";
  }
  if (s.includes("pend") || s.includes("wait")) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200";
  }
  if (s.includes("fail") || s.includes("error")) {
    return "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200";
  }
  return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-dark-6";
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Etiqueta legible para el estado devuelto por la API (p. ej. pending_verification → Pendiente). */
function formatDnsRecordStatus(
  status: string | undefined,
  labels: { pending: string },
): string {
  if (!status) return "";
  const n = status.trim().toLowerCase().replace(/-/g, "_");
  if (n === "pending_verification") return labels.pending;
  return status;
}

function CopyIconButton({
  value,
  ariaLabel,
  disabled,
  onCopy,
}: {
  value: string;
  ariaLabel: string;
  disabled?: boolean;
  onCopy: (v: string) => void;
}) {
  if (!value) return null;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onCopy(value)}
      className="inline-flex shrink-0 rounded p-0.5 text-dark-6 transition hover:bg-gray-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-dark-3"
      title={ariaLabel}
      aria-label={ariaLabel}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    </button>
  );
}

function DnsCellWithCopy({
  text,
  mono,
  maxClass,
  copyLabel,
  disabled,
  onCopy,
}: {
  text: string;
  mono?: boolean;
  maxClass?: string;
  copyLabel: string;
  disabled?: boolean;
  onCopy: (v: string) => void;
}) {
  const show = text.length > 0;
  return (
    <div className={cn("flex min-w-0 items-center gap-1", maxClass)}>
      <span
        className={cn("min-w-0 truncate", mono && "font-mono text-xs")}
        title={show ? text : undefined}
      >
        {show ? text : "—"}
      </span>
      {show ? <CopyIconButton value={text} ariaLabel={copyLabel} disabled={disabled} onCopy={onCopy} /> : null}
    </div>
  );
}

export function NotificationsDomainsPanel({
  disabled = false,
  organizationId,
}: NotificationsDomainsPanelProps) {
  const { language } = useLanguage();
  const translations = useNotificationsTranslations();
  const t = translations.domains;
  const locale = language === "es" ? "es-ES" : "en-US";

  const [setting, setSetting] = useState<OrganizationEmailSettingV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const loadSetting = useCallback(
    async (verifyDns: boolean) => {
      if (!organizationId) {
        setSetting(null);
        return;
      }
      setLoadMessage(null);
      if (verifyDns) setVerifying(true);
      else setLoading(true);
      try {
        const data = await getOrganizationEmailSetting(organizationId, { verifyDns });
        setSetting(data);
      } catch (e) {
        const msg = e instanceof AuthError ? e.message : t.loadError;
        setLoadMessage(msg);
      } finally {
        setLoading(false);
        setVerifying(false);
      }
    },
    [organizationId, t.loadError],
  );

  useEffect(() => {
    if (!organizationId) {
      setSetting(null);
      return;
    }
    void loadSetting(false);
  }, [organizationId, loadSetting]);

  const handleOpenModal = () => {
    setCreateMessage(null);
    setDomainInput("");
    setModalOpen(true);
  };

  const handleCreate = async () => {
    if (disabled || !organizationId || !domainInput.trim()) return;
    setCreateSubmitting(true);
    setCreateMessage(null);
    try {
      const created = await createOrganizationEmailSetting({
        organization_id: organizationId,
        domain: domainInput.trim(),
      });
      setSetting(created);
      setModalOpen(false);
      setDomainInput("");
    } catch (e) {
      if (e instanceof AuthError) {
        if (e.statusCode === 409) setCreateMessage(t.create409);
        else if (e.statusCode === 404) setCreateMessage(t.create404);
        else setCreateMessage(e.message || t.createError);
      } else {
        setCreateMessage(t.createError);
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleCopy = async (value: string) => {
    const ok = await copyText(value);
    setCopyFeedback(ok ? t.copied : null);
    if (ok) window.setTimeout(() => setCopyFeedback(null), 2000);
  };

  const dnsRows = setting?.dns_records ?? [];

  return (
    <fieldset
      disabled={disabled}
      className={cn(
        "m-0 min-w-0 rounded-3xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2",
        "disabled:cursor-not-allowed disabled:opacity-[0.88]",
      )}
    >
      <div className="flex flex-col gap-3 border-b border-stroke pb-6 dark:border-dark-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80">{t.domainsLabel}</p>
          <h2 className="text-2xl font-semibold text-dark dark:text-white">{t.pageTitle}</h2>
          <p className="text-sm text-dark-5 dark:text-dark-6">{t.pageSubtitle}</p>
        </div>
        {!setting && organizationId && (
          <Button
            type="button"
            variant="primary"
            shape="full"
            size="small"
            label={t.addDomainButton}
            onClick={handleOpenModal}
          />
        )}
      </div>

      {!organizationId && (
        <p className="mt-6 text-sm text-amber-800 dark:text-amber-200/90" role="status">
          {t.orgMissing}
        </p>
      )}

      {organizationId && loadMessage && (
        <p className="mt-6 text-sm text-rose-700 dark:text-rose-300" role="alert">
          {loadMessage}
        </p>
      )}

      {organizationId && loading && !setting && (
        <p className="mt-6 text-sm text-dark-6 dark:text-dark-6">{t.loadingSettings}</p>
      )}

      {organizationId && !loading && !setting && !loadMessage && (
        <div className="mt-8 rounded-2xl border border-dashed border-stroke bg-slate-50/60 p-8 text-center dark:border-dark-3 dark:bg-dark">
          <h3 className="text-lg font-semibold text-dark dark:text-white">{t.emptyTitle}</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-dark-5 dark:text-dark-6">{t.emptyDescription}</p>
          <Button
            type="button"
            className="mt-6"
            variant="primary"
            shape="full"
            size="small"
            label={t.addDomainButton}
            onClick={handleOpenModal}
          />
        </div>
      )}

      {setting && (
        <div className="mt-8 space-y-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-stroke bg-slate-50/50 p-5 dark:border-dark-3 dark:bg-dark sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{t.domainLabel}</p>
              <p className="text-xl font-semibold text-dark dark:text-white">{setting.domain}</p>
              <p className="mt-1 text-xs text-dark-5 dark:text-dark-6">
                {t.createdLabel}: {formatDateTime(setting.created_at, locale)} · {t.updatedLabel}:{" "}
                {formatDateTime(setting.updated_at, locale)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadSetting(false)}
                disabled={loading || verifying}
                className="rounded-full border border-stroke px-4 py-2 text-xs font-semibold text-dark transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-dark-3 dark:text-white"
              >
                {loading ? "…" : t.refreshFromServer}
              </button>
              <button
                type="button"
                onClick={() => void loadSetting(true)}
                disabled={loading || verifying}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying ? t.verifyDnsLoading : t.verifyDnsButton}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-dark dark:text-white">{t.dnsRecordsTableTitle}</h3>
            <p className="mb-3 text-xs text-dark-6 dark:text-dark-6">{t.dnsTitle}</p>
            <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100/80 text-xs uppercase tracking-wide text-dark-6 dark:bg-dark dark:text-dark-6">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t.tableCategory}</th>
                    <th className="px-3 py-2 font-medium">{t.tableType}</th>
                    <th className="px-3 py-2 font-medium">{t.tableName}</th>
                    <th className="px-3 py-2 font-medium">{t.tableValue}</th>
                    <th className="px-3 py-2 font-medium">{t.tableTtl}</th>
                    <th className="px-3 py-2 font-medium">{t.tablePriority}</th>
                    <th className="px-3 py-2 font-medium">{t.tableStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-dark-3">
                  {dnsRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-dark-6 dark:text-dark-6">
                        —
                      </td>
                    </tr>
                  ) : (
                    dnsRows.map((row: DnsRecordV2) => (
                      <tr key={row.id || `${row.type}-${row.name}`} className="bg-white/80 dark:bg-dark-2/80">
                        <td className="px-3 py-2 text-dark dark:text-white">{row.category ?? "—"}</td>
                        <td className="max-w-[min(140px,28vw)] px-3 py-2">
                          <DnsCellWithCopy
                            text={row.type}
                            mono
                            copyLabel={t.copyValue}
                            disabled={disabled}
                            onCopy={(v) => void handleCopy(v)}
                          />
                        </td>
                        <td className="max-w-[min(160px,32vw)] px-3 py-2">
                          <DnsCellWithCopy
                            text={row.name}
                            mono
                            copyLabel={t.copyValue}
                            disabled={disabled}
                            onCopy={(v) => void handleCopy(v)}
                          />
                        </td>
                        <td className="max-w-[min(360px,40vw)] px-3 py-2">
                          <DnsCellWithCopy
                            text={row.value}
                            mono
                            copyLabel={t.copyValue}
                            disabled={disabled}
                            onCopy={(v) => void handleCopy(v)}
                          />
                        </td>
                        <td className="px-3 py-2 text-dark-6">{row.ttl ?? "—"}</td>
                        <td className="px-3 py-2 text-dark-6">{row.priority ?? "—"}</td>
                        <td className="px-3 py-2">
                          {row.status ? (
                            <span
                              className={cn(
                                "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                recordStatusClass(row.status),
                              )}
                            >
                              {formatDnsRecordStatus(row.status, { pending: t.status.pending })}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {copyFeedback && (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300" role="status">
                {copyFeedback}
              </p>
            )}
          </div>

          {setting.dns_public_verification && (
            <div className="rounded-2xl border border-stroke bg-slate-50/50 p-5 dark:border-dark-3 dark:bg-dark">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-dark dark:text-white">{t.dnsPublicTableTitle}</h3>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    setting.dns_public_verification.all_records_match_expected
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
                  )}
                >
                  {setting.dns_public_verification.all_records_match_expected
                    ? t.allRecordsMatch
                    : t.partialRecordsMatch}
                </span>
              </div>
              <p className="mb-4 text-xs text-dark-6 dark:text-dark-6">
                {t.checkedAt}: {formatDateTime(setting.dns_public_verification.checked_at, locale)}
              </p>
              <div className="overflow-x-auto rounded-xl border border-stroke dark:border-dark-3">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100/80 text-xs uppercase tracking-wide text-dark-6 dark:bg-dark dark:text-dark-6">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t.tableType}</th>
                      <th className="px-3 py-2 font-medium">{t.tableName}</th>
                      <th className="px-3 py-2 font-medium">{t.publicLookupFqdn}</th>
                      <th className="px-3 py-2 font-medium">{t.publicMatch}</th>
                      <th className="px-3 py-2 font-medium">{t.publicExpected}</th>
                      <th className="px-3 py-2 font-medium">{t.publicObserved}</th>
                      <th className="px-3 py-2 font-medium">{t.publicError}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-dark-3">
                    {setting.dns_public_verification.by_record.map((r) => {
                      const observed = [r.observed_txt, r.observed_mx].filter(Boolean).join(" / ") || "—";
                      return (
                        <tr key={r.id || r.lookup_fqdn || r.name} className="bg-white/80 dark:bg-dark-2/80">
                          <td className="px-3 py-2 font-mono text-xs">{r.type}</td>
                          <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs" title={r.name}>
                            {r.name}
                          </td>
                          <td
                            className="max-w-[200px] truncate px-3 py-2 font-mono text-[11px]"
                            title={r.lookup_fqdn}
                          >
                            {r.lookup_fqdn ?? "—"}
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {r.matches_expected_configuration ? t.status.yes : t.status.no}
                          </td>
                          <td
                            className="max-w-[min(280px,35vw)] truncate px-3 py-2 font-mono text-xs"
                            title={r.expected_value}
                          >
                            {r.expected_value ?? "—"}
                          </td>
                          <td
                            className="max-w-[min(280px,35vw)] truncate px-3 py-2 font-mono text-xs"
                            title={observed}
                          >
                            {observed}
                          </td>
                          <td className="max-w-[200px] truncate px-3 py-2 text-xs text-rose-700 dark:text-rose-300" title={r.lookup_error}>
                            {r.lookup_error ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="domains-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-dark-2">
            <h3 id="domains-modal-title" className="text-lg font-semibold text-dark dark:text-white">
              {t.modalTitle}
            </h3>
            <p className="mt-2 text-sm text-dark-5 dark:text-dark-6">{t.modalHint}</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">
              {t.domainSubdomainLabel}
            </label>
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder={t.domainSubdomainPlaceholder}
              autoComplete="off"
              className="mt-1 w-full rounded-xl border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark dark:text-white"
            />
            {createMessage && (
              <p className="mt-3 text-sm text-rose-700 dark:text-rose-300" role="alert">
                {createMessage}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-stroke px-4 py-2 text-sm font-semibold text-dark dark:border-dark-3 dark:text-white"
              >
                {t.modalCancel}
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={createSubmitting || !domainInput.trim()}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createSubmitting ? t.modalCreating : t.modalCreate}
              </button>
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}
