"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  DEFAULT_TEMPLATE_GROUPS,
  type NotificationTemplate,
  type TemplateStatus,
  type TemplateChannel,
  type TemplateGroup,
} from "./notifications-data";
import { useNotificationsTranslations } from "./use-notifications-translations";
import {
  ACTIVE_MAP_EVENT,
  TEMPLATE_OVERRIDES_EVENT,
  getDefaultActiveMap,
  readActiveMap,
  readTemplateOverrides,
  saveCustomTemplate,
  writeActiveMap,
  type TemplateOverrides,
  type ActiveTemplateMap,
} from "./notifications-storage";
import { SyntaxHighlightTextarea } from "./syntax-highlight-textarea";

type DerivedStatus = "active" | "inactive" | "draft";
type RemoteTemplateStatus = {
  name: string;
  active: boolean | string;
};

const parseRemoteActive = (value: boolean | string | undefined): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
};

const OTP_ALLOWED_VARIABLES = new Set(["${safename}", "${code}"]);

const htmlContainsOtpVariables = (html: string) => {
  const normalized = html.toLowerCase();
  return normalized.includes("${safename}") && normalized.includes("${code}");
};

const findTemplateVariables = (html: string) => {
  const regex = /\$\{[^}]+\}/gi;
  const matches = html.match(regex);
  if (!matches) return [];
  return matches.map((item) => item.toLowerCase());
};

const CHANNEL_ORDER: TemplateChannel[] = ["mailing", "notifications"];
const CHANNEL_STYLES: Record<
  TemplateChannel,
  { baseColor: string; accent: string; badge: string }
> = {
  mailing: {
    baseColor: "#004195",
    accent: "text-sky-100",
    badge: "bg-white/20 text-white",
  },
  notifications: {
    baseColor: "#004195",
    accent: "text-orange-50",
    badge: "bg-white/20 text-white",
  },
};

export function NotificationsPageContent() {
  const router = useRouter();
  const { language } = useLanguage();
  const locale = language === "es" ? "es-ES" : "en-US";
  const translations = useNotificationsTranslations();

  const [templates, setTemplates] = useState<NotificationTemplate[]>(DEFAULT_NOTIFICATION_TEMPLATES);
  const [groups, setGroups] = useState<TemplateGroup[]>(DEFAULT_TEMPLATE_GROUPS);
  const [selectedChannel, setSelectedChannel] = useState<TemplateChannel>("mailing");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    const firstGroup = DEFAULT_TEMPLATE_GROUPS.find((group) => group.channel === "mailing");
    return firstGroup?.id ?? null;
  });
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateHtml, setNewTemplateHtml] = useState("");
  const [newTemplateCompanyId, setNewTemplateCompanyId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [previewFrom, setPreviewFrom] = useState("notifications@zelify.com");
  const [previewSubject, setPreviewSubject] = useState("");
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [previewFrameKey, setPreviewFrameKey] = useState(0);
  const [templateSubmitStatus, setTemplateSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [templateSubmitMessage, setTemplateSubmitMessage] = useState<string | null>(null);
  const [newTemplateNameError, setNewTemplateNameError] = useState<string | null>(null);
  const [newTemplateHtmlError, setNewTemplateHtmlError] = useState<string | null>(null);
  const defaultActiveMap = useMemo(() => getDefaultActiveMap(templates), [templates]);
  const [activeMap, setActiveMap] = useState<ActiveTemplateMap>(defaultActiveMap);
  const [hydrated, setHydrated] = useState(false);
  const [templateOverrides, setTemplateOverrides] = useState<TemplateOverrides>({});
  const [remoteStatuses, setRemoteStatuses] = useState<Record<string, Record<string, boolean>>>({});
  const [remoteTemplatesMap, setRemoteTemplatesMap] = useState<Record<string, RemoteTemplateStatus[]>>({});
  const renderedTemplateHtml = useMemo(() => {
    if (newTemplateHtml.trim()) return newTemplateHtml;
    return `<html><body style="font-family: Arial, sans-serif; padding: 40px; background: #f4f6fb;">
      <h2 style="margin-top:0;">${translations.createTemplate.previewFallbackTitle}</h2>
      <p>${translations.createTemplate.previewFallbackBody}</p>
    </body></html>`;
  }, [
    newTemplateHtml,
    translations.createTemplate.previewFallbackBody,
    translations.createTemplate.previewFallbackTitle,
  ]);
  const defaultTemplateIds = useMemo(() => new Set(DEFAULT_NOTIFICATION_TEMPLATES.map((template) => template.id)), []);
  const userDefinedTemplates = useMemo(
    () => templates.filter((template) => !defaultTemplateIds.has(template.id)),
    [templates, defaultTemplateIds],
  );

  useEffect(() => {
    const stored = readActiveMap();
    if (stored) {
      setActiveMap((prev) => ({ ...prev, ...stored }));
    }
    const overrides = readTemplateOverrides();
    if (overrides) {
      setTemplateOverrides(overrides);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    setPreviewFrameKey((key) => key + 1);
  }, [renderedTemplateHtml]);

  const handlePreviewLoad = useCallback(() => {
    const frame = previewFrameRef.current;
    if (!frame) return;
    const doc = frame.contentDocument;
    if (!doc) return;
    const height = doc.documentElement.scrollHeight || doc.body.scrollHeight;
    frame.style.height = `${Math.max(height, 600)}px`;
  }, []);

  useEffect(() => {
    if (hydrated) {
      writeActiveMap(activeMap);
    }
  }, [activeMap, hydrated]);

  useEffect(() => {
    const handler = () => {
      const stored = readActiveMap();
      if (stored) {
        setActiveMap((prev) => {
          if (mapsEqual(prev, stored)) return prev;
          return { ...prev, ...stored };
        });
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener(ACTIVE_MAP_EVENT, handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(ACTIVE_MAP_EVENT, handler);
      }
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      const stored = readTemplateOverrides();
      if (stored) {
        setTemplateOverrides(stored);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener(TEMPLATE_OVERRIDES_EVENT, handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(TEMPLATE_OVERRIDES_EVENT, handler);
      }
    };
  }, []);

  const templatesWithOverrides = useMemo(
    () => applyOverrides(templates, templateOverrides),
    [templates, templateOverrides],
  );

  const getTemplateCopy = useCallback(
    (template: NotificationTemplate) => {
      const translation = translations.templates[template.key as keyof typeof translations.templates];
      if (translation) return translation;
      return {
        name: template.name ?? template.key,
        subject: template.subject ?? "",
        description: template.description ?? "",
      };
    },
    [translations.templates],
  );

  const getTemplateNameKey = useCallback(
    (template: NotificationTemplate) => {
      const copy = getTemplateCopy(template);
      return (template.name ?? copy.name ?? template.key).toLowerCase();
    },
    [getTemplateCopy],
  );

  const getDerivedStatus = useCallback(
    (template: NotificationTemplate): DerivedStatus => {
      if (template.status === "draft") return "draft";
      const remoteGroup = remoteStatuses[template.groupId];
      if (remoteGroup) {
        const nameKey = getTemplateNameKey(template);
        if (remoteGroup[nameKey] !== undefined) {
          return remoteGroup[nameKey] ? "active" : "inactive";
        }
      }
      const activeId = activeMap[template.groupId] ?? defaultActiveMap[template.groupId];
      return activeId === template.id ? "active" : "inactive";
    },
    [activeMap, defaultActiveMap, remoteStatuses, getTemplateNameKey],
  );

  const channelCollections = useMemo(
    () =>
      CHANNEL_ORDER.map((channel) => {
        const items = templatesWithOverrides.filter((tpl) => tpl.channelGroup === channel);
        const active = items.find((tpl) => getDerivedStatus(tpl) === "active") ?? null;
        return { channel, items, active };
      }),
    [templatesWithOverrides, getDerivedStatus],
  );

  const channelInfo = {
    mailing: translations.categorySelector.mailing,
    notifications: translations.categorySelector.notifications,
  };

  const remoteTemplateNameSet = useMemo(() => {
    const names = new Set<string>();
    Object.values(remoteTemplatesMap).forEach((items) => {
      items?.forEach((item) => {
        const key = item.name?.trim().toLowerCase();
        if (key) names.add(key);
      });
    });
    return names;
  }, [remoteTemplatesMap]);

  const isDuplicateTemplateName = useCallback(
    (value: string) => {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return false;
      if (remoteTemplateNameSet.has(normalized)) return true;
      return userDefinedTemplates.some((template) => {
        const comparisonName = getTemplateNameKey(template);
        return comparisonName === normalized || template.id === slugify(value);
      });
    },
    [userDefinedTemplates, getTemplateNameKey, remoteTemplateNameSet],
  );

  const channelCards = channelCollections.map((entry) => {
    const info = channelInfo[entry.channel];
    const styles = CHANNEL_STYLES[entry.channel];
    const isSelected = entry.channel === selectedChannel;
    return {
      ...entry,
      info,
      styles,
      isSelected,
    };
  });

  const currentGroups = groups.filter((group) => group.channel === selectedChannel);
  const selectedGroup = currentGroups.find((group) => group.id === selectedGroupId) ?? currentGroups[0] ?? null;
  const remoteTemplatesForGroup = selectedGroup ? remoteTemplatesMap[selectedGroup.id] : undefined;

  const templatesInGroup = useMemo(() => {
    if (!selectedGroup) return [];
    const remoteEntries = remoteTemplatesMap[selectedGroup.id];
    if (!remoteEntries) return [];
    return remoteEntries.map((remote) => {
      const remoteIsActive = parseRemoteActive(remote.active);
      const normalizedName = remote.name?.trim().toLowerCase() ?? "";
      const match = templatesWithOverrides.find(
        (template) => template.groupId === selectedGroup.id && getTemplateNameKey(template) === normalizedName,
      );
      if (match) {
        const status: TemplateStatus = remoteIsActive ? "active" : match.status === "draft" ? "draft" : "inactive";
        return {
          ...match,
          status,
        } satisfies NotificationTemplate;
      }
      const nowIso = new Date().toISOString();
      const fallbackStatus: TemplateStatus = remoteIsActive ? "active" : "inactive";
      return {
        id: slugify(remote.name ?? `remote-${nowIso}`),
        key: slugify(remote.name ?? `remote-${nowIso}`),
        groupId: selectedGroup.id,
        channelGroup: selectedGroup.channel,
        channel: selectedGroup.channel === "mailing" ? "email" : "push",
        status: fallbackStatus,
        updatedAt: nowIso,
        lastUsed: nowIso,
        metrics: {
          openRate: 0,
          ctr: 0,
        },
        name: remote.name ?? translations.remote.remoteTemplateName,
        subject: remote.name ?? translations.remote.remoteTemplateName,
        description: translations.remote.remoteTemplateDescription,
        html: {
          en: "",
          es: "",
        },
        variables: [],
      } satisfies NotificationTemplate;
    });
  }, [
    remoteTemplatesMap,
    selectedGroup,
    templatesWithOverrides,
    getTemplateNameKey,
    translations.remote.remoteTemplateDescription,
    translations.remote.remoteTemplateName,
  ]);
  const remoteStatusForGroup = selectedGroup ? remoteStatuses[selectedGroup.id] : undefined;

  useEffect(() => {
    if (!selectedGroup || typeof window === "undefined") return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      channel: selectedChannel,
      category: selectedGroup.name,
    });
    const load = async () => {
      try {
        const response = await fetch(`/api/templates/by-filters?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch template statuses: ${response.status}`);
        }
        const data = (await response.json()) as RemoteTemplateStatus[];
        const normalized = data.reduce<Record<string, boolean>>((acc, item) => {
          const key = item.name?.trim().toLowerCase();
          if (key) {
            const isActive = parseRemoteActive(item.active);
            acc[key] = isActive;
          }
          return acc;
        }, {});
        setRemoteStatuses((prev) => ({ ...prev, [selectedGroup.id]: normalized }));
        const normalizedTemplates = data.map((item) => ({
          ...item,
          active: parseRemoteActive(item.active),
        }));
        setRemoteTemplatesMap((prev) => ({ ...prev, [selectedGroup.id]: normalizedTemplates }));
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
        console.warn("Error fetching template statuses", error);
      }
    };
    load();
    return () => controller.abort();
  }, [selectedChannel, selectedGroup]);

  const statusLabel = (status: "active" | "inactive" | "draft") => translations.templateList.status[status];

  const handleOpenTemplate = (templateId: string) => {
    const template = templatesInGroup.find((item) => item.id === templateId);
    if (template) {
      saveCustomTemplate(template);
    }
    router.push(`/pages/products/notifications/${templateId}`);
  };

  const handleCreateTemplate = async () => {
    if (!selectedGroup || !newTemplateName.trim() || !newTemplateHtml.trim()) {
      setTemplateSubmitStatus("error");
      setTemplateSubmitMessage(translations.validation.completeNameAndHtml);
      if (!newTemplateName.trim()) {
        setNewTemplateNameError(translations.validation.templateNameRequired);
      }
      if (!newTemplateHtml.trim()) {
        setNewTemplateHtmlError(translations.validation.templateHtmlRequired);
      }
      return;
    }
    if (selectedGroup.name.toLowerCase() === "otp") {
      const hasRequiredVariables = htmlContainsOtpVariables(newTemplateHtml);
      const variables = findTemplateVariables(newTemplateHtml);
      const disallowed = variables.filter((variable) => !OTP_ALLOWED_VARIABLES.has(variable));
      if (!hasRequiredVariables) {
        setTemplateSubmitStatus("error");
        setTemplateSubmitMessage(translations.validation.otpMissingRequiredVars);
        setNewTemplateHtmlError(translations.validation.otpMissingRequiredVarsField);
        return;
      }
      if (disallowed.length > 0) {
        setTemplateSubmitStatus("error");
        setTemplateSubmitMessage(translations.validation.otpOnlyAllowedVars);
        setNewTemplateHtmlError(translations.validation.otpRemoveDisallowedVars(disallowed.join(", ")));
        return;
      }
    }
    const localTemplateId = slugify(newTemplateName);
    if (isDuplicateTemplateName(newTemplateName) || userDefinedTemplates.some((template) => template.id === localTemplateId)) {
      setTemplateSubmitStatus("error");
      setTemplateSubmitMessage(translations.validation.templateNameUnique);
      setNewTemplateNameError(translations.validation.templateNameDuplicate);
      return;
    }
    setNewTemplateNameError(null);
    setNewTemplateHtmlError(null);
    setTemplateSubmitStatus("loading");
    setTemplateSubmitMessage(null);
    const finalSubject = previewSubject.trim() || newTemplateName.trim();
    const payload = {
      companyId: newTemplateCompanyId.trim(),
      channel: selectedChannel,
      category: selectedGroup.name,
      name: newTemplateName.trim(),
      template: newTemplateHtml,
      active: false,
      from: previewFrom.trim() || "notifications@zelify.com",
      subject: (previewSubject.trim() || finalSubject),
    };

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("[notifications] Creating template payload", JSON.stringify(payload, null, 2));
      if (!response.ok) {
        throw new Error("request failed");
      }
      const result = await response.json().catch(() => null);
      if (result !== "success") {
        throw new Error("failed");
      }
      const normalizedChannel = selectedChannel === "mailing" ? "email" : "push";
      const nowIso = new Date().toISOString();
      const newTemplate: NotificationTemplate = {
        id: localTemplateId,
        key: localTemplateId,
        groupId: selectedGroup.id,
        channelGroup: selectedChannel,
        channel: normalizedChannel,
        status: "inactive",
        updatedAt: nowIso,
        lastUsed: nowIso,
        metrics: {
          openRate: 0,
          ctr: 0,
        },
        from: previewFrom.trim() || "notifications@zelify.com",
        name: newTemplateName.trim(),
        subject: previewSubject.trim() || finalSubject,
        description: translations.templateList.customTemplateFallback,
        html: {
          en: newTemplateHtml,
          es: newTemplateHtml,
        },
        variables: [],
      };
      setTemplates((prev) => [...prev, newTemplate]);
      saveCustomTemplate(newTemplate);
      setRemoteStatuses((prev) => ({
        ...prev,
        [selectedGroup.id]: {
          ...(prev[selectedGroup.id] ?? {}),
          [newTemplateName.trim().toLowerCase()]: false,
        },
      }));
      setTemplateSubmitStatus("success");
      setTemplateSubmitMessage(translations.validation.createdSuccess);
      setNewTemplateName("");
      setNewTemplateHtml("");
      setNewTemplateHtmlError(null);
      setNewTemplateCompanyId("");
      setPreviewFrom("notifications@zelify.com");
      router.refresh();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error creating template", error);
      setTemplateSubmitStatus("error");
      setTemplateSubmitMessage(translations.validation.createdError);
      setNewTemplateNameError(translations.validation.createdError);
    }
  };

  const handleCreateGroup = useCallback(() => {
    const name = newGroupName.trim();
    const description = newGroupDescription.trim();
    if (!name) return;

    const normalized = name.toLowerCase();
    const existing = groups.find(
      (group) => group.channel === selectedChannel && group.name.trim().toLowerCase() === normalized,
    );
    if (existing) {
      setSelectedGroupId(existing.id);
      setNewGroupName("");
      setNewGroupDescription("");
      return;
    }

    const newGroupId = `${selectedChannel}-${slugify(name)}`;
    const newGroup: TemplateGroup = {
      id: newGroupId,
      name,
      description: description || translations.categories.customDescriptionFallback,
      channel: selectedChannel,
    };
    setGroups((prev) => [...prev, newGroup]);
    setSelectedGroupId(newGroupId);
    setNewGroupName("");
    setNewGroupDescription("");
  }, [newGroupName, newGroupDescription, groups, selectedChannel, translations.categories.customDescriptionFallback]);

  const handleChannelChange = (channel: TemplateChannel) => {
    setSelectedChannel(channel);
    const firstGroup = groups.find((group) => group.channel === channel);
    setSelectedGroupId(firstGroup?.id ?? null);
  };

  return (
    <div className="mx-auto w-full max-w-[1150px] ">
      <Breadcrumb pageName={translations.breadcrumb} />
      <div className="space-y-8">
        <header className="rounded-3xl border border-stroke bg-gradient-to-r from-primary/5 via-sky-100 to-indigo-100 p-6 dark:border-dark-3 dark:from-primary/10 dark:via-slate-800 dark:to-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary dark:text-primary/70">
                {translations.header.templatesBadge}
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-dark dark:text-white">{translations.pageTitle}</h1>
              <p className="mt-2 max-w-2xl text-sm text-dark-5 dark:text-dark-6">{translations.pageDescription}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {channelCards.map((card) => (
            <button
              key={card.channel}
              onClick={() => handleChannelChange(card.channel)}
              className={cn(
                "group relative overflow-hidden rounded-3xl border-2 p-5 text-left shadow-lg transition-all",
                card.isSelected ? "bg-[#6AFF00] text-dark" : "bg-[#1F4D93] text-white",
                card.isSelected ? "border-[#6AFF00] ring-4 ring-[#6AFF00]/30" : "border-transparent opacity-80 hover:opacity-100",
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p
                    className={cn(
                      "text-xs uppercase tracking-wider",
                      card.isSelected ? "text-black/70" : "text-white/80",
                    )}
                  >
                    {translations.categorySelector.title}
                  </p>
                  <h2 className={cn("mt-2 text-2xl font-semibold", card.isSelected ? "text-black" : "text-white")}>{card.info.label}</h2>
                  <p className={cn("mt-2 max-w-sm text-sm", card.isSelected ? "text-black/70" : card.styles.accent)}>
                    {card.info.description}
                  </p>
                </div>
                <div className={cn("text-right", card.isSelected ? "text-black" : "text-white")}> 
                  <p className="text-3xl font-bold">{card.items.length}</p>
                  <p className="text-xs uppercase tracking-widest">{translations.summaryCards.total}</p>
                  {card.active && (
                    <span className={cn(
                      "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                      card.styles.badge,
                      card.isSelected && "bg-black/10 text-black",
                    )}>
                      {translations.summaryCards.active}: {translations.templates[card.active.key].name}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{translations.categories.title}</p>
              <h2 className="text-2xl font-semibold text-dark dark:text-white">{translations.categories.subtitle}</h2>
              <p className="text-sm text-dark-5 dark:text-dark-6">
                {translations.categories.selectedChannelLabel(channelInfo[selectedChannel].label)}
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-stroke p-4 dark:border-dark-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={newGroupName}
                placeholder={translations.categories.newNamePlaceholder}
                onChange={(event) => setNewGroupName(event.target.value)}
                className="flex-1 rounded-full border border-stroke px-4 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"              />
              <input
                type="text"
                value={newGroupDescription}
                placeholder={translations.categories.newDescriptionPlaceholder}
                onChange={(event) => setNewGroupDescription(event.target.value)}
               className="flex-1 rounded-full border border-stroke px-4 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
              <button
                onClick={handleCreateGroup}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                {translations.categories.createButton}
              </button>
            </div>
          </div>

          {currentGroups.length > 0 ? (
            <div className="overflow-x-auto py-4">
              <div className="flex gap-3 pr-3">
                {currentGroups.map((group) => {
                  const displayName = translations.groups[group.id]?.name ?? group.name;
                  const displayDescription = translations.groups[group.id]?.description ?? group.description;
                  const templateCount = templates.filter((tpl) => tpl.groupId === group.id).length;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={cn(
                        "w-[280px] flex-shrink-0 rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:border-primary hover:shadow-lg dark:border-dark-3 dark:bg-dark-2",
                        group.id === selectedGroup?.id ? "border-primary shadow-lg" : "border-stroke bg-white",
                      )}
                    >
                      <p className="text-xs uppercase tracking-widest text-dark-5 dark:text-dark-6">
                        {translations.categories.card.label}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-dark dark:text-white">{displayName}</h3>
                      <p className="mt-2 text-sm text-dark-5 dark:text-dark-6">{displayDescription}</p>
                      <p className="mt-4 text-xs text-dark-5 dark:text-dark-6">
                        {translations.categories.card.templatesCount(templateCount)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-stroke bg-gray-50 p-6 text-center text-sm text-dark-6 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6">
              {translations.categories.empty}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-dashed border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{translations.createTemplate.badge}</p>
              <h3 className="text-2xl font-semibold text-dark dark:text-white">
                {selectedGroup
                  ? translations.createTemplate.title(translations.groups[selectedGroup.id]?.name ?? selectedGroup.name)
                  : translations.createTemplate.titleFallback}
              </h3>
              <p className="text-sm text-dark-5 dark:text-dark-6">{translations.createTemplate.subtitle}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-dark-6 dark:text-dark-6">{translations.createTemplate.templateNameLabel}</label>
              <input
                value={newTemplateName}
                onChange={(event) => {
                  const value = event.target.value;
                  setNewTemplateName(value);
                  if (!value.trim()) {
                    setNewTemplateNameError(null);
                    return;
                  }
                  if (isDuplicateTemplateName(value)) {
                    setNewTemplateNameError(translations.validation.templateNameDuplicate);
                  } else if (newTemplateNameError) {
                    setNewTemplateNameError(null);
                  }
                }}
                className="w-full rounded-full border border-stroke px-4 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                placeholder={translations.createTemplate.templateNamePlaceholder}
              />
              {newTemplateNameError && (
                <p className="text-xs text-rose-500 dark:text-rose-300">{newTemplateNameError}</p>
              )}
            </div>
          </div>
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:-mt-[10rem]">
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-semibold text-dark-6 dark:text-dark-6">{translations.createTemplate.htmlLabel}</label>
            <div className="flex-1 rounded-2xl border border-stroke bg-slate-50/60 shadow-inner dark:border-dark-3 dark:bg-dark-2">
              <div className="flex items-center justify-between border-b border-white/10 bg-dark/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/60 dark:border-white/10">
                <span className="text-white/80">template.html</span>
                <span className="text-white/50">HTML</span>
              </div>
              <SyntaxHighlightTextarea
                value={newTemplateHtml}
                onChange={(value) => {
                  setNewTemplateHtml(value);
                  if (selectedGroup?.name?.toLowerCase() === "otp") {
                    const hasRequired = htmlContainsOtpVariables(value);
                    const variables = findTemplateVariables(value);
                    const disallowed = variables.filter((variable) => !OTP_ALLOWED_VARIABLES.has(variable));
                    if (!hasRequired) {
                      setNewTemplateHtmlError(translations.validation.otpMissingRequiredVarsField);
                    } else if (disallowed.length > 0) {
                      setNewTemplateHtmlError(translations.validation.otpRemoveDisallowedVars(disallowed.join(", ")));
                    } else {
                      setNewTemplateHtmlError(null);
                    }
                  } else {
                    setNewTemplateHtmlError(value.trim().length === 0 ? translations.validation.templateHtmlRequired : null);
                  }
                }}
                variant="light"
                className="min-h-[360px]"
                placeholder="<h1>Hola {{name}}</h1>"
              />
            </div>
            {newTemplateHtmlError && (
              <p className="text-xs text-rose-500 dark:text-rose-300">{newTemplateHtmlError}</p>
            )}
          </div>
          <div className="space-y-1 lg:-mt-[6rem]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-white/80">{translations.createTemplate.fromLabel}</label>
                <input
                  value={previewFrom}
                  onChange={(event) => setPreviewFrom(event.target.value)}
                className="w-full rounded-full border border-white/20 bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-primary"
                  placeholder="notifications@zelify.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-white/80">{translations.createTemplate.subjectLabel}</label>
                <input
                  value={previewSubject}
                  onChange={(event) => setPreviewSubject(event.target.value)}
                className="w-full rounded-full border border-white/20 bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-primary"
                  placeholder={translations.createTemplate.subjectPlaceholder}
                />
              </div>
            </div>
            <div className="rounded-[32px] bg-slate-900/90 px-6 py-10 text-sm text-white shadow-2xl dark:bg-slate-950">
              <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4">
                <div className="rounded-3xl border border-white/10 bg-slate-800/80 px-6 py-4">
                  <div className="flex items-center gap-3 text-sm text-white/90">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-base font-semibold">
                      {(previewFrom?.charAt(0) ?? "U").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{previewFrom}</p>
                      <p className="text-xs text-white/70">{previewSubject}</p>
                    </div>
                  </div>
                </div>
                <iframe
                  key={previewFrameKey}
                  ref={previewFrameRef}
                  srcDoc={renderedTemplateHtml}
                  onLoad={handlePreviewLoad}
                  className="w-full rounded-[32px] border border-slate-200 bg-white text-dark shadow-xl dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  style={{ minHeight: "600px", width: "100%" }}
                  sandbox="allow-same-origin allow-popups allow-forms"
                />
              </div>
            </div>
          </div>
        </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateTemplate}
              disabled={templateSubmitStatus === "loading"}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
            >
              {templateSubmitStatus === "loading"
                ? translations.createTemplate.saving
                : translations.createTemplate.createButton}
            </button>
            {selectedGroup?.name?.toLowerCase() === "otp" && (
              <span
                className={cn(
                  "text-xs",
                  htmlContainsOtpVariables(newTemplateHtml) &&
                    findTemplateVariables(newTemplateHtml).every((variable) => OTP_ALLOWED_VARIABLES.has(variable))
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-rose-500 dark:text-rose-300",
                )}
              >
                {translations.createTemplate.otpOnlyVariablesHint}
              </span>
            )}
            {templateSubmitMessage && (
              <span
                className={cn(
                  "text-sm",
                  templateSubmitStatus === "success" ? "text-emerald-600 dark:text-emerald-300" : "text-rose-500",
                )}
              >
                {templateSubmitMessage}
              </span>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">
                {selectedGroup
                  ? (translations.groups[selectedGroup.id]?.name ?? selectedGroup.name)
                  : translations.templateList.selectCategory}
              </p>
              <h2 className="text-2xl font-semibold text-dark dark:text-white">{translations.templateList.title}</h2>
              <p className="text-sm text-dark-5 dark:text-dark-6">
                {translations.summaryCards.total}: {templatesInGroup.length}
              </p>
            </div>
          </div>

          {remoteStatusForGroup && Object.keys(remoteStatusForGroup ?? {}).length === 0 && (
            <div className="mb-4 rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100">
              {translations.remote.noRemoteTemplates}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {templatesInGroup.map((template) => {
              const copy = getTemplateCopy(template);
              const derivedStatus = getDerivedStatus(template);
              return (
                <button
                  key={template.id}
                  onClick={() => handleOpenTemplate(template.id)}
                  className="group relative flex min-h-[240px] flex-col overflow-hidden rounded-3xl border border-stroke bg-white p-5 text-left transition hover:-translate-y-1 hover:border-primary hover:shadow-xl dark:border-dark-3 dark:bg-dark-2"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        derivedStatus === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                          : derivedStatus === "draft"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200",
                      )}
                    >
                      {statusLabel(derivedStatus)}
                    </span>
                    <p className="text-xs text-dark-6 dark:text-dark-6">
                      {translations.templateList.lastUsed}: {formatDate(template.lastUsed, locale)}
                    </p>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-dark dark:text-white">{copy.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-dark-5 dark:text-dark-6">
                    {copy.subject ?? template.subject}
                  </p>
                  <div className="mt-4 rounded-2xl border border-dashed border-stroke bg-slate-50/70 p-4 text-left text-xs text-dark-5 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6">
                    <p className="font-semibold text-dark dark:text-white/80">
                      {translations.templateList.ctr} {template.metrics.ctr}%
                    </p>
                    <p>
                      {translations.templateList.openRate} {template.metrics.openRate}%
                    </p>
                    <p className="mt-2 line-clamp-2">
                      {copy.description ?? template.description ?? translations.templateList.customTemplateFallback}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {templatesInGroup.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-stroke bg-gray-50 p-8 text-center text-sm text-dark-6 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6">
              {translations.templateList.empty}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || `category-${Date.now()}`;
}

function mapsEqual(a: ActiveTemplateMap, b: ActiveTemplateMap) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]);
}

function applyOverrides(templates: NotificationTemplate[], overrides: TemplateOverrides) {
  if (!overrides || Object.keys(overrides).length === 0) return templates;
  return templates.map((template) => {
    const override = overrides[template.id];
    if (!override) return template;
    return {
      ...template,
      html: {
        ...template.html,
        ...(override.html ?? {}),
      },
      updatedAt: override.updatedAt ?? template.updatedAt,
      name: override.name ?? template.name,
      subject: override.subject ?? template.subject,
      description: override.description ?? template.description,
    };
  });
}
