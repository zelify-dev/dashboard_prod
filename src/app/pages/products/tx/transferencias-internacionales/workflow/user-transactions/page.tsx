"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthError } from "@/lib/auth-api";
import { getUserTransactionHistory, type UserTransactionItem } from "@/lib/user-transactions-api";
import { UserTransactionsTable } from "@/app/pages/products/tx/transferencias-internacionales/workflow/_components/user-transactions-table";

function formatUpstreamError(err: unknown): string {
  if (err instanceof AuthError) return `${err.message} (HTTP ${err.statusCode})`;
  if (err instanceof Error) return err.message;
  return String(err);
}

export default function InternationalTransfersUserTransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userIdFromUrl = searchParams.get("userId") ?? "";
  const userNameFromUrl = searchParams.get("userName") ?? "";
  const accountIdFromUrl = searchParams.get("accountId") ?? "";

  const [historyUserId, setHistoryUserId] = useState(userIdFromUrl);
  const [historyUserName, setHistoryUserName] = useState(userNameFromUrl);
  const [historyAccountId, setHistoryAccountId] = useState(accountIdFromUrl);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(20);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyItems, setHistoryItems] = useState<UserTransactionItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [direction, setDirection] = useState<"ALL" | "IN" | "OUT">("ALL");

  const filteredItems = useMemo(() => {
    return historyItems.filter((it) => {
      if (it.reference_type !== "international_transfer") return false;
      if (direction !== "ALL" && (it.direction ?? "") !== direction) return false;
      return true;
    });
  }, [direction, historyItems]);

  const uniqueTransfersCount = useMemo(() => {
    const ids = new Set<string>();
    for (const it of filteredItems) {
      if (it.reference_id) ids.add(String(it.reference_id));
    }
    return ids.size;
  }, [filteredItems]);

  const load = async (opts?: { page?: number }) => {
    const userId = historyUserId.trim();
    if (!userId) {
      setHistoryError("userId es requerido para consultar el historial.");
      return;
    }
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const page = opts?.page ?? historyPage;
      const res = await getUserTransactionHistory({
        userId,
        accountId: historyAccountId.trim() || undefined,
        page,
        limit: historyLimit,
      });
      setHistoryItems(res.items);
      setHistoryTotal(typeof res.total === "number" ? res.total : res.items.length);
      setHistoryPage(typeof res.page === "number" ? res.page : page);
    } catch (err) {
      setHistoryError(formatUpstreamError(err));
      setHistoryItems([]);
      setHistoryTotal(0);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (userIdFromUrl) {
      setHistoryUserId(userIdFromUrl);
      setHistoryUserName(userNameFromUrl);
      load({ page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdFromUrl]);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName="Movimientos (Transferencias internacionales)" />

      <div className="mb-4">
        <button
          onClick={() => router.push("/pages/products/tx/transferencias-internacionales/workflow")}
          className="ml-4 flex items-center gap-2 text-sm text-dark-6 transition hover:text-primary dark:text-dark-6"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Atrás
        </button>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-dark dark:text-white">Ledger por usuario/cuenta</h3>
          
          </div>
          <button
            onClick={() => load({ page: 1 })}
            disabled={historyLoading || !historyUserId.trim()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {historyLoading ? "Cargando…" : "Actualizar"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-sm text-dark dark:text-white">
            <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Usuario</span>
            <input
              value={historyUserName || historyUserId}
              disabled
              className="w-full cursor-not-allowed rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark opacity-80 outline-none dark:border-dark-3 dark:text-white"
            />
            <p className="text-xs text-dark-6 dark:text-dark-6">userId: {historyUserId || "—"}</p>
          </label>

          <label className="grid gap-1 text-sm text-dark dark:text-white">
            <span className="text-xs font-medium text-dark-6 dark:text-dark-6">account_id (opcional)</span>
            <input
              value={historyAccountId}
              onChange={(e) => setHistoryAccountId(e.target.value)}
              placeholder="7a0b9c8d-…"
              className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-dark dark:text-white">
            <span className="text-xs font-medium text-dark-6 dark:text-dark-6">page</span>
            <input
              type="number"
              min={1}
              value={historyPage}
              onChange={(e) => setHistoryPage(Math.max(1, Number(e.target.value || 1)))}
              className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-dark dark:text-white">
            <span className="text-xs font-medium text-dark-6 dark:text-dark-6">limit</span>
            <input
              type="number"
              min={1}
              max={200}
              value={historyLimit}
              onChange={(e) => setHistoryLimit(Math.max(1, Math.min(200, Number(e.target.value || 20))))}
              className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-dark-6 dark:text-dark-6">
          <div>
            Total: <span className="font-medium text-dark dark:text-white">{historyTotal}</span> · Mostrando:{" "}
            <span className="font-medium text-dark dark:text-white">{filteredItems.length}</span> · Transferencias únicas:{" "}
            <span className="font-medium text-dark dark:text-white">{uniqueTransfersCount}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white">
              <span className="text-xs font-medium text-dark-6 dark:text-dark-6">Dirección</span>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="bg-transparent text-sm text-dark outline-none dark:text-white"
              >
                <option value="ALL">Todas</option>
                <option value="OUT">OUT</option>
                <option value="IN">IN</option>
              </select>
            </label>

            <button
              onClick={() => load({ page: historyPage })}
              disabled={historyLoading || !historyUserId.trim()}
              className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
            >
              Ir
            </button>
            <button
              onClick={() => load({ page: Math.max(1, historyPage - 1) })}
              disabled={historyLoading || historyPage <= 1}
              className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
            >
              Anterior
            </button>
            <button
              onClick={() => load({ page: historyPage + 1 })}
              disabled={historyLoading || (historyTotal > 0 && historyPage * historyLimit >= historyTotal)}
              className="rounded-md border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white"
            >
              Siguiente
            </button>
          </div>
        </div>

        {historyError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {historyError}
          </div>
        ) : null}

        <div className="mt-4">
          <UserTransactionsTable items={filteredItems} isLoading={historyLoading} />
        </div>
      </div>
    </div>
  );
}

