"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../_components/cards-translations";
import { CardUser, formatUserIdShort } from "./card-user-types";
import { useState } from "react";

function CopyIdButton({
  fullId,
  labelCopy,
  labelCopied,
}: {
  fullId: string;
  labelCopy: string;
  labelCopied: string;
}) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullId);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void copy();
      }}
      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      title={labelCopy}
    >
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      {done ? labelCopied : labelCopy}
    </button>
  );
}

interface CardUsersTableProps {
  users: CardUser[];
  onSelect: (user: CardUser) => void;
}

export function CardUsersTable({ users, onSelect }: CardUsersTableProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].cardUsers;

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[200px] xl:pl-7.5">{t.table.name}</TableHead>
            <TableHead className="min-w-[220px]">{t.table.email}</TableHead>
            <TableHead className="min-w-[140px]">{t.table.identification}</TableHead>
            <TableHead className="min-w-[110px] xl:pr-7.5">{t.table.status}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-dark-6 dark:text-dark-6">
                {t.table.noData}
              </TableCell>
            </TableRow>
          ) : null}
          {users.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer border-[#eee] dark:border-dark-3 hover:bg-gray-50 dark:hover:bg-dark-2"
              onClick={() => onSelect(row)}
            >
              <TableCell className="align-top xl:pl-7.5">
                <p className="font-medium text-dark dark:text-white">{row.name}</p>
                <p className="mt-0.5 font-mono text-xs text-dark-6 dark:text-dark-6">
                  {formatUserIdShort(row.id)}
                </p>
                <CopyIdButton fullId={row.id} labelCopy={t.copyId} labelCopied={t.copied} />
              </TableCell>
              <TableCell className="align-top">
                <p className="text-dark dark:text-white">{row.email}</p>
              </TableCell>
              <TableCell className="align-top">
                <p className="text-dark dark:text-white">{row.idNumber}</p>
                <p className="mt-1 text-body-sm font-medium text-dark-6 dark:text-dark-6">{row.idDocType}</p>
              </TableCell>
              <TableCell className="align-top xl:pr-7.5">
                <div
                  className={cn(
                    "max-w-fit rounded-full px-3.5 py-1 text-sm font-medium",
                    row.status === "active"
                      ? "bg-[#219653]/[0.08] text-[#219653]"
                      : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                  )}
                >
                  {t.status[row.status]}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
