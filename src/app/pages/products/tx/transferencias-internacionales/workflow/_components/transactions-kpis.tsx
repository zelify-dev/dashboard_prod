"use client";

import { compactFormat, standardFormat } from "@/lib/format-number";
import type { NormalizedTransaction } from "./normalize-transaction";

function getLocale(): string {
  if (typeof window === "undefined") return "en-US";
  return localStorage.getItem("preferredLanguage") === "es" ? "es-ES" : "en-US";
}

function formatMoney(amount: number, currency?: string): string {
  const safeCurrency = currency && currency.length === 3 ? currency : undefined;
  try {
    if (safeCurrency) {
      return new Intl.NumberFormat(getLocale(), {
        style: "currency",
        currency: safeCurrency,
      }).format(amount);
    }
  } catch {
    // fallback below
  }
  return standardFormat(amount);
}

function normalizeStatusBucket(status: string): "ok" | "pending" | "error" | "other" {
  const s = (status ?? "").toLowerCase();
  if (!s) return "other";
  if (/(ok|success|performed|completed|confirmed|accepted)/.test(s)) return "ok";
  if (/(pending|processing|in_progress|in-progress|submitted|queued)/.test(s)) return "pending";
  if (/(error|failed|rejected|denied|declined|invalid)/.test(s)) return "error";
  return "other";
}

function sumAmounts(transactions: NormalizedTransaction[]): number {
  return transactions.reduce((acc, t) => acc + (typeof t.amount === "number" ? t.amount : 0), 0);
}

function countByCurrency(transactions: NormalizedTransaction[]) {
  const map = new Map<string, { count: number; amount: number }>();
  for (const t of transactions) {
    const c = (t.currency ?? "N/A").toUpperCase();
    const cur = map.get(c) ?? { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += typeof t.amount === "number" ? t.amount : 0;
    map.set(c, cur);
  }
  return [...map.entries()]
    .map(([currency, v]) => ({ currency, ...v }))
    .sort((a, b) => b.count - a.count);
}

function countByFinId(transactions: NormalizedTransaction[], side: "debtor" | "creditor") {
  const map = new Map<string, number>();
  for (const t of transactions) {
    const id = side === "debtor" ? t.debtorFinId : t.creditorFinId;
    if (!id) continue;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([finId, count]) => ({ finId, count }))
    .sort((a, b) => b.count - a.count);
}

function KpiCard(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
      <div className="text-sm font-medium text-dark-6 dark:text-dark-6">{props.label}</div>
      <div className="mt-2 text-[26px] font-bold leading-[30px] text-dark dark:text-white">{props.value}</div>
      {props.hint ? (
        <div className="mt-1 text-xs text-dark-6 dark:text-dark-6">{props.hint}</div>
      ) : null}
    </div>
  );
}

export function TransactionsKpis({ transactions }: { transactions: NormalizedTransaction[] }) {
  const totalCount = transactions.length;
  const totalAmount = sumAmounts(transactions);

  const byBucket = transactions.reduce(
    (acc, t) => {
      acc[normalizeStatusBucket(t.status)] += 1;
      return acc;
    },
    { ok: 0, pending: 0, error: 0, other: 0 } as Record<"ok" | "pending" | "error" | "other", number>,
  );

  const currencies = countByCurrency(transactions);
  const topCurrency = currencies[0]?.currency ?? "—";
  const topDebtor = countByFinId(transactions, "debtor")[0]?.finId ?? "—";
  const topCreditor = countByFinId(transactions, "creditor")[0]?.finId ?? "—";

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <KpiCard label="Total de transacciones" value={compactFormat(totalCount)} />
      <KpiCard
        label="Monto total (sumatoria)"
        value={formatMoney(totalAmount, currencies[0]?.currency === "N/A" ? undefined : currencies[0]?.currency)}
        hint="Se calcula con los montos disponibles en el listado."
      />
      <KpiCard
        label="Estado (OK / Pendiente / Error)"
        value={`${byBucket.ok} / ${byBucket.pending} / ${byBucket.error}`}
        hint={`Otros: ${byBucket.other}`}
      />
      <KpiCard
        label="Top (moneda / deudor / acreedor)"
        value={`${topCurrency} · ${topDebtor} · ${topCreditor}`}
        hint="Basado en frecuencia."
      />
    </div>
  );
}

