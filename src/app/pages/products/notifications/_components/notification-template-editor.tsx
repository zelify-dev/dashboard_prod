"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { cn } from "@/lib/utils";
import { useLanguage, type Language } from "@/contexts/language-context";
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  DEFAULT_TEMPLATE_GROUPS,
  type NotificationTemplate,
  type TemplateVariable,
} from "./notifications-data";
import { useNotificationsTranslations } from "./use-notifications-translations";
import {
  TEMPLATE_OVERRIDES_EVENT,
  deleteCustomTemplate,
  readActiveMap,
  readCustomTemplate,
  readTemplateOverrides,
  saveTemplateOverride,
  setActiveTemplateInStorage,
  type TemplateOverrides,
} from "./notifications-storage";
import { SyntaxHighlightTextarea } from "./syntax-highlight-textarea";

const ACTIVATION_ENDPOINT = "/api/notifications/activate-template";

interface NotificationTemplateEditorProps {
  templateId: string;
}

export function NotificationTemplateEditor({ templateId }: NotificationTemplateEditorProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const translations = useNotificationsTranslations();
  const t = translations.templateEditor;
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [previewFrameKey, setPreviewFrameKey] = useState(0);

  const baseTemplate = useMemo(() => {
    const fromDefaults = DEFAULT_NOTIFICATION_TEMPLATES.find((item) => item.id === templateId);
    if (fromDefaults) return fromDefaults;
    return readCustomTemplate(templateId);
  }, [templateId]);
  const [templateOverride, setTemplateOverride] = useState<TemplateOverrides[string] | null>(null);
  const [remoteTemplateError, setRemoteTemplateError] = useState<string | null>(null);
  const [remoteTemplateLoading, setRemoteTemplateLoading] = useState(false);

  useEffect(() => {
    const updateOverride = () => {
      const overrides = readTemplateOverrides();
      setTemplateOverride(overrides?.[templateId] ?? null);
    };
    updateOverride();
    if (typeof window !== "undefined") {
      window.addEventListener(TEMPLATE_OVERRIDES_EVENT, updateOverride);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(TEMPLATE_OVERRIDES_EVENT, updateOverride);
      }
    };
  }, [templateId]);

  const template = useMemo(() => {
    if (!baseTemplate) return null;
    if (!templateOverride) return baseTemplate;
    return {
      ...baseTemplate,
      html: {
        ...baseTemplate.html,
        ...(templateOverride.html ?? {}),
      },
      name: templateOverride.name ?? baseTemplate.name,
      subject: templateOverride.subject ?? baseTemplate.subject,
      description: templateOverride.description ?? baseTemplate.description,
      updatedAt: templateOverride.updatedAt ?? baseTemplate.updatedAt,
    };
  }, [baseTemplate, templateOverride]);

  if (!template) {
    return (
      <div className="mx-auto w-full max-w-[1200px]">
        <Breadcrumb pageName={translations.breadcrumb} />
        <div className="mt-10 rounded-3xl border border-dashed border-rose-200 bg-rose-50/60 p-10 text-center text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          <p className="text-lg font-semibold">{t.templateNotFound}</p>
          <button
            className="mt-4 rounded-full border border-rose-400 px-5 py-2 text-sm font-semibold text-rose-600 hover:border-rose-600 hover:text-rose-800 dark:border-rose-300 dark:text-rose-100 dark:hover:border-rose-100"
            onClick={() => router.push("/pages/products/notifications")}
          >
            {t.backToTemplates}
          </button>
        </div>
      </div>
    );
  }

  const [templateData, setTemplateData] = useState(template);
  const [codeByLanguage, setCodeByLanguage] = useState<Record<Language, string>>({
    en: template.html.en,
    es: template.html.es,
  });
  const [editorLanguage, setEditorLanguage] = useState<Language>(language);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [remoteTemplateId, setRemoteTemplateId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(() => {
    const stored = readActiveMap();
    if (stored && stored[template.groupId]) {
      return stored[template.groupId] === template.id;
    }
    return template.status === "active";
  });

  useEffect(() => {
    setTemplateData(template);
    setCodeByLanguage({
      en: template.html.en,
      es: template.html.es,
    });
    const stored = readActiveMap();
    if (stored && stored[template.groupId]) {
      setIsActive(stored[template.groupId] === template.id);
    } else {
      setIsActive(template.status === "active");
    }
  }, [template]);

  const codeForPreview = codeByLanguage[editorLanguage] ?? templateData.html[editorLanguage];
  const renderedTemplateHtml = renderTemplateHtml(codeForPreview, templateData.variables);
  const requiredVariables = templateData.variables?.filter((variable) => variable.required !== false) ?? [];
  const templateGroup = useMemo(
    () => DEFAULT_TEMPLATE_GROUPS.find((group) => group.id === templateData.groupId),
    [templateData.groupId],
  );

  const templateName =
    templateData.name ??
    translations.templates[templateData.key as keyof typeof translations.templates]?.name ??
    templateData.key;
  const [previewFrom, setPreviewFrom] = useState("notifications@zelify.com");
  const [previewRecipient, setPreviewRecipient] = useState(t.recipientPlaceholder);
  const [previewSubject, setPreviewSubject] = useState(templateData.subject ?? templateName);

  useEffect(() => {
    if (!templateName) return;
    const controller = new AbortController();
    setRemoteTemplateLoading(true);
    setRemoteTemplateError(null);

    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/templates/name/${encodeURIComponent(templateName)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          console.warn(`Failed to fetch template by name (${response.status})`);
          setRemoteTemplateError(t.remoteTemplateFetchError);
          setRemoteTemplateLoading(false);
          return;
        }
        const data = (await response.json().catch(() => null)) as
          | {
              templateId?: string;
              id?: string;
              template?: string;
              name?: string;
              subject?: string;
              from?: string;
              updatedAt?: string;
              active?: boolean;
            }
          | null;
        if (!data) {
          setRemoteTemplateId(null);
          setRemoteTemplateError(t.remoteTemplateNotFound);
          setRemoteTemplateLoading(false);
          return;
        }
        setRemoteTemplateId(data.templateId ?? data.id ?? null);
        setTemplateData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            name: data.name ?? prev.name,
            subject: data.subject ?? prev.subject,
            from: data.from ?? prev.from,
            description: prev.description,
            html: {
              en: data.template ?? prev.html.en,
              es: data.template ?? prev.html.es,
            },
            updatedAt: data.updatedAt ?? prev.updatedAt,
            status: data.active ? "active" : prev.status,
          };
        });
        setIsActive(Boolean(data.active));
        const templateHtml = data.template ?? templateData.html[editorLanguage];
        setCodeByLanguage({
          en: data.template ?? templateData.html.en,
          es: data.template ?? templateData.html.es,
        });
      } catch (error) {
        if ((error as DOMException)?.name !== "AbortError") {
          console.error("Error fetching template by name", error);
          setRemoteTemplateError(t.remoteTemplateFetchError);
          setRemoteTemplateId(null);
        }
      } finally {
        setRemoteTemplateLoading(false);
      }
    };

    fetchTemplate();
    return () => controller.abort();
  }, [templateName, editorLanguage, templateData.html.en, templateData.html.es]);

  useEffect(() => {
    setPreviewFrom(templateData.from ?? "notifications@zelify.com");
    setPreviewSubject(templateData.subject ?? templateName);
  }, [templateData.from, templateData.subject, templateName]);

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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    const updatePayload = {
      name: templateName,
      template: codeByLanguage[editorLanguage],
      from: previewFrom.trim(),
      subject: previewSubject.trim() || templateName,
    };
    console.log("[notifications] Updating template payload", JSON.stringify(updatePayload, null, 2));
    try {
      const response = await fetch("/api/templates/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "request failed");
        setSaveMessage(t.saveError);
        console.warn("Template update failed", errorText);
        return;
      }
      const rawResult = await response.text().catch(() => null);
      const normalizedResult = normalizeApiResult(rawResult);
      if (normalizedResult !== "success") {
        setSaveMessage(t.saveError);
        return;
      }
      const updatedAt = new Date().toISOString();
      setTemplateData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          html: {
            ...prev.html,
            ...codeByLanguage,
          },
          updatedAt,
          subject: previewSubject.trim() || templateName,
          from: previewFrom.trim(),
        };
      });
      saveTemplateOverride(templateData.id, {
        html: codeByLanguage,
        updatedAt,
        name: templateName,
        subject: previewSubject.trim() || templateName,
        from: previewFrom.trim(),
        description: templateData.description,
      });
      setSaveMessage(translations.alerts.saved);
    } catch (error) {
      console.error("Error saving template", error);
      setSaveMessage(t.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);
    setSaveMessage(null);
    const payload = {
      channel: templateData.channelGroup,
      category: templateGroup?.name ?? templateData.groupId,
      name: templateName,
      active: true,
    };
    try {
      const response = await fetch("/api/templates/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "request failed");
        setSaveMessage(t.activateError);
        console.warn("Activation request failed", errorText);
        return;
      }
      const rawResult = await response.text().catch(() => null);
      const normalizedResult = normalizeApiResult(rawResult);
      if (normalizedResult && normalizedResult !== "success") {
        setSaveMessage(t.activateError);
        return;
      }
      setActiveTemplateInStorage(templateData.groupId, templateData.id);
      setIsActive(true);
      setTemplateData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: "active",
          updatedAt: new Date().toISOString(),
        };
      });
      await sendActivationEvent({
        canales: templateData.channelGroup,
        categoria: templateGroup?.name ?? templateData.groupId,
        plantilla: codeByLanguage,
        companyId: "",
        templateId: templateData.id,
      });
      setSaveMessage(translations.alerts.activated);
    } catch (error) {
      console.error("Error activating template", error);
      setSaveMessage(t.activateError);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setSaveMessage(null);
    if (!remoteTemplateId) {
      setSaveMessage(t.remoteIdMissing);
      setIsDeleting(false);
      return;
    }
    try {
      const response = await fetch(`/api/templates/${encodeURIComponent(remoteTemplateId)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "request failed");
        console.warn("Template delete failed", errorText);
        setSaveMessage(t.deleteError);
        return;
      }
      const rawResult = await response.text().catch(() => null);
      const normalizedResult = normalizeApiResult(rawResult);
      if (normalizedResult !== "success") {
        setSaveMessage(t.deleteError);
        return;
      }
      deleteCustomTemplate(templateData.id);
      setSaveMessage(translations.alerts.deleted);
      router.push("/pages/products/notifications");
    } catch (error) {
      console.error("Error deleting template", error);
      setSaveMessage(t.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Breadcrumb pageName={`${translations.breadcrumb} / ${templateName}`} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push("/pages/products/notifications")}
          className="inline-flex items-center gap-2 rounded-full border border-stroke px-4 py-2 text-sm font-semibold text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white dark:hover:border-primary"
        >
          ← {translations.categorySelector.title}
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-full border border-rose-400 px-5 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500 dark:text-rose-200"
          >
            {isDeleting ? t.deleteProgress : translations.previewPanel.delete}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full border border-stroke px-5 py-2 text-sm font-semibold text-dark transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:text-white dark:hover:border-primary"
          >
            {isSaving ? t.saveProgress : translations.previewPanel.save}
          </button>
          <button
            onClick={handleActivate}
            disabled={isActivating || isActive}
            className={cn(
              "rounded-full px-6 py-2 text-sm font-semibold text-white transition",
              isActive
                ? "bg-emerald-500 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50",
            )}
          >
            {isActivating ? t.activateProgress : translations.previewPanel.activate}
          </button>
        </div>
      </div>
      {remoteTemplateError && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100">
          {remoteTemplateError}
        </div>
      )}
      {saveMessage && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          {saveMessage}
        </div>
      )}

      <section className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col space-y-4">
          <div className="rounded-2xl border border-stroke bg-dark/95 text-white shadow-inner dark:border-dark-3 dark:bg-black">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-3 text-xs uppercase tracking-wider text-white/70">
            <span>{translations.previewPanel.html}</span>
            {requiredVariables.length > 0 && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
                {t.requiredVariables}
              </span>
            )}
          </div>
          {requiredVariables.length > 0 && (
            <div className="border-b border-white/5 bg-white/5 px-5 py-3 text-xs text-white/80">
              {requiredVariables.map((variable) => (
                <span
                  key={variable.key}
                  className="mr-2 inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-rose-100"
                >
                  <code>{variable.placeholder}</code>
                  <span>{t.required}</span>
                </span>
              ))}
            </div>
          )}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-5 py-3">
          {(["es", "en"] as Language[]).map((lang) => (
            <button
                key={lang}
                onClick={() => setEditorLanguage(lang)}
                className={cn(
                  "rounded-full px-4 py-1 text-sm font-semibold transition",
                  editorLanguage === lang ? "bg-white text-dark" : "border border-white/30 text-white",
                )}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <SyntaxHighlightTextarea
            value={codeByLanguage[editorLanguage] ?? ""}
            onChange={(value) =>
              setCodeByLanguage((prev) => ({
                ...prev,
                [editorLanguage]: value,
              }))
            }
            className="min-h-[480px]"
            placeholder="<h1>Hola {{name}}</h1>"
          />
          </div>
        </div>

        <div className="rounded-2xl border border-transparent bg-transparent shadow-none dark:border-transparent dark:bg-transparent">
          <div className="border-b border-dark/10 px-5 py-3 text-xs uppercase tracking-wider text-dark-6 dark:border-white/10 dark:text-dark-6">
            {translations.previewPanel.live}
          </div>
          <div className="space-y-4 rounded-b-2xl bg-slate-900/80 px-5 py-5 dark:bg-slate-950/90">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-white/80">{t.fromLabel}</label>
                <input
                  value={previewFrom}
                  onChange={(event) => setPreviewFrom(event.target.value)}
                  className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white outline-none focus:border-primary"
                  placeholder="notifications@zelify.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-white/80">{t.subjectLabel}</label>
                <input
                  value={previewSubject}
                  onChange={(event) => setPreviewSubject(event.target.value)}
                  className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white outline-none focus:border-primary"
                  placeholder={translations.createTemplate.subjectPlaceholder}
                />
              </div>
            </div>
            <div className="rounded-[32px] bg-slate-900/90 px-6 py-8 text-sm text-white shadow-2xl dark:bg-slate-950">
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
      </section>
    </div>
  );
}

function renderTemplateHtml(html: string, variables: TemplateVariable[] | undefined) {
  if (!variables?.length) {
    return html;
  }
  return variables.reduce((content, variable) => {
    const value = variable.sampleValue;
    const pattern = new RegExp(`\\$\\{${escapeRegExp(variable.key)}\\}`, "g");
    return content.replace(pattern, value);
  }, html);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}

type ActivationPayload = {
  canales: string;
  categoria: string;
  plantilla: Record<Language, string>;
  companyId: string;
  templateId: string;
};

async function sendActivationEvent(payload: ActivationPayload) {
  try {
    console.log("[notifications] Activating template", payload.templateId);
    await fetch(ACTIVATION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to notify activation", error);
  }
}

function normalizeApiResult(result: string | null) {
  if (!result) return null;
  const trimmed = result.trim();
  if (!trimmed) return null;
  if (trimmed === "success" || trimmed === "failed") {
    return trimmed;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") {
      const inner = parsed.trim().replace(/^"|"$/g, "");
      if (inner) return inner;
    }
    if (typeof parsed === "object" && parsed !== null) {
      const possible = (parsed as Record<string, unknown>).result ?? (parsed as Record<string, unknown>).status;
      if (typeof possible === "string") {
        const inner = possible.trim();
        if (inner) return inner;
      }
    }
  } catch {
    // ignore
  }
  return trimmed.replace(/^"|"$/g, "").trim();
}
