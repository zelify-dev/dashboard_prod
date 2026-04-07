"use client";

import { cn } from "@/lib/utils";

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[420px] overflow-auto rounded-md bg-[#0b1220] p-4 text-xs text-[#d1d5db]">
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
}

export function TransactionDetails(props: {
  networkId: string | null;
  isLoading?: boolean;
  status?: unknown;
  response?: unknown;
  error?: string;
}) {
  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-dark dark:text-white">Detalle de WorkFlow</h3>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            {props.networkId ? (
              <>
                Network ID: <span className="font-medium text-dark dark:text-white">{props.networkId}</span>
              </>
            ) : (
              "Selecciona una transacción para ver su estado y respuesta."
            )}
          </p>
        </div>
        {props.isLoading ? (
          <div className="inline-flex items-center gap-2 text-sm text-dark-6 dark:text-dark-6">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            Cargando…
          </div>
        ) : null}
      </div>

      {props.error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {props.error}
        </div>
      ) : null}

      <div className={cn("mt-6 grid gap-6", props.networkId ? "lg:grid-cols-2" : "lg:grid-cols-1")}>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-dark dark:text-white">Estado</h4>
          <JsonBlock value={props.status} />
        </div>
        {props.networkId ? (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-dark dark:text-white">Respuesta</h4>
            <JsonBlock value={props.response} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

