"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { useAMLTranslations } from "./use-aml-translations";

export interface AMLList {
  id: string;
  title: string;
  category: string;
  description: string;
  country: string;
  icon: React.ReactNode;
  enabled: boolean;
  source: string;
}

export interface AMLListGroup {
  id: string;
  name: string;
  description?: string;
  listIds: string[];
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
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        enabled ? "bg-primary" : "bg-gray-300 dark:bg-dark-3"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
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
}: AMLListConfigProps) {
  const translations = useAMLTranslations();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedListsForGroup, setSelectedListsForGroup] = useState<string[]>([]);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    onCreateGroup({
      name: newGroupName,
      description: newGroupDescription,
      listIds: selectedListsForGroup,
    });
    
    setShowCreateGroupModal(false);
    setNewGroupName("");
    setNewGroupDescription("");
    setSelectedListsForGroup([]);
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="mt-6 space-y-6">
      {/* Header con botón de crear grupo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            {translations.config.title}
          </h2>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            {translations.config.description}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateGroupModal(true)}
          label={translations.config.newGroup}
          variant="primary"
          shape="rounded"
          size="small"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        />
      </div>

      {/* Selector de grupo */}
      {groups.length > 0 && (
        <div className="rounded-lg border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
          <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
            {translations.config.selectGroup}
          </label>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id === selectedGroupId ? null : group.id)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  selectedGroupId === group.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-stroke bg-white text-dark hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
                )}
              >
                {group.name}
              </button>
            ))}
            <button
              onClick={() => onSelectGroup(null)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                selectedGroupId === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-stroke bg-white text-dark hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
              )}
            >
              {translations.config.allLists}
            </button>
          </div>
        </div>
      )}

      {/* Grid de listas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((list, index) => {
          const isInSelectedGroup = selectedGroup
            ? selectedGroup.listIds.includes(list.id)
            : true;
          
          // Si hay un grupo seleccionado, mostrar si está en el grupo; si no, mostrar estado global
          const toggleEnabled = selectedGroup ? isInSelectedGroup : list.enabled;
          const isVisible = selectedGroup ? isInSelectedGroup : list.enabled;

          const handleToggle = (enabled: boolean) => {
            if (selectedGroup && selectedGroupId) {
              // Si hay un grupo seleccionado, agregar/quitar del grupo
              if (onToggleListInGroup) {
                onToggleListInGroup(selectedGroupId, list.id, enabled);
              } else {
                // Fallback: actualizar el grupo directamente
                const currentListIds = selectedGroup.listIds;
                const newListIds = enabled
                  ? [...currentListIds, list.id]
                  : currentListIds.filter((id) => id !== list.id);
                onUpdateGroup(selectedGroupId, { listIds: newListIds });
              }
            } else {
              // Si no hay grupo seleccionado, activar/desactivar globalmente
              onToggleList(list.id, enabled);
            }
          };

          return (
            <div
              key={list.id}
              data-tour-id={index === 0 ? "tour-aml-list-config" : undefined}
              className={cn(
                "flex h-full flex-col rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-dark-2",
                isVisible
                  ? "border-stroke dark:border-dark-3"
                  : "border-gray-200 opacity-60 dark:border-dark-4"
              )}
            >
              {/* Header con icono y toggle */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                    {list.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-dark dark:text-white">
                      {list.title}
                    </h3>
                    <p className="text-xs text-dark-6 dark:text-dark-6">{list.category}</p>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <p className="mb-4 text-sm text-dark-6 dark:text-dark-6 whitespace-normal break-words">
                {list.description}
              </p>

              {/* Footer con toggle */}
              <div className="mt-auto flex items-center justify-between border-t border-stroke pt-4 dark:border-dark-3">
                <div className="flex items-center gap-2">
                  <Toggle
                    enabled={toggleEnabled}
                    onChange={handleToggle}
                  />
                  <span className="text-xs text-dark-6 dark:text-dark-6">
                    {toggleEnabled
                      ? translations.config.listScreening
                      : translations.config.listNotScreening}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de crear grupo */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-dark-2">
            <h3 className="mb-4 text-xl font-bold text-dark dark:text-white">
              {translations.config.createGroup}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
                  {translations.config.groupName}
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={translations.config.groupNamePlaceholder}
                  className="block w-full rounded-lg border border-stroke bg-white px-4 py-2 text-sm text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
                  {translations.config.groupDescription}
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder={translations.config.groupDescriptionPlaceholder}
                  rows={3}
                  className="block w-full rounded-lg border border-stroke bg-white px-4 py-2 text-sm text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
                  {translations.config.selectLists}
                </label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-stroke p-3 dark:border-dark-3">
                  {lists.map((list) => (
                    <label
                      key={list.id}
                      className="flex items-center gap-2 text-sm text-dark dark:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={selectedListsForGroup.includes(list.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedListsForGroup([...selectedListsForGroup, list.id]);
                          } else {
                            setSelectedListsForGroup(
                              selectedListsForGroup.filter((id) => id !== list.id)
                            );
                          }
                        }}
                        className="h-4 w-4 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3"
                      />
                      <span>{list.title} - {list.category}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCreateGroup}
                  label={translations.config.create}
                  variant="primary"
                  shape="rounded"
                  size="small"
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    setShowCreateGroupModal(false);
                    setNewGroupName("");
                    setNewGroupDescription("");
                    setSelectedListsForGroup([]);
                  }}
                  label={translations.config.cancel}
                  variant="outlineDark"
                  shape="rounded"
                  size="small"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
