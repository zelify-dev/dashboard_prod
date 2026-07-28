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
      className="mt-1 inline-flex items-center gap-1 text-[10px] font-light text-dark-6 hover:text-dark"
      title={labelCopy}
    >
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
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
    <div className="rounded-2xl border border-gray-100 bg-white py-5 px-6">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-100">
            <TableHead className="min-w-[200px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.name}</TableHead>
            <TableHead className="min-w-[220px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.email}</TableHead>
            <TableHead className="min-w-[140px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.identification}</TableHead>
            <TableHead className="min-w-[110px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.status}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-xs font-light text-dark-6">
                {t.table.noData}
              </TableCell>
            </TableRow>
          ) : null}
          {users.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50/50"
              onClick={() => onSelect(row)}
            >
              <TableCell className="align-top py-3">
                <p className="font-normal text-dark">{row.name}</p>
                <p className="mt-0.5 font-mono text-[10px] font-light text-dark-6">
                  {formatUserIdShort(row.id)}
                </p>
                <CopyIdButton fullId={row.id} labelCopy={t.copyId} labelCopied={t.copied} />
              </TableCell>
              <TableCell className="align-top py-3">
                <p className="text-sm font-light text-dark-6">{row.email}</p>
              </TableCell>
              <TableCell className="align-top py-3">
                <p className="text-sm font-normal text-dark">{row.idNumber}</p>
                <p className="mt-1 text-xs font-light text-dark-6">{row.idDocType}</p>
              </TableCell>
              <TableCell className="align-top py-3">
                <div
                  className={cn(
                    "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider",
                    row.status === "active"
                      ? "bg-zelify-midnight text-zelify-green"
                      : "bg-gray-100 text-dark-6 border border-gray-200/50"
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
