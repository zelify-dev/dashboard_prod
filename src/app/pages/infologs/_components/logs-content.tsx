"use client";

import { useState, useEffect, useCallback } from "react";
import { YStack, XStack, Text, Input, Button, ScrollView } from "tamagui";
import { SimpleSelect } from "@/components/FormElements/simple-select";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { useOrganizationScopes } from "@/hooks/use-organization-scopes";
import { canUseOrganizationIntegrations } from "@/lib/auth-api";
import { getLogs, type LogItem } from "@/lib/logs-api";
import { cn } from "@/lib/utils";
import { Search, RefreshCw, X, Code2, ServerCrash, Zap, Sparkles, Box, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

// Tipos base para filtros
type ActionType = "API request" | "Webhook" | "Link event" | "";
const ACTION_TYPES: ActionType[] = ["API request", "Webhook", "Link event"];

type Environment = "PRODUCTION" | "SANDBOX" | "";
const ENVIRONMENTS: { value: Environment; label: string }[] = [
  { value: "PRODUCTION", label: "Production" },
  { value: "SANDBOX", label: "Sandbox" },
];

type ResponseCode = "200" | "400" | "401" | "404" | "500" | "";
const RESPONSE_CODES: ResponseCode[] = ["200", "400", "401", "404", "500"];

export function LogsPageContent() {
  const ui = useUiTranslations();
  const t = ui.logsPage;
  const webhooksUi = ui.webhooksPage;
  
  const { organization, loading: orgLoading } = useOrganizationCountry();
  const scopes = useOrganizationScopes();
  const canUseLogs = canUseOrganizationIntegrations(organization, scopes);
  const logsLocked = orgLoading || !canUseLogs;

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  const [selectedPayload, setSelectedPayload] = useState<Record<string, unknown> | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    type: "" as ActionType | string,
    status_code: "" as ResponseCode | string,
    environment: "" as Environment | string,
    from_date: "",
    to_date: "",
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const itemsPerPage = 50;

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const fetchLogs = useCallback(async () => {
    if (!organization?.id || logsLocked) return;
    
    setLoadingLogs(true);
    try {
      const fromDateISO = filters.from_date ? new Date(`${filters.from_date}T00:00:00.000Z`).toISOString() : undefined;
      const toDateISO = filters.to_date ? new Date(`${filters.to_date}T23:59:59.999Z`).toISOString() : undefined;

      const response = await getLogs(organization.id, {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        type: filters.type || undefined,
        status_code: filters.status_code || undefined,
        environment: filters.environment || undefined,
        from_date: fromDateISO,
        to_date: toDateISO,
      });
      setLogs(response.items || []);
      setTotalLogs(response.total || 0);
    } catch (error) {
      console.error("Error fetching logs", error);
    } finally {
      setLoadingLogs(false);
    }
  }, [organization?.id, logsLocked, currentPage, filters.type, filters.status_code, filters.environment, filters.from_date, filters.to_date, debouncedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(totalLogs / itemsPerPage));

  const handleResetFilters = () => {
    setFilters({ search: "", type: "", status_code: "", environment: "", from_date: "", to_date: "" });
    setCurrentPage(1);
  };

  const getResponseCodeBadge = (code: string | number | undefined) => {
    if (code === undefined) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-light bg-gray-100 text-gray-500">
          N/A
        </span>
      );
    }
    const c = String(code);
    if (c.startsWith("2")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-light bg-emerald-50 text-emerald-700 border border-emerald-100">
          {code}
        </span>
      );
    }
    if (c.startsWith("4")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-light bg-amber-50 text-amber-700 border border-amber-100">
          {code}
        </span>
      );
    }
    if (c.startsWith("5")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-light bg-rose-50 text-rose-700 border border-rose-100">
          {code}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-light bg-gray-100 text-gray-700 border border-gray-200">
        {code}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getEnvBadge = (env: string | undefined) => {
    if (env === "PRODUCTION") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-zelify-midnight px-1.5 py-0.5 text-[9px] font-light tracking-wider text-zelify-green uppercase">
          PROD
        </span>
      );
    }
    if (env === "SANDBOX") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-gray-50 border border-gray-100 px-1.5 py-0.5 text-[9px] font-light tracking-wider text-dark-6 uppercase">
          SANDBOX
        </span>
      );
    }
    return <span className="text-[10px] font-light text-dark-6">{env || "N/A"}</span>;
  };

  const logServiceLabel = (service: string | undefined) => {
    if (!service) return null;
    let label = service;
    if (service === "API request") label = t.values.logTypes.apiRequest;
    if (service === "Webhook") label = t.values.logTypes.webhook;
    if (service === "Link event") label = t.values.logTypes.linkEvent;
    return (
      <span className="flex items-center gap-1.5 text-xs text-dark font-light">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
        {label}
      </span>
    );
  };

  return (
    <div className="relative min-w-0">
      {/* Payload Modal Viewer (Glassmorphism) */}
      {selectedPayload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-all duration-300 animate-in fade-in zoom-in-95">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-normal text-dark font-mono">Payload.json</h3>
              </div>
              <button
                onClick={() => setSelectedPayload(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-dark-6 hover:text-dark transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-950">
              <pre 
                className="text-[12px] leading-relaxed font-mono text-slate-100 whitespace-pre-wrap break-all"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(selectedPayload, null, 2)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/"(.*?)":/g, '<span style="color: #7ee787">"$1"</span>:')
                    .replace(/:\s*("[^"]*")/g, ': <span style="color: #a5d6ff">$1</span>')
                }}
              />
              <div className="mt-6 flex items-start gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[11px] font-light text-slate-400">
                  Data obfuscation is active. Sensitive credential values or PII may have been masked as <code className="bg-slate-800 px-1 rounded text-rose-400">[***]</code> organically by the edge prior to storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {orgLoading && (
        <p className="text-xs font-light text-dark-6 animate-pulse mb-4">{webhooksUi.loadingAccess}</p>
      )}
      {!orgLoading && !canUseLogs && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-4 text-xs font-light text-rose-800 shadow-sm flex items-center gap-3 mb-6">
           <Zap className="w-5 h-5 shrink-0" />
           {webhooksUi.lockedUntilOnboarding}
        </div>
      )}

      <fieldset
        disabled={logsLocked}
        className={cn(
          "m-0 min-w-0 border-0 p-0 transition-opacity duration-300",
          logsLocked && "disabled:cursor-not-allowed disabled:opacity-[0.88]",
        )}
      >
        {/* Search Bar & Filters Wrapper */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-6">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search traces, IDs or metadata..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2 pl-10 pr-4 text-xs font-light text-dark outline-none transition focus:border-gray-200"
              />
            </div>
          </div>

          {/* Filters Base */}
          <div className="flex flex-wrap gap-3 items-center">
            <SimpleSelect
              options={[
                { value: "", label: t.filters.type },
                ...ACTION_TYPES.map((type) => ({ value: type, label: type })),
              ]}
              value={filters.type}
              onChange={(value) => { setFilters({ ...filters, type: value }); setCurrentPage(1); }}
              className="min-w-[140px]"
            />

            <SimpleSelect
              options={[
                { value: "", label: "All Environments" },
                ...ENVIRONMENTS,
              ]}
              value={filters.environment}
              onChange={(value) => { setFilters({ ...filters, environment: value }); setCurrentPage(1); }}
              className="min-w-[150px]"
            />

            <SimpleSelect
              options={[
                { value: "", label: "Status" },
                ...RESPONSE_CODES.map((code) => ({ value: code, label: code })),
              ]}
              value={filters.status_code}
              onChange={(value) => { setFilters({ ...filters, status_code: value }); setCurrentPage(1); }}
              className="min-w-[120px]"
            />

            <div className="flex rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
               <input
                 type="date"
                 title="From date"
                 value={filters.from_date}
                 onChange={(e) => { setFilters({ ...filters, from_date: e.target.value }); setCurrentPage(1); }}
                 className="px-3 py-1.5 text-xs text-dark bg-transparent outline-none border-r border-gray-100 hover:bg-gray-100/50 transition cursor-pointer font-light"
               />
               <input
                 type="date"
                 title="To date"
                 value={filters.to_date}
                 onChange={(e) => { setFilters({ ...filters, to_date: e.target.value }); setCurrentPage(1); }}
                 className="px-3 py-1.5 text-xs text-dark bg-transparent outline-none hover:bg-gray-100/50 transition cursor-pointer font-light"
               />
            </div>

            <button
              onClick={handleResetFilters}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-100 bg-white text-dark hover:bg-gray-50 active:scale-95 transition"
              aria-label="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm max-w-full">
          <div className="overflow-x-auto">
            <div className="min-w-[1100px] flex flex-col">
              
              {/* Header Row */}
              <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/50 px-5 py-3 text-[10px] font-light uppercase tracking-wider text-dark-6">
                <span className="w-[110px]">ID Trace</span>
                <span className="w-[180px]">{t.table.type}</span>
                <span className="flex-1">Event Detail</span>
                <span className="w-[90px]">{t.table.env}</span>
                <span className="w-[90px]">{t.table.response}</span>
                <span className="w-[160px]">Date & Time</span>
                <span className="w-[90px] text-center">Metadata</span>
              </div>

              {/* Body Rows */}
              {loadingLogs ? (
                 <div className="flex h-32 items-center justify-center">
                   <div className="flex items-center gap-2">
                     <RefreshCw className="w-4 h-4 animate-spin text-dark-6" />
                     <span className="text-xs font-light text-dark-6">Loading...</span>
                   </div>
                 </div>
              ) : logs.length === 0 ? (
                <div className="flex h-44 flex-col items-center justify-center bg-gray-50/30 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white mb-3">
                    <Search className="w-4 h-4 text-dark-6" />
                  </div>
                  <p className="text-xs font-normal text-dark mb-1">{t.table.emptyTitle}</p>
                  <p className="text-[11px] font-light text-dark-6 max-w-xs text-center">{t.table.emptySubtitle}</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center gap-4 border-b border-gray-100/60 px-5 py-2 hover:bg-gray-50/30 transition-colors text-xs font-light text-dark-6"
                  >
                    <span className="w-[110px] font-mono text-[11px] text-dark">
                      {log.id.slice(0, 8)}...
                    </span>
                    
                    <span className="w-[180px] overflow-hidden">
                      {logServiceLabel(log.type || log.service)}
                    </span>
                    
                    <span className="flex-1 overflow-hidden pr-4 flex items-center">
                      <span className="rounded-lg bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-dark font-normal">
                        {log.operation}
                      </span>
                    </span>

                    <span className="w-[90px]">
                      {getEnvBadge(log.environment)}
                    </span>

                    <span className="w-[90px]">
                      {getResponseCodeBadge(log.status_code)}
                    </span>

                    <span className="w-[160px] text-[11px] text-dark-6">
                      {formatTimestamp(log.created_at)}
                    </span>

                    <div className="w-[90px] flex justify-center">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <button
                          onClick={() => setSelectedPayload(log.metadata!)}
                          className="flex items-center gap-1 rounded-xl border border-gray-100 bg-white px-2.5 py-1 text-[11px] text-indigo-600 hover:bg-gray-50 active:scale-95 transition"
                        >
                          <Code2 className="w-3 h-3" />
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pagination Footer */}
        {logs.length > 0 && (
           <div className="mt-4 flex items-center justify-between px-1">
             <span className="text-xs font-light text-dark-6">
               Showing page {currentPage} of {totalPages}
             </span>
             
             <div className="flex items-center gap-2">
               <button
                 disabled={currentPage === 1 || loadingLogs}
                 onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                 className="rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-xs font-light text-dark hover:bg-gray-50 disabled:opacity-50 active:scale-95 transition"
               >
                 Previous
               </button>
               <button
                 disabled={currentPage === totalPages || loadingLogs}
                 onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                 className="rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-xs font-light text-dark hover:bg-gray-50 disabled:opacity-50 active:scale-95 transition"
               >
                 Next
               </button>
             </div>
           </div>
        )}
      </fieldset>
    </div>
  );
}
