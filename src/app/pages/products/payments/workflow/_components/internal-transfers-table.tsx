"use client";

import Link from "next/link";
import type { InternalTransferItem } from "@/lib/payments-transfers-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLocalDateOnly, formatLocalTimeOnly } from "@/lib/date-utils";

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

export function InternalTransfersTable(props: {
  items: InternalTransferItem[];
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
            <TableHead className="min-w-[160px] xl:pl-7.5">ID</TableHead>
            <TableHead className="min-w-[160px]">Transaction ID</TableHead>
            <TableHead className="min-w-[160px]">De</TableHead>
            <TableHead className="min-w-[160px]">Para</TableHead>
            <TableHead className="min-w-[120px]">Categoría</TableHead>
            <TableHead className="min-w-[160px]">Monto</TableHead>
            <TableHead className="min-w-[220px]">Nota</TableHead>
            <TableHead className="text-right xl:pr-7.5">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.isLoading ? (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={8} className="py-10 text-center text-sm text-dark-6 dark:text-dark-6">
                Cargando transferencias internas…
              </TableCell>
            </TableRow>
          ) : props.items.length === 0 ? (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={8} className="py-10 text-center text-sm text-dark-6 dark:text-dark-6">
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
                <TableCell className="min-w-[160px] xl:pl-7.5">
                  <p className="text-dark dark:text-white">{it.id}</p>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="text-dark-6 dark:text-dark-6">{it.transaction_id ?? "—"}</p>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  {it.from_user_id ? (
                    props.userTransactionsHref ? (
                      <Link
                        href={props.userTransactionsHref(
                          String(it.from_user_id),
                          it.from_user?.full_name ?? it.from_user?.email ?? undefined,
                        )}
                        onClick={(e) => e.stopPropagation()}
                        className="block cursor-pointer text-left"
                      >
                        <p className="font-medium text-dark hover:text-primary dark:text-white">
                          {userPrimary(it.from_user, it.from_user_id)}
                        </p>
                        <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">
                          {userSecondary(it.from_user)}
                        </p>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onUserClick?.(String(it.from_user_id));
                        }}
                        className="block w-full cursor-pointer text-left"
                      >
                        <p className="font-medium text-dark hover:text-primary dark:text-white">
                          {userPrimary(it.from_user, it.from_user_id)}
                        </p>
                        <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">
                          {userSecondary(it.from_user)}
                        </p>
                      </button>
                    )
                  ) : (
                    <>
                      <p className="text-dark dark:text-white">{userPrimary(it.from_user, it.from_user_id)}</p>
                      <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{userSecondary(it.from_user)}</p>
                    </>
                  )}
                </TableCell>
                <TableCell className="min-w-[160px]">
                  {it.to_user_id ? (
                    props.userTransactionsHref ? (
                      <Link
                        href={props.userTransactionsHref(
                          String(it.to_user_id),
                          it.to_user?.full_name ?? it.to_user?.email ?? undefined,
                        )}
                        onClick={(e) => e.stopPropagation()}
                        className="block cursor-pointer text-left"
                      >
                        <p className="font-medium text-dark hover:text-primary dark:text-white">
                          {userPrimary(it.to_user, it.to_user_id)}
                        </p>
                        <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">
                          {userSecondary(it.to_user)}
                        </p>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onUserClick?.(String(it.to_user_id));
                        }}
                        className="block w-full cursor-pointer text-left"
                      >
                        <p className="font-medium text-dark hover:text-primary dark:text-white">
                          {userPrimary(it.to_user, it.to_user_id)}
                        </p>
                        <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">
                          {userSecondary(it.to_user)}
                        </p>
                      </button>
                    )
                  ) : (
                    <>
                      <p className="text-dark dark:text-white">{userPrimary(it.to_user, it.to_user_id)}</p>
                      <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{userSecondary(it.to_user)}</p>
                    </>
                  )}
                </TableCell>
                <TableCell className="min-w-[120px]">
                  <p className="text-dark-6 dark:text-dark-6">{it.category ?? "—"}</p>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="font-medium text-dark dark:text-white">{formatAmount(it.amount, it.currency)}</p>
                  <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{it.currency ?? ""}</p>
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
