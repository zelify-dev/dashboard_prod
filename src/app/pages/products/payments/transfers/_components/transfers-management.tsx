"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  formatMXN,
  INITIAL_TRANSFERS_MOCK,
  TransferItem,
  TransferStatus,
} from "@/lib/payments-mock-data";
import { getStoredOrganization } from "@/lib/auth-api";
import { listDashboardMembers, listRegisteredUsers, OrgUserListItem } from "@/lib/organization-users-api";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: TransferStatus }) {
  const config = {
    COMPLETED: {
      label: "Completada",
      style: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
    PENDING: {
      label: "Pendiente",
      style: "bg-amber-50 text-amber-700 border-amber-200/80",
    },
    PROCESSING: {
      label: "En proceso",
      style: "bg-sky-50 text-sky-700 border-sky-200/80",
    },
    REJECTED: {
      label: "Rechazada",
      style: "bg-rose-50 text-rose-700 border-rose-200/80",
    },
    CANCELLED: {
      label: "Cancelada",
      style: "bg-gray-100 text-slate-600 border-gray-200",
    },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xl border px-2.5 py-0.5 text-[10px] font-normal uppercase tracking-wider",
        config.style
      )}
    >
      {config.label}
    </span>
  );
}

function formatDate(isoStr?: string | null): string {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return Number.isNaN(d.getTime())
      ? isoStr
      : d.toLocaleString("es-MX", {
          dateStyle: "short",
          timeStyle: "short",
        });
  } catch {
    return isoStr;
  }
}

export function TransfersManagement() {
  const org = getStoredOrganization();
  const [users, setUsers] = useState<OrgUserListItem[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>(INITIAL_TRANSFERS_MOCK);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransferStatus | "ALL">("ALL");
  const [sourceAccountFilter, setSourceAccountFilter] = useState("");
  const [destinationAccountFilter, setDestinationAccountFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Paginación y Ordenamiento
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortField, setSortField] = useState<"createdAt" | "amount" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal de Detalle
  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null);

  // Cargar usuarios reales de la organización (Auth/Identity) para poblar los filtros
  useEffect(() => {
    if (!org?.id) {
      setLoadingUsers(false);
      return;
    }
    setLoadingUsers(true);
    listRegisteredUsers(org.id, { page: 1, limit: 50 })
      .then((res) => {
        if (res.items && res.items.length > 0) {
          setUsers(res.items);
        } else {
          return listDashboardMembers(org.id, { page: 1, limit: 50 }).then((mRes) => setUsers(mRes.items));
        }
      })
      .catch(() => {
        listDashboardMembers(org.id, { page: 1, limit: 50 })
          .then((mRes) => setUsers(mRes.items))
          .catch(() => setUsers([]));
      })
      .finally(() => setLoadingUsers(false));
  }, [org?.id]);

  // Vincular automáticamente los usuarios reales cargados con el historial de transferencias
  useEffect(() => {
    if (!users || users.length === 0) return;
    setTransfers((prevTransfers) =>
      prevTransfers.map((t, idx) => {
        const user = users[idx % users.length];
        return {
          ...t,
          userName: user.full_name || user.email,
          userEmail: user.email,
          userId: user.id,
        };
      })
    );
  }, [users]);

  // Filtrado de la lista
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      // Búsqueda por texto (referencia, speiKey, cuentas)
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesRef = t.reference.toLowerCase().includes(q);
        const matchesSpei = t.speiKey.toLowerCase().includes(q);
        const matchesSrc = t.sourceAccount.toLowerCase().includes(q);
        const matchesDst = t.destinationAccount.toLowerCase().includes(q);
        const matchesUser = t.userName.toLowerCase().includes(q) || t.userEmail.toLowerCase().includes(q);
        if (!matchesRef && !matchesSpei && !matchesSrc && !matchesDst && !matchesUser) {
          return false;
        }
      }

      // Filtro de usuario por texto
      if (selectedUserEmail.trim()) {
        const uQuery = selectedUserEmail.toLowerCase().trim();
        const matchesName = t.userName.toLowerCase().includes(uQuery);
        const matchesEmail = t.userEmail.toLowerCase().includes(uQuery);
        if (!matchesName && !matchesEmail) {
          return false;
        }
      }

      // Filtro de estado
      if (statusFilter !== "ALL" && t.status !== statusFilter) {
        return false;
      }

      // Cuenta Origen
      if (sourceAccountFilter.trim() && !t.sourceAccount.includes(sourceAccountFilter.trim())) {
        return false;
      }

      // Cuenta Destino
      if (destinationAccountFilter.trim() && !t.destinationAccount.includes(destinationAccountFilter.trim())) {
        return false;
      }

      // Rango de Montos
      if (minAmount && t.amount < parseFloat(minAmount)) return false;
      if (maxAmount && t.amount > parseFloat(maxAmount)) return false;

      // Rango de Fechas
      if (startDate) {
        const start = new Date(startDate).getTime();
        const tDate = new Date(t.createdAt).getTime();
        if (tDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).getTime() + 86400000;
        const tDate = new Date(t.createdAt).getTime();
        if (tDate > end) return false;
      }

      return true;
    });
  }, [
    transfers,
    search,
    selectedUserEmail,
    statusFilter,
    sourceAccountFilter,
    destinationAccountFilter,
    minAmount,
    maxAmount,
    startDate,
    endDate,
  ]);

  // Ordenamiento
  const sortedTransfers = useMemo(() => {
    return [...filteredTransfers].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTransfers, sortField, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(sortedTransfers.length / pageSize) || 1;
  const paginatedTransfers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTransfers.slice(start, start + pageSize);
  }, [sortedTransfers, page]);

  const resetFilters = () => {
    setSearch("");
    setSelectedUserEmail("");
    setStatusFilter("ALL");
    setSourceAccountFilter("");
    setDestinationAccountFilter("");
    setMinAmount("");
    setMaxAmount("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    toast.info("Filtros limpiados");
  };

  const handleSort = (field: "createdAt" | "amount" | "status") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dark">Consulta de Transferencias</h2>
          <p className="text-xs text-dark-6">
            Historial de transferencias entre cuentas interbancarias y usuarios de la organización.
          </p>
        </div>
      </div>

      {/* Contenedor de Filtros Avanzados */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-dark uppercase tracking-wider">Filtros de búsqueda</span>
          <button
            onClick={resetFilters}
            className="text-xs font-light text-slate-500 hover:text-dark underline transition"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Búsqueda por Texto */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">Referencia / Clave</label>
            <input
              type="text"
              placeholder="Ej. TRF-8941201 o Clave SPEI..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
            />
          </div>

          {/* Input de búsqueda de Usuario Relacionado */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">Usuario Relacionado</label>
            <input
              type="text"
              placeholder="Buscar por usuario o email..."
              value={selectedUserEmail}
              onChange={(e) => {
                setSelectedUserEmail(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
            />
          </div>

          {/* Selector de Estado */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as TransferStatus | "ALL");
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
            >
              <option value="ALL">Todos los estados</option>
              <option value="COMPLETED">Completadas</option>
              <option value="PENDING">Pendientes</option>
              <option value="PROCESSING">En proceso</option>
              <option value="REJECTED">Rechazadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          {/* CLABE Origen */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">CLABE Origen</label>
            <input
              type="text"
              placeholder="Filtrar por origen..."
              value={sourceAccountFilter}
              onChange={(e) => {
                setSourceAccountFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
            />
          </div>

          {/* CLABE Destino */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">CLABE Destino</label>
            <input
              type="text"
              placeholder="Filtrar por destino..."
              value={destinationAccountFilter}
              onChange={(e) => {
                setDestinationAccountFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
            />
          </div>

          {/* Rango de Montos Mínimo / Máximo */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-dark-6">Monto Mín</label>
              <input
                type="number"
                placeholder="$0.00"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 py-2 text-xs text-dark outline-none focus:border-dark transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-dark-6">Monto Máx</label>
              <input
                type="number"
                placeholder="$999,999"
                value={maxAmount}
                onChange={(e) => {
                  setMaxAmount(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 py-2 text-xs text-dark outline-none focus:border-dark transition"
              />
            </div>
          </div>

          {/* Rango de Fechas */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">Fecha Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">Fecha Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Transferencias */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/60 border-b border-gray-100 text-[11px] font-medium uppercase tracking-wider text-dark-6">
              <tr>
                <th className="px-4 py-3.5">Referencia / Clave SPEI</th>
                <th className="px-4 py-3.5">Usuario</th>
                <th className="px-4 py-3.5">Origen</th>
                <th className="px-4 py-3.5">Destino</th>
                <th
                  className="px-4 py-3.5 cursor-pointer hover:text-dark transition"
                  onClick={() => handleSort("amount")}
                >
                  Monto {sortField === "amount" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th
                  className="px-4 py-3.5 cursor-pointer hover:text-dark transition"
                  onClick={() => handleSort("status")}
                >
                  Estado {sortField === "status" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th
                  className="px-4 py-3.5 cursor-pointer hover:text-dark transition"
                  onClick={() => handleSort("createdAt")}
                >
                  Creación {sortField === "createdAt" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-normal text-slate-700">
              {paginatedTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-dark-6">
                    No se encontraron transferencias con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedTransfers.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3.5 font-medium text-dark">
                      <div>{item.reference}</div>
                      <div className="text-[10px] font-light text-dark-6 font-mono truncate max-w-[120px]">
                        {item.speiKey}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-dark">{item.userName}</div>
                      <div className="text-[10px] font-light text-dark-6">{item.userEmail}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-dark">{item.sourceAccount}</div>
                      <div className="text-[10px] font-light text-dark-6">{item.sourceBank}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-dark">{item.destinationAccount}</div>
                      <div className="text-[10px] font-light text-dark-6">{item.destinationBank}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-dark whitespace-nowrap">
                      {formatMXN(item.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-dark-6">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTransfer(item)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-1 text-xs font-light text-dark transition hover:bg-gray-50 active:scale-95"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 text-xs">
          <span className="text-dark-6 font-light">
            Mostrando {paginatedTransfers.length} de {filteredTransfers.length} resultados
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-dark disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Anterior
            </button>
            <span className="text-dark font-medium px-2">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-dark disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalle Completo de Transferencia */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-dark-6">
                  Comprobante de Transferencia SPEI
                </span>
                <h3 className="text-base font-semibold text-dark">{selectedTransfer.reference}</h3>
              </div>
              <button
                onClick={() => setSelectedTransfer(null)}
                className="rounded-lg p-1 text-dark-6 hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Status Header */}
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 border border-gray-100">
              <div>
                <span className="block text-[11px] font-medium text-dark-6">Estado de Operación</span>
                <StatusBadge status={selectedTransfer.status} />
              </div>
              <div className="text-right">
                <span className="block text-[11px] font-medium text-dark-6">Monto Total</span>
                <span className="text-base font-bold text-dark">{formatMXN(selectedTransfer.amount)}</span>
              </div>
            </div>

            {/* Clave SPEI */}
            <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
              <span className="block text-[10px] font-medium text-dark-6 uppercase">Clave de Rastreo SPEI</span>
              <span className="font-mono text-xs font-semibold text-dark break-all">
                {selectedTransfer.speiKey}
              </span>
            </div>

            {/* Datos Ordenante y Beneficiario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 p-3.5 space-y-1">
                <span className="block text-[10px] font-medium text-dark-6 uppercase">Ordenante (Origen)</span>
                <p className="text-xs font-semibold text-dark">{selectedTransfer.userName}</p>
                <p className="text-[11px] font-light text-dark-6">{selectedTransfer.userEmail}</p>
                <p className="text-[11px] font-mono text-dark pt-1">{selectedTransfer.sourceAccount}</p>
                <p className="text-[10px] font-light text-dark-6">{selectedTransfer.sourceBank}</p>
              </div>

              <div className="rounded-xl border border-gray-100 p-3.5 space-y-1">
                <span className="block text-[10px] font-medium text-dark-6 uppercase">Beneficiario (Destino)</span>
                <p className="text-xs font-semibold text-dark">Cuenta Destino</p>
                <p className="text-[11px] font-mono text-dark pt-1">{selectedTransfer.destinationAccount}</p>
                <p className="text-[10px] font-light text-dark-6">{selectedTransfer.destinationBank}</p>
              </div>
            </div>

            {/* Concepto y Desglose Financiero */}
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-dark-6">Concepto de pago:</span>
                <span className="font-medium text-dark">{selectedTransfer.concept}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-6">Comisión SPEI:</span>
                <span className="font-medium text-dark">{formatMXN(selectedTransfer.fee)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-6">IVA Comisión:</span>
                <span className="font-medium text-dark">{formatMXN(selectedTransfer.vat)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-6">Fecha de creación:</span>
                <span className="font-medium text-dark">{formatDate(selectedTransfer.createdAt)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-6">Fecha de procesamiento:</span>
                <span className="font-medium text-dark">{formatDate(selectedTransfer.processedAt)}</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedTransfer(null)}
                className="w-full sm:w-auto rounded-xl bg-zelify-midnight px-5 py-2.5 text-xs font-light text-white transition hover:bg-black active:scale-95"
              >
                Cerrar comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
