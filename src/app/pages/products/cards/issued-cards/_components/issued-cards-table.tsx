"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatLocal } from "@/lib/date-utils";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../_components/cards-translations";

export type IssuedCard = {
  id: string;
  lastFour: string;
  productSummary: string;
  userName: string;
  idNumber: string;
  idDocType: string;
  affinityGroup: string;
  createdAt: string;
  activationAt: string | null;
  status: "enabled" | "disabled";
};

const PAGE_SIZE = 8;

export const mockIssuedCards: IssuedCard[] = [
  {
    id: "ic_001",
    lastFour: "3123",
    productSummary: "Crédito | Física",
    userName: "Carlos García",
    idNumber: "1144096557",
    idDocType: "CC",
    affinityGroup: "Virtuales & nominadas",
    createdAt: "2026-03-31T12:00:00Z",
    activationAt: null,
    status: "disabled",
  },
  {
    id: "ic_002",
    lastFour: "8841",
    productSummary: "Débito | Virtual",
    userName: "Ana María López",
    idNumber: "52987654",
    idDocType: "CC",
    affinityGroup: "Empleados",
    createdAt: "2026-02-10T09:00:00Z",
    activationAt: "2026-02-10T10:15:00Z",
    status: "enabled",
  },
  {
    id: "ic_003",
    lastFour: "1022",
    productSummary: "Crédito | Virtual",
    userName: "Luis Fernández",
    idNumber: "901234567",
    idDocType: "CE",
    affinityGroup: "Virtuales & nominadas",
    createdAt: "2026-01-05T14:30:00Z",
    activationAt: "2026-01-05T14:32:00Z",
    status: "enabled",
  },
];

function formatDayMonthYear(iso: string) {
  return formatLocal(iso, "DD/MM/YYYY");
}

function statusBadgeClass(status: IssuedCard["status"]) {
  return status === "enabled"
    ? "bg-[#219653]/[0.08] text-[#219653]"
    : "bg-[#D34053]/[0.08] text-[#D34053]";
}

interface IssuedCardsTableProps {
  cards: IssuedCard[];
}

export function IssuedCardsTable({ cards }: IssuedCardsTableProps) {
  const { language } = useLanguage();
  const t = cardsTranslations[language].issuedCards;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = cards.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <Table>
          <TableHeader>
            <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
              <TableHead className="min-w-[140px] xl:pl-7.5">{t.table.card}</TableHead>
              <TableHead className="min-w-[160px]">{t.table.user}</TableHead>
              <TableHead className="min-w-[130px]">{t.table.identification}</TableHead>
              <TableHead className="min-w-[160px]">{t.table.affinityGroup}</TableHead>
              <TableHead className="min-w-[110px]">{t.table.createdAt}</TableHead>
              <TableHead className="min-w-[110px]">{t.table.activation}</TableHead>
              <TableHead className="min-w-[120px] xl:pr-7.5">{t.table.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-dark-6 dark:text-dark-6">
                  {t.table.noData}
                </TableCell>
              </TableRow>
            ) : null}
            {pageItems.map((row) => (
              <TableRow
                key={row.id}
                className="border-[#eee] dark:border-dark-3 hover:bg-gray-50 dark:hover:bg-dark-2"
              >
                <TableCell className="align-top xl:pl-7.5">
                  <p className="font-medium tracking-wide text-dark dark:text-white">•••• {row.lastFour}</p>
                  <p className="mt-1 text-body-sm text-dark-6 dark:text-dark-6">{row.productSummary}</p>
                </TableCell>
                <TableCell className="align-top">
                  <p className="text-dark dark:text-white">{row.userName}</p>
                </TableCell>
                <TableCell className="align-top">
                  <p className="text-dark dark:text-white">{row.idNumber}</p>
                  <p className="mt-1 text-body-sm font-medium text-dark-6 dark:text-dark-6">{row.idDocType}</p>
                </TableCell>
                <TableCell className="align-top">
                  <p className="text-dark dark:text-white">{row.affinityGroup}</p>
                </TableCell>
                <TableCell className="align-top">
                  <p className="text-dark dark:text-white">{formatDayMonthYear(row.createdAt)}</p>
                </TableCell>
                <TableCell className="align-top">
                  <p className="text-dark dark:text-white">
                    {row.activationAt ? formatDayMonthYear(row.activationAt) : t.activationNone}
                  </p>
                </TableCell>
                <TableCell className="align-top xl:pr-7.5">
                  <div
                    className={cn(
                      "max-w-fit rounded-full px-3.5 py-1 text-sm font-medium",
                      statusBadgeClass(row.status)
                    )}
                  >
                    {t.cardStatus[row.status]}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {cards.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 sm:px-7.5">
          <p className="text-sm text-dark-6 dark:text-dark-6">{t.pagination.pageOf(safePage, totalPages)}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={cn(
                "rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium transition dark:border-dark-3",
                safePage <= 1
                  ? "cursor-not-allowed opacity-50"
                  : "text-dark hover:bg-gray-50 dark:text-white dark:hover:bg-dark-2"
              )}
            >
              {t.pagination.previous}
            </button>
            <span className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg bg-[#F7F9FC] text-sm font-semibold text-dark dark:bg-dark-2 dark:text-white">
              {safePage}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={cn(
                "rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium transition dark:border-dark-3",
                safePage >= totalPages
                  ? "cursor-not-allowed opacity-50"
                  : "text-dark hover:bg-gray-50 dark:text-white dark:hover:bg-dark-2"
              )}
            >
              {t.pagination.next}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
