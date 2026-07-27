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
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
        enabled ? "bg-zelify-midnight" : "bg-gray-200",
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
          <svg className="h-3 w-3 animate-spin text-zelify-midnight" viewBox="0 0 24 24">
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
    if (!countryCode || countryCode === "ND") return "[ND]";
    return `[${countryCode.toUpperCase()}]`;
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
    <div className="mt-4 space-y-4">
      {/* Cabecera Principal */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-dark">
            {translations.config.title}
          </h2>
          <p className="mt-1 text-base font-light text-dark-6">
            {translations.config.description}
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="flex items-center gap-2 rounded-xl bg-zelify-midnight px-4 py-2 text-xs font-light text-white transition-all hover:bg-zelify-midnight/90 active:scale-95"
          >
            <svg className="h-4 w-4 text-zelify-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {translations.config.newGroup}
          </button>
        </div>
      </div>

      {/* Barra de Comandos Forense */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex items-center gap-4">
          {/* Paginación Superior */}
          {pagination && onPageChange && (
            <div className="flex items-center gap-4 border-r border-gray-100 pr-4">
              <span className="text-xs font-light text-dark-6">
                Página <span className="font-normal text-dark">{pagination.page}</span> de <span className="font-normal text-dark">{Math.ceil(pagination.total / 25)}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!pagination.previousPage) return;
                    setIsTransitioning(true);
                    onPageChange(pagination.previousPage);
                    setTimeout(() => setIsTransitioning(false), 400);
                  }}
                  disabled={!pagination.previousPage || isLoading || isTransitioning}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-light uppercase text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => {
                    if (!pagination.nextPage) return;
                    setIsTransitioning(true);
                    onPageChange(pagination.nextPage);
                    setTimeout(() => setIsTransitioning(false), 400);
                  }}
                  disabled={!pagination.hasMore || isLoading || isTransitioning}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-light uppercase text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
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
              className="h-10 min-w-[220px] font-light text-sm"
            />
            {selectedGroupId && (
              <button
                onClick={() => setShowDeleteConfirmModal(selectedGroupId)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50/50 text-red-600 transition-all hover:bg-red-50"
                title="Eliminar grupo seleccionado"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Buscador Global Pro */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Buscar por nombre, país o fuente..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-10 text-sm font-light text-dark outline-none transition-all focus:border-zelify-midnight"
          />
          {searchTerm && (
            <button
              onClick={() => onSearch?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-6 hover:text-dark transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Banner de Instrucción */}
      {!selectedGroupId && !isLoading && (
        <div className="flex items-center gap-3 rounded-2xl border border-zelify-midnight/10 bg-gray-50/50 py-3 px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zelify-midnight/10 text-zelify-midnight">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-normal text-zelify-midnight uppercase tracking-tight">Acción Requerida</h4>
            <p className="text-xs font-light text-dark-6">
              Para activar o gestionar listas sintonizadas, debes **seleccionar un grupo** en el selector superior o **crear uno nuevo**.
            </p>
          </div>
        </div>
      )}

      {/* Skeleton / Empty State / Grid */}
      {isLoading && lists.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-100"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-100"></div>
                  <div className="h-3 w-1/4 rounded bg-gray-100"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 w-full rounded bg-gray-100/50"></div>
                <div className="h-3 w-5/6 rounded bg-gray-100/50"></div>
              </div>
              <div className="mt-auto border-t border-gray-100 pt-4">
                <div className="h-6 w-24 rounded bg-gray-100/50"></div>
              </div>
            </div>
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-dark-6">
            <svg className="h-8 w-8 text-dark-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-light text-dark">No se encontraron listas</h3>
          <p className="text-xs font-light text-dark-6">Intenta con otro término de búsqueda.</p>
        </div>
      ) : (
        <div className={cn(
          "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300 relative",
          (isLoading || isTransitioning) ? "opacity-30 blur-[2px] pointer-events-none" : "opacity-100 blur-0"
        )}>
          {/* Spinner Central */}
          {(isLoading || isTransitioning) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-sm border border-gray-100">
                <svg className="h-10 w-10 animate-spin text-zelify-midnight" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-light text-dark uppercase tracking-widest">Sincronizando...</span>
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
                  "relative flex h-full flex-col rounded-2xl border bg-white p-4 transition-all hover:border-gray-200/80",
                  listEnabled ? "border-zelify-midnight bg-gray-50/10" : "border-gray-100",
                  (!listEnabled || !selectedGroupId) && "opacity-80",
                  isPending && "ring-1 ring-zelify-midnight/35",
                  !selectedGroupId && "grayscale-[0.5] cursor-not-allowed"
                )}
              >
                {/* Loader Cobertura */}
                {isPending && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px]">
                    <svg className="h-8 w-8 animate-spin text-zelify-midnight" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>

                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="mt-2 text-[10px] font-bold text-primary uppercase tracking-tighter">Actualizando...</span>
                  </div>
                )}

                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100/50 text-xs font-light text-dark-6">
                      {getJurisdictionIcon(list.country)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-normal text-dark dark:text-white line-clamp-2">
                        {list.title}
                      </h3>
                      <p className="text-[10px] font-light uppercase tracking-wider text-dark-6">
                        {list.country}
                      </p>
                    </div>
                  </div>
                </div>
  
                <p className="mb-3 text-xs font-light text-dark-6 line-clamp-3 leading-relaxed">
                  {list.description}
                </p>
  
                <div className="mt-auto space-y-3">
                  <div className="flex flex-wrap gap-2">
                     {list.number_of_entries && (
                       <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-light text-dark-6 border border-gray-200/50">
                         {list.number_of_entries.toLocaleString()} entradas
                       </span>
                     )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Toggle enabled={listEnabled} onChange={handleToggle} loading={isPending} />
                      <span className="text-xs font-light text-dark-6">
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
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 py-6">
          <p className="text-sm font-light text-dark-6">
            Página <span className="font-normal text-dark">{pagination.page}</span> de <span className="font-normal text-dark">{Math.ceil(pagination.total / 25)}</span> ({pagination.total} listas totales)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!pagination.previousPage) return;
                setIsTransitioning(true);
                onPageChange(pagination.previousPage);
                setTimeout(() => setIsTransitioning(false), 400); 
              }}
              disabled={!pagination.previousPage || isLoading || isTransitioning}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-light uppercase text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => {
                if (!pagination.nextPage) return;
                setIsTransitioning(true);
                onPageChange(pagination.nextPage);
                setTimeout(() => setIsTransitioning(false), 400); 
              }}
              disabled={!pagination.hasMore || isLoading || isTransitioning}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-light uppercase text-dark-6 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Modal Nueva Configuración */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 border border-gray-100">
            <h3 className="mb-6 text-xl font-light text-dark tracking-tight">
              Nueva Configuración de Validación
            </h3>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-light text-dark-6">
                  Nombre de la Configuración
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ej: Perfil de Riesgo Alto"
                  className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-light text-dark outline-none transition-all focus:border-zelify-midnight"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-light text-dark-6">
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
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-zelify-midnight [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                      style={{
                        background: `linear-gradient(to right, #000016 0%, #000016 ${(minScore - 0.5) / 0.5 * 100}%, #E2E8F0 ${(minScore - 0.5) / 0.5 * 100}%, #E2E8F0 100%)`
                      }}
                    />
                  </div>
                  <span className="min-w-[50px] rounded-xl bg-zelify-midnight px-3 py-1.5 text-center text-[11px] font-light text-white shadow-sm">
                    {Math.round(minScore * 100)}%
                  </span>
                </div>
                <p className="mt-2 text-[10px] font-light text-dark-6 italic">
                  * Determina qué tan similar debe ser un nombre para generar una alerta.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleCreateGroup} 
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-zelify-midnight py-3 text-sm font-light uppercase text-white transition-all hover:bg-zelify-midnight/90 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Creando..." : "Crear Configuración"}
                </button>
                <button 
                  onClick={() => setShowCreateGroupModal(false)} 
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-light uppercase text-dark-6 hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 border border-gray-100">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mx-auto">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="mb-2 text-center text-xl font-light text-dark tracking-tight">¿Eliminar Configuración?</h3>
            <p className="mb-8 text-center text-xs font-light text-dark-6">
              Esta acción es permanente y eliminará todas las listas asociadas a este grupo.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  onDeleteGroup(showDeleteConfirmModal);
                  onSelectGroup(null);
                  setShowDeleteConfirmModal(null);
                }} 
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-light uppercase text-white transition-all hover:bg-red-700 active:scale-95"
              >
                Sí, Eliminar
              </button>
              <button 
                onClick={() => setShowDeleteConfirmModal(null)} 
                className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-light uppercase text-dark-6 hover:bg-gray-50 transition-all active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aviso Acción Requerida */}
      {showNoGroupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 border border-gray-100">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-dark-6 mx-auto">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-center text-xl font-light text-dark tracking-tight">Acción Requerida</h3>
            <p className="mb-8 text-center text-xs font-light text-dark-6 italic">
              "Para activar controles forenses, primero debes seleccionar una configuración activa en el menú superior."
            </p>
            <button 
              onClick={() => setShowNoGroupModal(false)} 
              className="w-full rounded-xl bg-zelify-midnight py-3 text-sm font-light uppercase text-white transition-all hover:bg-zelify-midnight/90 active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
