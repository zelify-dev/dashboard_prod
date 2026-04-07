"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Button } from "@/components/ui-elements/button";
import { AMLValidationsList, mockValidations, AMLValidation } from "./_components/aml-validations-list";
import { AMLValidationForm } from "./_components/aml-validation-form";
import { AMLValidationDetail } from "./_components/aml-validation-detail";
import { AMLListConfig, AMLList, AMLListGroup } from "./_components/aml-list-config";
import { getAMLists } from "./_components/aml-lists-data";
import { useAMLTranslations } from "./_components/use-aml-translations";
import { useLanguage } from "@/contexts/language-context";
import { useOrganizationCountry } from "@/hooks/use-organization-country";

import { AMLPreviewPanel } from "./_components/aml-preview-panel";
import { AMLPersonalizationConfig } from "./_components/aml-personalization-config";
import { AMLConfig } from "./_components/aml-config-types";
import { useTour } from "@/contexts/tour-context";

type ViewMode = "validations" | "config" | "personalization";

const AML_LISTS_STORAGE_KEY = "aml_validation_global_lists_enabled_v1";

function readEnabledMapFromStorage(): Record<string, boolean> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(AML_LISTS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<Record<string, boolean>>((acc, [key, value]) => {
      if (typeof value === "boolean") {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function applyEnabledMap(lists: AMLList[], enabledMap: Record<string, boolean>): AMLList[] {
  return lists.map((list) =>
    Object.prototype.hasOwnProperty.call(enabledMap, list.id)
      ? { ...list, enabled: enabledMap[list.id] }
      : list
  );
}

import { getAMLScreenings, getAMLScreeningDetail, getAMLListsCatalog, AMLScreeningItem, AMLCatalogItem } from "@/lib/aml-api";

export default function ValidationGlobalListPage() {
  const translations = useAMLTranslations();
  const { language } = useLanguage();
  const { countryName } = useOrganizationCountry();
  const { isTourActive, currentStep, steps } = useTour();
  const [viewMode, setViewMode] = useState<ViewMode>("validations");
  const [selectedValidationId, setSelectedValidationId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [validations, setValidations] = useState<AMLValidation[]>([]);
  const [displayedValidation, setDisplayedValidation] = useState<AMLValidation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<AMLCatalogItem[]>([]);
  const [catalogPagination, setCatalogPagination] = useState<{
    page: number;
    hasMore: boolean;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
  }>({
    page: 1,
    hasMore: false,
    nextPage: null,
    previousPage: null,
    total: 0,
  });

  const [amlConfig, setAmlConfig] = useState<AMLConfig>({
    branding: {
      light: {
        logo: null,
        customColorTheme: "#004492",
      },
      dark: {
        logo: null,
        customColorTheme: "#004492",
      },
    },
  });

  // Mapeador de item de lista de screening a nuestra interfaz de validación
  const mapScreeningToValidation = (item: AMLScreeningItem): AMLValidation => ({
    id: item.screening_id,
    name: item.name,
    verification: item.match_count > 0 ? "Hit" : "success",
    matchCount: item.match_count,
    hasMatches: item.has_matches,
    createdAt: new Date(item.created_at).toLocaleDateString(),
    foundIn: item.has_matches ? item.data_source : undefined,
  });

  const fetchValidations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAMLScreenings();
      setValidations(data.items.map(mapScreeningToValidation));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar validaciones");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCatalog = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const data = await getAMLListsCatalog({ page });
      setCatalog(data.results);
      setCatalogPagination({
        page: data.page,
        hasMore: data.has_more,
        nextPage: data.next_page,
        previousPage: data.previous_page,
        total: data.count,
      });
      
      // Update the local lists structure to match the catalog
      const mappedLists: AMLList[] = data.results.map((item: AMLCatalogItem) => ({
        id: item.short_name,
        title: item.name,
        category: item.country === "INT" ? "Internacional" : item.country,
        description: `${item.number_of_entries || 0} entradas registradas.`,
        country: item.country,
        icon: null, // Icons are handled by the component or defaults
        enabled: true,
        source: item.short_name
      }));
      setLists(mappedLists);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar el catálogo de listas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "validations" && !selectedValidationId && !isCreatingNew) {
      fetchValidations();
    }
    if (viewMode === "config") {
      fetchCatalog(catalogPagination.page);
    }
  }, [viewMode, selectedValidationId, isCreatingNew]);

  const handleCatalogPageChange = (newPage: number) => {
    fetchCatalog(newPage);
  };

  const [lists, setLists] = useState<AMLList[]>([]);
  const [groups, setGroups] = useState<AMLListGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // ... (existing personalization config state remains)

  const handleSelectValidation = async (validationId: string) => {
    setSelectedValidationId(validationId);
    setIsCreatingNew(false);
    setIsLoading(true);
    setError(null);

    try {
      const detail = await getAMLScreeningDetail(validationId);
      // Mapear el detalle "Radiografía"
      const mapped: AMLValidation = {
        id: detail.screening_id,
        name: detail.request.name,
        country: detail.request.country || "ND",
        createdAt: new Date(detail.created_at).toLocaleDateString(),
        verification: detail.response.count > 0 ? "Hit" : "success",
        foundIn: detail.response.count > 0 ? detail.response.results[0]?.data_source?.name : undefined,
        rawDetail: detail, // Save the full response for deep radiography
        details: detail.response.count > 0 ? {
          listName: detail.response.results[0]?.data_source?.name || detail.response.results[0]?.data_source?.short_name,
          matchScore: detail.response.results[0]?.confidence_score * 100,
          source: detail.response.results[0]?.data_source?.name,
          dateFound: new Date(detail.created_at).toLocaleDateString(),
        } : undefined
      };
      setDisplayedValidation(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar el detalle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedValidationId("new");
    setIsCreatingNew(true);
  };

  const handleBackToList = () => {
    setSelectedValidationId(null);
    setIsCreatingNew(false);
    setDisplayedValidation(null);
  };

  const handleStartVerification = async (validation: AMLValidation) => {
    // En una implementación real, aquí llamaríamos a POST /api/aml/screenings
    // Por ahora, simulamos el inicio y recargamos la lista
    setIsCreatingNew(false);
    setSelectedValidationId(null);
    fetchValidations();
  };

  const handleToggleList = (listId: string, enabled: boolean) => {
    setLists((prev) =>
      prev.map((list) => (list.id === listId ? { ...list, enabled } : list))
    );
  };

  const handleCreateGroup = (group: Omit<AMLListGroup, "id">) => {
    const newGroup: AMLListGroup = {
      ...group,
      id: Date.now().toString(),
    };
    setGroups((prev) => [...prev, newGroup]);
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<AMLListGroup>) => {
    setGroups((prev) =>
      prev.map((group) => (group.id === groupId ? { ...group, ...updates } : group))
    );
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
  };

  const handleToggleListInGroup = (groupId: string, listId: string, add: boolean) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          const currentListIds = group.listIds;
          const newListIds = add
            ? [...currentListIds, listId]
            : currentListIds.filter((id) => id !== listId);
          return { ...group, listIds: newListIds };
        }
        return group;
      })
    );
  };

  const selectedValidation = displayedValidation || validations.find((v) => v.id === selectedValidationId);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={translations.pageTitle} />

      {/* Navegación entre vistas */}
      <div className="mb-6 flex gap-4 border-b border-stroke dark:border-dark-3">
        <button
          onClick={() => {
            setViewMode("validations");
            setSelectedValidationId(null);
            setIsCreatingNew(false);
          }}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${viewMode === "validations"
            ? "border-primary text-primary"
            : "border-transparent text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            }`}
        >
          {translations.validationsTitle}
        </button>
        <button
          onClick={() => {
            setViewMode("config");
            setSelectedValidationId(null);
            setIsCreatingNew(false);
          }}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${viewMode === "config"
            ? "border-primary text-primary"
            : "border-transparent text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            }`}
        >
          {translations.config.title}
        </button>
        <button
          onClick={() => {
            setViewMode("personalization");
            setSelectedValidationId(null);
            setIsCreatingNew(false);
          }}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${viewMode === "personalization"
            ? "border-primary text-primary"
            : "border-transparent text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            }`}
        >
          Personalización
        </button>
      </div>

      {viewMode === "config" ? (
        <AMLListConfig
          lists={lists}
          groups={groups}
          onToggleList={handleToggleList}
          onCreateGroup={handleCreateGroup}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          onToggleListInGroup={handleToggleListInGroup}
          pagination={catalogPagination}
          onPageChange={handleCatalogPageChange}
        />
      ) : viewMode === "personalization" ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Panel Izquierdo: Preview */}
          <div
            className="relative min-h-[600px] overflow-hidden rounded-2xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-dark-2"
            data-tour-id="tour-aml-preview"
          >
            <AMLPreviewPanel config={amlConfig} isActive={viewMode === "personalization"} />
          </div>

          {/* Panel Derecho: Configuración */}
          <div className="relative">
            <AMLPersonalizationConfig
              config={amlConfig}
              updateConfig={(updates) => setAmlConfig({ ...amlConfig, ...updates })}
            />
          </div>
        </div>
      ) : selectedValidationId === "new" ? (
        <div>
          <div className="mb-4">
            <Button
              onClick={handleBackToList}
              label={translations.backToValidations}
              variant="outlineDark"
              shape="rounded"
              size="small"
              className="text-sm py-2 px-4"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            />
          </div>
          <AMLValidationForm
            onStartVerification={handleStartVerification}
            onCancel={handleBackToList}
            groups={groups}
            selectedGroupId={selectedGroupId}
          />
        </div>
      ) : selectedValidation ? (
        <div>
          <div className="mb-4">
            <Button
              onClick={handleBackToList}
              label={translations.backToValidations}
              variant="outlineDark"
              shape="rounded"
              size="small"
              className="text-sm py-2 px-4"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            />
          </div>
          <AMLValidationDetail validation={selectedValidation} />
        </div>
      ) : (
        <AMLValidationsList
          validations={validations}
          onSelectValidation={handleSelectValidation}
          onCreateNew={handleCreateNew}
        />
      )}
    </div>
  );
}
