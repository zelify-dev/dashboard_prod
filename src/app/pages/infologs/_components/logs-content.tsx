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
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { useOrganizationScopes } from "@/hooks/use-organization-scopes";
import { canUseOrganizationIntegrations } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

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

// En producción esto debería venir de una API. Por ahora se deja vacío para evitar logs "pegados".
const MOCK_LOGS: Log[] = [];

const LOG_TYPES: LogType[] = ["API request", "Webhook", "Link event"];
const ENVIRONMENTS: Environment[] = ["Production", "Sandbox"];
const RESPONSE_CODES: ResponseCode[] = ["200", "400", "401", "404", "500"];

export function LogsPageContent() {
  const ui = useUiTranslations();
  const t = ui.logsPage;
  const webhooksUi = ui.webhooksPage;
  const { organization, loading: orgLoading } = useOrganizationCountry();
  const scopes = useOrganizationScopes();
  const canUseLogs = canUseOrganizationIntegrations(organization, scopes);
  const logsLocked = orgLoading || !canUseLogs;

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
    <div className="min-w-0 space-y-4">
      {orgLoading && (
        <p className="text-sm text-dark-6 dark:text-dark-6">{webhooksUi.loadingAccess}</p>
      )}
      {!orgLoading && !canUseLogs && (
        <div
          role="status"
          className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-dark dark:text-white/90 dark:border-primary/40 dark:bg-primary/15"
        >
          {webhooksUi.lockedUntilOnboarding}
        </div>
      )}

      <fieldset
        disabled={logsLocked}
        className={cn(
          "m-0 min-w-0 space-y-4 border-0 p-0",
          logsLocked && "disabled:cursor-not-allowed disabled:opacity-[0.88]",
        )}
      >
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
          options={
            filters.environment
              ? ([
                  {
                    value: filters.environment === "Sandbox" ? "Production" : "Sandbox",
                    label: environmentLabel(filters.environment === "Sandbox" ? "Production" : "Sandbox"),
                  },
                ] as { value: string; label: string }[])
              : ENVIRONMENTS.map((env) => ({ value: env, label: environmentLabel(env) }))
          }
            value={filters.environment}
          onChange={(value) => { setFilters({ ...filters, environment: value }); setCurrentPage(1); }}
          placeholder={t.filters.environment}
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
                <TableHead className="hidden md:table-cell w-20 px-2">{t.table.env}</TableHead>
                <TableHead className="w-28 px-2">{t.table.timestamp}</TableHead>
                <TableHead className="w-20 px-2">{t.table.response}</TableHead>
                <TableHead className="min-w-[100px] px-2">{t.table.payload}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <div className="mx-auto max-w-md">
                      <p className="mb-1 text-xs font-semibold text-dark dark:text-white sm:text-sm">
                        {t.table.emptyTitle}
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
      </fieldset>
    </div>
  );
}
