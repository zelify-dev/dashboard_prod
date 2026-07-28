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
      <div className="rounded-2xl border border-gray-100 bg-white py-5 px-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100">
              <TableHead className="min-w-[140px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.card}</TableHead>
              <TableHead className="min-w-[160px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.user}</TableHead>
              <TableHead className="min-w-[130px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.identification}</TableHead>
              <TableHead className="min-w-[160px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.affinityGroup}</TableHead>
              <TableHead className="min-w-[110px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.createdAt}</TableHead>
              <TableHead className="min-w-[110px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.activation}</TableHead>
              <TableHead className="min-w-[120px] text-xs font-light uppercase tracking-wider text-dark-6 py-3">{t.table.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-xs font-light text-dark-6">
                  {t.table.noData}
                </TableCell>
              </TableRow>
            ) : null}
            {pageItems.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-gray-100 transition hover:bg-gray-50/50"
              >
                <TableCell className="align-top py-3">
                  <p className="font-normal text-dark">•••• {row.lastFour}</p>
                  <p className="mt-1 text-xs font-light text-dark-6">{row.productSummary}</p>
                </TableCell>
                <TableCell className="align-top py-3">
                  <p className="text-sm font-light text-dark-6">{row.userName}</p>
                </TableCell>
                <TableCell className="align-top py-3">
                  <p className="text-sm font-normal text-dark">{row.idNumber}</p>
                  <p className="mt-1 text-xs font-light text-dark-6">{row.idDocType}</p>
                </TableCell>
                <TableCell className="align-top py-3">
                  <p className="text-sm font-light text-dark-6">{row.affinityGroup}</p>
                </TableCell>
                <TableCell className="align-top py-3">
                  <p className="text-xs font-light text-dark-6">{formatDayMonthYear(row.createdAt)}</p>
                </TableCell>
                <TableCell className="align-top py-3">
                  <p className="text-xs font-light text-dark-6">
                    {row.activationAt ? formatDayMonthYear(row.activationAt) : t.activationNone}
                  </p>
                </TableCell>
                <TableCell className="align-top py-3">
                  <div
                    className={cn(
                      "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-light uppercase tracking-wider",
                      row.status === "enabled"
                        ? "bg-zelify-midnight text-zelify-green"
                        : "bg-gray-100 text-dark-6 border border-gray-200/50"
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <p className="text-xs font-light text-dark-6">{t.pagination.pageOf(safePage, totalPages)}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-light text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.pagination.previous}
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-light text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.pagination.next}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
