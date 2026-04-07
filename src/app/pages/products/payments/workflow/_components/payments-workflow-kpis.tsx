"use client";

import type { InternalTransferItem, InterbankTransferItem } from "@/lib/payments-transfers-api";
import { compactFormat } from "@/lib/format-number";
import { parseMoney } from "./payments-workflow-utils";

function getLocale(): string {
  if (typeof window === "undefined") return "en-US";
  return localStorage.getItem("preferredLanguage") === "es" ? "es-ES" : "en-US";
}

function formatMoney(amount: number, currency?: string): string {
  const cur = currency && currency.length === 3 ? currency.toUpperCase() : undefined;
  try {
    if (cur) {
      return new Intl.NumberFormat(getLocale(), { style: "currency", currency: cur }).format(amount);
    }
  } catch {
    // ignore
  }
  return amount.toLocaleString(getLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function KpiCard(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
      <div className="text-sm font-medium text-dark-6 dark:text-dark-6">{props.label}</div>
      <div className="mt-2 text-[26px] font-bold leading-[30px] text-dark dark:text-white">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-dark-6 dark:text-dark-6">{props.hint}</div> : null}
    </div>
  );
}

function topByCount<T>(items: T[], keyFn: (i: T) => string | undefined) {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = keyFn(it);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const [top] = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return top ? { key: top[0], count: top[1] } : null;
}

export function InternalTransfersKpis(props: { items: InternalTransferItem[]; currencyForSums?: string }) {
  const count = props.items.length;
  const sum = props.items.reduce((acc, it) => acc + parseMoney(it.amount), 0);
  const topCategory = topByCount(props.items, (i) => i.category?.trim().toLowerCase());
  const topSender = topByCount(props.items, (i) => i.from_user?.full_name ?? i.from_user_id);
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <KpiCard label="Internas: total" value={compactFormat(count)} />
      <KpiCard
        label="Internas: monto (sumatoria)"
        value={formatMoney(sum, props.currencyForSums)}
        hint={props.currencyForSums ? `Moneda: ${props.currencyForSums}` : "Total sin normalizar por moneda"}
      />
      <KpiCard
        label="Internas: top categoría"
        value={topCategory?.key ?? "—"}
        hint={topCategory ? `${topCategory.count} transferencias` : undefined}
      />
      <KpiCard
        label="Internas: top emisor"
        value={topSender?.key ?? "—"}
        hint={topSender ? `${topSender.count} transferencias` : undefined}
      />
    </div>
  );
}

export function InterbankTransfersKpis(props: { items: InterbankTransferItem[]; currencyForSums?: string }) {
  const count = props.items.length;
  const sum = props.items.reduce((acc, it) => acc + parseMoney(it.amount), 0);
  const commissionSum = props.items.reduce((acc, it) => acc + parseMoney(it.commission), 0);
  const byStatus = props.items.reduce((acc, it) => {
    const s = (it.status ?? "—").toUpperCase();
    acc.set(s, (acc.get(s) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
  const statusTop = [...byStatus.entries()].sort((a, b) => b[1] - a[1])[0];
  const topInstitution = topByCount(props.items, (i) => i.contact?.institution?.trim());

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <KpiCard label="Interbancarias: total" value={compactFormat(count)} />
      <KpiCard
        label="Interbancarias: monto (sumatoria)"
        value={formatMoney(sum, props.currencyForSums)}
        hint={props.currencyForSums ? `Moneda: ${props.currencyForSums}` : "Total sin normalizar por moneda"}
      />
      <KpiCard label="Interbancarias: comisiones" value={formatMoney(commissionSum, props.currencyForSums)} />
      <KpiCard
        label="Interbancarias: status / institución"
        value={`${statusTop?.[0] ?? "—"} · ${topInstitution?.key ?? "—"}`}
        hint={statusTop ? `Status top: ${statusTop[1]}` : undefined}
      />
    </div>
  );
}

