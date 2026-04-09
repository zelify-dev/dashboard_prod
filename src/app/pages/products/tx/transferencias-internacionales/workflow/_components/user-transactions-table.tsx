"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLocalDateOnly, formatLocalTimeOnly } from "@/lib/date-utils";
import type { UserTransactionItem } from "@/lib/user-transactions-api";

function formatAmount(amount?: string, currency?: string) {
  if (!amount) return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  const cur = currency && currency.length === 3 ? currency.toUpperCase() : undefined;
  try {
    if (cur) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n);
    }
  } catch {
    // ignore
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function UserTransactionsTable(props: {
  items: UserTransactionItem[];
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[140px] xl:pl-7.5">ID</TableHead>
            <TableHead className="min-w-[160px]">Tipo</TableHead>
            <TableHead className="min-w-[90px]">Dirección</TableHead>
            <TableHead className="min-w-[150px]">Monto</TableHead>
            <TableHead className="min-w-[200px]">Referencia</TableHead>
            <TableHead className="min-w-[220px]">Descripción</TableHead>
            <TableHead className="min-w-[160px]">Contraparte</TableHead>
            <TableHead className="text-right xl:pr-7.5">Fecha</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {props.isLoading ? (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={8} className="py-10 text-center text-sm text-dark-6 dark:text-dark-6">
                Cargando historial…
              </TableCell>
            </TableRow>
          ) : props.items.length === 0 ? (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={8} className="py-10 text-center text-sm text-dark-6 dark:text-dark-6">
                Sin movimientos para los filtros actuales.
              </TableCell>
            </TableRow>
          ) : (
            props.items.map((it) => (
              <TableRow key={it.id} className="border-[#eee] dark:border-dark-3 hover:bg-gray-50 dark:hover:bg-dark-2">
                <TableCell className="min-w-[140px] xl:pl-7.5">
                  <p className="text-dark dark:text-white">{it.id}</p>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="text-dark-6 dark:text-dark-6">{it.type}</p>
                </TableCell>
                <TableCell className="min-w-[90px]">
                  <p className="text-dark dark:text-white">{it.direction ?? "—"}</p>
                </TableCell>
                <TableCell className="min-w-[150px]">
                  <p className="font-medium text-dark dark:text-white">{formatAmount(it.amount, it.currency)}</p>
                  <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{it.currency ?? ""}</p>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <p className="text-dark dark:text-white">{it.reference_type ?? "—"}</p>
                  <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{it.reference_id ?? ""}</p>
                </TableCell>
                <TableCell className="min-w-[220px]">
                  <p className="text-dark dark:text-white">{it.description ?? "—"}</p>
                  {it.note ? (
                    <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">
                      Nota: {it.note}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="text-dark dark:text-white">{it.counterparty?.full_name ?? "—"}</p>
                  <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{it.counterparty?.email ?? ""}</p>
                </TableCell>
                <TableCell className="text-right xl:pr-7.5">
                  <p className="text-dark dark:text-white">{formatLocalDateOnly(it.created_at)}</p>
                  <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{formatLocalTimeOnly(it.created_at)}</p>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
