import type { InternalTransferItem, InterbankTransferItem } from "@/lib/payments-transfers-api";

export function parseMoney(value?: string): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function getDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function filterInternalTransfers(
  items: InternalTransferItem[],
  filters: { from?: string; to?: string; currency?: string; category?: string },
): InternalTransferItem[] {
  const fromDate = filters.from ? getDate(filters.from) : null;
  const toDate = filters.to ? getDate(filters.to) : null;
  const cur = filters.currency?.trim() ? filters.currency.trim().toUpperCase() : undefined;
  const cat = filters.category?.trim() ? filters.category.trim().toLowerCase() : undefined;

  return items.filter((it) => {
    if (cur && (it.currency ?? "").toUpperCase() !== cur) return false;
    if (cat && !(it.category ?? "").toLowerCase().includes(cat)) return false;

    if (fromDate || toDate) {
      const dt = getDate(it.created_at);
      if (dt) {
        if (fromDate && dt.getTime() < fromDate.getTime()) return false;
        if (toDate && dt.getTime() > toDate.getTime()) return false;
      }
    }
    return true;
  });
}

export function filterInterbankTransfers(
  items: InterbankTransferItem[],
  filters: { from?: string; to?: string; currency?: string; status?: string; institution?: string },
): InterbankTransferItem[] {
  const fromDate = filters.from ? getDate(filters.from) : null;
  const toDate = filters.to ? getDate(filters.to) : null;
  const cur = filters.currency?.trim() ? filters.currency.trim().toUpperCase() : undefined;
  const status = filters.status?.trim() ? filters.status.trim().toUpperCase() : undefined;
  const inst = filters.institution?.trim() ? filters.institution.trim().toLowerCase() : undefined;

  return items.filter((it) => {
    if (cur && (it.currency ?? "").toUpperCase() !== cur) return false;
    if (status && (it.status ?? "").toUpperCase() !== status) return false;
    if (inst && !(it.contact?.institution ?? "").toLowerCase().includes(inst)) return false;

    if (fromDate || toDate) {
      const dt = getDate(it.created_at);
      if (dt) {
        if (fromDate && dt.getTime() < fromDate.getTime()) return false;
        if (toDate && dt.getTime() > toDate.getTime()) return false;
      }
    }
    return true;
  });
}

