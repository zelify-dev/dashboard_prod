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

export default function ValidationGlobalListPage() {
  const translations = useAMLTranslations();
  const { language } = useLanguage();
  const { isTourActive, currentStep, steps } = useTour();
  const [viewMode, setViewMode] = useState<ViewMode>("validations");
  const [selectedValidationId, setSelectedValidationId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [validations, setValidations] = useState<AMLValidation[]>(mockValidations);
  const [lists, setLists] = useState<AMLList[]>(() => {
    const baseLists = getAMLists(language);
    const storedEnabledMap = readEnabledMapFromStorage();
    return applyEnabledMap(baseLists, storedEnabledMap);
  });
  const [groups, setGroups] = useState<AMLListGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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

  // Actualizar listas cuando cambie el idioma conservando estado enabled
  useEffect(() => {
    setLists((prevLists) => {
      const baseLists = getAMLists(language);
      const previousEnabledMap = prevLists.reduce<Record<string, boolean>>((acc, list) => {
        acc[list.id] = list.enabled;
        return acc;
      }, {});
      const storedEnabledMap = readEnabledMapFromStorage();
      const mergedEnabledMap = { ...previousEnabledMap, ...storedEnabledMap };
      return applyEnabledMap(baseLists, mergedEnabledMap);
    });
  }, [language]);

  // Persistir toggles de listas AML en localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const enabledMap = lists.reduce<Record<string, boolean>>((acc, list) => {
      acc[list.id] = list.enabled;
      return acc;
    }, {});

    window.localStorage.setItem(AML_LISTS_STORAGE_KEY, JSON.stringify(enabledMap));
  }, [lists]);

  // Cambiar a la pestaña correcta cuando el tour busque targets específicos
  useEffect(() => {
    if (isTourActive && steps.length > 0 && currentStep < steps.length) {
      const currentStepData = steps[currentStep];
      if (currentStepData?.target === "tour-aml-preview") {
        setViewMode("personalization");
        // Asegurar que no haya validación seleccionada
        setSelectedValidationId(null);
        setIsCreatingNew(false);
      } else if (currentStepData?.target === "tour-aml-validations-list") {
        setViewMode("validations");
        // Asegurar que no haya validación seleccionada para mostrar la tabla completa
        setSelectedValidationId(null);
        setIsCreatingNew(false);
      } else if (currentStepData?.target === "tour-aml-list-config") {
        setViewMode("config");
        // Asegurar que no haya validación seleccionada
        setSelectedValidationId(null);
        setIsCreatingNew(false);
      }
    }
  }, [isTourActive, currentStep, steps]);

  const handleSelectValidation = (validationId: string) => {
    setSelectedValidationId(validationId);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    setSelectedValidationId("new");
    setIsCreatingNew(true);
  };

  const handleBackToList = () => {
    setSelectedValidationId(null);
    setIsCreatingNew(false);
  };

  const handleStartVerification = (validation: AMLValidation) => {
    // Agregar con estado "pending"
    setValidations((prev) => [validation, ...prev]);
    setSelectedValidationId(null);
    setIsCreatingNew(false);

    // Después de 3-5 segundos, actualizar el estado aleatoriamente
    const delay = 3000 + Math.random() * 2000; // 3-5 segundos

    setTimeout(() => {
      setValidations((prev) => {
        const randomResult = Math.random();
        let updatedValidation: AMLValidation;

        // Obtener las listas verificadas
        const verifiedListIds = validation.verifiedListIds || [];
        const verifiedLists = lists.filter((l) => verifiedListIds.includes(l.id));

        if (randomResult < 0.4 && (verifiedLists.length > 0 || validation.includePEPs?.enabled)) {
          // 40% chance de encontrar un match
          // Si hay PEPs habilitado, considerar también esa opción
          const shouldCheckPEPs = validation.includePEPs?.enabled && Math.random() < 0.3;

          if (shouldCheckPEPs && validation.includePEPs?.country) {
            // Match en PEPs
            updatedValidation = {
              ...validation,
              verification: "PEP",
              foundIn: "PEP",
              foundInListId: "peps",
              details: {
                listName: `PEPs - Personas Expuestas Políticamente de ${validation.includePEPs.country}`,
                matchScore: Math.floor(Math.random() * 20) + 80,
                source: "World-Check",
                dateFound: new Date().toISOString().split("T")[0],
              },
            };
          } else if (verifiedLists.length > 0) {
            // Match en una de las listas AML verificadas
            const randomList = verifiedLists[Math.floor(Math.random() * verifiedLists.length)];
            updatedValidation = {
              ...validation,
              verification: randomList.category,
              foundIn: randomList.category,
              foundInListId: randomList.id,
              details: {
                listName: `${randomList.title} - ${randomList.category}`,
                matchScore: Math.floor(Math.random() * 20) + 80,
                source: randomList.source,
                dateFound: new Date().toISOString().split("T")[0],
              },
            };
          } else {
            // Si solo hay PEPs pero no se encontró match, success
            updatedValidation = {
              ...validation,
              verification: "success",
            };
          }
        } else {
          // 60% chance de success
          updatedValidation = {
            ...validation,
            verification: "success",
          };
        }

        return prev.map((v) => (v.id === validation.id ? updatedValidation : v));
      });
    }, delay);
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

  const selectedValidation = validations.find((v) => v.id === selectedValidationId);

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
