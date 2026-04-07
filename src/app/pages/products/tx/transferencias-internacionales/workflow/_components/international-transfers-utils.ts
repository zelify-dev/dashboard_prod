import type { InternationalTransferItem } from "@/lib/international-transfers-api";

export function parseMoney(value?: string): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function parseFx(value?: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function getDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function filterInternationalTransfers(
  items: InternationalTransferItem[],
  filters: {
    from?: string;
    to?: string;
    sent_currency?: string;
    recipient_country?: string;
    recipient_bank?: string;
  },
): InternationalTransferItem[] {
  const fromDate = filters.from ? getDate(filters.from) : null;
  const toDate = filters.to ? getDate(filters.to) : null;
  const sentCurrency = filters.sent_currency?.trim()
    ? filters.sent_currency.trim().toUpperCase()
    : undefined;
  const country = filters.recipient_country?.trim()
    ? filters.recipient_country.trim().toUpperCase()
    : undefined;
  const bank = filters.recipient_bank?.trim()
    ? filters.recipient_bank.trim().toLowerCase()
    : undefined;

  return items.filter((it) => {
    if (sentCurrency && (it.sent_currency ?? "").toUpperCase() !== sentCurrency)
      return false;
    if (country && (it.recipient_country ?? "").toUpperCase() !== country)
      return false;
    if (bank && !(it.recipient_bank ?? "").toLowerCase().includes(bank))
      return false;

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

