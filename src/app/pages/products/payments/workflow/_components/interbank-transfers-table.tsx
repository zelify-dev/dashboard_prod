"use client";

import Link from "next/link";
import type { InterbankTransferItem } from "@/lib/payments-transfers-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLocalDateOnly, formatLocalTimeOnly } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

function formatAmount(amount?: string, currency?: string) {
  if (!amount) return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  const cur = currency && currency.length === 3 ? currency.toUpperCase() : undefined;
  try {
    if (cur) return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n);
  } catch {
    // ignore
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusColor(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (/(ok|success|performed|completed|confirmed|accepted)/.test(s)) {
    return "bg-[#219653]/[0.08] text-[#219653]";
  }
  if (/(pending|processing|in_progress|in-progress|submitted|queued)/.test(s)) {
    return "bg-[#FFA70B]/[0.08] text-[#FFA70B]";
  }
  if (/(error|failed|rejected|denied|declined|invalid|canceled|cancelled)/.test(s)) {
    return "bg-[#D34053]/[0.08] text-[#D34053]";
  }
  return "bg-gray-100 text-gray-600 dark:bg-dark-2 dark:text-dark-6";
}

export function InterbankTransfersTable(props: {
  items: InterbankTransferItem[];
  isLoading?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onUserClick?: (userId: string) => void;
  userTransactionsHref?: (userId: string, userName?: string) => string;
}) {
  const userPrimary = (user: { full_name?: string | null; email?: string | null } | null | undefined, userId?: unknown) =>
    user?.full_name ?? user?.email ?? (userId ? String(userId) : "—");

  const userSecondary = (user: { email?: string | null } | null | undefined) => user?.email ?? "";

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[140px] xl:pl-7.5">ID</TableHead>
            <TableHead className="min-w-[220px]">Institución</TableHead>
            <TableHead className="min-w-[160px]">Beneficiario</TableHead>
            <TableHead className="min-w-[160px]">Creado por</TableHead>
            <TableHead className="min-w-[140px]">Status</TableHead>
            <TableHead className="min-w-[160px]">Monto</TableHead>
            <TableHead className="min-w-[160px]">Comisión</TableHead>
            <TableHead className="min-w-[220px]">Nota</TableHead>
            <TableHead className="text-right xl:pr-7.5">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.isLoading ? (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={9} className="py-10 text-center text-sm text-dark-6 dark:text-dark-6">
                Cargando transferencias interbancarias…
              </TableCell>
            </TableRow>
          ) : props.items.length === 0 ? (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={9} className="py-10 text-center text-sm text-dark-6 dark:text-dark-6">
                Sin resultados con los filtros actuales.
              </TableCell>
            </TableRow>
          ) : (
            props.items.map((it) => (
              <TableRow
                key={it.id}
                data-state={props.selectedId === it.id ? "selected" : undefined}
                className="cursor-pointer border-[#eee] dark:border-dark-3 hover:bg-gray-50 dark:hover:bg-dark-2"
                onClick={() => props.onSelect?.(it.id)}
              >
                <TableCell className="min-w-[140px] xl:pl-7.5">
                  <p className="text-dark dark:text-white">{it.id}</p>
                </TableCell>
                <TableCell className="min-w-[220px]">
                  <p className="text-dark dark:text-white">{it.contact?.institution ?? "—"}</p>
                  <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{it.contact?.account_type ?? ""}</p>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="text-dark dark:text-white">{it.contact?.full_name ?? "—"}</p>
                  <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{it.contact?.email ?? ""}</p>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  {it.created_by_user_id ? (
                    props.userTransactionsHref ? (
                      <Link
                        href={props.userTransactionsHref(
                          String(it.created_by_user_id),
                          it.created_by_user?.full_name ?? it.created_by_user?.email ?? undefined,
                        )}
                        onClick={(e) => e.stopPropagation()}
                        className="block cursor-pointer text-left"
                      >
                        <p className="font-medium text-dark hover:text-primary dark:text-white">
                          {userPrimary(it.created_by_user, it.created_by_user_id)}
                        </p>
                        <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">
                          {userSecondary(it.created_by_user)}
                        </p>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onUserClick?.(String(it.created_by_user_id));
                        }}
                        className="block w-full cursor-pointer text-left"
                      >
                        <p className="font-medium text-dark hover:text-primary dark:text-white">
                          {userPrimary(it.created_by_user, it.created_by_user_id)}
                        </p>
                        <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">
                          {userSecondary(it.created_by_user)}
                        </p>
                      </button>
                    )
                  ) : (
                    <>
                      <p className="text-dark dark:text-white">{userPrimary(it.created_by_user, it.created_by_user_id)}</p>
                      <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{userSecondary(it.created_by_user)}</p>
                    </>
                  )}
                </TableCell>
                <TableCell className="min-w-[140px]">
                  <div className={cn("max-w-fit rounded-full px-3.5 py-1 text-sm font-medium", statusColor(it.status))}>
                    {it.status ?? "—"}
                  </div>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="font-medium text-dark dark:text-white">{formatAmount(it.amount, it.currency)}</p>
                  <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{it.currency ?? ""}</p>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="font-medium text-dark dark:text-white">{formatAmount(it.commission, it.currency)}</p>
                </TableCell>
                <TableCell className="min-w-[220px]">
                  <p className="text-dark dark:text-white">{it.note ?? "—"}</p>
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
