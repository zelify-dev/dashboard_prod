"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui-elements/button";
import { useAMLTranslations } from "./_components/use-aml-translations";
import { AMLValidationsList, AMLValidation } from "./_components/aml-validations-list";
import { AMLValidationDetail } from "./_components/aml-validation-detail";
import { AMLValidationForm } from "./_components/aml-validation-form";
import { AMLListConfig, AMLList, AMLListGroup } from "./_components/aml-list-config";
import { 
  getAMLScreenings, 
  getAMLScreeningDetail, 
  getAMLListsCatalog, 
  getAMLGroups,
  createAMLGroup,
  updateAMLGroup,
  deleteAMLGroup,
  AMLScreeningItem, 
  AMLCatalogItem,
  AMLGroup
} from "@/lib/aml-api";

function parseListSources(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== "all" && part !== "*");
}

export default function AMLValidationPage() {
  const translations = useAMLTranslations();
  const [activeTab, setActiveTab] = useState<"auditoria" | "configuracion">("auditoria");
  const [validations, setValidations] = useState<AMLValidation[]>([]);
  const [selectedValidation, setSelectedValidation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<AMLList[]>([]);
  const [groups, setGroups] = useState<AMLListGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [fullCatalog, setFullCatalog] = useState<AMLList[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized Search & Pagination (100% Client-Side)
  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return fullCatalog;
    const term = catalogSearch.toLowerCase().trim();
    return fullCatalog.filter(list => 
      list.title.toLowerCase().includes(term) ||
      list.country.toLowerCase().includes(term) ||
      list.id.toLowerCase().includes(term)
    );
  }, [fullCatalog, catalogSearch]);

  const paginatedCatalog = useMemo(() => {
    const itemsPerPage = 25;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCatalog.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCatalog, currentPage]);

  const catalogPagination = useMemo(() => ({
    page: currentPage,
    total: filteredCatalog.length,
    hasMore: currentPage * 25 < filteredCatalog.length,
    nextPage: currentPage * 25 < filteredCatalog.length ? currentPage + 1 : null,
    previousPage: currentPage > 1 ? currentPage - 1 : null
  }), [currentPage, filteredCatalog.length]);

  // Initial data fetch
  useEffect(() => {
    fetchAuditoria();
    fetchFullCatalog(); // One-shot load
    fetchGroups();
  }, []);

  // Reset page to 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [catalogSearch]);

  const fetchAuditoria = async () => {
    try {
      const data = await getAMLScreenings();
      setValidations(data.items.map(mapScreeningToValidation));
    } catch (err) {
      console.error("Error fetching screenings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullCatalog = async () => {
    try {
      setIsCatalogLoading(true);
      let allMappedLists: AMLList[] = [];
      let pageToFetch = 1;
      let hasMore = true;
      let safetyCounter = 0;

      while (hasMore && safetyCounter < 15) { // Cap at 15 pages for safety
        safetyCounter++;
        const data = await getAMLListsCatalog({ page: pageToFetch });
        
        const mappedPage: AMLList[] = data.results.map((item: AMLCatalogItem) => ({
          id: item.short_name,
          title: item.name,
          category: "Global List",
          description: `Lista oficial de ${item.country}. Contiene registros de sanciones y personas expuestas.`,
          country: item.country,
          icon: null,
          enabled: true,
          source: item.short_name,
          number_of_entries: item.number_of_entries,
          last_update: item.last_update_info?.timestamp
        }));

        allMappedLists = [...allMappedLists, ...mappedPage];
        hasMore = data.has_more && data.next_page !== null;
        pageToFetch = data.next_page || (pageToFetch + 1);

        if (!hasMore) break;
      }
      
      setFullCatalog(allMappedLists);
    } catch (err) {
      console.error("❌ [Catalog] Error in recursive full load:", err);
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await getAMLGroups();
      
      // Deduplicate by name if the backend has duplicates, keeping only the latest/unique
      const uniqueMap = new Map();
      data.forEach((g: AMLGroup) => {
        uniqueMap.set(g.name, g); // Using name as key to solve "porque sale asi"
      });
      
      const mappedGroups: AMLListGroup[] = Array.from(uniqueMap.values()).map((g: AMLGroup) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        sources: g.sources,
        min_score: g.min_score
      }));
      setGroups(mappedGroups);
    } catch (err) {
      console.error("❌ Error fetching groups:", err);
    }
  };

  const handleCreateGroup = async (groupData: Omit<AMLListGroup, "id">) => {
    try {
      await createAMLGroup({
        name: groupData.name,
        description: groupData.description,
        sources: groupData.sources,
        min_score: groupData.min_score
      });
      fetchGroups();
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const handleUpdateGroup = async (groupId: string, updateData: Partial<AMLListGroup>) => {
    try {
      await updateAMLGroup(groupId, {
        name: updateData.name,
        description: updateData.description,
        sources: updateData.sources,
        min_score: updateData.min_score
      });
      fetchGroups();
    } catch (err) {
      console.error("Error updating group:", err);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteAMLGroup(groupId);
      fetchGroups();
    } catch (err) {
      console.error("Error deleting group:", err);
    }
  };

  const mapScreeningToValidation = (item: AMLScreeningItem): AMLValidation => ({
    id: item.screening_id,
    name: item.name,
    country: "Global",
    documentNumber: "N/D",
    verification: item.has_matches ? "hit" : "success",
    createdAt: new Date(item.created_at).toLocaleDateString(),
    verifiedListIds: parseListSources((item as AMLScreeningItem & { data_source?: unknown }).data_source),
  });

  const handleViewDetail = async (id: string) => {
    try {
      const detail = await getAMLScreeningDetail(id);
      const requestData = detail?.request as { data_source?: unknown; sources?: unknown } | undefined;
      const detailedSources = [
        ...parseListSources(requestData?.data_source),
        ...parseListSources(requestData?.sources),
      ];

      setValidations(prev => prev.map(v => 
        v.id === id
          ? {
              ...v,
              rawDetail: detail,
              verifiedListIds: Array.from(new Set([...(v.verifiedListIds || []), ...detailedSources])),
            }
          : v
      ));
      setSelectedValidation(id);
    } catch (err) {
      console.error("Error fetching screening detail:", err);
    }
  };

  const selectedValidationData = validations.find((v) => v.id === selectedValidation);

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* View Selectors */}
      <div className="mb-6 flex space-x-8 border-b border-stroke dark:border-dark-3">
        <button
          onClick={() => {
            setActiveTab("auditoria");
            setSelectedValidation(null);
            setShowForm(false);
          }}
          className={cn(
            "pb-4 text-sm font-bold transition-all",
            activeTab === "auditoria" 
              ? "border-b-2 border-primary text-primary" 
              : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
          )}
        >
          Historial de Auditoría
        </button>
        <button
          onClick={() => setActiveTab("configuracion")}
          className={cn(
            "pb-4 text-sm font-bold transition-all",
            activeTab === "configuracion" 
              ? "border-b-2 border-primary text-primary" 
              : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
          )}
        >
          Configuración de Listas y Grupos
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 2xl:gap-7.5">
        {activeTab === "auditoria" ? (
          selectedValidationData ? (
            <div>
              <Button
                onClick={() => setSelectedValidation(null)}
                label={translations.backToValidations}
                variant="outlineDark"
                size="small"
                shape="rounded"
                className="mb-4"
              />
              <AMLValidationDetail validation={selectedValidationData} />
            </div>
          ) : showForm ? (
            <div>
              <Button
                onClick={() => setShowForm(false)}
                label={translations.backToValidations}
                variant="outlineDark"
                size="small"
                shape="rounded"
                className="mb-4"
              />
              <AMLValidationForm 
                groups={groups}
                selectedGroupId={selectedGroupId}
                onStartVerification={(v) => {
                  setValidations(prev => [v, ...prev]);
                  setShowForm(false);
                  setActiveTab("auditoria");
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          ) : (
            <AMLValidationsList
              validations={validations}
              onSelectValidation={handleViewDetail}
              onCreateNew={() => setShowForm(true)}
              loading={loading}
            />
          )
        ) : (
          <AMLListConfig 
            lists={paginatedCatalog}
            groups={groups}
            onToggleList={() => {}}
            onCreateGroup={handleCreateGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            pagination={catalogPagination}
            onPageChange={setCurrentPage}
            searchTerm={catalogSearch}
            onSearch={setCatalogSearch}
            isLoading={isCatalogLoading}
          />
        )}
      </div>
    </div>
  );
}
