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
import { formatLocalDateOnly, formatLocalTimeOnly } from "@/lib/date-utils";
import type { NormalizedTransaction } from "./normalize-transaction";

function statusColor(status: string) {
  const s = (status ?? "").toLowerCase();
  if (/(ok|success|performed|completed|confirmed|accepted)/.test(s)) {
    return "bg-[#219653]/[0.08] text-[#219653]";
  }
  if (/(pending|processing|in_progress|in-progress|submitted|queued)/.test(s)) {
    return "bg-[#FFA70B]/[0.08] text-[#FFA70B]";
  }
  if (/(error|failed|rejected|denied|declined|invalid)/.test(s)) {
    return "bg-[#D34053]/[0.08] text-[#D34053]";
  }
  return "bg-gray-100 text-gray-600 dark:bg-dark-2 dark:text-dark-6";
}

function formatAmount(amount?: number, currency?: string) {
  if (typeof amount !== "number") return "—";
  const safeCurrency = currency && currency.length === 3 ? currency.toUpperCase() : undefined;
  try {
    if (safeCurrency) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: safeCurrency }).format(amount);
    }
  } catch {
    // ignore
  }
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TransactionsTable(props: {
  transactions: NormalizedTransaction[];
  isLoading?: boolean;
  onSelect: (networkId: string) => void;
  selectedNetworkId?: string | null;
}) {
  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[140px] xl:pl-7.5">Network ID</TableHead>
            <TableHead className="min-w-[120px]">Estado</TableHead>
            <TableHead className="min-w-[140px]">Monto</TableHead>
            <TableHead className="min-w-[90px]">Moneda</TableHead>
            <TableHead className="min-w-[160px]">Deudor (FIN)</TableHead>
            <TableHead className="min-w-[160px]">Acreedor (FIN)</TableHead>
            <TableHead className="text-right xl:pr-7.5">Fecha</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {props.isLoading ? (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={7} className="py-10 text-center text-sm text-dark-6 dark:text-dark-6">
                Cargando transacciones…
              </TableCell>
            </TableRow>
          ) : props.transactions.length === 0 ? (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={7} className="py-10 text-center text-sm text-dark-6 dark:text-dark-6">
                Sin resultados con los filtros actuales.
              </TableCell>
            </TableRow>
          ) : (
            props.transactions.map((t) => (
              <TableRow
                key={t.networkId}
                data-state={props.selectedNetworkId === t.networkId ? "selected" : undefined}
                className={cn(
                  "cursor-pointer border-[#eee] dark:border-dark-3 hover:bg-gray-50 dark:hover:bg-dark-2",
                  props.selectedNetworkId === t.networkId && "bg-neutral-100 dark:bg-neutral-800",
                )}
                onClick={() => props.onSelect(t.networkId)}
              >
                <TableCell className="min-w-[140px] xl:pl-7.5">
                  <p className="text-dark dark:text-white">{t.networkId}</p>
                </TableCell>

                <TableCell>
                  <div className={cn("max-w-fit rounded-full px-3.5 py-1 text-sm font-medium", statusColor(t.status))}>
                    {t.status}
                  </div>
                </TableCell>

                <TableCell>
                  <p className="font-medium text-dark dark:text-white">{formatAmount(t.amount, t.currency)}</p>
                </TableCell>

                <TableCell>
                  <p className="text-dark-6 dark:text-dark-6">{t.currency ?? "—"}</p>
                </TableCell>

                <TableCell>
                  <p className="text-dark-6 dark:text-dark-6">{t.debtorFinId ?? "—"}</p>
                </TableCell>

                <TableCell>
                  <p className="text-dark-6 dark:text-dark-6">{t.creditorFinId ?? "—"}</p>
                </TableCell>

                <TableCell className="text-right xl:pr-7.5">
                  <p className="text-dark dark:text-white">{formatLocalDateOnly(t.createdAt)}</p>
                  <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{formatLocalTimeOnly(t.createdAt)}</p>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

