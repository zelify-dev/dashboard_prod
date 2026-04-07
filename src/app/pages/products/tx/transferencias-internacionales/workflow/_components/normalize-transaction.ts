export type NormalizedTransaction = {
  networkId: string;
  status: string;
  currency?: string;
  amount?: number;
  createdAt?: string;
  debtorFinId?: string;
  creditorFinId?: string;
  raw: unknown;
};

function getString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function getNested(obj: any, path: Array<string | number>): unknown {
  let cur: any = obj;
  for (const p of path) {
    if (cur == null) return undefined;
    cur = cur[p as any];
  }
  return cur;
}

export function normalizeTransaction(raw: any): NormalizedTransaction {
  const networkId =
    getString(raw?.shinkansen_id) ??
    getString(raw?.network_id) ??
    getString(raw?.networkId) ??
    getString(raw?.id) ??
    "—";

  const status =
    getString(raw?.status) ??
    getString(raw?.state) ??
    getString(raw?.transaction_status) ??
    getString(getNested(raw, ["document", "header", "status"])) ??
    "desconocido";

  const amount =
    getNumber(getNested(raw, ["amount", "value"])) ??
    getNumber(raw?.amount) ??
    getNumber(getNested(raw, ["payment", "amount"])) ??
    getNumber(getNested(raw, ["document", "payment", "amount", "value"]));

  const currency =
    getString(getNested(raw, ["amount", "currency"])) ??
    getString(raw?.currency) ??
    getString(getNested(raw, ["payment", "currency"])) ??
    getString(getNested(raw, ["document", "payment", "amount", "currency"]));

  const createdAt =
    getString(raw?.creation_date) ??
    getString(raw?.created_at) ??
    getString(getNested(raw, ["document", "header", "creation_date"])) ??
    getString(raw?.timestamp);

  const debtorFinId =
    getString(getNested(raw, ["debtor", "financial_institution", "fin_id"])) ??
    getString(raw?.debtor_fin_id) ??
    getString(getNested(raw, ["debtor", "fin_id"]));

  const creditorFinId =
    getString(getNested(raw, ["creditor", "financial_institution", "fin_id"])) ??
    getString(raw?.creditor_fin_id) ??
    getString(getNested(raw, ["creditor", "fin_id"]));

  return {
    networkId,
    status,
    currency,
    amount,
    createdAt,
    debtorFinId,
    creditorFinId,
    raw,
  };
}

export function extractTransactionList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

