"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  DisbursementBeneficiary,
  DisbursementItem,
  DisbursementStatus,
  formatMXN,
  INITIAL_DISBURSEMENTS_MOCK,
  MEXICAN_BANKS,
  SOURCE_ACCOUNTS_MOCK,
  validateClabeMexico,
} from "@/lib/payments-mock-data";
import { getStoredOrganization } from "@/lib/auth-api";
import { listDashboardMembers, listRegisteredUsers, OrgUserListItem } from "@/lib/organization-users-api";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: DisbursementStatus }) {
  const config = {
    COMPLETED: {
      label: "Completada",
      style: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
    PARTIALLY_COMPLETED: {
      label: "Completada parcialmente",
      style: "bg-teal-50 text-teal-700 border-teal-200/80",
    },
    PENDING_PROCESSING: {
      label: "Pendiente de procesamiento",
      style: "bg-amber-50 text-amber-700 border-amber-200/80",
    },
    PROCESSING: {
      label: "En proceso",
      style: "bg-sky-50 text-sky-700 border-sky-200/80",
    },
    DRAFT: {
      label: "Borrador",
      style: "bg-slate-50 text-slate-700 border-slate-200",
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

export function DisbursementManagement() {
  const org = getStoredOrganization();
  const [users, setUsers] = useState<OrgUserListItem[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementItem[]>(INITIAL_DISBURSEMENTS_MOCK);

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisbursementStatus | "ALL">("ALL");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [sourceAccountFilter, setSourceAccountFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Paginación y Ordenamiento
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortField, setSortField] = useState<"createdAt" | "totalAmount" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal de Crear Dispersión
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [dispName, setDispName] = useState("");
  const [selectedSourceAccount, setSelectedSourceAccount] = useState(SOURCE_ACCOUNTS_MOCK[0].id);

  // Formulario temporal de Beneficiario
  const [beneficiaries, setBeneficiaries] = useState<DisbursementBeneficiary[]>([]);
  const [bName, setBName] = useState("");
  const [bClabe, setBClabe] = useState("");
  const [bBank, setBBank] = useState(MEXICAN_BANKS[0]);
  const [bAmount, setBAmount] = useState("");
  const [bConcept, setBConcept] = useState("");
  const [bError, setBError] = useState<string | null>(null);

  // Modal de Detalle
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementItem | null>(null);

  // Cargar usuarios reales de Auth/Identity para filtros y autor de la dispersión
  useEffect(() => {
    if (!org?.id) return;
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
      });
  }, [org?.id]);

  // Vincular automáticamente los usuarios reales cargados con el historial de dispersiones
  useEffect(() => {
    if (!users || users.length === 0) return;
    setDisbursements((prevDisbursements) =>
      prevDisbursements.map((d, idx) => {
        const user = users[idx % users.length];
        return {
          ...d,
          createdByName: user.full_name || user.email,
          createdByEmail: user.email,
        };
      })
    );
  }, [users]);

  // Cálculos de Métricas KPIs
  const metrics = useMemo(() => {
    let totalDispersed = 0;
    let totalCount = disbursements.length;
    let totalBeneficiaries = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    disbursements.forEach((d) => {
      totalDispersed += d.totalAmount;
      totalBeneficiaries += d.beneficiariesCount;
      if (d.status === "COMPLETED") completedCount++;
      if (d.status === "PENDING_PROCESSING" || d.status === "PROCESSING" || d.status === "DRAFT") pendingCount++;
      if (d.status === "REJECTED" || d.status === "CANCELLED") rejectedCount++;
    });

    const averageAmount = totalCount > 0 ? totalDispersed / totalCount : 0;
    const currentPeriodAmount = totalDispersed * 0.45; // Simulación del periodo actual

    return {
      totalDispersed,
      totalCount,
      totalBeneficiaries,
      completedCount,
      pendingCount,
      rejectedCount,
      averageAmount,
      currentPeriodAmount,
    };
  }, [disbursements]);

  // Filtrado de Dispersiones
  const filteredDisbursements = useMemo(() => {
    return disbursements.filter((d) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesId = d.id.toLowerCase().includes(q);
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesSource = d.sourceAccount.toLowerCase().includes(q);
        const matchesUser = d.createdByName.toLowerCase().includes(q) || d.createdByEmail.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesSource && !matchesUser) return false;
      }

      if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
      if (selectedUserEmail.trim()) {
        const uQuery = selectedUserEmail.toLowerCase().trim();
        const matchesName = d.createdByName.toLowerCase().includes(uQuery);
        const matchesEmail = d.createdByEmail.toLowerCase().includes(uQuery);
        if (!matchesName && !matchesEmail) return false;
      }
      if (sourceAccountFilter.trim() && !d.sourceAccount.includes(sourceAccountFilter.trim())) return false;
      if (minAmount && d.totalAmount < parseFloat(minAmount)) return false;
      if (maxAmount && d.totalAmount > parseFloat(maxAmount)) return false;

      if (startDate) {
        const start = new Date(startDate).getTime();
        const tDate = new Date(d.createdAt).getTime();
        if (tDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).getTime() + 86400000;
        const tDate = new Date(d.createdAt).getTime();
        if (tDate > end) return false;
      }

      return true;
    });
  }, [
    disbursements,
    search,
    statusFilter,
    selectedUserEmail,
    sourceAccountFilter,
    minAmount,
    maxAmount,
    startDate,
    endDate,
  ]);

  // Ordenamiento
  const sortedDisbursements = useMemo(() => {
    return [...filteredDisbursements].sort((a, b) => {
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
  }, [filteredDisbursements, sortField, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(sortedDisbursements.length / pageSize) || 1;
  const paginatedDisbursements = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedDisbursements.slice(start, start + pageSize);
  }, [sortedDisbursements, page]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setSelectedUserEmail("");
    setSourceAccountFilter("");
    setMinAmount("");
    setMaxAmount("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    toast.info("Filtros limpiados");
  };

  const handleSort = (field: "createdAt" | "totalAmount" | "status") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Agregar beneficiario a la lista del modal
  const handleAddBeneficiary = () => {
    setBError(null);
    if (!bName.trim()) {
      setBError("Ingresa el nombre completo del beneficiario.");
      return;
    }
    if (!validateClabeMexico(bClabe)) {
      setBError("La CLABE debe contener exactamente 18 dígitos numéricos válidos.");
      return;
    }
    const numAmount = parseFloat(bAmount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setBError("El monto debe ser mayor a $0.00 MXN.");
      return;
    }
    if (!bConcept.trim()) {
      setBError("Ingresa un concepto o referencia de pago.");
      return;
    }

    const newB: DisbursementBeneficiary = {
      id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: bName.trim(),
      clabe: bClabe.trim(),
      bank: bBank,
      amount: numAmount,
      concept: bConcept.trim(),
    };

    setBeneficiaries((prev) => [...prev, newB]);
    setBName("");
    setBClabe("");
    setBAmount("");
    setBConcept("");
    toast.success("Beneficiario agregado al lote");
  };

  const handleRemoveBeneficiary = (id: string) => {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  };

  const totalDispAmount = useMemo(() => {
    return beneficiaries.reduce((acc, b) => acc + b.amount, 0);
  }, [beneficiaries]);

  // Confirmar y generar la dispersión
  const handleConfirmDisbursement = () => {
    if (beneficiaries.length === 0) {
      toast.error("Agrega al menos un beneficiario para generar la dispersión.");
      return;
    }

    const acc = SOURCE_ACCOUNTS_MOCK.find((a) => a.id === selectedSourceAccount) || SOURCE_ACCOUNTS_MOCK[0];
    const newId = `DISP-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newDisbursement: DisbursementItem = {
      id: newId,
      name: dispName.trim() || `Dispersión de Pago ${newId}`,
      sourceAccount: acc.clabe,
      sourceBank: acc.bank,
      beneficiariesCount: beneficiaries.length,
      totalAmount: totalDispAmount,
      currency: "MXN",
      status: "PENDING_PROCESSING",
      createdAt: new Date().toISOString(),
      processedAt: null,
      createdByName: users[0]?.full_name || "Juan Pérez",
      createdByEmail: users[0]?.email || "admin@pegala.com",
      beneficiaries: [...beneficiaries],
    };

    setDisbursements((prev) => [newDisbursement, ...prev]);
    setIsCreateOpen(false);
    setCreateStep(1);
    setDispName("");
    setBeneficiaries([]);
    toast.success(`Dispersión ${newId} generada exitosamente en estado pendiente de procesamiento.`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dark">Panel General de Dispersión de Pagos</h2>
          <p className="text-xs text-dark-6">
            Administra, genera y consulta dispersiones masivas hacia cuentas bancarias mexicanas.
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreateOpen(true);
            setCreateStep(1);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zelify-midnight px-4 py-2.5 text-xs font-light text-white transition hover:bg-black active:scale-95 shadow-sm"
        >
          <span>+ Crear nueva dispersión</span>
        </button>
      </div>

      {/* Tarjetas de Indicadores KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-dark-6 uppercase tracking-wider">Monto total dispersado</span>
          <p className="text-lg font-bold text-dark">{formatMXN(metrics.totalDispersed)}</p>
          <p className="text-[10px] text-emerald-600 font-normal">Actualizado en tiempo real</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-dark-6 uppercase tracking-wider">Total Dispersiones</span>
          <p className="text-lg font-bold text-dark">{metrics.totalCount} operaciones</p>
          <p className="text-[10px] text-dark-6 font-normal">
            {metrics.completedCount} completadas · {metrics.pendingCount} pendientes
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-dark-6 uppercase tracking-wider">Beneficiarios Alcanzados</span>
          <p className="text-lg font-bold text-dark">{metrics.totalBeneficiaries} cuentas</p>
          <p className="text-[10px] text-dark-6 font-normal">Cuentas CLABE verificadas</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-dark-6 uppercase tracking-wider">Monto Promedio por Lote</span>
          <p className="text-lg font-bold text-dark">{formatMXN(metrics.averageAmount)}</p>
          <p className="text-[10px] text-dark-6 font-normal">Promedio general</p>
        </div>
      </div>

      {/* Contenedor de Filtros */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-dark uppercase tracking-wider">Filtros de Dispersiones</span>
          <button
            onClick={resetFilters}
            className="text-xs font-light text-slate-500 hover:text-dark underline transition"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">Identificador / Nombre</label>
            <input
              type="text"
              placeholder="Buscar por ID o descripción..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as DisbursementStatus | "ALL");
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
            >
              <option value="ALL">Todos los estados</option>
              <option value="COMPLETED">Completada</option>
              <option value="PENDING_PROCESSING">Pendiente de procesamiento</option>
              <option value="PROCESSING">En proceso</option>
              <option value="PARTIALLY_COMPLETED">Completada parcialmente</option>
              <option value="DRAFT">Borrador</option>
              <option value="REJECTED">Rechazada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">Usuario Creador</label>
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

          <div>
            <label className="mb-1 block text-[11px] font-medium text-dark-6">Cuenta o CLABE Origen</label>
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
                placeholder="$9,999,999"
                value={maxAmount}
                onChange={(e) => {
                  setMaxAmount(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 py-2 text-xs text-dark outline-none focus:border-dark transition"
              />
            </div>
          </div>

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

      {/* Tabla del Historial de Dispersiones */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/60 border-b border-gray-100 text-[11px] font-medium uppercase tracking-wider text-dark-6">
              <tr>
                <th className="px-4 py-3.5">ID / Nombre Dispersión</th>
                <th className="px-4 py-3.5">Cuenta CLABE Origen</th>
                <th className="px-4 py-3.5 text-center">Beneficiarios</th>
                <th
                  className="px-4 py-3.5 cursor-pointer hover:text-dark transition"
                  onClick={() => handleSort("totalAmount")}
                >
                  Monto Total {sortField === "totalAmount" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
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
                <th className="px-4 py-3.5">Creado Por</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-normal text-slate-700">
              {paginatedDisbursements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-dark-6">
                    No hay dispersiones registradas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                paginatedDisbursements.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3.5 font-medium text-dark">
                      <div>{item.name}</div>
                      <div className="text-[10px] font-mono text-dark-6">{item.id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-dark">{item.sourceAccount}</div>
                      <div className="text-[10px] text-dark-6">{item.sourceBank}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium text-dark">
                      {item.beneficiariesCount}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-dark whitespace-nowrap">
                      {formatMXN(item.totalAmount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-dark-6">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-dark">{item.createdByName}</div>
                      <div className="text-[10px] text-dark-6">{item.createdByEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDisbursement(item)}
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
            Mostrando {paginatedDisbursements.length} de {filteredDisbursements.length} dispersiones
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

      {/* Modal Multipaso de Crear Nueva Dispersión */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-dark-6">
                  Paso {createStep} de 3
                </span>
                <h3 className="text-base font-semibold text-dark">Nueva Dispersión de Pagos</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-dark-6 hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Paso 1: Configuración de Origen */}
            {createStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-dark">
                    Nombre o Descripción de la Dispersión
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Dispersión Nómina Quincena 15 Agosto..."
                    value={dispName}
                    onChange={(e) => setDispName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-xs text-dark outline-none focus:border-dark transition"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-dark">
                    Cuenta Origen (México CLABE)
                  </label>
                  <select
                    value={selectedSourceAccount}
                    onChange={(e) => setSelectedSourceAccount(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-xs text-dark outline-none focus:border-dark transition"
                  >
                    {SOURCE_ACCOUNTS_MOCK.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.label} (Saldo Disponible: {formatMXN(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 text-right">
                  <button
                    onClick={() => {
                      if (!dispName.trim()) {
                        toast.error("Ingresa un nombre para la dispersión.");
                        return;
                      }
                      setCreateStep(2);
                    }}
                    className="rounded-xl bg-zelify-midnight px-5 py-2.5 text-xs font-light text-white transition hover:bg-black active:scale-95"
                  >
                    Siguiente: Capturar Beneficiarios →
                  </button>
                </div>
              </div>
            )}

            {/* Paso 2: Captura de Beneficiarios */}
            {createStep === 2 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
                  <h4 className="text-xs font-medium text-dark uppercase tracking-wider">
                    Agregar Beneficiario
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-dark-6">Nombre Completo</label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Carlos López..."
                        value={bName}
                        onChange={(e) => setBName(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-dark-6">CLABE (18 dígitos)</label>
                      <input
                        type="text"
                        maxLength={18}
                        placeholder="012180015489201948"
                        value={bClabe}
                        onChange={(e) => setBClabe(e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-mono text-dark outline-none focus:border-dark transition"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-dark-6">Banco Destino</label>
                      <select
                        value={bBank}
                        onChange={(e) => setBBank(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
                      >
                        {MEXICAN_BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-dark-6">Monto ($ MXN)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={bAmount}
                        onChange={(e) => setBAmount(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] font-medium text-dark-6">Concepto / Referencia</label>
                      <input
                        type="text"
                        placeholder="Ej. Pago de nómina o factura..."
                        value={bConcept}
                        onChange={(e) => setBConcept(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-dark outline-none focus:border-dark transition"
                      />
                    </div>
                  </div>

                  {bError && <p className="text-xs text-rose-600 font-light">{bError}</p>}

                  <div className="text-right">
                    <button
                      onClick={handleAddBeneficiary}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-dark hover:bg-gray-50 active:scale-95 transition"
                    >
                      + Añadir Beneficiario
                    </button>
                  </div>
                </div>

                {/* Tabla de Beneficiarios Agregados */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-dark">
                      Beneficiarios en este lote ({beneficiaries.length})
                    </span>
                    <span className="text-xs font-bold text-dark">Total: {formatMXN(totalDispAmount)}</span>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-white overflow-hidden max-h-[180px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-medium uppercase text-dark-6">
                        <tr>
                          <th className="px-3 py-2">Nombre</th>
                          <th className="px-3 py-2">CLABE / Banco</th>
                          <th className="px-3 py-2">Monto</th>
                          <th className="px-3 py-2 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {beneficiaries.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-xs text-dark-6">
                              Aún no has agregado ningún beneficiario.
                            </td>
                          </tr>
                        ) : (
                          beneficiaries.map((b) => (
                            <tr key={b.id}>
                              <td className="px-3 py-2 font-medium text-dark">{b.name}</td>
                              <td className="px-3 py-2">
                                <div className="font-mono text-[11px]">{b.clabe}</div>
                                <div className="text-[9px] text-dark-6">{b.bank}</div>
                              </td>
                              <td className="px-3 py-2 font-semibold text-dark">{formatMXN(b.amount)}</td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() => handleRemoveBeneficiary(b.id)}
                                  className="text-rose-600 hover:text-rose-800 text-xs transition"
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setCreateStep(1)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-light text-dark hover:bg-gray-50 transition"
                  >
                    ← Volver
                  </button>

                  <button
                    onClick={() => {
                      if (beneficiaries.length === 0) {
                        toast.error("Agrega al menos un beneficiario para continuar.");
                        return;
                      }
                      setCreateStep(3);
                    }}
                    className="rounded-xl bg-zelify-midnight px-5 py-2.5 text-xs font-light text-white transition hover:bg-black active:scale-95"
                  >
                    Siguiente: Resumen y Confirmación →
                  </button>
                </div>
              </div>
            )}

            {/* Paso 3: Resumen y Confirmación */}
            {createStep === 3 && (
              <div className="space-y-5">
                <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Resumen de Dispersión
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-dark-6 block">Nombre:</span>
                      <span className="font-medium text-dark">{dispName}</span>
                    </div>
                    <div>
                      <span className="text-dark-6 block">Cuenta Origen:</span>
                      <span className="font-mono text-dark font-medium">
                        {SOURCE_ACCOUNTS_MOCK.find((a) => a.id === selectedSourceAccount)?.clabe}
                      </span>
                    </div>
                    <div>
                      <span className="text-dark-6 block">Total Beneficiarios:</span>
                      <span className="font-medium text-dark">{beneficiaries.length} beneficiarios</span>
                    </div>
                    <div>
                      <span className="text-dark-6 block">Monto Acumulado:</span>
                      <span className="font-bold text-dark text-sm">{formatMXN(totalDispAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setCreateStep(2)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-light text-dark hover:bg-gray-50 transition"
                  >
                    ← Modificar Beneficiarios
                  </button>

                  <div className="relative inline-block overflow-hidden rounded-[14px] p-[2px]">
                    <span className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0_260deg,#75fa4c_360deg)] animate-[spin_2.5s_linear_infinite]" />
                    <button
                      onClick={handleConfirmDisbursement}
                      className="relative z-10 rounded-xl bg-zelify-midnight px-6 py-2.5 text-xs font-medium text-white transition hover:bg-black active:scale-95"
                    >
                      Confirmar y Generar Dispersión
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalle de Dispersión */}
      {selectedDisbursement && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-dark-6">
                  {selectedDisbursement.id}
                </span>
                <h3 className="text-base font-semibold text-dark">{selectedDisbursement.name}</h3>
              </div>
              <button
                onClick={() => setSelectedDisbursement(null)}
                className="rounded-lg p-1 text-dark-6 hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 border border-gray-100">
              <div>
                <span className="block text-[11px] font-medium text-dark-6">Estado del Lote</span>
                <StatusBadge status={selectedDisbursement.status} />
              </div>
              <div className="text-right">
                <span className="block text-[11px] font-medium text-dark-6">Monto Total</span>
                <span className="text-base font-bold text-dark">{formatMXN(selectedDisbursement.totalAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-gray-100 p-3 space-y-1">
                <span className="text-[10px] text-dark-6 block uppercase">Cuenta Origen</span>
                <p className="font-mono font-medium text-dark">{selectedDisbursement.sourceAccount}</p>
                <p className="text-[10px] text-dark-6">{selectedDisbursement.sourceBank}</p>
              </div>

              <div className="rounded-xl border border-gray-100 p-3 space-y-1">
                <span className="text-[10px] text-dark-6 block uppercase">Creado Por</span>
                <p className="font-medium text-dark">{selectedDisbursement.createdByName}</p>
                <p className="text-[10px] text-dark-6">{selectedDisbursement.createdByEmail}</p>
              </div>
            </div>

            {/* Lista de beneficiarios */}
            <div>
              <h4 className="text-xs font-semibold text-dark mb-2">
                Beneficiarios Incluidos ({selectedDisbursement.beneficiaries.length})
              </h4>
              <div className="rounded-xl border border-gray-100 overflow-hidden max-h-[160px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-medium uppercase text-dark-6">
                    <tr>
                      <th className="px-3 py-2">Beneficiario</th>
                      <th className="px-3 py-2">CLABE</th>
                      <th className="px-3 py-2">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedDisbursement.beneficiaries.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-3 text-center text-xs text-dark-6">
                          Sin beneficiarios desglosados en el borrador.
                        </td>
                      </tr>
                    ) : (
                      selectedDisbursement.beneficiaries.map((b) => (
                        <tr key={b.id}>
                          <td className="px-3 py-2 font-medium text-dark">{b.name}</td>
                          <td className="px-3 py-2 font-mono text-[11px]">{b.clabe}</td>
                          <td className="px-3 py-2 font-semibold text-dark">{formatMXN(b.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedDisbursement(null)}
                className="w-full sm:w-auto rounded-xl bg-zelify-midnight px-5 py-2.5 text-xs font-light text-white transition hover:bg-black active:scale-95"
              >
                Cerrar detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
