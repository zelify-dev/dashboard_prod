"use client";

import type { InternationalTransferItem } from "@/lib/international-transfers-api";
import { compactFormat } from "@/lib/format-number";
import { parseFx, parseMoney } from "./international-transfers-utils";

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

function topByCount(items: InternationalTransferItem[], keyFn: (i: InternationalTransferItem) => string | undefined) {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = keyFn(it);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const [top] = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return top ? { key: top[0], count: top[1] } : null;
}

export function InternationalTransfersKpis(props: {
  items: InternationalTransferItem[];
  currencyForSums?: string;
}) {
  const count = props.items.length;

  const sentSum = props.items.reduce((acc, it) => acc + parseMoney(it.sent_amount), 0);
  const receivedSum = props.items.reduce((acc, it) => acc + parseMoney(it.received_amount), 0);

  const fxValues = props.items.map((it) => parseFx(it.fx_rate)).filter((n): n is number => typeof n === "number");
  const fxAvg = fxValues.length ? fxValues.reduce((a, b) => a + b, 0) / fxValues.length : null;

  const topCountry = topByCount(props.items, (i) => i.recipient_country?.toUpperCase());
  const topBank = topByCount(props.items, (i) => i.recipient_bank?.trim());

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <KpiCard label="Total de transferencias" value={compactFormat(count)} />
      <KpiCard
        label="Monto enviado (sumatoria)"
        value={formatMoney(sentSum, props.currencyForSums)}
        hint={props.currencyForSums ? `Moneda: ${props.currencyForSums.toUpperCase()}` : "Total sin normalizar por moneda"}
      />
      <KpiCard
        label="Monto recibido (sumatoria)"
        value={formatMoney(receivedSum)}
        hint="Total sin normalizar por moneda"
      />
      <KpiCard
        label="Top destino"
        value={`${topCountry?.key ?? "—"}`}
        hint={topBank ? `Banco más frecuente: ${topBank.key} (${topBank.count})` : undefined}
      />
    </div>
  );
}

