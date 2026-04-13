"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { useOrganizationCountry } from "@/hooks/use-organization-country";
import { fetchWithAuth, getStoredOrganization, isOrganizationOnboardingVerified } from "@/lib/auth-api";
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
import { formatLocalDateTime } from "@/lib/date-utils";

type DerivedStatus = "active" | "inactive" | "draft";
type RemoteTemplateStatus = {
  name: string;
  active: boolean | string;
};

type RemoteTemplateListItem = {
  id: string;
  organization_id: string;
  category: string;
  template: string;
  isActive: boolean;
  sender_email?: string | null;
};

type CreateTemplateResponse =
  | {
      status: "success";
      data: {
        id: string;
        organization_id: string;
        category: string;
        template: string;
        isActive: boolean;
        sender_email?: string | null;
      };
    }
  | {
      status: "error";
      message?: string;
    }
  | {
      message?: unknown;
      error?: string;
      statusCode?: number;
    };

const parseRemoteActive = (value: boolean | string | undefined): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
};

const CATEGORY_PRESETS = [
  { name: "OTP", description: "Códigos de un solo uso (OTP)." },
  { name: "Transacciones", description: "Notificaciones transaccionales." },
  { name: "resetear contraseña", description: "Recuperación y reseteo de contraseña." },
] as const;

const BRANDING_REQUIRED_VARIABLES = ["${primaryColor}", "${secondaryColor}", "${logoUrl}", "${companyName}"] as const;

// findTemplateVariables() lowercases all matches, so this set must contain lowercase variants.
const OTP_ALLOWED_VARIABLES = new Set([
  "${safename}",
  "${code}",
  "${primarycolor}",
  "${secondarycolor}",
  "${logourl}",
  "${companyname}",
  "${year}",
]);

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

const normalizeBrandingVariables = (html: string) => {
  // Replace legacy lowercase placeholders with canonical casing (required by templates engine).
  return html
    .replace(/\$\{primarycolor\}/gi, "${primaryColor}")
    .replace(/\$\{secondarycolor\}/gi, "${secondaryColor}")
    .replace(/\$\{logourl\}/gi, "${logoUrl}")
    .replace(/\$\{companyname\}/gi, "${companyName}");
};

const applyBrandingPreview = (
  html: string,
  branding: {
    logoUrl: string | null | undefined;
    primaryColor: string | null | undefined;
    secondaryColor: string | null | undefined;
    companyName: string | null | undefined;
  },
) => {
  const url = (branding.logoUrl ?? "").trim();
  const primaryColor = (branding.primaryColor ?? "").trim() || "#004195";
  const secondaryColor = (branding.secondaryColor ?? "").trim() || "#6AFF00";
  const companyName = (branding.companyName ?? "").trim() || "Company";
  const year = String(new Date().getFullYear());

  const replaced = normalizeBrandingVariables(html)
    .replace(/\$\{logoUrl\}/gi, url || "${logoUrl}")
    .replace(/\$\{primaryColor\}/gi, primaryColor)
    .replace(/\$\{secondaryColor\}/gi, secondaryColor)
    .replace(/\$\{companyName\}/gi, companyName);
  const replacedWithYear = replaced
    .replace(/\$\{year\}/gi, year)
    .replace(/\{\{\s*year\s*\}\}/gi, year);

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(replacedWithYear, "text/html");

    const isImageUrl = (value: string) => /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(value.trim());

    const buildLogoImage = () => {
      const img = doc.createElement("img");
      img.setAttribute("src", url);
      img.setAttribute("alt", branding.companyName ? `${branding.companyName} logo` : "logo");
      img.setAttribute("style", "max-height:56px; max-width:240px; display:block; margin:0 auto;");
      return img;
    };

    const replaceElementWithImage = (el: Element, imageUrl: string) => {
      const img = doc.createElement("img");
      img.setAttribute("src", imageUrl);
      img.setAttribute("alt", branding.companyName ? `${branding.companyName} logo` : "logo");
      img.setAttribute("style", "max-height:56px; max-width:240px; display:block; margin:0 auto;");
      el.replaceWith(img);
    };

    // 1) Replace anchors that point to the logo URL with an <img>.
    doc.querySelectorAll("a").forEach((anchor) => {
      const href = (anchor.getAttribute("href") ?? "").trim();
      const text = (anchor.textContent ?? "").trim();
      if (url && href === url) return replaceElementWithImage(anchor, url);
      if (url && text === url) return replaceElementWithImage(anchor, url);
      if (isImageUrl(href) && (!anchor.children.length || text === href)) return replaceElementWithImage(anchor, href);
    });

    // 2) Replace elements whose only content is an image URL (or the logo URL) with an <img>.
    doc.querySelectorAll("p,div,span,td,th,h1,h2,h3,h4,h5,h6").forEach((el) => {
      if (el.children.length > 0) return;
      const text = (el.textContent ?? "").trim();
      if (!text) return;
      if (url && text === url) return replaceElementWithImage(el, url);
      if (isImageUrl(text)) return replaceElementWithImage(el, text);
    });

    return doc.documentElement.outerHTML;
  } catch {
    return replaced;
  }
};

const findMissingBrandingVariables = (html: string) => {
  return BRANDING_REQUIRED_VARIABLES.filter((variable) => !html.includes(variable));
};

// Solo se soporta Mailing en este dashboard (ocultamos el canal "notifications").
const CHANNEL_ORDER: TemplateChannel[] = ["mailing"];
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
  const ui = useUiTranslations();
  const { organization, loading: orgLoading } = useOrganizationCountry();
  const canUseWebhooks = isOrganizationOnboardingVerified(organization);
  const locked = orgLoading || !canUseWebhooks;

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
  const [remoteTemplatesList, setRemoteTemplatesList] = useState<RemoteTemplateListItem[] | null>(null);
  const [remoteStatuses, setRemoteStatuses] = useState<Record<string, Record<string, boolean>>>({});
  const autoSelectedActiveRef = useRef(false);
  const newTemplateHtmlDirtyRef = useRef(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
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
        const items = remoteTemplatesList ?? [];
        const active = items.find((tpl) => tpl.isActive) ?? null;
        return { channel, items, active };
      }),
    [remoteTemplatesList],
  );

  const channelInfo = {
    mailing: translations.categorySelector.mailing,
    notifications: translations.categorySelector.notifications,
  };

  const isDuplicateTemplateName = useCallback(
    (value: string) => {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return false;
      return userDefinedTemplates.some((template) => {
        const comparisonName = getTemplateNameKey(template);
        return comparisonName === normalized || template.id === slugify(value);
      });
    },
    [userDefinedTemplates, getTemplateNameKey],
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

  useEffect(() => {
    if (!remoteTemplatesList) return;
    const uniqueCategories = Array.from(
      new Set(remoteTemplatesList.map((item) => item.category).filter(Boolean)),
    );
    if (uniqueCategories.length === 0) return;
    setGroups((prev) => {
      const existingByBackendCategory = new Set(
        prev
          .filter((group) => group.channel === "mailing")
          .map((group) => toBackendCategory(group.name)),
      );
      const missing = uniqueCategories.filter((category) => !existingByBackendCategory.has(category));
      if (missing.length === 0) return prev;
      const newGroups: TemplateGroup[] = missing.map((category) => ({
        id: `mailing-${category}`,
        name: category,
        description: translations.categories.customDescriptionFallback,
        channel: "mailing",
      }));
      return [...prev, ...newGroups];
    });
  }, [remoteTemplatesList, translations.categories.customDescriptionFallback]);

  useEffect(() => {
    if (selectedGroupId) return;
    const firstGroup = groups.find((group) => group.channel === selectedChannel);
    if (firstGroup) {
      setSelectedGroupId(firstGroup.id);
    }
  }, [groups, selectedChannel, selectedGroupId]);

  const currentGroups = groups.filter((group) => group.channel === selectedChannel);
  const selectedGroup = currentGroups.find((group) => group.id === selectedGroupId) ?? currentGroups[0] ?? null;
  const canCreateTemplate = Boolean(selectedGroup);
  const hasOrganizationTemplates = (remoteTemplatesList?.length ?? 0) > 0;
  const isEditingTemplate = Boolean(editingTemplateId);

  const remoteTemplatesForSelectedGroup = useMemo(() => {
    if (!selectedGroup || !remoteTemplatesList) return [];
    const category = toBackendCategory(selectedGroup.name);
    return remoteTemplatesList.filter((item) => item.category === category);
  }, [remoteTemplatesList, selectedGroup]);

  const editingRemoteTemplate = useMemo(() => {
    if (!editingTemplateId || !remoteTemplatesList) return null;
    return remoteTemplatesList.find((item) => item.id === editingTemplateId) ?? null;
  }, [editingTemplateId, remoteTemplatesList]);

  const activeTemplateHtmlForSelectedGroup = useMemo(() => {
    const active = remoteTemplatesForSelectedGroup.find((item) => item.isActive);
    return active?.template?.trim() ?? "";
  }, [remoteTemplatesForSelectedGroup]);

  useEffect(() => {
    // When a category is selected and there is an active template, show its HTML in the editor
    // unless the user already started typing a new template.
    if (!selectedGroup) return;
    if (!activeTemplateHtmlForSelectedGroup) return;
    if (newTemplateHtmlDirtyRef.current) return;
    setNewTemplateHtml(activeTemplateHtmlForSelectedGroup);
  }, [activeTemplateHtmlForSelectedGroup, selectedGroup]);

  useEffect(() => {
    if (!selectedGroup) return;
    if (newTemplateHtmlDirtyRef.current) return;
    const active = remoteTemplatesForSelectedGroup.find((item) => item.isActive) ?? null;
    if (active) {
      setEditingTemplateId(active.id);
      setNewTemplateName(humanizeCategory(active.category));
      setPreviewFrom(active.sender_email?.trim() || "notifications@zelify.com");
      return;
    }
    setEditingTemplateId(null);
    setNewTemplateName(humanizeCategory(selectedGroup.name));
    setPreviewFrom("notifications@zelify.com");
  }, [remoteTemplatesForSelectedGroup, selectedGroup]);

  const previewSrcDoc = useMemo(() => {
    if (newTemplateHtml.trim()) return renderedTemplateHtml;
    if (activeTemplateHtmlForSelectedGroup) return activeTemplateHtmlForSelectedGroup;
    return renderedTemplateHtml;
  }, [activeTemplateHtmlForSelectedGroup, newTemplateHtml, renderedTemplateHtml]);

  const previewSrcDocResolved = useMemo(() => {
    return applyBrandingPreview(previewSrcDoc, {
      logoUrl: organization?.url_log ?? null,
      primaryColor: organization?.color_a ?? null,
      secondaryColor: organization?.color_b ?? null,
      companyName: organization?.name ?? null,
    });
  }, [organization?.color_a, organization?.color_b, organization?.name, organization?.url_log, previewSrcDoc]);

  useEffect(() => {
    if (autoSelectedActiveRef.current) return;
    if (!remoteTemplatesList || remoteTemplatesList.length === 0) return;
    const active = remoteTemplatesList.find((item) => item.isActive);
    if (!active) return;
    const groupForActive = groups.find((group) => toBackendCategory(group.name) === active.category);
    if (!groupForActive) return;
    autoSelectedActiveRef.current = true;
    newTemplateHtmlDirtyRef.current = false;
    setSelectedChannel(groupForActive.channel);
    setSelectedGroupId(groupForActive.id);
  }, [remoteTemplatesList, groups]);

  const templatesInGroup = useMemo(() => {
    if (!selectedGroup) return [];
    const nowIso = new Date().toISOString();
    const total = remoteTemplatesForSelectedGroup.length;
    const baseName = humanizeCategory(selectedGroup.name);
    const sorted = [...remoteTemplatesForSelectedGroup].sort((a, b) => Number(b.isActive) - Number(a.isActive));
    return sorted.map((remote, index) => {
      const name = total > 1 ? `${baseName} #${index + 1}` : baseName;
      const senderEmail = remote.sender_email?.trim() || "notifications@zelify.com";
      return {
        id: remote.id,
        key: remote.id,
        groupId: selectedGroup.id,
        channelGroup: selectedGroup.channel,
        channel: selectedGroup.channel === "mailing" ? "email" : "push",
        status: remote.isActive ? "active" : "inactive",
        updatedAt: nowIso,
        lastUsed: nowIso,
        metrics: {
          openRate: 0,
          ctr: 0,
        },
        name,
        subject: name,
        description: translations.remote.remoteTemplateDescription,
        html: {
          en: remote.template ?? "",
          es: remote.template ?? "",
        },
        from: senderEmail,
        variables: [],
      } satisfies NotificationTemplate;
    });
  }, [
    selectedGroup,
    remoteTemplatesForSelectedGroup,
    translations.remote.remoteTemplateDescription,
  ]);

  const remoteStatusForGroup = selectedGroup ? remoteStatuses[selectedGroup.id] : undefined;

  useEffect(() => {
    if (!organization?.id || typeof window === "undefined") return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetchWithAuth(
          `/api/templates/list?organization_id=${encodeURIComponent(organization.id)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          console.warn("Failed to fetch templates list:", response.status);
          return;
        }
        const json = (await response.json().catch(() => null)) as
          | { status: "success"; data: RemoteTemplateListItem[] }
          | null;
        const list = json?.status === "success" ? json.data : [];
        setRemoteTemplatesList(list);
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
        console.warn("Error fetching templates list", error);
      }
    };
    load();
    return () => controller.abort();
  }, [organization?.id]);

  useEffect(() => {
    if (!remoteTemplatesList) return;
    const byCategory = new Map<string, RemoteTemplateListItem>();
    remoteTemplatesList.forEach((item) => byCategory.set(item.category, item));

    const next: Record<string, Record<string, boolean>> = {};
    groups.forEach((group) => {
      const backendCategory = toBackendCategory(group.name);
      const remote = byCategory.get(backendCategory);
      if (!remote) {
        next[group.id] = {};
        return;
      }
      const templatesInThisGroup = templatesWithOverrides.filter((t) => t.groupId === group.id);
      const statusMap: Record<string, boolean> = {};
      templatesInThisGroup.forEach((t) => {
        statusMap[getTemplateNameKey(t)] = Boolean(remote.isActive);
      });
      statusMap[group.name.trim().toLowerCase()] = Boolean(remote.isActive);
      next[group.id] = statusMap;
    });
    setRemoteStatuses(next);
  }, [remoteTemplatesList, groups, templatesWithOverrides, getTemplateNameKey]);

  const statusLabel = (status: "active" | "inactive" | "draft") => translations.templateList.status[status];

  const handleOpenTemplate = (template: NotificationTemplate) => {
    const remote = remoteTemplatesForSelectedGroup.find((item) => item.id === template.id) ?? null;
    setEditingTemplateId(template.id);
    newTemplateHtmlDirtyRef.current = false;
    setNewTemplateHtml(remote?.template ?? template.html?.es ?? template.html?.en ?? "");
    setNewTemplateName(template.name ?? humanizeCategory(remote?.category ?? selectedGroup?.name ?? ""));
    setPreviewFrom(remote?.sender_email?.trim() || template.from?.trim() || "notifications@zelify.com");
  };

  const handleCreateTemplate = async () => {
    const isEditing = Boolean(editingTemplateId);
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

    const normalizedHtml = normalizeBrandingVariables(newTemplateHtml);
    if (normalizedHtml !== newTemplateHtml) {
      setNewTemplateHtml(normalizedHtml);
    }

    const missingBrandingVars = findMissingBrandingVariables(normalizedHtml);
    if (missingBrandingVars.length > 0) {
      setTemplateSubmitStatus("error");
      setTemplateSubmitMessage(translations.validation.brandingMissingRequiredVars);
      setNewTemplateHtmlError(translations.validation.brandingMissingRequiredVarsField(missingBrandingVars.join(", ")));
      return;
    }

    if (selectedGroup.name.toLowerCase() === "otp") {
      const hasRequiredVariables = htmlContainsOtpVariables(normalizedHtml);
      const variables = findTemplateVariables(normalizedHtml);
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
    if (
      !isEditing &&
      (isDuplicateTemplateName(newTemplateName) || userDefinedTemplates.some((template) => template.id === localTemplateId))
    ) {
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
    const organizationId = organization?.id ?? getStoredOrganization()?.id ?? "";
    const category = toBackendCategory(selectedGroup.name);
    const remoteCategory = editingRemoteTemplate?.category ?? category;
    const remoteIsActive = editingRemoteTemplate?.isActive ?? false;
    const senderEmail = previewFrom.trim() || "notifications@zelify.com";

    if (isEditing && editingTemplateId) {
      const payload = {
        organization_id: organizationId,
        category: remoteCategory,
        template: normalizedHtml,
        isActive: remoteIsActive,
        sender_email: senderEmail,
      };
      try {
        if (!payload.organization_id) {
          throw new Error("missing_organization_id");
        }
        const response = await fetchWithAuth(`/api/templates/${encodeURIComponent(editingTemplateId)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("request failed");
        }
        const result = (await response.json().catch(() => null)) as { status?: string } | null;
        if (!result || result.status !== "success") {
          throw new Error("failed");
        }
        setRemoteTemplatesList((prev) => {
          if (!prev) return prev;
          return prev.map((item) =>
            item.id === editingTemplateId ? { ...item, template: normalizedHtml, sender_email: senderEmail } : item,
          );
        });
        setTemplateSubmitStatus("success");
        setTemplateSubmitMessage(translations.alerts.saved);
        newTemplateHtmlDirtyRef.current = false;
        return;
      } catch (error) {
        console.error("Error updating template", error);
        setTemplateSubmitStatus("error");
        setTemplateSubmitMessage(translations.validation.createdError);
        return;
      }
    }

    const payload = {
      organization_id: organizationId,
      category,
      template: normalizedHtml,
      isActive: false,
      sender_email: senderEmail,
    };

    try {
      if (!payload.organization_id) {
        throw new Error("missing_organization_id");
      }
      const response = await fetchWithAuth("/api/templates", {
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
      const result = (await response.json().catch(() => null)) as CreateTemplateResponse | null;
      const success = result && typeof result === "object" && "status" in result && result.status === "success";
      if (!success) {
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
        from: senderEmail,
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
      if (result && typeof result === "object" && "data" in result && (result as { data?: unknown }).data) {
        const created = (result as { data: RemoteTemplateListItem }).data;
        setRemoteTemplatesList((prev) => (prev ? [...prev, created] : [created]));
      }
      setTemplateSubmitStatus("success");
      setTemplateSubmitMessage(translations.validation.createdSuccess);
      setNewTemplateName("");
      setNewTemplateHtml("");
      setNewTemplateHtmlError(null);
      setNewTemplateCompanyId("");
      setPreviewFrom("notifications@zelify.com");
      router.refresh();
    } catch (error) {
      console.error("Error creating template", error);
      setTemplateSubmitStatus("error");
      setTemplateSubmitMessage(translations.validation.createdError);
      setNewTemplateNameError(translations.validation.createdError);
    }
  };

  const handleDeleteRemoteTemplate = async (templateId: string) => {
    try {
      const response = await fetchWithAuth(`/api/templates/${encodeURIComponent(templateId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("request_failed");
      const json = (await response.json().catch(() => null)) as { status?: string } | null;
      if (!json || json.status !== "success") throw new Error("delete_failed");
      setRemoteTemplatesList((prev) => (prev ? prev.filter((item) => item.id !== templateId) : prev));
      if (editingTemplateId === templateId) {
        setEditingTemplateId(null);
        setNewTemplateHtml("");
        setNewTemplateName(selectedGroup ? humanizeCategory(selectedGroup.name) : "");
        newTemplateHtmlDirtyRef.current = false;
      }
    } catch (error) {
      console.warn("Failed to delete template", error);
    }
  };

  const handleCreateGroup = useCallback(() => {
    const name = newGroupName.trim();
    const presetDescription = CATEGORY_PRESETS.find((item) => item.name === name)?.description ?? "";
    const description = presetDescription || newGroupDescription.trim();
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
      {orgLoading && (
        <p className="text-sm text-dark-6 dark:text-dark-6">{ui.webhooksPage.loadingAccess}</p>
      )}
      {!orgLoading && !canUseWebhooks && (
        <div
          role="status"
          className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-dark dark:text-white/90 dark:border-primary/40 dark:bg-primary/15"
        >
          {ui.webhooksPage.lockedUntilOnboarding}
        </div>
      )}

      {!locked && <div className="space-y-8">
        <header className="rounded-3xl border border-transparent bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
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

        <div className="grid gap-4 md:grid-cols-1">
          {channelCards.map((card) => (
            <button
              key={card.channel}
              onClick={() => handleChannelChange(card.channel)}
              className={cn(
                "group relative overflow-hidden rounded-3xl border-2 p-5 text-left shadow-lg transition-all",
                card.isSelected ? "bg-white text-dark" : "bg-[#1F4D93] text-white",
                card.isSelected ? "border-white ring-0" : "border-transparent opacity-80 hover:opacity-100",
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
                  <p
                    className={cn(
                      "text-xs uppercase tracking-widest",
                      card.isSelected ? "text-black/70" : "text-white/80",
                    )}
                  >
                    {translations.summaryCards.total}
                  </p>
                  {card.active && (
                    <span className={cn(
                      "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                      card.styles.badge,
                      card.isSelected && "bg-black/10 text-black",
                    )}>
                      {translations.summaryCards.active}: {card.active.category}
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
	              <select
	                value={newGroupName}
	                onChange={(event) => {
	                  const value = event.target.value;
	                  setNewGroupName(value);
	                  const presetDescription = CATEGORY_PRESETS.find((item) => item.name === value)?.description ?? "";
	                  if (presetDescription) setNewGroupDescription(presetDescription);
	                }}
	                className="flex-1 rounded-full border border-stroke bg-white px-4 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
	              >
	                <option value="">{translations.categories.newNamePlaceholder}</option>
	                {CATEGORY_PRESETS.map((preset) => (
	                  <option key={preset.name} value={preset.name}>
	                    {preset.name}
	                  </option>
	                ))}
	              </select>
	              <button
	                onClick={handleCreateGroup}
	                disabled={!newGroupName.trim()}
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
                  const remoteCount = remoteTemplatesList
                    ? remoteTemplatesList.filter((item) => item.category === toBackendCategory(group.name)).length
                    : 0;
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
                        {translations.categories.card.templatesCount(remoteCount)}
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

        {hasOrganizationTemplates && (
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

            {selectedGroup && remoteTemplatesForSelectedGroup.length === 0 && (
              <div className="mb-4 rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100">
                {translations.remote.noRemoteTemplates}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {templatesInGroup.map((template) => {
                const copy = getTemplateCopy(template);
                const derivedStatus = template.status as TemplateStatus;
                return (
                  <div
                    key={template.id}
                    onClick={() => handleOpenTemplate(template)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenTemplate(template);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "group relative flex min-h-[240px] cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-xl dark:bg-dark-2",
                      derivedStatus === "active"
                        ? "border-emerald-400/80 ring-4 ring-emerald-400/20 dark:border-emerald-300/60 dark:ring-emerald-300/15"
                        : "border-stroke hover:border-primary dark:border-dark-3",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
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
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-xs text-dark-6 dark:text-dark-6">
                          {translations.templateList.lastUsed}: {formatLocalDateTime(template.lastUsed)}
                        </p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleDeleteRemoteTemplate(template.id);
                          }}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                        >
                          {translations.previewPanel.delete}
                        </button>
                      </div>
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
                  </div>
                );
              })}
            </div>
	            {templatesInGroup.length === 0 && (
	              <div className="mt-6 rounded-3xl border border-dashed border-stroke bg-gray-50 p-8 text-center text-sm text-dark-6 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6">
	                {translations.templateList.empty}
	              </div>
	            )}
	          </section>
	        )}

        {canCreateTemplate ? (
          <section className="space-y-4 rounded-3xl border border-dashed border-stroke bg-white p-6 dark:border-dark-3 dark:bg-dark-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{translations.createTemplate.badge}</p>
                <h3 className="text-2xl font-semibold text-dark dark:text-white">
                  {isEditingTemplate
                    ? translations.createTemplate.editTitle(
                        translations.groups[selectedGroup.id]?.name ?? selectedGroup.name,
                      )
                    : translations.createTemplate.title(translations.groups[selectedGroup.id]?.name ?? selectedGroup.name)}
                </h3>
                <p className="text-sm text-dark-5 dark:text-dark-6">{translations.createTemplate.subtitle}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-dark-6 dark:text-dark-6">{translations.createTemplate.templateNameLabel}</label>
                <input
                  value={newTemplateName}
                  onChange={
                    isEditingTemplate
                      ? undefined
                      : (event) => {
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
                        }
                  }
                  readOnly={isEditingTemplate}
                  className={cn(
                    "w-full rounded-full border border-stroke px-4 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white",
                    isEditingTemplate &&
                      "cursor-not-allowed bg-slate-50 text-dark/70 dark:bg-dark-3 dark:text-white/70 focus:border-stroke",
                  )}
                  placeholder={translations.createTemplate.templateNamePlaceholder}
                />
                {newTemplateNameError && (
                  <p className="text-xs text-rose-500 dark:text-rose-300">{newTemplateNameError}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-dark-6 dark:text-dark-6">
                  {translations.createTemplate.senderEmailLabel}
                </label>
                <input
                  value={previewFrom}
                  onChange={(event) => setPreviewFrom(event.target.value)}
                  className="w-full rounded-full border border-stroke px-4 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  placeholder="notifications@zelify.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-dark-6 dark:text-dark-6">
                  {translations.createTemplate.subjectLabel}
                </label>
                <input
                  value={previewSubject}
                  onChange={(event) => setPreviewSubject(event.target.value)}
                  className="w-full rounded-full border border-stroke px-4 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:mt-1">
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-dark-6 dark:text-dark-6">{translations.createTemplate.htmlLabel}</label>
	              <div className="flex-1 min-h-[720px] rounded-2xl border border-stroke bg-slate-50/60 shadow-inner dark:border-dark-3 dark:bg-dark-2">
	                <div className="flex items-center justify-between border-b border-white/10 bg-dark/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/60 dark:border-white/10">
	                  <span className="text-white/80">template.html</span>
	                  <span className="text-white/50">HTML</span>
	                </div>
	                <SyntaxHighlightTextarea
	                  value={newTemplateHtml}
	                  onChange={(value) => {
	                    newTemplateHtmlDirtyRef.current = true;
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
	                  className="min-h-[720px]"
	                  placeholder="<h1>Hola {{name}}</h1>"
	                />
	              </div>
              {newTemplateHtmlError && (
                <p className="text-xs text-rose-500 dark:text-rose-300">{newTemplateHtmlError}</p>
              )}
            </div>
            <div className="space-y-1 lg:mt-1">
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
		                    srcDoc={previewSrcDocResolved}
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
                : isEditingTemplate
                  ? translations.createTemplate.updateButton
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
        ) : (
          <section className="space-y-2 rounded-3xl border border-dashed border-stroke bg-white p-6 text-sm text-dark-6 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
            <p className="text-xs uppercase tracking-widest text-dark-6 dark:text-dark-6">{translations.createTemplate.badge}</p>
            <h3 className="text-2xl font-semibold text-dark dark:text-white">{translations.createTemplate.titleFallback}</h3>
            <p className="text-sm text-dark-5 dark:text-dark-6">{translations.createTemplate.noCategory}</p>
          </section>
        )}

        {!hasOrganizationTemplates && (
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

          {selectedGroup && remoteTemplatesForSelectedGroup.length === 0 && (
            <div className="mb-4 rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100">
              {translations.remote.noRemoteTemplates}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {templatesInGroup.map((template) => {
              const copy = getTemplateCopy(template);
              const derivedStatus = template.status as TemplateStatus;
              return (
                <button
                  key={template.id}
                  onClick={() => handleOpenTemplate(template)}
                  className={cn(
                    "group relative flex min-h-[240px] flex-col overflow-hidden rounded-3xl border bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-xl dark:bg-dark-2",
                    derivedStatus === "active"
                      ? "border-emerald-400/80 ring-4 ring-emerald-400/20 dark:border-emerald-300/60 dark:ring-emerald-300/15"
                      : "border-stroke hover:border-primary dark:border-dark-3",
                  )}
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
                      {translations.templateList.lastUsed}: {formatLocalDateTime(template.lastUsed)}
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
        )}
      </div>}
    </div>
  );
}



function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || `category-${Date.now()}`;
}

function toBackendCategory(value: string) {
  return slugify(value).replace(/-/g, "_");
}

function humanizeCategory(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
