"use client";

import { cn } from "@/lib/utils";
import type { InternalTransferItem, InterbankTransferItem } from "@/lib/payments-transfers-api";
import { getDate, parseMoney } from "./payments-workflow-utils";
import { SpendByMonthChart, type SpendSeries } from "./spend-by-month-chart";
import { useMemo, useState } from "react";

type Granularity = "week" | "month";

function getLocale(): string {
  if (typeof window === "undefined") return "es-ES";
  return localStorage.getItem("preferredLanguage") === "es" ? "es-ES" : "en-US";
}

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function startOfWeekUtc(date: Date): Date {
  const day = date.getUTCDay() || 7; // domingo=0 -> 7
  const diff = day - 1; // lunes=1
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function weekKey(d: Date): string {
  const sow = startOfWeekUtc(d);
  const y = sow.getUTCFullYear();
  const m = String(sow.getUTCMonth() + 1).padStart(2, "0");
  const day = String(sow.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // lunes de la semana
}

function lastNMonthsKeys(n: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(monthKey(d));
  }
  return keys;
}

function lastNWeeksKeys(n: number): string[] {
  const now = startOfWeekUtc(new Date());
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    keys.push(weekKey(d));
  }
  return keys;
}

function monthsBetween(from?: string, to?: string, maxMonths = 24): string[] | null {
  const start = from ? getDate(from) : null;
  const end = to ? getDate(to) : null;
  if (!start || !end) return null;

  const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const e = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  if (s.getTime() > e.getTime()) return null;

  const keys: string[] = [];
  const cursor = new Date(s);
  while (cursor.getTime() <= e.getTime() && keys.length < maxMonths) {
    keys.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys.length ? keys : null;
}

function weeksBetween(from?: string, to?: string, maxWeeks = 104): string[] | null {
  const start = from ? getDate(from) : null;
  const end = to ? getDate(to) : null;
  if (!start || !end) return null;

  const s = startOfWeekUtc(start);
  const e = startOfWeekUtc(end);
  if (s.getTime() > e.getTime()) return null;

  const keys: string[] = [];
  const cursor = new Date(s);
  while (cursor.getTime() <= e.getTime() && keys.length < maxWeeks) {
    keys.push(weekKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return keys.length ? keys : null;
}

function buildSeries(
  internal: InternalTransferItem[],
  interbank: InterbankTransferItem[],
  months: string[],
  granularity: Granularity,
): { categories: string[]; series: SpendSeries[] } {
  // Gasto = internas.amount + (interbank.amount + interbank.commission)
  // Agrupamos por moneda para evitar mezclar.
  const byCurrency = new Map<string, Map<string, number>>();

  const add = (currency: string | undefined, createdAt: string | undefined, value: number) => {
    const cur = (currency ?? "N/A").toUpperCase();
    const dt = getDate(createdAt ?? undefined);
    if (!dt) return;
    const mk = granularity === "month" ? monthKey(dt) : weekKey(dt);
    if (!months.includes(mk)) return;
    const m = byCurrency.get(cur) ?? new Map<string, number>();
    m.set(mk, (m.get(mk) ?? 0) + value);
    byCurrency.set(cur, m);
  };

  for (const it of internal) {
    add(it.currency, it.created_at, parseMoney(it.amount));
  }
  for (const it of interbank) {
    add(it.currency, it.created_at, parseMoney(it.amount) + parseMoney(it.commission));
  }

  const currencies = [...byCurrency.keys()].sort((a, b) => {
    const suma = months.reduce((acc, k) => acc + (byCurrency.get(a)?.get(k) ?? 0), 0);
    const sumb = months.reduce((acc, k) => acc + (byCurrency.get(b)?.get(k) ?? 0), 0);
    return sumb - suma;
  });

  const top = currencies.slice(0, 3);
  const other = currencies.slice(3);

  const toData = (cur: string) => months.map((k) => Number((byCurrency.get(cur)?.get(k) ?? 0).toFixed(2)));

  const series: SpendSeries[] = top.map((c) => ({ name: c, data: toData(c) }));
  if (other.length) {
    const otherData = months.map((k) =>
      Number(
        other.reduce((acc, c) => acc + (byCurrency.get(c)?.get(k) ?? 0), 0).toFixed(2),
      ),
    );
    series.push({ name: "OTRAS", data: otherData });
  }

  const categories = months.map((k) => {
    if (granularity === "month") {
      const [y, mm] = k.split("-");
      const d = new Date(Date.UTC(Number(y), Number(mm) - 1, 1));
      return new Intl.DateTimeFormat(getLocale(), { month: "short", year: "2-digit" }).format(d);
    }
    // week: key = YYYY-MM-DD (lunes)
    const d = new Date(`${k}T00:00:00.000Z`);
    const label = new Intl.DateTimeFormat(getLocale(), { day: "2-digit", month: "2-digit" }).format(d);
    return `Sem ${label}`;
  });

  return { categories, series: series.length ? series : [{ name: "N/A", data: months.map(() => 0) }] };
}

export function SpendByMonthPanel(props: {
  internal: InternalTransferItem[];
  interbank: InterbankTransferItem[];
  from?: string;
  to?: string;
  title?: string;
  subtitle?: string;
  maxMonths?: number;
  defaultGranularity?: Granularity;
  showGranularityToggle?: boolean;
  className?: string;
}) {
  const [granularity, setGranularity] = useState<Granularity>(
    props.defaultGranularity ?? "month",
  );

  const keys = useMemo(() => {
    if (granularity === "week") {
      return weeksBetween(props.from, props.to, 104) ?? lastNWeeksKeys(12);
    }
    return monthsBetween(props.from, props.to, props.maxMonths ?? 24) ?? lastNMonthsKeys(12);
  }, [granularity, props.from, props.maxMonths, props.to]);

  const { categories, series } = useMemo(
    () => buildSeries(props.internal, props.interbank, keys, granularity),
    [granularity, keys, props.interbank, props.internal],
  );

  return (
    <div
      className={cn(
        "grid gap-2 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        props.className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          {props.title ?? "Gasto por mes"}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-dark-6 dark:text-dark-6">
            {props.subtitle ?? "Incluye internas + interbancarias (monto + comisión)."}
          </p>
          {(props.showGranularityToggle ?? true) ? (
            <label className="flex items-center gap-2 rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white">
              <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Agrupar</span>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as Granularity)}
                className="bg-transparent text-sm text-dark outline-none dark:text-white"
              >
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <SpendByMonthChart categories={categories} series={series} />
    </div>
  );
}
