"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { AuthError } from "@/lib/auth-api";
import {
  listInternationalTransfers,
  type InternationalTransferItem,
} from "@/lib/international-transfers-api";
import { filterInternationalTransfers } from "./international-transfers-utils";
import { InternationalTransfersKpis } from "./international-transfers-kpis";
import { InternationalTransfersTable } from "./international-transfers-table";
import { SpendByPeriodPanel } from "./spend-by-period-panel";

type Filters = {
  from?: string;
  to?: string;
  sent_currency?: string;
  recipient_country?: string;
  recipient_bank?: string;
};

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

export function InternationalTransfersWorkflowPageContent() {
  const ui = useUiTranslations();

  const [filters, setFilters] = useState<Filters>(() => ({
    from: `${daysAgoIsoDate(30)}T00:00:00.000Z`,
    to: `${todayIsoDate()}T23:59:59.999Z`,
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [items, setItems] = useState<InternationalTransferItem[]>([]);

  const [transfersPage, setTransfersPage] = useState<number>(1);
  const [transfersPageSize, setTransfersPageSize] = useState<number>(20);

  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await listInternationalTransfers();
      setItems(data);
    } catch (err) {
      setError(formatUpstreamError(err));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => filterInternationalTransfers(items, filters), [items, filters]);
  const currencyForSums = filters.sent_currency?.trim() ? filters.sent_currency.trim().toUpperCase() : undefined;

  const userTransactionsHref = (userId: string, userName?: string) => {
    const params = new URLSearchParams();
    params.set("userId", userId);
    if (userName && userName.trim()) params.set("userName", userName.trim());
    return `/pages/products/tx/transferencias-internacionales/workflow/user-transactions?${params.toString()}`;
  };

  const transfersTotal = filteredItems.length;
  const transfersTotalPages = Math.max(1, Math.ceil(transfersTotal / transfersPageSize));
  const transfersPageClamped = Math.min(Math.max(1, transfersPage), transfersTotalPages);
  const transfersPagedItems = useMemo(() => {
    const start = (transfersPageClamped - 1) * transfersPageSize;
    return filteredItems.slice(start, start + transfersPageSize);
  }, [filteredItems, transfersPageClamped, transfersPageSize]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si cambian filtros/datos, reiniciar paginación de transferencias.
  useEffect(() => {
    setTransfersPage(1);
  }, [filters.from, filters.to, filters.sent_currency, filters.recipient_country, filters.recipient_bank]);

  // Clamp page si el total cambia (ej: filtros nuevos).
  useEffect(() => {
    if (transfersPage !== transfersPageClamped) {
      setTransfersPage(transfersPageClamped);
    }
  }, [transfersPage, transfersPageClamped]);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={ui.sidebar.menuItems.subItems.internationalTransfersWorkflow} />

      <div className="mb-6 rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-dark dark:text-white">
              Transferencias internacionales
            </h3>
          </div>

          <button
            onClick={refresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1 text-sm text-dark dark:text-white">
            <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Desde (from)</span>
            <input
              type="datetime-local"
              value={(filters.from ?? "").replace("Z", "").slice(0, 16)}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  from: e.target.value ? `${e.target.value}:00.000Z` : undefined,
                }))
              }
              className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-dark dark:text-white">
            <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Hasta (to)</span>
            <input
              type="datetime-local"
              value={(filters.to ?? "").replace("Z", "").slice(0, 16)}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  to: e.target.value ? `${e.target.value}:00.000Z` : undefined,
                }))
              }
              className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-dark dark:text-white">
            <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Moneda enviada</span>
            <input
              placeholder="USD"
              value={filters.sent_currency ?? ""}
              onChange={(e) =>
                setFilters((p) => ({ ...p, sent_currency: e.target.value || undefined }))
              }
              className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-dark dark:text-white">
            <span className="text-xs font-medium text-dark-6 dark:text-dark-6">País destino</span>
            <input
              placeholder="MX"
              value={filters.recipient_country ?? ""}
              onChange={(e) =>
                setFilters((p) => ({ ...p, recipient_country: e.target.value || undefined }))
              }
              className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-dark dark:text-white">
            <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Banco destino</span>
            <input
              placeholder="Banco Comercial"
              value={filters.recipient_bank ?? ""}
              onChange={(e) =>
                setFilters((p) => ({ ...p, recipient_bank: e.target.value || undefined }))
              }
              className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mt-6">
          <InternationalTransfersKpis items={filteredItems} currencyForSums={currencyForSums} />
        </div>

        <div className="mt-6">
          <SpendByPeriodPanel
            items={filteredItems}
            from={filters.from}
            to={filters.to}
            title="Gasto por periodo (Internacionales)"
            subtitle="Monto enviado por moneda. Se recalcula con tus filtros."
            defaultGranularity="week"
          />
        </div>
      </div>

      <div className="space-y-6">
        <InternationalTransfersTable
          items={transfersPagedItems}
          isLoading={isLoading}
          selectedId={selectedTransferId}
          userTransactionsHref={userTransactionsHref}
          onSelect={(id) => {
            setSelectedTransferId(id);
          }}
        />

        <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-dark-6 dark:text-dark-6">
            <div>
              Mostrando{" "}
              <span className="font-medium text-dark dark:text-white">
                {transfersTotal === 0 ? 0 : (transfersPageClamped - 1) * transfersPageSize + 1}
                –
                {Math.min(transfersPageClamped * transfersPageSize, transfersTotal)}
              </span>{" "}
              de{" "}
              <span className="font-medium text-dark dark:text-white">{transfersTotal}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                <span className="text-xs font-medium">Filas</span>
                <select
                  value={transfersPageSize}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setTransfersPageSize(next);
                    setTransfersPage(1);
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
                onClick={() => setTransfersPage(1)}
                disabled={isLoading || transfersPageClamped <= 1}
                className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
              >
                Primero
              </button>
              <button
                onClick={() => setTransfersPage(Math.max(1, transfersPageClamped - 1))}
                disabled={isLoading || transfersPageClamped <= 1}
                className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
              >
                Anterior
              </button>

              <div className="px-2 text-sm">
                Página{" "}
                <span className="font-medium text-dark dark:text-white">{transfersPageClamped}</span>{" "}
                de{" "}
                <span className="font-medium text-dark dark:text-white">{transfersTotalPages}</span>
              </div>

              <button
                onClick={() => setTransfersPage(Math.min(transfersTotalPages, transfersPageClamped + 1))}
                disabled={isLoading || transfersPageClamped >= transfersTotalPages}
                className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
              >
                Siguiente
              </button>
	              <button
	                onClick={() => setTransfersPage(transfersTotalPages)}
	                disabled={isLoading || transfersPageClamped >= transfersTotalPages}
	                className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
	              >
	                Último
	              </button>
	            </div>
	          </div>
	        </div>
	      </div>
	    </div>
	  );
	}
