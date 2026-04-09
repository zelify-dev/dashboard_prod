"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { AuthError } from "@/lib/auth-api";
import {
  listInternalTransfers,
  listInterbankTransfers,
  type InternalTransferItem,
  type InterbankTransferItem,
} from "@/lib/payments-transfers-api";
import { filterInternalTransfers, filterInterbankTransfers, parseMoney } from "./payments-workflow-utils";
import { InternalTransfersKpis, InterbankTransfersKpis } from "./payments-workflow-kpis";
import { InternalTransfersTable } from "./internal-transfers-table";
import { InterbankTransfersTable } from "./interbank-transfers-table";
import { SpendByMonthPanel } from "./spend-by-month-panel";

function todayIsoDate() {
  return dayjs().format("YYYY-MM-DD");
}
function daysAgoIsoDate(days: number) {
  return dayjs().subtract(days, "day").format("YYYY-MM-DD");
}

function formatUpstreamError(err: unknown): string {
  if (err instanceof AuthError) return `${err.message} (HTTP ${err.statusCode})`;
  if (err instanceof Error) return err.message;
  return String(err);
}

type InternalFilters = { from?: string; to?: string; currency?: string; category?: string };
type InterbankFilters = { from?: string; to?: string; currency?: string; status?: string; institution?: string };

export function PaymentsWorkflowPageContent() {
  const ui = useUiTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"internal" | "interbank">(
    tabFromUrl === "interbank" ? "interbank" : "internal",
  );

  useEffect(() => {
    if (tabFromUrl === "interbank" || tabFromUrl === "internal") setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const [internalFilters, setInternalFilters] = useState<InternalFilters>(() => ({
    from: `${daysAgoIsoDate(30)}T00:00:00.000Z`,
    to: `${todayIsoDate()}T23:59:59.999Z`,
  }));
  const [interbankFilters, setInterbankFilters] = useState<InterbankFilters>(() => ({
    from: `${daysAgoIsoDate(30)}T00:00:00.000Z`,
    to: `${todayIsoDate()}T23:59:59.999Z`,
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [internalTransfers, setInternalTransfers] = useState<InternalTransferItem[]>([]);
  const [interbankTransfers, setInterbankTransfers] = useState<InterbankTransferItem[]>([]);

  // Client-side pagination (arrays)
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(20);
  const [interbankPage, setInterbankPage] = useState(1);
  const [interbankPageSize, setInterbankPageSize] = useState(20);

  const [selectedInternalId, setSelectedInternalId] = useState<string | null>(null);
  const [selectedInterbankId, setSelectedInterbankId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [internal, interbank] = await Promise.all([listInternalTransfers(), listInterbankTransfers()]);
      setInternalTransfers(internal);
      setInterbankTransfers(interbank);
    } catch (err) {
      setError(formatUpstreamError(err));
      setInternalTransfers([]);
      setInterbankTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const internalFiltered = useMemo(
    () => filterInternalTransfers(internalTransfers, internalFilters),
    [internalTransfers, internalFilters],
  );
  const interbankFiltered = useMemo(
    () => filterInterbankTransfers(interbankTransfers, interbankFilters),
    [interbankTransfers, interbankFilters],
  );

  // Clamp + slice internal
  const internalTotal = internalFiltered.length;
  const internalTotalPages = Math.max(1, Math.ceil(internalTotal / internalPageSize));
  const internalPageClamped = Math.min(Math.max(1, internalPage), internalTotalPages);
  const internalPaged = useMemo(() => {
    const start = (internalPageClamped - 1) * internalPageSize;
    return internalFiltered.slice(start, start + internalPageSize);
  }, [internalFiltered, internalPageClamped, internalPageSize]);

  // Clamp + slice interbank
  const interbankTotal = interbankFiltered.length;
  const interbankTotalPages = Math.max(1, Math.ceil(interbankTotal / interbankPageSize));
  const interbankPageClamped = Math.min(Math.max(1, interbankPage), interbankTotalPages);
  const interbankPaged = useMemo(() => {
    const start = (interbankPageClamped - 1) * interbankPageSize;
    return interbankFiltered.slice(start, start + interbankPageSize);
  }, [interbankFiltered, interbankPageClamped, interbankPageSize]);

  // Reset pages when filters change
  useEffect(() => setInternalPage(1), [internalFilters.from, internalFilters.to, internalFilters.currency, internalFilters.category]);
  useEffect(() => setInterbankPage(1), [interbankFilters.from, interbankFilters.to, interbankFilters.currency, interbankFilters.status, interbankFilters.institution]);

  const userTransactionsHref = (userId: string, userName?: string) => {
    const params = new URLSearchParams();
    params.set("userId", userId);
    if (userName && userName.trim()) params.set("userName", userName.trim());
    params.set("tab", activeTab);
    return `/pages/products/payments/workflow/user-transactions?${params.toString()}`;
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={ui.sidebar.menuItems.subItems.paymentsWorkflow} />

      <div className="mb-6 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-dark dark:text-white">WorkFlow (Payments & Transfers)</h3>
            <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
              Selecciona un usuario (nombre) para ver su ledger en una página dedicada.
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="mb-6 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-dark dark:text-white">Transferencias</h3>
        </div>
        <div className="mt-4 flex gap-4 border-b border-stroke dark:border-dark-3">
          <button
            onClick={() => router.replace("/pages/products/payments/workflow?tab=internal")}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === "internal"
                ? "border-b-2 border-primary text-primary"
                : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            }`}
          >
            Internas
          </button>
          <button
            onClick={() => router.replace("/pages/products/payments/workflow?tab=interbank")}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === "interbank"
                ? "border-b-2 border-primary text-primary"
                : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            }`}
          >
            Interbancarias
          </button>
        </div>

        {activeTab === "internal" ? (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-1 text-sm text-dark dark:text-white">
                <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Desde</span>
                <input
                  type="datetime-local"
                  value={(internalFilters.from ?? "").replace("Z", "").slice(0, 16)}
                  onChange={(e) =>
                    setInternalFilters((p) => ({
                      ...p,
                      from: e.target.value ? `${e.target.value}:00.000Z` : undefined,
                    }))
                  }
                  className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </label>
              <label className="grid gap-1 text-sm text-dark dark:text-white">
                <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Hasta</span>
                <input
                  type="datetime-local"
                  value={(internalFilters.to ?? "").replace("Z", "").slice(0, 16)}
                  onChange={(e) =>
                    setInternalFilters((p) => ({
                      ...p,
                      to: e.target.value ? `${e.target.value}:00.000Z` : undefined,
                    }))
                  }
                  className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </label>
              <label className="grid gap-1 text-sm text-dark dark:text-white">
                <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Moneda</span>
                <input
                  value={internalFilters.currency ?? ""}
                  onChange={(e) =>
                    setInternalFilters((p) => ({ ...p, currency: e.target.value || undefined }))
                  }
                  placeholder="USD"
                  className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </label>
              <label className="grid gap-1 text-sm text-dark dark:text-white">
                <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Categoría</span>
                <input
                  value={internalFilters.category ?? ""}
                  onChange={(e) =>
                    setInternalFilters((p) => ({ ...p, category: e.target.value || undefined }))
                  }
                  placeholder="comida"
                  className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </label>
            </div>
            <div className="mt-6">
              <InternalTransfersKpis
                items={internalFiltered}
                currencyForSums={internalFilters.currency?.trim() ? internalFilters.currency.trim().toUpperCase() : undefined}
              />
            </div>

            <div className="mt-6">
              <SpendByMonthPanel
                internal={internalFiltered}
                interbank={[]}
                from={internalFilters.from}
                to={internalFilters.to}
                title="Gasto por periodo (Internas)"
                subtitle="Agrupado por moneda. Se recalcula con tus filtros."
                defaultGranularity="week"
              />
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-1 text-sm text-dark dark:text-white">
                <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Desde</span>
                <input
                  type="datetime-local"
                  value={(interbankFilters.from ?? "").replace("Z", "").slice(0, 16)}
                  onChange={(e) =>
                    setInterbankFilters((p) => ({
                      ...p,
                      from: e.target.value ? `${e.target.value}:00.000Z` : undefined,
                    }))
                  }
                  className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </label>
              <label className="grid gap-1 text-sm text-dark dark:text-white">
                <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Hasta</span>
                <input
                  type="datetime-local"
                  value={(interbankFilters.to ?? "").replace("Z", "").slice(0, 16)}
                  onChange={(e) =>
                    setInterbankFilters((p) => ({
                      ...p,
                      to: e.target.value ? `${e.target.value}:00.000Z` : undefined,
                    }))
                  }
                  className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </label>
              <label className="grid gap-1 text-sm text-dark dark:text-white">
                <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Moneda</span>
                <input
                  value={interbankFilters.currency ?? ""}
                  onChange={(e) =>
                    setInterbankFilters((p) => ({ ...p, currency: e.target.value || undefined }))
                  }
                  placeholder="USD"
                  className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </label>
              <label className="grid gap-1 text-sm text-dark dark:text-white">
                <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Status</span>
                <input
                  value={interbankFilters.status ?? ""}
                  onChange={(e) =>
                    setInterbankFilters((p) => ({ ...p, status: e.target.value || undefined }))
                  }
                  placeholder="PENDING"
                  className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </label>
              <label className="grid gap-1 text-sm text-dark dark:text-white lg:col-span-2">
                <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Institución (contains)</span>
                <input
                  value={interbankFilters.institution ?? ""}
                  onChange={(e) =>
                    setInterbankFilters((p) => ({ ...p, institution: e.target.value || undefined }))
                  }
                  placeholder="Banco"
                  className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </label>
            </div>
            <div className="mt-6">
              <InterbankTransfersKpis
                items={interbankFiltered}
                currencyForSums={interbankFilters.currency?.trim() ? interbankFilters.currency.trim().toUpperCase() : undefined}
              />
            </div>

            <div className="mt-6">
              <SpendByMonthPanel
                internal={[]}
                interbank={interbankFiltered}
                from={interbankFilters.from}
                to={interbankFilters.to}
                title="Gasto por periodo (Interbancarias)"
                subtitle="Monto + comisión. Se recalcula con tus filtros."
                defaultGranularity="week"
              />
            </div>
          </>
        )}
      </div>

      {activeTab === "internal" ? (
        <>
          <InternalTransfersTable
            items={internalPaged}
            isLoading={loading}
            selectedId={selectedInternalId}
            onSelect={(id) => setSelectedInternalId(id)}
            userTransactionsHref={userTransactionsHref}
          />

          <div className="my-4 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-dark-6 dark:text-dark-6">
              <div>
                Mostrando{" "}
                <span className="font-medium text-dark dark:text-white">
                  {internalTotal === 0 ? 0 : (internalPageClamped - 1) * internalPageSize + 1}–
                  {Math.min(internalPageClamped * internalPageSize, internalTotal)}
                </span>{" "}
                de <span className="font-medium text-dark dark:text-white">{internalTotal}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2">
                  <span className="text-xs font-medium">Filas</span>
                  <select
                    value={internalPageSize}
                    onChange={(e) => {
                      setInternalPageSize(Number(e.target.value));
                      setInternalPage(1);
                    }}
                    className="rounded-md border border-stroke bg-transparent px-2 py-1.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
                <button
                  onClick={() => setInternalPage(1)}
                  disabled={loading || internalPageClamped <= 1}
                  className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  Primero
                </button>
                <button
                  onClick={() => setInternalPage(Math.max(1, internalPageClamped - 1))}
                  disabled={loading || internalPageClamped <= 1}
                  className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  Anterior
                </button>
                <div className="px-2 text-sm">
                  Página{" "}
                  <span className="font-medium text-dark dark:text-white">{internalPageClamped}</span> de{" "}
                  <span className="font-medium text-dark dark:text-white">{internalTotalPages}</span>
                </div>
                <button
                  onClick={() => setInternalPage(Math.min(internalTotalPages, internalPageClamped + 1))}
                  disabled={loading || internalPageClamped >= internalTotalPages}
                  className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  Siguiente
                </button>
                <button
                  onClick={() => setInternalPage(internalTotalPages)}
                  disabled={loading || internalPageClamped >= internalTotalPages}
                  className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  Último
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <InterbankTransfersTable
            items={interbankPaged}
            isLoading={loading}
            selectedId={selectedInterbankId}
            onSelect={(id) => setSelectedInterbankId(id)}
            userTransactionsHref={userTransactionsHref}
          />

          <div className="my-4 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-dark-6 dark:text-dark-6">
              <div>
                Mostrando{" "}
                <span className="font-medium text-dark dark:text-white">
                  {interbankTotal === 0 ? 0 : (interbankPageClamped - 1) * interbankPageSize + 1}–
                  {Math.min(interbankPageClamped * interbankPageSize, interbankTotal)}
                </span>{" "}
                de <span className="font-medium text-dark dark:text-white">{interbankTotal}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2">
                  <span className="text-xs font-medium">Filas</span>
                  <select
                    value={interbankPageSize}
                    onChange={(e) => {
                      setInterbankPageSize(Number(e.target.value));
                      setInterbankPage(1);
                    }}
                    className="rounded-md border border-stroke bg-transparent px-2 py-1.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
                <button
                  onClick={() => setInterbankPage(1)}
                  disabled={loading || interbankPageClamped <= 1}
                  className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  Primero
                </button>
                <button
                  onClick={() => setInterbankPage(Math.max(1, interbankPageClamped - 1))}
                  disabled={loading || interbankPageClamped <= 1}
                  className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  Anterior
                </button>
                <div className="px-2 text-sm">
                  Página{" "}
                  <span className="font-medium text-dark dark:text-white">{interbankPageClamped}</span> de{" "}
                  <span className="font-medium text-dark dark:text-white">{interbankTotalPages}</span>
                </div>
                <button
                  onClick={() => setInterbankPage(Math.min(interbankTotalPages, interbankPageClamped + 1))}
                  disabled={loading || interbankPageClamped >= interbankTotalPages}
                  className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  Siguiente
                </button>
                <button
                  onClick={() => setInterbankPage(interbankTotalPages)}
                  disabled={loading || interbankPageClamped >= interbankTotalPages}
                  className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  Último
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
