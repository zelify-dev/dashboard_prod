"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SimpleSelect } from "@/components/FormElements/simple-select";
import { useUiTranslations } from "@/hooks/use-ui-translations";

// Tipos de datos
type LogType = "API request" | "Webhook" | "Link event";
type Environment = "Production" | "Sandbox";
type ResponseCode = "200" | "400" | "401" | "404" | "500" | "200 OK" | "401 Unauthorized" | "404 Not Found" | "500 Server Error";

interface Log {
  id: string;
  type: LogType;
  description: string;
  institution: string;
  environment: Environment;
  timestamp: string;
  responseCode: ResponseCode;
  errorCodes?: string;
  response: string;
}

// Datos de ejemplo (en producción vendrían de una API)
const MOCK_LOGS: Log[] = [
  {
    id: "1",
    type: "API request",
    description: "Transaction completed successfully",
    institution: "Bank of America",
    environment: "Production",
    timestamp: "2024-10-15 14:30:25",
    responseCode: "200 OK",
    response: '{"status": "success", "transaction_id": "txn_123456789", "amount": 1500.00}',
  },
  {
    id: "2",
    type: "API request",
    description: "Authentication error - insufficient credentials",
    institution: "Chase Bank",
    environment: "Sandbox",
    timestamp: "2024-10-15 14:28:12",
    responseCode: "401 Unauthorized",
    errorCodes: "INSUFFICIENT_CREDENTIALS",
    response: '{"error": "Invalid credentials", "code": "INSUFFICIENT_CREDENTIALS", "message": "The provided credentials are not valid"}',
  },
  {
    id: "3",
    type: "Webhook",
    description: "Account update notification received",
    institution: "Wells Fargo",
    environment: "Production",
    timestamp: "2024-10-15 14:25:45",
    responseCode: "200",
    response: '{"event": "ACCOUNT_UPDATE", "account_id": "acc_987654321", "timestamp": "2024-10-15T14:25:45Z"}',
  },
  {
    id: "4",
    type: "Link event",
    description: "User successfully linked bank account",
    institution: "Citibank",
    environment: "Production",
    timestamp: "2024-10-15 14:20:33",
    responseCode: "200 OK",
    response: '{"status": "success", "link_id": "link_abc123", "institution": "Citibank", "accounts": 2}',
  },
  {
    id: "5",
    type: "API request",
    description: "Endpoint not found",
    institution: "Bank of America",
    environment: "Sandbox",
    timestamp: "2024-10-15 14:15:08",
    responseCode: "404 Not Found",
    errorCodes: "ENDPOINT_NOT_FOUND",
    response: '{"error": "Endpoint not found", "code": "ENDPOINT_NOT_FOUND", "path": "/api/v1/invalid-endpoint"}',
  },
  {
    id: "6",
    type: "Webhook",
    description: "Transaction failed - insufficient funds",
    institution: "Chase Bank",
    environment: "Production",
    timestamp: "2024-10-15 14:10:22",
    responseCode: "500 Server Error",
    errorCodes: "INSUFFICIENT_FUNDS",
    response: '{"error": "Transaction failed", "code": "INSUFFICIENT_FUNDS", "account_balance": 45.50, "requested_amount": 200.00}',
  },
  {
    id: "7",
    type: "Link event",
    description: "User exited link flow",
    institution: "Wells Fargo",
    environment: "Sandbox",
    timestamp: "2024-10-15 14:05:17",
    responseCode: "200 OK",
    response: '{"event": "EXIT", "link_session_id": "link_sess_xyz789", "exit_reason": "user_cancelled"}',
  },
  {
    id: "8",
    type: "API request",
    description: "Balance inquiry successful",
    institution: "Citibank",
    environment: "Production",
    timestamp: "2024-10-15 14:00:55",
    responseCode: "200 OK",
    response: '{"status": "success", "account_id": "acc_456789", "balance": {"available": 5000.00, "current": 5000.00}}',
  },
  {
    id: "9",
    type: "Webhook",
    description: "Identity verification completed",
    institution: "Bank of America",
    environment: "Production",
    timestamp: "2024-10-15 13:55:40",
    responseCode: "200",
    response: '{"event": "IDENTITY_VERIFIED", "user_id": "user_123", "verification_status": "verified", "timestamp": "2024-10-15T13:55:40Z"}',
  },
  {
    id: "10",
    type: "Link event",
    description: "Error during account linking - access not granted",
    institution: "Chase Bank",
    environment: "Production",
    timestamp: "2024-10-15 13:50:15",
    responseCode: "401 Unauthorized",
    errorCodes: "ACCESS_NOT_GRANTED",
    response: '{"error": "Access not granted", "code": "ACCESS_NOT_GRANTED", "message": "User did not grant necessary permissions"}',
  },
  {
    id: "11",
    type: "API request",
    description: "Transaction history retrieved",
    institution: "Wells Fargo",
    environment: "Sandbox",
    timestamp: "2024-10-15 13:45:30",
    responseCode: "200 OK",
    response: '{"status": "success", "transactions": [{"id": "txn_001", "amount": -50.00}, {"id": "txn_002", "amount": 100.00}], "count": 2}',
  },
  {
    id: "12",
    type: "Webhook",
    description: "Server error processing webhook",
    institution: "Citibank",
    environment: "Production",
    timestamp: "2024-10-15 13:40:18",
    responseCode: "500 Server Error",
    errorCodes: "INTERNAL_SERVER_ERROR",
    response: '{"error": "Internal server error", "code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred"}',
  },
  {
    id: "13",
    type: "API request",
    description: "Account information retrieved successfully",
    institution: "Bank of America",
    environment: "Production",
    timestamp: "2024-10-15 13:35:42",
    responseCode: "200 OK",
    response: '{"status": "success", "account": {"id": "acc_789", "name": "Checking Account", "type": "depository", "subtype": "checking"}}',
  },
  {
    id: "14",
    type: "Link event",
    description: "Handoff event - user redirected to institution",
    institution: "Chase Bank",
    environment: "Sandbox",
    timestamp: "2024-10-15 13:30:05",
    responseCode: "200 OK",
    response: '{"event": "HANDOFF", "link_session_id": "link_sess_handoff123", "institution_id": "ins_109508"}',
  },
  {
    id: "15",
    type: "API request",
    description: "Invalid request parameters",
    institution: "Wells Fargo",
    environment: "Production",
    timestamp: "2024-10-15 13:25:50",
    responseCode: "400",
    errorCodes: "INVALID_REQUEST",
    response: '{"error": "Invalid request parameters", "code": "INVALID_REQUEST", "details": "Missing required field: account_id"}',
  },
];

const LOG_TYPES: LogType[] = ["API request", "Webhook", "Link event"];
const ENVIRONMENTS: Environment[] = ["Production", "Sandbox"];
const RESPONSE_CODES: ResponseCode[] = ["200", "400", "401", "404", "500"];

export function LogsPageContent() {
  const t = useUiTranslations().logsPage;

  const logTypeLabel = (type: LogType) => {
    switch (type) {
      case "API request":
        return t.values.logTypes.apiRequest;
      case "Webhook":
        return t.values.logTypes.webhook;
      case "Link event":
        return t.values.logTypes.linkEvent;
      default:
        return type;
    }
  };

  const environmentLabel = (env: Environment) => {
    switch (env) {
      case "Production":
        return t.values.environments.production;
      case "Sandbox":
        return t.values.environments.sandbox;
      default:
        return env;
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    institution: "",
    environment: "",
    responseCode: "",
    errorCodes: "",
    date: "",
    timezone: "-05",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredLogs = MOCK_LOGS.filter((log) => {
    // Filtro por búsqueda
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        log.description.toLowerCase().includes(searchLower) ||
        log.institution.toLowerCase().includes(searchLower) ||
        log.type.toLowerCase().includes(searchLower) ||
        log.responseCode.toLowerCase().includes(searchLower) ||
        log.errorCodes?.toLowerCase().includes(searchLower) ||
        log.response.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Filtro por tipo
    if (filters.type && log.type !== filters.type) return false;

    // Filtro por institución
    if (filters.institution && log.institution !== filters.institution) return false;

    // Filtro por ambiente
    if (filters.environment && log.environment !== filters.environment) return false;

    // Filtro por código de respuesta
    if (filters.responseCode && !log.responseCode.includes(filters.responseCode)) return false;

    // Filtro por códigos de error
    if (filters.errorCodes && !log.errorCodes?.toLowerCase().includes(filters.errorCodes.toLowerCase())) return false;

    // Filtro por fecha
    if (filters.date) {
      const logDate = log.timestamp.split(" ")[0]; // Extraer solo la fecha
      if (logDate !== filters.date) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setFilters({
      type: "",
      institution: "",
      environment: "",
      responseCode: "",
      errorCodes: "",
      date: "",
      timezone: "-05",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const getResponseCodeColor = (code: string) => {
    if (code.startsWith("2")) return "text-green-600 dark:text-green-400";
    if (code.startsWith("4")) return "text-yellow-600 dark:text-yellow-400";
    if (code.startsWith("5")) return "text-red-600 dark:text-red-400";
    return "text-dark-6 dark:text-dark-6";
  };

  const formatTimestampWithTimezone = (timestamp: string, timezone: string) => {
    try {
      // Parsear el timestamp (formato: "2024-10-15 14:30:25")
      const [datePart, timePart] = timestamp.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes, seconds] = timePart.split(":").map(Number);

      // Crear fecha en UTC (asumiendo que el timestamp original está en UTC)
      const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

      // Obtener el offset del timezone (ej: "-05" = -5 horas)
      const offsetHours = parseInt(timezone.replace("+", ""), 10);

      // Aplicar el offset
      const adjustedDate = new Date(date.getTime() + offsetHours * 60 * 60 * 1000);

      // Formatear la fecha ajustada
      const adjustedYear = adjustedDate.getUTCFullYear();
      const adjustedMonth = String(adjustedDate.getUTCMonth() + 1).padStart(2, "0");
      const adjustedDay = String(adjustedDate.getUTCDate()).padStart(2, "0");
      const adjustedHours = String(adjustedDate.getUTCHours()).padStart(2, "0");
      const adjustedMinutes = String(adjustedDate.getUTCMinutes()).padStart(2, "0");
      const adjustedSeconds = String(adjustedDate.getUTCSeconds()).padStart(2, "0");

      return `${adjustedYear}-${adjustedMonth}-${adjustedDay} ${adjustedHours}:${adjustedMinutes}:${adjustedSeconds} UTC${timezone}`;
    } catch (error) {
      // Si hay error, devolver el timestamp original
      return timestamp;
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <div className="absolute left-0 top-0 z-10 flex h-full items-center rounded-l-lg border border-r-0 border-stroke bg-gray-1 px-2 text-xs font-semibold text-dark dark:border-dark-3 dark:bg-dark-3 dark:text-white sm:px-3 sm:text-sm">
            {t.search.label}
          </div>
          <input
            type="text"
            placeholder={t.search.placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-stroke bg-white py-2 pl-[100px] pr-10 text-xs text-dark shadow-sm outline-none transition-all placeholder:text-dark-6 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-3 dark:bg-dark dark:text-white dark:placeholder:text-dark-6 dark:focus:border-primary sm:pl-[120px] sm:text-sm"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-dark-6 transition-colors hover:bg-gray-100 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white sm:h-8 sm:w-8"
            aria-label={t.search.ariaLabel}
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Filters - Más compactos y responsive */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <SimpleSelect
          options={[
            { value: "", label: t.filters.type },
            ...LOG_TYPES.map((type) => ({ value: type, label: logTypeLabel(type) })),
          ]}
            value={filters.type}
          onChange={(value) => { setFilters({ ...filters, type: value }); setCurrentPage(1); }}
          className="min-w-[100px] sm:min-w-[120px]"
        />

        <SimpleSelect
          options={[
            { value: "", label: t.filters.institution },
            { value: "Bank of America", label: "Bank of America" },
            { value: "Chase Bank", label: "Chase Bank" },
            { value: "Wells Fargo", label: "Wells Fargo" },
            { value: "Citibank", label: "Citibank" },
          ]}
            value={filters.institution}
          onChange={(value) => { setFilters({ ...filters, institution: value }); setCurrentPage(1); }}
          className="min-w-[120px] sm:min-w-[140px]"
        />

        <SimpleSelect
          options={[
            { value: "", label: t.filters.environment },
            ...ENVIRONMENTS.map((env) => ({ value: env, label: environmentLabel(env) })),
          ]}
            value={filters.environment}
          onChange={(value) => { setFilters({ ...filters, environment: value }); setCurrentPage(1); }}
          className="min-w-[110px] sm:min-w-[130px]"
        />

        <input
          type="text"
          placeholder={t.filters.errorCodesPlaceholder}
          value={filters.errorCodes}
          onChange={(e) => { setFilters({ ...filters, errorCodes: e.target.value }); setCurrentPage(1); }}
          className={`rounded-lg border border-stroke bg-white px-2 py-1.5 text-xs font-medium text-dark shadow-sm outline-none transition-all placeholder:text-dark-6 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-3 dark:bg-dark dark:text-white dark:placeholder:text-dark-6 dark:hover:border-primary/50 ${filters.errorCodes ? "border-primary bg-primary/5 dark:bg-primary/10" : ""} sm:px-3 sm:py-2 sm:text-sm`}
        />

        <input
          type="date"
          value={filters.date}
          onChange={(e) => { setFilters({ ...filters, date: e.target.value }); setCurrentPage(1); }}
          className={`rounded-lg border border-stroke bg-white px-2 py-1.5 text-xs font-medium text-dark shadow-sm outline-none transition-all hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-3 dark:bg-dark dark:text-white dark:hover:border-primary/50 ${filters.date ? "border-primary bg-primary/5 dark:bg-primary/10" : ""} sm:px-3 sm:py-2 sm:text-sm`}
        />

        <button
          onClick={handleResetFilters}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke bg-white text-dark-6 shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-dark-3 dark:bg-dark dark:text-dark-6 dark:hover:bg-primary/10 dark:hover:text-primary"
          aria-label={t.filters.resetAriaLabel}
          title={t.filters.resetTitle}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>

      {/* Table - Mucho más compacta y responsive */}
      <div className="overflow-x-auto max-w-full">
        <div className="overflow-hidden rounded-lg border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <Table className="min-w-[280px] text-xs sm:text-sm">
            <TableHeader>
              <TableRow className="sticky top-0 z-10 bg-gray-1/90 backdrop-blur dark:bg-dark-3/90 [&>th]:py-2 [&>th]:text-xs [&>th]:font-semibold [&>th]:text-dark [&>th]:dark:text-white">
                <TableHead className="w-20 px-2">{t.table.type}</TableHead>
                <TableHead className="min-w-[120px] px-2">{t.table.description}</TableHead>
                <TableHead className="hidden sm:table-cell w-24 px-2">{t.table.institution}</TableHead>
                <TableHead className="hidden md:table-cell w-20 px-2">{t.table.env}</TableHead>
                <TableHead className="w-28 px-2">{t.table.timestamp}</TableHead>
                <TableHead className="w-20 px-2">{t.table.response}</TableHead>
                <TableHead className="min-w-[100px] px-2">{t.table.payload}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <div className="mx-auto max-w-md">
                      <p className="mb-1 text-xs font-semibold text-dark dark:text-white sm:text-sm">
                        {t.table.emptyTitle}
                      </p>
                      <p className="text-xs text-dark-6 dark:text-dark-6">
                        {t.table.emptySubtitle}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id} className="text-xs text-dark dark:text-white sm:text-sm">
                    <TableCell className="px-2 py-1.5 font-medium">
                      <span className="truncate">{logTypeLabel(log.type)}</span>
                    </TableCell>
                    <TableCell className="px-2 py-1.5 max-w-[120px] truncate" title={log.description}>
                      {log.description}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-2 py-1.5 truncate" title={log.institution}>
                      {log.institution}
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-2 py-1.5">
                      {log.environment === "Production" ? t.table.prodShort : t.table.sandboxShort}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 whitespace-nowrap">
                      {formatTimestampWithTimezone(log.timestamp, filters.timezone)}
                    </TableCell>
                    <TableCell className="px-2 py-1.5">
                      <div className="flex flex-col gap-0.5">
                        <span className={getResponseCodeColor(log.responseCode)}>
                          {log.responseCode.split(' ')[0]}
                        </span>
                        {log.errorCodes && (
                          <span className="text-[10px] text-red-600 dark:text-red-400 truncate" title={log.errorCodes}>
                            {log.errorCodes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1.5 max-w-[100px] sm:max-w-[140px] truncate font-mono text-[10px] sm:text-xs" title={log.response}>
                      {log.response}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination - Más compacta */}
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="flex h-7 w-7 items-center justify-center rounded border border-stroke bg-white text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:bg-dark dark:text-dark-6 dark:hover:bg-dark-3"
            aria-label={t.pagination.firstPage}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-7 w-7 items-center justify-center rounded border border-stroke bg-white text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:bg-dark dark:text-dark-6 dark:hover:bg-dark-3"
            aria-label={t.pagination.previousPage}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <span className="px-2 text-xs text-dark dark:text-white sm:text-sm">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-7 w-7 items-center justify-center rounded border border-stroke bg-white text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:bg-dark dark:text-dark-6 dark:hover:bg-dark-3"
            aria-label={t.pagination.nextPage}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="flex h-7 w-7 items-center justify-center rounded border border-stroke bg-white text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:bg-dark dark:text-dark-6 dark:hover:bg-dark-3"
            aria-label={t.pagination.lastPage}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
