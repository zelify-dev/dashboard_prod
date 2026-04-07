"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";
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
  pagination?: {
    page: number;
    hasMore: boolean;
    nextPage: number | null;
    previousPage: number | null;
    total: number;
  };
  onPageChange?: (page: number) => void;
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
  pagination,
  onPageChange,
}: AMLListConfigProps) {
  const translations = useAMLTranslations();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedListsForGroup, setSelectedListsForGroup] = useState<string[]>([]);

  const getJurisdictionIcon = (countryCode: string) => {
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

    // Convert ISO code to regional indicator symbols (Flag Emoji)
    try {
      return countryCode
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
    } catch (e) {
      return "📍";
    }
  };

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
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => {
          const handleToggle = (enabled: boolean) => {
            if (selectedGroup && selectedGroupId) {
              if (onToggleListInGroup) {
                onToggleListInGroup(selectedGroupId, list.id, enabled);
              } else {
                const currentListIds = selectedGroup.listIds;
                onUpdateGroup(selectedGroupId, {
                  listIds: enabled ? [...currentListIds, list.id] : currentListIds.filter((id) => id !== list.id)
                });
              }
            } else {
              onToggleList(list.id, enabled);
            }
          };

          return (
            <div
              key={list.id}
              className={cn(
                "flex h-full flex-col rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-dark-2",
                list.enabled ? "border-stroke dark:border-dark-3" : "border-gray-200 opacity-60 dark:border-dark-4"
              )}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-2xl dark:bg-primary/20">
                    {getJurisdictionIcon(list.country)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-dark dark:text-white line-clamp-2">
                      {list.title}
                    </h3>
                    <p className="text-xs text-dark-6 dark:text-dark-6 uppercase font-bold tracking-wider">
                      {list.country}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mb-4 text-sm text-dark-6 dark:text-dark-6 line-clamp-3">
                {list.description}
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-stroke pt-4 dark:border-dark-3">
                <div className="flex items-center gap-2">
                  <Toggle enabled={list.enabled} onChange={handleToggle} />
                  <span className="text-xs text-dark-6 dark:text-dark-6">
                    {list.enabled ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pagination && onPageChange && (
        <div className="mt-8 flex items-center justify-between border-t border-stroke py-4 dark:border-dark-3">
          <p className="text-sm text-dark-6">
            Página <span className="font-bold text-dark dark:text-white">{pagination.page}</span> de <span className="font-bold text-dark dark:text-white">{Math.ceil(pagination.total / 25)}</span> ({pagination.total} listas totales)
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => pagination.previousPage && onPageChange(pagination.previousPage)}
              disabled={!pagination.previousPage}
              label="Anterior"
              variant="outlineDark"
              size="small"
              shape="rounded"
            />
            <Button
              onClick={() => pagination.nextPage && onPageChange(pagination.nextPage)}
              disabled={!pagination.hasMore}
              label="Próxima"
              variant="primary"
              size="small"
              shape="rounded"
            />
          </div>
        </div>
      )}

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
                  className="block w-full rounded-lg border border-stroke bg-white px-4 py-2 text-sm text-dark dark:border-dark-3 dark:bg-dark-3 dark:text-white"
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
                  className="block w-full rounded-lg border border-stroke bg-white px-4 py-2 text-sm text-dark dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
                  {translations.config.selectLists}
                </label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-stroke p-3 dark:border-dark-3">
                  {lists.map((list) => (
                    <label key={list.id} className="flex items-center gap-2 text-sm text-dark dark:text-white">
                      <input
                        type="checkbox"
                        checked={selectedListsForGroup.includes(list.id)}
                        onChange={(e) => {
                          setSelectedListsForGroup(e.target.checked ? [...selectedListsForGroup, list.id] : selectedListsForGroup.filter((id) => id !== list.id));
                        }}
                        className="h-4 w-4 rounded border-stroke text-primary"
                      />
                      <span>{list.title}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleCreateGroup} label={translations.config.create} variant="primary" size="small" shape="rounded" className="flex-1" />
                <Button onClick={() => setShowCreateGroupModal(false)} label={translations.config.cancel} variant="outlineDark" size="small" shape="rounded" className="flex-1" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
