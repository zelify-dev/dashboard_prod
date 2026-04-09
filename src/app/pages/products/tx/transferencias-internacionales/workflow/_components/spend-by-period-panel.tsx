"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { InternationalTransferItem } from "@/lib/international-transfers-api";
import { getDate } from "./international-transfers-utils";
import { SpendByPeriodChart, type SpendSeries } from "./spend-by-period-chart";

type Granularity = "week" | "month";

function getLocale(): string {
  if (typeof window === "undefined") return "es-ES";
  return localStorage.getItem("preferredLanguage") === "es" ? "es-ES" : "en-US";
}

function parseMoney(value?: string): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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
  items: InternationalTransferItem[],
  keys: string[],
  granularity: Granularity,
): { categories: string[]; series: SpendSeries[] } {
  // Gasto internacional (simplificado): sent_amount (por moneda enviada)
  const byCurrency = new Map<string, Map<string, number>>();

  for (const it of items) {
    const cur = (it.sent_currency ?? "N/A").toUpperCase();
    const dt = getDate(it.created_at ?? undefined);
    if (!dt) continue;
    const key = granularity === "month" ? monthKey(dt) : weekKey(dt);
    if (!keys.includes(key)) continue;
    const m = byCurrency.get(cur) ?? new Map<string, number>();
    m.set(key, (m.get(key) ?? 0) + parseMoney(it.sent_amount));
    byCurrency.set(cur, m);
  }

  const currencies = [...byCurrency.keys()].sort((a, b) => {
    const suma = keys.reduce((acc, k) => acc + (byCurrency.get(a)?.get(k) ?? 0), 0);
    const sumb = keys.reduce((acc, k) => acc + (byCurrency.get(b)?.get(k) ?? 0), 0);
    return sumb - suma;
  });

  const top = currencies.slice(0, 3);
  const other = currencies.slice(3);

  const toData = (cur: string) => keys.map((k) => Number((byCurrency.get(cur)?.get(k) ?? 0).toFixed(2)));
  const series: SpendSeries[] = top.map((c) => ({ name: c, data: toData(c) }));

  if (other.length) {
    const otherData = keys.map((k) =>
      Number(other.reduce((acc, c) => acc + (byCurrency.get(c)?.get(k) ?? 0), 0).toFixed(2)),
    );
    series.push({ name: "OTRAS", data: otherData });
  }

  const categories = keys.map((k) => {
    if (granularity === "month") {
      const [y, mm] = k.split("-");
      const d = new Date(Date.UTC(Number(y), Number(mm) - 1, 1));
      return new Intl.DateTimeFormat(getLocale(), { month: "short", year: "2-digit" }).format(d);
    }
    const d = new Date(`${k}T00:00:00.000Z`);
    const label = new Intl.DateTimeFormat(getLocale(), { day: "2-digit", month: "2-digit" }).format(d);
    return `Sem ${label}`;
  });

  return { categories, series: series.length ? series : [{ name: "N/A", data: keys.map(() => 0) }] };
}

export function SpendByPeriodPanel(props: {
  items: InternationalTransferItem[];
  from?: string;
  to?: string;
  title?: string;
  subtitle?: string;
  defaultGranularity?: Granularity;
  showGranularityToggle?: boolean;
  className?: string;
}) {
  const [granularity, setGranularity] = useState<Granularity>(props.defaultGranularity ?? "week");

  const keys = useMemo(() => {
    if (granularity === "week") {
      return weeksBetween(props.from, props.to, 104) ?? lastNWeeksKeys(12);
    }
    return monthsBetween(props.from, props.to, 24) ?? lastNMonthsKeys(12);
  }, [granularity, props.from, props.to]);

  const { categories, series } = useMemo(
    () => buildSeries(props.items, keys, granularity),
    [granularity, keys, props.items],
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
          {props.title ?? "Gasto por periodo"}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-dark-6 dark:text-dark-6">
            {props.subtitle ?? "Se recalcula con tus filtros."}
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

      <SpendByPeriodChart categories={categories} series={series} />
    </div>
  );
}

