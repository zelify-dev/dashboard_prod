"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { SimpleSelect } from "@/components/FormElements/simple-select";
import { cn } from "@/lib/utils";
import { useAMLTranslations } from "./use-aml-translations";

export interface AMLList {
  id: string; // This will be the short_name
  title: string;
  category: string;
  description: string;
  country: string;
  icon: React.ReactNode;
  enabled: boolean;
  source: string;
  number_of_entries?: number;
  last_update?: string;
}

export interface AMLListGroup {
  id: string;
  name: string;
  description?: string;
  sources: string[]; // List of short_names
  min_score: number;
  isDefault?: boolean;
}

interface AMLListConfigProps {
  lists: AMLList[];
  groups: AMLListGroup[];
  onToggleList: (listId: string, enabled: boolean) => void;
  onCreateGroup: (group: Omit<AMLListGroup, "id">) => void;
  onUpdateGroup: (groupId: string, group: Partial<AMLListGroup>) => void;
  onDeleteGroup: (groupId: string) => void;
  selectedGroupId?: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onToggleListInGroup?: (groupId: string, listId: string, add: boolean) => void;
  pagination?: {
    page: number;
    hasMore: boolean;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
  };
  onPageChange?: (page: number) => void;
  searchTerm?: string;
  onSearch?: (term: string) => void;
  isLoading?: boolean;
}

function Toggle({ enabled, onChange, loading = false }: { enabled: boolean; onChange: (enabled: boolean) => void; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        enabled ? "bg-primary" : "bg-gray-300 dark:bg-dark-3",
        loading && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform flex items-center justify-center",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      >
        {loading && (
          <svg className="h-3 w-3 animate-spin text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </span>
    </button>
  );
}

export function AMLListConfig({
  lists,
  groups,
  onToggleList,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  selectedGroupId,
  onSelectGroup,
  onToggleListInGroup,
  pagination,
  onPageChange,
  searchTerm = "",
  onSearch,
  isLoading = false,
}: AMLListConfigProps) {
  const translations = useAMLTranslations();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [minScore, setMinScore] = useState(0.85); // Default confidence threshold
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<string | null>(null);
  const [showNoGroupModal, setShowNoGroupModal] = useState(false);

  const getJurisdictionIcon = (countryCode: string) => {
    if (!countryCode || countryCode === "ND") return "📍";
    if (countryCode === "INT" || countryCode === "GL") {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (countryCode === "EU") {
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L13.09 5.36H16.62L13.76 7.44L14.85 10.8L12 8.72L9.15 10.8L10.24 7.44L7.38 5.36H10.91L12 2Z" />
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );
    }

    try {
      return countryCode
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
    } catch (e) {
      return "📍";
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onCreateGroup({
        name: newGroupName,
        description: newGroupDescription,
        sources: [], // Start empty
        min_score: minScore,
      });
      setShowCreateGroupModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setMinScore(0.85);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const isListEnabled = (listId: string) => {
    if (selectedGroup) {
      return selectedGroup.sources.includes(listId);
    }
    return false;
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-stroke pb-6 dark:border-dark-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-dark dark:text-white">
            {translations.config.title}
          </h2>
          <p className="mt-1 text-base text-dark-6">
            {translations.config.description}
          </p>
        </div>
        <div className="shrink-0">
          <Button
            onClick={() => setShowCreateGroupModal(true)}
            label={translations.config.newGroup}
            variant="primary"
            shape="rounded"
            size="default"
            className="px-6 py-3 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          />
        </div>
      </div>

      {/* Barra de Comandos Forense */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stroke bg-white p-4 shadow-sm dark:border-dark-3 dark:bg-dark-2">
        <div className="flex items-center gap-4">
          {/* Paginación Superior */}
          {pagination && onPageChange && (
            <div className="flex items-center gap-4 border-r border-stroke pr-4 dark:border-dark-3">
              <span className="text-xs font-medium text-dark-6">
                Página <span className="font-bold text-dark dark:text-white">{pagination.page}</span> de <span className="font-bold text-dark dark:text-white">{Math.ceil(pagination.total / 25)}</span>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    if (!pagination.previousPage) return;
                    setIsTransitioning(true);
                    onPageChange(pagination.previousPage);
                    setTimeout(() => setIsTransitioning(false), 400);
                  }}
                  disabled={!pagination.previousPage || isLoading || isTransitioning}
                  label="Anterior"
                  variant="outlineDark"
                  size="small"
                  shape="rounded"
                  className="h-9 min-w-[90px] text-[11px]"
                />
                <Button
                  onClick={() => {
                    if (!pagination.nextPage) return;
                    setIsTransitioning(true);
                    onPageChange(pagination.nextPage);
                    setTimeout(() => setIsTransitioning(false), 400);
                  }}
                  disabled={!pagination.hasMore || isLoading || isTransitioning}
                  label="Próxima"
                  variant="primary"
                  size="small"
                  shape="rounded"
                  className="h-9 min-w-[90px] text-[11px]"
                />
              </div>
            </div>
          )}

          {/* Selector de Grupo */}
          <div className="flex items-center gap-2">
            <SimpleSelect
              options={[
                { value: "", label: translations.config.allLists },
                ...groups.map((g) => ({ value: g.id, label: g.name }))
              ]}
              value={selectedGroupId || ""}
              onChange={(value) => onSelectGroup(value === "" ? null : value)}
              className="h-10 min-w-[220px]"
            />
            {selectedGroupId && (
              <button
                onClick={() => setShowDeleteConfirmModal(selectedGroupId)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-all hover:bg-red-100 hover:text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400"
                title="Eliminar grupo seleccionado"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Buscador Global Pro */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Buscar por nombre, país o fuente..."
            className="h-10 w-full rounded-lg border border-stroke bg-gray-50/50 py-2 pl-10 pr-10 text-sm font-medium text-dark outline-none transition-all focus:border-primary focus:bg-white dark:border-dark-3 dark:bg-dark-3 dark:text-white"
          />
          {searchTerm && (
            <button
              onClick={() => onSearch?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-6 hover:text-dark dark:hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Banner de Instrucción */}
      {!selectedGroupId && !isLoading && (
        <div className="flex animate-pulse items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5 dark:border-primary/30 dark:bg-primary/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-primary uppercase tracking-tight">Acción Requerida</h4>
            <p className="text-xs font-medium text-primary/80">
              Para activar o gestionar listas sintonizadas, debes **seleccionar un grupo** en el selector superior o **crear uno nuevo**.
            </p>
          </div>
        </div>
      )}

      {/* Skeleton / Empty State / Grid */}
      {isLoading && lists.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-dark-3"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-dark-3"></div>
                  <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-dark-3"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 w-full rounded bg-gray-100 dark:bg-dark-3/50"></div>
                <div className="h-3 w-5/6 rounded bg-gray-100 dark:bg-dark-3/50"></div>
              </div>
              <div className="mt-auto border-t border-stroke pt-4 dark:border-dark-3">
                <div className="h-6 w-24 rounded bg-gray-100 dark:bg-dark-3/50"></div>
              </div>
            </div>
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stroke py-20 dark:border-dark-3">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-3">
            <svg className="h-8 w-8 text-dark-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-dark dark:text-white">No se encontraron listas</h3>
          <p className="text-dark-6">Intenta con otro término de búsqueda.</p>
        </div>
      ) : (
        <div className={cn(
          "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300 relative",
          (isLoading || isTransitioning) ? "opacity-30 blur-[2px] pointer-events-none" : "opacity-100 blur-0"
        )}>
          {/* Spinner Central */}
          {(isLoading || isTransitioning) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 rounded-xl bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:bg-dark-2/80">
                <svg className="h-10 w-10 animate-spin text-primary" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-bold text-dark dark:text-white uppercase tracking-widest">Sincronizando...</span>
              </div>
            </div>
          )}

          {lists.map((list) => {
            const listEnabled = isListEnabled(list.id);
            const isPending = pendingToggles.has(list.id);
            
            const handleToggle = async (enabled: boolean) => {
              if (!selectedGroupId) {
                setShowNoGroupModal(true);
                return;
              }
              setPendingToggles(prev => new Set(prev).add(list.id));
              try {
                if (selectedGroup && selectedGroupId) {
                  if (onToggleListInGroup) {
                    await onToggleListInGroup(selectedGroupId, list.id, enabled);
                  } else {
                    const currentSources = selectedGroup.sources;
                    await onUpdateGroup(selectedGroupId, {
                      sources: enabled ? [...currentSources, list.id] : currentSources.filter((id) => id !== list.id)
                    });
                  }
                } else {
                  await onToggleList(list.id, enabled);
                }
              } finally {
                setPendingToggles(prev => {
                  const next = new Set(prev);
                  next.delete(list.id);
                  return next;
                });
              }
            };
  
            return (
              <div
                key={list.id}
                className={cn(
                  "relative flex h-full flex-col rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-dark-2",
                  listEnabled ? "border-primary/30 ring-1 ring-primary/10" : "border-stroke dark:border-dark-3",
                  (!listEnabled || !selectedGroupId) && "opacity-80",
                  isPending && "ring-2 ring-primary/50",
                  !selectedGroupId && "grayscale-[0.5] cursor-not-allowed"
                )}
              >
                {/* Loader Cobertura */}
                {isPending && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/60 backdrop-blur-[1px] dark:bg-dark-2/60">
                    <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="mt-2 text-[10px] font-bold text-primary uppercase tracking-tighter">Actualizando...</span>
                  </div>
                )}

                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                      {getJurisdictionIcon(list.country)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-dark dark:text-white line-clamp-2">
                        {list.title}
                      </h3>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-dark-6">
                        {list.country}
                      </p>
                    </div>
                  </div>
                </div>
  
                <p className="mb-4 text-sm text-dark-6 line-clamp-3 leading-relaxed">
                  {list.description}
                </p>
  
                <div className="mt-auto space-y-4">
                  <div className="flex flex-wrap gap-2">
                     {list.number_of_entries && (
                       <span className="rounded bg-dark/5 px-2 py-0.5 text-[10px] font-bold text-dark-6 dark:bg-white/5">
                         {list.number_of_entries.toLocaleString()} entradas
                       </span>
                     )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-stroke pt-4 dark:border-dark-3">
                    <div className="flex items-center gap-2">
                      <Toggle enabled={listEnabled} onChange={handleToggle} loading={isPending} />
                      <span className="text-xs font-semibold text-dark-6">
                        {isPending ? "Procesando..." : listEnabled ? "Activada" : "Desactivada"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Paginación */}
      {pagination && onPageChange && (
        <div className="mt-8 flex items-center justify-between border-t border-stroke py-4 dark:border-dark-3">
          <p className="text-sm text-dark-6">
            Página <span className="font-bold text-dark dark:text-white">{pagination.page}</span> de <span className="font-bold text-dark dark:text-white">{Math.ceil(pagination.total / 25)}</span> ({pagination.total} listas totales)
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!pagination.previousPage) return;
                setIsTransitioning(true);
                onPageChange(pagination.previousPage);
                setTimeout(() => setIsTransitioning(false), 400); 
              }}
              disabled={!pagination.previousPage || isLoading || isTransitioning}
              label="Anterior"
              variant="outlineDark"
              size="small"
              shape="rounded"
            />
            <Button
              onClick={() => {
                if (!pagination.nextPage) return;
                setIsTransitioning(true);
                onPageChange(pagination.nextPage);
                setTimeout(() => setIsTransitioning(false), 400); 
              }}
              disabled={!pagination.hasMore || isLoading || isTransitioning}
              label="Próxima"
              variant="primary"
              size="small"
              shape="rounded"
            />
          </div>
        </div>
      )}

      {/* Modal Nueva Validación */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl dark:bg-dark-2 border border-stroke dark:border-dark-3">
            <h3 className="mb-6 text-xl font-semibold text-dark dark:text-white tracking-tight">
              Nueva Configuración de Validación
            </h3>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-6 dark:text-dark-4">
                  Nombre de la Configuración
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ej: Perfil de Riesgo Alto"
                  className="block w-full rounded-lg border border-stroke bg-white px-4 py-3 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white transition-all focus:border-primary"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-6 dark:text-dark-4">
                  Score de Confianza Mínimo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.01"
                      value={minScore}
                      onChange={(e) => setMinScore(parseFloat(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-dark-3 outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-primary [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                      style={{
                        background: `linear-gradient(to right, #3C50E0 0%, #3C50E0 ${(minScore - 0.5) / 0.5 * 100}%, #E2E8F0 ${(minScore - 0.5) / 0.5 * 100}%, #E2E8F0 100%)`
                      }}
                    />
                  </div>
                  <span className="min-w-[50px] rounded-full bg-primary/10 px-3 py-1 text-center text-[12px] font-bold text-primary border border-primary/20 shadow-sm">
                    {Math.round(minScore * 100)}%
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-dark-6 italic">
                  * Determina qué tan similar debe ser un nombre para generar una alerta.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleCreateGroup} 
                  label={isSubmitting ? "Creando..." : "Crear Configuración"} 
                  variant="primary" 
                  size="default" 
                  shape="rounded" 
                  className="flex-1" 
                  disabled={isSubmitting}
                />
                <Button onClick={() => setShowCreateGroupModal(false)} label="Cancelar" variant="outlineDark" size="default" shape="rounded" className="flex-1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl dark:bg-dark-2">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 mx-auto">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="mb-2 text-center text-xl font-bold text-dark dark:text-white uppercase tracking-tight">¿Eliminar Configuración?</h3>
            <p className="mb-8 text-center text-sm text-dark-6">
              Esta acción es permanente y eliminará todas las listas asociadas a este grupo.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  onDeleteGroup(showDeleteConfirmModal);
                  onSelectGroup(null);
                  setShowDeleteConfirmModal(null);
                }} 
                label="Sí, Eliminar" 
                variant="primary" 
                className="flex-1 bg-red-600 hover:bg-red-700 !border-red-600 font-bold" 
              />
              <Button onClick={() => setShowDeleteConfirmModal(null)} label="Cancelar" variant="outlineDark" className="flex-1 font-bold" />
            </div>
          </div>
        </div>
      )}

      {/* Modal Aviso Acción Requerida */}
      {showNoGroupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl dark:bg-dark-2 border border-primary/30">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-center text-xl font-bold text-dark dark:text-white uppercase tracking-tight">Acción Requerida</h3>
            <p className="mb-8 text-center text-sm text-dark-6 italic">
              "Para activar controles forenses, primero debes seleccionar una configuración activa en el menú superior."
            </p>
            <Button onClick={() => setShowNoGroupModal(false)} label="Entendido" variant="primary" className="w-full font-bold shadow-lg shadow-primary/20" />
          </div>
        </div>
      )}
    </div>
  );
}
