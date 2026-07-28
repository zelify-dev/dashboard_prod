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
      className="ml-1 inline-flex items-center rounded p-0.5 text-dark-6 hover:bg-gray-50"
      title={copyLabel}
      aria-label={copyLabel}
    >
      <span className="sr-only">{done ? copiedLabel : copyLabel}</span>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
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
      <p className="text-[10px] font-light uppercase tracking-wider text-dark-6">{label}</p>
      <div className="mt-1 flex items-center gap-0.5">
        <p
          className={cn(
            "text-sm font-normal text-dark",
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
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-light uppercase text-dark-6 transition hover:bg-gray-50 active:scale-95"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {d.back}
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-light text-dark">{user.name}</h2>
          <p className="mt-2 text-xs font-light text-dark-6">{d.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-light text-dark hover:bg-gray-50 transition-all active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            {d.editUser}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-zelify-midnight px-4 py-2 text-xs font-light text-white transition-all hover:bg-zelify-midnight/90 active:scale-95"
          >
            {d.changeStatus}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-light text-dark">{d.userData}</h3>
            <span
              className={cn(
                "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider",
                user.status === "active"
                  ? "bg-zelify-midnight text-zelify-green"
                  : "bg-gray-100 text-dark-6 border border-gray-200/50"
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
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="mb-4 text-lg font-light text-dark">{d.address}</h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label={d.addressLine} value={user.address.line} />
              <Field label={d.postalCode} value={user.address.postal} />
              <Field label={d.urbanization} value={urb} />
              <Field label={d.city} value={user.address.city} />
              <Field label={d.department} value={user.address.department} />
              <Field label={d.countryAddr} value={user.address.country} />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="mb-4 text-lg font-light text-dark">{d.contact}</h3>
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
