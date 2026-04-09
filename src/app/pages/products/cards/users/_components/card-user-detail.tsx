"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../_components/cards-translations";
import { CardUser, formatUserIdShort } from "./card-user-types";
import { cn } from "@/lib/utils";

function CopyValue({ value, copyLabel, copiedLabel }: { value: string; copyLabel: string; copiedLabel: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="ml-1 inline-flex items-center rounded p-0.5 text-dark-6 hover:bg-gray-100 hover:text-primary dark:hover:bg-dark-3"
      title={copyLabel}
      aria-label={copyLabel}
    >
      <span className="sr-only">{done ? copiedLabel : copyLabel}</span>
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

function Field({
  label,
  value,
  mono,
  copyable,
  copyLabel,
  copiedLabel,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: string;
  copyLabel?: string;
  copiedLabel?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-dark-6 dark:text-dark-6">{label}</p>
      <div className="mt-1 flex items-center gap-0.5">
        <p
          className={cn(
            "text-sm font-semibold text-dark dark:text-white",
            mono && "font-mono text-xs"
          )}
        >
          {value}
        </p>
        {copyable && copyLabel && copiedLabel ? (
          <CopyValue value={copyable} copyLabel={copyLabel} copiedLabel={copiedLabel} />
        ) : null}
      </div>
    </div>
  );
}

interface CardUserDetailProps {
  user: CardUser;
  onBack: () => void;
}

export function CardUserDetail({ user, onBack }: CardUserDetailProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].cardUsers;
  const d = t.detail;
  const g = t.gender[user.gender] ?? user.gender;
  const notes = user.notes?.trim() ? user.notes : d.empty;
  const urb = user.address.urbanization?.trim() ? user.address.urbanization : d.empty;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {d.back}
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark dark:text-white">{user.name}</h2>
          <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">{d.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            {d.editUser}
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
          >
            {d.changeStatus}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4 rounded-[10px] border border-stroke bg-[#F7F9FC] p-6 dark:border-dark-3 dark:bg-dark-2/50 sm:p-7.5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-dark dark:text-white">{d.userData}</h3>
            <span
              className={cn(
                "rounded-full px-3 py-0.5 text-xs font-semibold",
                user.status === "active"
                  ? "bg-[#219653]/[0.12] text-[#219653]"
                  : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-300"
              )}
            >
              {t.status[user.status]}
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label={d.userId}
              value={formatUserIdShort(user.id)}
              mono
              copyable={user.id}
              copyLabel={d.copy}
              copiedLabel={t.copied}
            />
            <Field label={d.country} value={user.country} />
            <Field
              label={d.identification}
              value={`${user.idDocType} ${user.idNumber}`}
            />
            <Field
              label={d.taxId}
              value={`NIT ${user.taxId}`}
              copyable={`NIT ${user.taxId}`}
              copyLabel={d.copy}
              copiedLabel={t.copied}
            />
            <Field label={d.birthDate} value={user.birthDate} />
            <Field label={d.gender} value={g} />
            <Field label={d.notes} value={notes} className="sm:col-span-2" />
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 lg:w-[min(100%,420px)] lg:shrink-0">
          <div className="rounded-[10px] border border-stroke bg-[#F7F9FC] p-6 dark:border-dark-3 dark:bg-dark-2/50 sm:p-7.5">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">{d.address}</h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label={d.addressLine} value={user.address.line} />
              <Field label={d.postalCode} value={user.address.postal} />
              <Field label={d.urbanization} value={urb} />
              <Field label={d.city} value={user.address.city} />
              <Field label={d.department} value={user.address.department} />
              <Field label={d.countryAddr} value={user.address.country} />
            </div>
          </div>
          <div className="rounded-[10px] border border-stroke bg-[#F7F9FC] p-6 dark:border-dark-3 dark:bg-dark-2/50 sm:p-7.5">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">{d.contact}</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={d.mail}
                value={user.email}
                copyable={user.email}
                copyLabel={d.copy}
                copiedLabel={t.copied}
              />
              <Field label={d.phone} value={user.phone} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
