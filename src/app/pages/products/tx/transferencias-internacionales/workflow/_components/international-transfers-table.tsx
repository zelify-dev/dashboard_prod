"use client";

import Link from "next/link";
import type { InternationalTransferItem } from "@/lib/international-transfers-api";
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
    if (cur) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n);
    }
  } catch {
    // ignore
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InternationalTransfersTable(props: {
  items: InternationalTransferItem[];
  isLoading?: boolean;
  selectedId?: string | null;
  onSelect?: (transferId: string) => void;
  userTransactionsHref?: (userId: string, userName?: string) => string;
}) {
  const userPrimary = (
    user: { full_name?: string | null; email?: string | null } | null | undefined,
    userId?: unknown,
  ) => user?.full_name ?? user?.email ?? (userId ? String(userId) : "—");

  const userSecondary = (user: { email?: string | null } | null | undefined) => user?.email ?? "";

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[160px] xl:pl-7.5">ID</TableHead>
            <TableHead className="min-w-[160px]">Transaction ID</TableHead>
            <TableHead className="min-w-[200px]">Usuario</TableHead>
            <TableHead className="min-w-[90px]">País</TableHead>
            <TableHead className="min-w-[200px]">Banco</TableHead>
            <TableHead className="min-w-[200px]">Beneficiario</TableHead>
            <TableHead className="min-w-[160px]">Enviado</TableHead>
            <TableHead className="min-w-[160px]">Recibido</TableHead>
            <TableHead className="text-right xl:pr-7.5">Fecha</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {props.isLoading ? (
            <TableRow className="border-[#eee] dark:border-dark-3">
              <TableCell colSpan={9} className="py-10 text-center text-sm text-dark-6 dark:text-dark-6">
                Cargando transferencias…
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
                <TableCell className="min-w-[160px] xl:pl-7.5">
                  <p className="text-dark dark:text-white">{it.id}</p>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="text-dark-6 dark:text-dark-6">{it.transaction_id}</p>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  {it.from_user_id && props.userTransactionsHref ? (
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
                    <>
                      <p className="text-dark dark:text-white">{userPrimary(it.from_user, it.from_user_id)}</p>
                      <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{userSecondary(it.from_user)}</p>
                    </>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-dark-6 dark:text-dark-6">{it.recipient_country ?? "—"}</p>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <p className="text-dark dark:text-white">{it.recipient_bank ?? "—"}</p>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <p className="text-dark dark:text-white">{it.recipient_name ?? "—"}</p>
                  <p className="mt-[3px] text-body-sm text-dark-6 dark:text-dark-6">{it.recipient_account ? `Cuenta: ${it.recipient_account}` : ""}</p>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="font-medium text-dark dark:text-white">
                    {formatAmount(it.sent_amount, it.sent_currency)}
                  </p>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="font-medium text-dark dark:text-white">
                    {formatAmount(it.received_amount, it.received_currency)}
                  </p>
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
