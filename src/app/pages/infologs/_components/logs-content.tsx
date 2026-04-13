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
    if (code === undefined) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-dark-3 dark:text-dark-6">N/A</span>;
    const c = String(code);
    if (c.startsWith("2")) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>{code}</span>;
    if (c.startsWith("4")) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>{code}</span>;
    if (c.startsWith("5")) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100/80 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-sm"><ServerCrash className="w-3 h-3 mr-1" />{code}</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-dark-3 dark:text-dark-6 border border-gray-200 dark:border-dark-4">{code}</span>;
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
    if (env === "PRODUCTION") return <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded border border-purple-200 dark:border-purple-500/20"><Sparkles className="w-3 h-3" /> PROD</span>;
    if (env === "SANDBOX") return <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded border border-blue-200 dark:border-blue-500/20"><Box className="w-3 h-3" /> SANDBOX</span>;
    return <span className="text-xs text-dark-5 dark:text-dark-6">{env || "N/A"}</span>;
  }

  const logServiceLabel = (service: string | undefined) => {
    if (!service) return null;
    switch (service) {
      case "API request": return <XStack alignItems="center" gap="$1.5"><Zap className="w-3.5 h-3.5 text-orange-500" /> <Text fontSize="$2" color="$color11">{t.values.logTypes.apiRequest}</Text></XStack>;
      case "Webhook": return <XStack alignItems="center" gap="$1.5"><Zap className="w-3.5 h-3.5 text-blue-500" /> <Text fontSize="$2" color="$color11">{t.values.logTypes.webhook}</Text></XStack>;
      case "Link event": return <XStack alignItems="center" gap="$1.5"><Zap className="w-3.5 h-3.5 text-green-500" /> <Text fontSize="$2" color="$color11">{t.values.logTypes.linkEvent}</Text></XStack>;
      default: return <Text fontSize="$2" color="$color11" fontWeight="500">{service}</Text>;
    }
  };

  return (
    <YStack className="min-w-0 relative">
      {/* Payload Modal Viewer (Glassmorphism) */}
      {selectedPayload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-all duration-300 animate-in fade-in zoom-in-95">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl bg-white/95 dark:bg-dark-2/95 shadow-2xl border border-white/20 dark:border-white/10 ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-dark-3/50 px-6 py-4 bg-slate-50/50 dark:bg-dark-3/30">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white font-mono tracking-tight">Payload.json</h3>
              </div>
              <button
                onClick={() => setSelectedPayload(null)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-dark-3 text-slate-500 hover:bg-slate-200 dark:hover:bg-dark-4 hover:text-slate-800 dark:hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#0d1117]">
              <pre 
                className="text-[13px] leading-relaxed font-mono text-[#e6edf3] whitespace-pre-wrap break-all"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(selectedPayload, null, 2)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/"(.*?)":/g, '<span style="color: #7ee787">"$1"</span>:')
                    .replace(/:\s*("[^"]*")/g, ': <span style="color: #a5d6ff">$1</span>')
                }}
              />
              <div className="mt-6 flex items-start gap-2 p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
                <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-[#8b949e]">
                  Data obfuscation is active. Sensitive credential values or PII may have been masked as <code className="bg-[#21262d] px-1 rounded text-red-400">[***]</code> organically by the edge prior to storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {orgLoading && (
        <p className="text-sm text-dark-6 animate-pulse">{webhooksUi.loadingAccess}</p>
      )}
      {!orgLoading && !canUseLogs && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 shadow-sm flex items-center gap-3">
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
      <YStack className="gap-4 bg-white dark:bg-dark-2 p-4 rounded-xl border border-slate-200 dark:border-dark-3 shadow-sm mb-6">
        <XStack className="gap-2 relative min-w-0" alignItems="center">
          <div className="absolute left-3 z-10 text-slate-400 flex items-center justify-center pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <Input
            flex={1}
            paddingLeft="$8"
            placeholder="Search traces, IDs or metadata..."
            value={filters.search}
            onChangeText={(text) => {
              setFilters({ ...filters, search: text });
              setCurrentPage(1);
            }}
            backgroundColor="$gray2"
            focusStyle={{ borderColor: "$blue8", backgroundColor: "$background", borderWidth: 2 }}
            borderWidth={1}
            borderColor="$gray5"
            borderRadius="$4"
            className="text-sm dark:bg-dark-3/50 dark:border-dark-3"
          />
        </XStack>

        {/* Filters Base */}
        <XStack className="flex-wrap gap-3 items-center">
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

          <XStack className="bg-slate-50 dark:bg-dark-3/50 border border-slate-200 dark:border-dark-3 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
             <input
               type="date"
               title="From date"
               value={filters.from_date}
               onChange={(e) => { setFilters({ ...filters, from_date: e.target.value }); setCurrentPage(1); }}
               className="px-3 py-2 text-xs sm:text-sm text-slate-700 bg-transparent outline-none dark:text-slate-300 border-r border-slate-200 dark:border-dark-3 focus:bg-indigo-50/50 dark:focus:bg-indigo-500/10 hover:bg-slate-100 dark:hover:bg-dark-3 transition-colors cursor-pointer"
             />
             <input
               type="date"
               title="To date"
               value={filters.to_date}
               onChange={(e) => { setFilters({ ...filters, to_date: e.target.value }); setCurrentPage(1); }}
               className="px-3 py-2 text-xs sm:text-sm text-slate-700 bg-transparent outline-none dark:text-slate-300 focus:bg-indigo-50/50 dark:focus:bg-indigo-500/10 hover:bg-slate-100 dark:hover:bg-dark-3 transition-colors cursor-pointer"
             />
          </XStack>

          <Button
            size="$3"
            icon={RefreshCw}
            circular
            backgroundColor="$background"
            borderWidth={1}
            borderColor="$gray5"
            hoverStyle={{ backgroundColor: "$gray3" }}
            onPress={handleResetFilters}
            aria-label="Reset Filters"
          />
        </XStack>
      </YStack>

      {/* Tamagui Grid Table Container */}
      <YStack 
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-dark-3 dark:bg-dark-2 ring-1 ring-slate-900/5 max-w-full"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <YStack minWidth={850} flex={1}>
            
            {/* Header Row */}
            <XStack 
              backgroundColor="$gray2" 
              className="dark:bg-dark-3/80 border-b border-slate-200 dark:border-dark-3"
              height={44}
              alignItems="center"
              paddingHorizontal="$4"
            >
              <Text flex={1} maxWidth={100} fontSize="$2" fontWeight="bold" color="$gray11" textTransform="uppercase">ID Trace</Text>
              <Text flex={1} maxWidth={130} fontSize="$2" fontWeight="bold" color="$gray11" textTransform="uppercase">{t.table.type}</Text>
              <Text flex={2} fontSize="$2" fontWeight="bold" color="$gray11" textTransform="uppercase">Event Detail</Text>
              <Text flex={1} maxWidth={130} fontSize="$2" fontWeight="bold" color="$gray11" textTransform="uppercase">{t.table.env}</Text>
              <Text flex={1} maxWidth={110} fontSize="$2" fontWeight="bold" color="$gray11" textTransform="uppercase">{t.table.response}</Text>
              <Text flex={1.5} maxWidth={160} fontSize="$2" fontWeight="bold" color="$gray11" textTransform="uppercase">Date & Time</Text>
              <Text flex={1} maxWidth={100} textAlign="center" fontSize="$2" fontWeight="bold" color="$gray11" textTransform="uppercase">Metadata</Text>
            </XStack>

            {/* Body Rows */}
            {loadingLogs ? (
               <YStack height={120} justifyContent="center" alignItems="center">
                 <XStack gap="$2" alignItems="center">
                   <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                   <Text color="$gray10">Loading...</Text>
                 </XStack>
               </YStack>
            ) : logs.length === 0 ? (
              <YStack height={180} justifyContent="center" alignItems="center" backgroundColor="$gray1" className="dark:bg-dark-3/10">
                <YStack alignItems="center" gap="$3">
                  <YStack width={48} height={48} borderRadius="$10" backgroundColor="$gray3" className="dark:bg-dark-3" justifyContent="center" alignItems="center">
                    <Search className="w-5 h-5 text-slate-400" />
                  </YStack>
                  <Text fontSize="$3" fontWeight="bold" color="$color12">
                    {t.table.emptyTitle}
                  </Text>
                  <Text fontSize="$2" color="$gray10" maxWidth={300} textAlign="center">
                    {t.table.emptySubtitle}
                  </Text>
                </YStack>
              </YStack>
            ) : (
              logs.map((log) => (
                <XStack 
                  key={log.id} 
                  className="border-b border-slate-100 dark:border-dark-3/50 cursor-default"
                  minHeight={50}
                  alignItems="center"
                  paddingHorizontal="$4"
                  hoverStyle={{ backgroundColor: "$color3" }}
                >
                  <Text flex={1} maxWidth={100} fontFamily="$mono" fontSize="$2" color="$gray10" numberOfLines={1}>
                    {log.id.slice(0, 8)}...
                  </Text>
                  
                  <YStack flex={1} maxWidth={130}>
                    {logServiceLabel(log.type || log.service)}
                  </YStack>
                  
                  <YStack flex={2} paddingRight="$4">
                    <XStack backgroundColor="$gray3" className="dark:bg-dark-3/50 px-2 py-0.5 rounded" alignSelf="flex-start">
                      <Text fontSize="$2" color="$color11" fontWeight="500" numberOfLines={1}>
                        {log.operation}
                      </Text>
                    </XStack>
                  </YStack>

                  <YStack flex={1} maxWidth={130}>
                    {getEnvBadge(log.environment)}
                  </YStack>

                  <YStack flex={1} maxWidth={110}>
                    {getResponseCodeBadge(log.status_code)}
                  </YStack>

                  <Text flex={1.5} maxWidth={160} fontSize="$2" color="$gray10" numberOfLines={1}>
                    {formatTimestamp(log.created_at)}
                  </Text>

                  <YStack flex={1} maxWidth={100} alignItems="center">
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <Button
                        size="$2"
                        icon={<Code2 className="w-3.5 h-3.5" />}
                        backgroundColor="$blue3"
                        borderColor="$blue5"
                        borderWidth={1}
                        hoverStyle={{ backgroundColor: "$blue9", borderColor: "transparent" }}
                        pressStyle={{ scale: 0.95 }}
                        onPress={() => setSelectedPayload(log.metadata!)}
                      >
                        View
                      </Button>
                    ) : (
                      <Text color="$gray8">-</Text>
                    )}
                  </YStack>
                </XStack>
              ))
            )}
          </YStack>
        </ScrollView>
      </YStack>

      {/* Pagination Footer */}
      {logs.length > 0 && (
         <XStack className="mt-4 pt-2 border-t border-transparent px-1" justifyContent="space-between" alignItems="center">
           <Text fontSize="$2" color="$gray11" fontWeight="500">
             Showing page {currentPage} of {totalPages}
           </Text>
           
           <XStack gap="$2" alignItems="center">
             <Button
               size="$3"
               icon={ChevronLeft}
               disabled={currentPage === 1 || loadingLogs}
               opacity={currentPage === 1 || loadingLogs ? 0.5 : 1}
               onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
               backgroundColor="$background"
               borderColor="$gray5"
               borderWidth={1}
               hoverStyle={currentPage === 1 || loadingLogs ? undefined : { backgroundColor: "$gray3" }}
             >
               Previous
             </Button>
             <Button
               size="$3"
               iconAfter={ChevronRight}
               disabled={currentPage === totalPages || loadingLogs}
               opacity={currentPage === totalPages || loadingLogs ? 0.5 : 1}
               onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
               backgroundColor="$background"
               borderColor="$gray5"
               borderWidth={1}
               hoverStyle={currentPage === totalPages || loadingLogs ? undefined : { backgroundColor: "$gray3" }}
             >
               Next
             </Button>
           </XStack>
         </XStack>
      )}
      </fieldset>
    </YStack>
  );
}
