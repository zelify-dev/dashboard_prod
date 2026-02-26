"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useNotificationsTranslations } from "./use-notifications-translations";

type DnsRecord = {
  id: string;
  type: "SPF" | "DKIM" | "DMARC" | "MX";
  host: string;
  value: string;
  status: "pending" | "verified" | "warning";
};

type DomainEntry = {
  id: string;
  name: string;
  defaultFrom: string;
  status: "pending" | "verified" | "failed";
  lastSyncedAt: string | null;
  dnsRecords: DnsRecord[];
  smtp: {
    host: string;
    port: number;
    username: string;
    fromName: string;
    encryption: "SSL" | "TLS";
  };
};

const INITIAL_DOMAINS: DomainEntry[] = [
  {
    id: "domain-zwippe",
    name: "emails.zelify.com",
    defaultFrom: "notifications@zelify.com",
    status: "verified",
    lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    dnsRecords: [
      {
        id: "spf",
        type: "SPF",
        host: "@",
        value: "v=spf1 include:_spf.zelemail.com ~all",
        status: "verified",
      },
      {
        id: "dkim",
        type: "DKIM",
        host: "smtp._domainkey",
        value: "k=rsa; p=MIIBIjANBgkqh...",
        status: "verified",
      },
      {
        id: "dmarc",
        type: "DMARC",
        host: "_dmarc",
        value: "v=DMARC1; p=quarantine; rua=mailto:security@zelify.com",
        status: "pending",
      },
    ],
    smtp: {
      host: "smtp.sendgrid.net",
      port: 587,
      username: "apikey",
      fromName: "Zelify Notifications",
      encryption: "TLS",
    },
  },
];

export function NotificationsDomainsPanel() {
  const { language } = useLanguage();
  const translations = useNotificationsTranslations();
  const t = translations.domains;
  const locale = language === "es" ? "es-ES" : "en-US";

  const [domains, setDomains] = useState<DomainEntry[]>(INITIAL_DOMAINS);
  const [selectedDomainId, setSelectedDomainId] = useState<string>(INITIAL_DOMAINS[0]?.id ?? "");
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainSender, setNewDomainSender] = useState("support@acme.com");
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpMessage, setSmtpMessage] = useState<string | null>(null);

  const selectedDomain = useMemo(
    () => domains.find((domain) => domain.id === selectedDomainId) ?? domains[0] ?? null,
    [domains, selectedDomainId],
  );

  const handleAddDomain = () => {
    if (!newDomainName.trim()) return;
    const id = `domain-${Date.now()}`;
    const entry: DomainEntry = {
      id,
      name: newDomainName.trim().toLowerCase(),
      defaultFrom: newDomainSender.trim() || `no-reply@${newDomainName.trim()}`,
      status: "pending",
      lastSyncedAt: null,
      dnsRecords: [
        {
          id: "spf",
          type: "SPF",
          host: "@",
          value: "v=spf1 include:mailgun.org ~all",
          status: "pending",
        },
        {
          id: "dkim",
          type: "DKIM",
          host: "smtp._domainkey",
          value: "k=rsa; p=GENERATE_THIS",
          status: "pending",
        },
        {
          id: "dmarc",
          type: "DMARC",
          host: "_dmarc",
          value: "v=DMARC1; p=none; rua=mailto:infra@domain.com",
          status: "pending",
        },
      ],
      smtp: {
        host: "smtp.your-provider.com",
        port: 465,
        username: "api-user",
        fromName: t.defaultFromName,
        encryption: "SSL",
      },
    };
    setDomains((prev) => [...prev, entry]);
    setSelectedDomainId(id);
    setNewDomainName("");
  };

  const handleSmtpChange = (field: keyof DomainEntry["smtp"], value: string) => {
    if (!selectedDomain) return;
    setDomains((prev) =>
      prev.map((domain) =>
        domain.id === selectedDomain.id
          ? {
              ...domain,
              smtp: {
                ...domain.smtp,
                [field]: field === "port" ? Number(value) || 0 : value,
              },
            }
          : domain,
      ),
    );
  };

  const handleSaveSmtp = () => {
    if (!selectedDomain) return;
    setSmtpSaving(true);
    setSmtpMessage(null);
    setTimeout(() => {
      setSmtpSaving(false);
      setSmtpMessage(`${t.smtpSavedPrefix} ${selectedDomain.name}`);
    }, 1200);
  };

  const domainStatusLabel = (status: DomainEntry["status"]) => {
    switch (status) {
      case "verified":
        return t.status.verified;
      case "pending":
        return t.status.pending;
      case "failed":
        return t.status.failed;
      default:
        return status;
    }
  };

  const dnsStatusLabel = (status: DnsRecord["status"]) => {
    switch (status) {
      case "verified":
        return t.status.verified;
      case "pending":
        return t.status.pending;
      case "warning":
        return t.status.dnsWarning;
      default:
        return status;
    }
  };

  const formatRelativeTime = (iso: string | null) => {
    if (!iso) return t.lastSyncedUnverified;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return t.lastSyncedUnverified;
    const diffMs = date.getTime() - Date.now();
    const diffMinutes = Math.round(diffMs / (60 * 1000));
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
    const diffDays = Math.round(diffHours / 24);
    return rtf.format(diffDays, "day");
  };

  return (
    <section className="rounded-3xl border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">
      <div className="flex flex-col gap-3 border-b border-stroke pb-6 dark:border-dark-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80">{t.domainsLabel}</p>
          <h2 className="text-2xl font-semibold text-dark dark:text-white">{t.pageTitle}</h2>
          <p className="text-sm text-dark-5 dark:text-dark-6">
            {t.pageSubtitle}
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-stroke p-4 dark:border-dark-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">{t.domainSubdomainLabel}</label>
            <input
              type="text"
              value={newDomainName}
              placeholder={t.domainSubdomainPlaceholder}
              onChange={(event) => setNewDomainName(event.target.value)}
              className="mt-1 w-full rounded-full border border-stroke px-4 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">{t.defaultSenderLabel}</label>
            <input
              type="text"
              value={newDomainSender}
              onChange={(event) => setNewDomainSender(event.target.value)}
              className="mt-1 w-full rounded-full border border-stroke px-4 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark dark:text-white"
            />
          </div>
          <button
            onClick={handleAddDomain}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            {t.addDomainButton}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {domains.map((domain) => (
          <button
            key={domain.id}
            onClick={() => setSelectedDomainId(domain.id)}
            className={cn(
              "rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:border-primary hover:shadow-lg",
              domain.id === selectedDomain?.id
                ? "border-primary bg-primary/5 shadow-lg dark:bg-primary/10"
                : "border-stroke bg-slate-50/40 dark:border-dark-3 dark:bg-dark",
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{t.domainLabel}</p>
                <h3 className="text-xl font-semibold text-dark dark:text-white">{domain.name}</h3>
                <p className="text-sm text-dark-5 dark:text-dark-6">{t.senderLabel}: {domain.defaultFrom}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                  domain.status === "verified" && "bg-emerald-100 text-emerald-700",
                  domain.status === "pending" && "bg-amber-100 text-amber-700",
                  domain.status === "failed" && "bg-rose-100 text-rose-700",
                )}
              >
                {domainStatusLabel(domain.status)}
              </span>
            </div>
            <p className="mt-3 text-xs text-dark-6 dark:text-dark-6">{t.lastSyncLabel}: {formatRelativeTime(domain.lastSyncedAt)}</p>
          </button>
        ))}
      </div>

      {selectedDomain && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-stroke bg-slate-50 p-6 dark:border-dark-3 dark:bg-dark">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stroke pb-4 dark:border-dark-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{t.dnsTitle}</p>
                <h4 className="text-lg font-semibold text-dark dark:text-white">{selectedDomain.name}</h4>
              </div>
              <button className="rounded-full border border-stroke px-4 py-2 text-xs font-semibold text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white">
                {t.dnsRevalidate}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {selectedDomain.dnsRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-dashed border-stroke bg-white/70 p-4 text-sm dark:border-dark-3 dark:bg-dark-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{record.type}</p>
                      <p className="font-semibold text-dark dark:text-white">
                        {record.host} → <span className="font-mono text-xs">{record.value}</span>
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
                        record.status === "verified" && "bg-emerald-100 text-emerald-700",
                        record.status === "pending" && "bg-amber-100 text-amber-700",
                        record.status === "warning" && "bg-rose-100 text-rose-700",
                      )}
                    >
                      {dnsStatusLabel(record.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-stroke bg-slate-50 p-6 dark:border-dark-3 dark:bg-dark">
            <div className="border-b border-stroke pb-4 dark:border-dark-3">
              <p className="text-xs uppercase tracking-[0.35em] text-dark-6 dark:text-dark-6">{t.smtpLabel}</p>
              <h4 className="text-lg font-semibold text-dark dark:text-white">{t.smtpTitle}</h4>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{t.smtpHost}</label>
                <input
                  value={selectedDomain.smtp.host}
                  onChange={(event) => handleSmtpChange("host", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-stroke px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{t.smtpPort}</label>
                  <input
                    value={selectedDomain.smtp.port}
                    onChange={(event) => handleSmtpChange("port", event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-stroke px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{t.smtpEncryption}</label>
                  <select
                    value={selectedDomain.smtp.encryption}
                    onChange={(event) => handleSmtpChange("encryption", event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-stroke px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  >
                    <option value="SSL">SSL</option>
                    <option value="TLS">TLS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{t.smtpUsername}</label>
                <input
                  value={selectedDomain.smtp.username}
                  onChange={(event) => handleSmtpChange("username", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-stroke px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{t.smtpFromName}</label>
                <input
                  value={selectedDomain.smtp.fromName}
                  onChange={(event) => handleSmtpChange("fromName", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-stroke px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-dashed border-stroke px-4 py-3 text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6">
                <span>{t.smtpFallbackLabel}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
              </div>
              {smtpMessage && (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {smtpMessage}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSmtp}
                  disabled={smtpSaving}
                  className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
                >
                  {smtpSaving ? t.smtpSaving : t.smtpSave}
                </button>
                <button className="rounded-full border border-stroke px-4 py-2 text-sm font-semibold text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white">
                  {t.smtpTest}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
