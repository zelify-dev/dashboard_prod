"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SimpleSelect } from "@/components/FormElements/simple-select";
import { useLanguage } from "@/contexts/language-context";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { formatLocalDateTime } from "@/lib/date-utils";
import {
  getStoredOrganization,
  getOrganization,
  canUseOrganizationIntegrations,
  type OrganizationDetails,
} from "@/lib/auth-api";
import { useOrganizationScopes } from "@/hooks/use-organization-scopes";
import {
  getWebhookEventTypes,
  getWebhookEventTypeDetail,
  getWebhooks,
  getWebhookDetail,
  getWebhookDeliveries,
  createWebhook,
  deleteWebhook,
  rotateWebhookSecret,
  type WebhookCategory,
  type WebhookEventDetail,
  type WebhookRecord,
  type WebhookDelivery,
} from "@/lib/webhooks-api";
import { Eye, EyeOff, Copy, RefreshCw, CircleHelp } from "lucide-react";

type DetailTab = "overview" | "deliveries";

function getWebhookCreatedAt(webhook: WebhookRecord): string {
  return webhook.createdAt ?? webhook.created_at ?? "";
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

export function WebhooksPageContent() {
  const { language } = useLanguage();
  const t = useUiTranslations().webhooksPage;
  const scopes = useOrganizationScopes();
  const [orgDetails, setOrgDetails] = useState<OrganizationDetails | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [categories, setCategories] = useState<WebhookCategory[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [isRotating, setIsRotating] = useState<string | null>(null);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [detailWebhookId, setDetailWebhookId] = useState<string | null>(null);
  const [detailWebhook, setDetailWebhook] = useState<WebhookRecord | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [detailLoading, setDetailLoading] = useState(false);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [eventDetail, setEventDetail] = useState<WebhookEventDetail | null>(null);
  const [eventDetailLoading, setEventDetailLoading] = useState(false);
  const [showSecretNotice, setShowSecretNotice] = useState(false);
  const [formData, setFormData] = useState({
    event: "",
    endpoint: "",
  });
  const [errors, setErrors] = useState({
    event: "",
    endpoint: "",
  });

  const canUseWebhooks = canUseOrganizationIntegrations(orgDetails, scopes);
  const webhooksLocked = orgLoading || !canUseWebhooks;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, webhooksRes] = await Promise.all([
        getWebhookEventTypes(),
        getWebhooks(),
      ]);
      setCategories(eventsRes.categories);
      setWebhooks(webhooksRes);
    } catch (err) {
      console.error("Error fetching webhooks data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const id = getStoredOrganization()?.id;
    if (!id) {
      setOrgLoading(false);
      return;
    }
    setOrgLoading(true);
    getOrganization(id)
      .then(setOrgDetails)
      .catch(() => setOrgDetails(null))
      .finally(() => setOrgLoading(false));

    fetchData();
  }, []);

  useEffect(() => {
    if (!showNewWebhook || !formData.event) {
      setEventDetail(null);
      return;
    }
    let cancelled = false;
    setEventDetailLoading(true);
    getWebhookEventTypeDetail(formData.event)
      .then((detail) => {
        if (!cancelled) setEventDetail(detail);
      })
      .catch((err) => {
        console.error("Error fetching webhook event detail:", err);
        if (!cancelled) setEventDetail(null);
      })
      .finally(() => {
        if (!cancelled) setEventDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.event, showNewWebhook]);

  useEffect(() => {
    if (!detailWebhookId) {
      setDetailWebhook(null);
      setDeliveries([]);
      setDetailTab("overview");
      setShowSecretNotice(false);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    getWebhookDetail(detailWebhookId)
      .then((detail) => {
        if (!cancelled) setDetailWebhook(detail);
      })
      .catch((err) => {
        console.error("Error fetching webhook detail:", err);
        if (!cancelled) {
          const fallback = webhooks.find((item) => item.id === detailWebhookId) ?? null;
          setDetailWebhook(fallback);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detailWebhookId, webhooks]);

  useEffect(() => {
    if (detailTab !== "deliveries" || !detailWebhookId) return;
    let cancelled = false;
    setDeliveriesLoading(true);
    getWebhookDeliveries(detailWebhookId)
      .then((result) => {
        if (!cancelled) setDeliveries(result.deliveries);
      })
      .catch((err) => {
        console.error("Error fetching webhook deliveries:", err);
        if (!cancelled) setDeliveries([]);
      })
      .finally(() => {
        if (!cancelled) setDeliveriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detailTab, detailWebhookId]);

  const validateURL = (url: string): boolean => {
    return url.startsWith("http://") || url.startsWith("https://");
  };

  const eventLabel = (webhook: WebhookRecord) => {
    if (webhook.eventLabel) return webhook.eventLabel;
    for (const cat of categories) {
      const found = cat.events.find((item) => item.id === webhook.event);
      if (found) return found.name;
    }
    return webhook.eventId ?? webhook.event;
  };

  const selectOptions = [
    { value: "", label: t.sections.event.selectPlaceholder },
    ...categories.map((cat) => ({
      label: cat.category,
      options: cat.events.map((evt) => ({
        value: evt.id,
        label: evt.name,
      })),
    })),
  ];

  const closeNewWebhook = () => {
    setShowNewWebhook(false);
    setFormData({ event: "", endpoint: "" });
    setErrors({ event: "", endpoint: "" });
    setEventDetail(null);
  };

  const handleNewWebhook = () => {
    if (webhooksLocked) return;
    closeNewWebhook();
    setShowNewWebhook(true);
  };

  const handleInputChange = (field: "event" | "endpoint", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleConfigure = async () => {
    if (webhooksLocked || isSaving) return;
    const newErrors = { event: "", endpoint: "" };
    let hasErrors = false;

    if (!formData.event) {
      newErrors.event = t.validation.eventRequired;
      hasErrors = true;
    }

    if (!formData.endpoint) {
      newErrors.endpoint = t.validation.endpointRequired;
      hasErrors = true;
    } else if (!validateURL(formData.endpoint)) {
      newErrors.endpoint = t.validation.urlSchemeRequired;
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      const created = await createWebhook({
        url: formData.endpoint,
        event: formData.event,
      });
      setWebhooks((prev) => [created, ...prev]);
      closeNewWebhook();
      setDetailWebhookId(created.id);
      setDetailWebhook(created);
      setDetailTab("overview");
      setShowSecretNotice(true);
    } catch (err) {
      console.error("Error creating webhook:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteModal) return;
    try {
      await deleteWebhook(showDeleteModal);
      setWebhooks((prev) => prev.filter((w) => w.id !== showDeleteModal));
      if (detailWebhookId === showDeleteModal) {
        setDetailWebhookId(null);
      }
      setShowDeleteModal(null);
    } catch (err) {
      console.error("Error deleting webhook:", err);
    }
  };

  const handleToggleSecret = (id: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (value: string | undefined) => {
    if (!value) return;
    void navigator.clipboard.writeText(value);
  };

  const handleRotate = async (id: string) => {
    if (webhooksLocked || isRotating) return;
    setIsRotating(id);
    try {
      const updated = await rotateWebhookSecret(id);
      setWebhooks((prev) => prev.map((item) => (item.id === id ? updated : item)));
      if (detailWebhookId === id) {
        setDetailWebhook(updated);
        setShowSecretNotice(true);
      }
    } catch (err) {
      console.error("Error rotating secret:", err);
    } finally {
      setIsRotating(null);
    }
  };

  const selectedEventDescription =
    categories
      .flatMap((cat) => cat.events)
      .find((event) => event.id === formData.event)?.description ?? "";

  const detailPayload = stringifyJson(
    detailWebhook?.payloadExample ?? eventDetail?.payloadExample ?? {}
  );

  return (
    <div className="space-y-6">
      {orgLoading && <p className="text-xs font-light text-dark-6">{t.loadingAccess}</p>}
      {!orgLoading && !canUseWebhooks && (
        <div
          role="status"
          className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-xs font-light text-rose-800"
        >
          {t.lockedUntilOnboarding}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleNewWebhook}
          disabled={webhooksLocked}
          className="rounded-xl bg-zelify-midnight px-4 py-2 text-xs font-light text-white transition hover:bg-zelify-midnight/90 active:scale-95 disabled:opacity-50"
        >
          {t.newWebhook}
        </button>
      </div>

      {showNewWebhook && canUseWebhooks && (
        <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-normal text-dark">{t.configureWebhook}</h3>
            <button
              onClick={closeNewWebhook}
              className="text-xs font-light text-dark-6 hover:text-dark"
            >
              {t.cancel}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-1 text-xs font-light uppercase tracking-wider text-dark-6">
                {t.sections.event.title}
              </h4>
              <p className="mb-3 text-xs font-light text-dark-6">
                {t.sections.event.description}
              </p>
              <SimpleSelect
                options={selectOptions}
                value={formData.event}
                onChange={(value) => handleInputChange("event", value)}
                isSearchable={true}
                className={errors.event ? "react-select-error" : ""}
              />
              {errors.event && (
                <p className="mt-1.5 text-xs text-red-600">{errors.event}</p>
              )}
            </div>
            {formData.event && (
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-xs font-light text-dark-6">
                <p className="font-normal text-dark">
                  {eventDetail?.name || selectedEventDescription || formData.event}
                </p>
                {selectedEventDescription && (
                  <p className="mt-1">{selectedEventDescription}</p>
                )}
                {eventDetailLoading && (
                  <p className="mt-2 text-[10px] animate-pulse text-dark-6">
                    {t.detailModal.loading}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-light uppercase tracking-wider text-dark-6">
              {t.sections.webhook.title}
            </h4>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t.sections.webhook.endpointPlaceholder}
                  value={formData.endpoint}
                  onChange={(e) => handleInputChange("endpoint", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2 text-xs font-light text-dark outline-none transition-all placeholder:text-dark-6 ${
                    errors.endpoint
                      ? "border-red-500 bg-red-50"
                      : "border-gray-100 bg-gray-50/50 focus:border-gray-200"
                  }`}
                />
                {errors.endpoint && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.endpoint}
                  </p>
                )}
              </div>
              <button
                onClick={handleConfigure}
                disabled={isSaving}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-light text-dark transition hover:bg-gray-50 active:scale-95"
              >
                {t.sections.webhook.configureButton}
              </button>
            </div>
            {eventDetail && (
              <div className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-xs font-light text-dark-6">
                <div>
                  <p className="font-normal text-dark">{t.detailModal.headers}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {eventDetail.headers.map((header) => (
                      <code
                        key={header}
                        className="rounded-lg border border-gray-100 bg-white px-2 py-1 text-[11px] text-dark font-mono"
                      >
                        {header}
                      </code>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-normal text-dark">{t.detailModal.signature}</p>
                  <p className="mt-1">
                    {eventDetail.signatureScheme.algorithm} · {eventDetail.signatureScheme.header}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {canUseWebhooks && !isLoading && webhooks.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm max-w-full">
          <div className="overflow-x-auto">
            <div className="min-w-[1100px] flex flex-col">
              
              {/* Header Row */}
              <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/50 px-5 py-3 text-[10px] font-light uppercase tracking-wider text-dark-6">
                <span className="flex-1">{t.table.endpoint}</span>
                <span className="w-64">{t.table.events}</span>
                <span className="w-48">{t.table.created}</span>
                <span className="w-56">{t.table.signingSecret}</span>
                <span className="w-24 text-right">{t.table.actions}</span>
              </div>

              {/* Body Rows */}
              {webhooks.map((webhook) => (
                <div 
                  key={webhook.id} 
                  className="flex items-center gap-4 border-b border-gray-100/60 px-5 py-3 hover:bg-gray-50/30 transition text-xs font-light text-dark-6"
                >
                  <span className="flex-1 font-normal text-dark truncate">
                    {webhook.url}
                  </span>
                  
                  <span className="w-64 flex items-center gap-2 overflow-hidden">
                    <span className="truncate">{eventLabel(webhook)}</span>
                    <button
                      type="button"
                      onClick={() => setDetailWebhookId(webhook.id)}
                      className="inline-flex rounded-full p-1 text-dark-6 hover:bg-gray-100 hover:text-dark transition"
                      title={t.detailModal.openAria}
                      aria-label={t.detailModal.openAria}
                    >
                      <CircleHelp size={14} strokeWidth={1.5} />
                    </button>
                  </span>

                  <span className="w-48 text-[11px] text-dark-6">
                    {formatLocalDateTime(getWebhookCreatedAt(webhook))}
                  </span>

                  <div className="w-56 flex items-center gap-2">
                    <div className="relative flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-1 font-mono text-[11px] font-light text-dark-6">
                      <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {revealedSecrets.has(webhook.id) && webhook.secret
                          ? webhook.secret
                          : "••••••••••••••••••••••••"}
                      </span>
                      <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                        <button
                          onClick={() => handleToggleSecret(webhook.id)}
                          className="text-dark-6 hover:text-dark transition"
                          title={revealedSecrets.has(webhook.id) ? t.detailModal.hide : t.detailModal.show}
                        >
                          {revealedSecrets.has(webhook.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          onClick={() => handleCopy(webhook.secret)}
                          className="text-dark-6 hover:text-dark transition"
                          title={t.detailModal.copySecret}
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRotate(webhook.id)}
                      disabled={!!isRotating}
                      className={`text-dark-6 hover:text-dark transition ${
                        isRotating === webhook.id ? "animate-spin" : ""
                      }`}
                      title={t.detailModal.rotateSecret}
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>

                  <div className="w-24 text-right">
                    <button
                      onClick={() => setShowDeleteModal(webhook.id)}
                      className="rounded-xl border border-red-100 bg-white px-3 py-1.5 text-xs font-light text-red-600 hover:bg-red-50 transition active:scale-95"
                    >
                      {t.table.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {canUseWebhooks && !isLoading && webhooks.length === 0 && !showNewWebhook && (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-xs font-light text-dark-6">{t.empty.message}</p>
        </div>
      )}

      {detailWebhookId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="webhook-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailWebhookId(null);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="webhook-detail-title" className="text-sm font-normal text-dark">
                  {t.detailModal.title}
                </h3>
                {detailWebhook && (
                  <p className="mt-1 text-xs font-light text-dark-6">
                    {eventLabel(detailWebhook)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailWebhookId(null)}
                className="text-xs font-light text-dark-6 hover:text-dark"
              >
                {t.detailModal.close}
              </button>
            </div>

            <div className="mt-5 flex gap-2 border-b border-gray-100 pb-3">
              <button
                type="button"
                onClick={() => setDetailTab("overview")}
                className={`rounded-xl px-3 py-1.5 text-xs font-light transition ${
                  detailTab === "overview"
                    ? "bg-zelify-midnight text-white"
                    : "border border-gray-100 bg-gray-50/50 text-dark hover:bg-gray-100/50"
                }`}
              >
                {t.detailModal.overviewTab}
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("deliveries")}
                className={`rounded-xl px-3 py-1.5 text-xs font-light transition ${
                  detailTab === "deliveries"
                    ? "bg-zelify-midnight text-white"
                    : "border border-gray-100 bg-gray-50/50 text-dark hover:bg-gray-100/50"
                }`}
              >
                {t.detailModal.deliveriesTab}
              </button>
            </div>

            {detailLoading && (
              <p className="mt-4 text-sm text-dark-6 dark:text-dark-6">{t.detailModal.loading}</p>
            )}

            {!detailLoading && detailWebhook && detailTab === "overview" && (
              <div className="mt-5 space-y-5">
                {showSecretNotice && (
                  <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-dark dark:text-white/90 dark:border-primary/40 dark:bg-primary/15">
                    {t.detailModal.secretNotice}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-stroke bg-gray-1/70 p-4 dark:border-dark-3 dark:bg-dark">
                    <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                      {t.detailModal.eventNameLabel}
                    </p>
                    <p className="mt-1 font-medium text-dark dark:text-white">{eventLabel(detailWebhook)}</p>
                    <p className="mt-3 text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                      {t.detailModal.eventIdLabel}
                    </p>
                    <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-xs text-dark dark:bg-dark-2 dark:text-white">
                      {detailWebhook.eventId ?? detailWebhook.event}
                    </code>
                    {detailWebhook.eventDescription && (
                      <p className="mt-3 text-sm text-dark-6 dark:text-dark-6">
                        {detailWebhook.eventDescription}
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-stroke bg-gray-1/70 p-4 dark:border-dark-3 dark:bg-dark">
                    <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                      {t.detailModal.destinationUrlLabel}
                    </p>
                    <div className="mt-2 flex items-start gap-2">
                      <code className="flex-1 break-all rounded bg-white px-2 py-1 text-xs text-dark dark:bg-dark-2 dark:text-white">
                        {detailWebhook.url}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(detailWebhook.url)}
                        className="rounded-md border border-stroke px-2 py-1 text-xs font-medium text-primary hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
                      >
                        {t.detailModal.copyUrl}
                      </button>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                      {t.detailModal.category}
                    </p>
                    <p className="mt-1 text-sm text-dark dark:text-white">
                      {detailWebhook.category || t.detailModal.notAvailable}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-stroke bg-gray-1/70 p-4 dark:border-dark-3 dark:bg-dark">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        {t.detailModal.secretLabel}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="block break-all rounded bg-white px-3 py-2 text-xs text-dark dark:bg-dark-2 dark:text-white">
                          {detailWebhook.secret
                            ? revealedSecrets.has(detailWebhook.id)
                              ? detailWebhook.secret
                              : "••••••••••••••••••••••••"
                            : t.detailModal.notAvailable}
                        </code>
                        {detailWebhook.secret && (
                          <button
                            type="button"
                            onClick={() => handleToggleSecret(detailWebhook.id)}
                            className="inline-flex rounded-md border border-stroke p-2 text-dark-6 hover:text-primary dark:border-dark-3 dark:text-dark-6 dark:hover:text-primary"
                            title={revealedSecrets.has(detailWebhook.id) ? t.detailModal.hide : t.detailModal.show}
                            aria-label={revealedSecrets.has(detailWebhook.id) ? t.detailModal.hide : t.detailModal.show}
                          >
                            {revealedSecrets.has(detailWebhook.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(detailWebhook.secret)}
                        className="rounded-md border border-stroke px-3 py-2 text-xs font-medium text-primary hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
                      >
                        {t.detailModal.copySecret}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotate(detailWebhook.id)}
                        disabled={!!isRotating}
                        className="rounded-md border border-stroke px-3 py-2 text-xs font-medium text-dark hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                      >
                        {t.detailModal.rotateSecret}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-stroke bg-gray-1/70 p-4 dark:border-dark-3 dark:bg-dark">
                    <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                      {t.detailModal.method}
                    </p>
                    <p className="mt-1 text-sm font-medium text-dark dark:text-white">
                      {detailWebhook.method || t.detailModal.notAvailable}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                      {t.detailModal.contentType}
                    </p>
                    <p className="mt-1 text-sm font-medium text-dark dark:text-white">
                      {detailWebhook.contentType || t.detailModal.notAvailable}
                    </p>
                  </div>

                  <div className="rounded-lg border border-stroke bg-gray-1/70 p-4 dark:border-dark-3 dark:bg-dark">
                    <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                      {t.detailModal.created}
                    </p>
                    <p className="mt-1 text-sm font-medium text-dark dark:text-white">
                      {formatLocalDateTime(getWebhookCreatedAt(detailWebhook))}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-stroke bg-gray-1/70 p-4 dark:border-dark-3 dark:bg-dark">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-dark dark:text-white">{t.detailModal.headers}</p>
                    <button
                      type="button"
                      onClick={() => handleCopy((detailWebhook.headers ?? []).join("\n"))}
                      className="rounded-md border border-stroke px-2 py-1 text-xs font-medium text-primary hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
                    >
                      {t.detailModal.copyHeaders}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(detailWebhook.headers ?? []).map((header) => (
                      <code
                        key={header}
                        className="rounded bg-white px-2 py-1 text-xs text-dark dark:bg-dark-2 dark:text-white"
                      >
                        {header}
                      </code>
                    ))}
                  </div>
                </div>

                {detailWebhook.signatureScheme && (
                  <div className="rounded-lg border border-stroke bg-gray-1/70 p-4 dark:border-dark-3 dark:bg-dark">
                    <p className="font-semibold text-dark dark:text-white">{t.detailModal.signature}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                          {t.detailModal.algorithm}
                        </p>
                        <p className="mt-1 text-sm text-dark dark:text-white">
                          {detailWebhook.signatureScheme.algorithm}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                          {t.detailModal.signatureHeader}
                        </p>
                        <code className="mt-1 block rounded bg-white px-2 py-1 text-xs text-dark dark:bg-dark-2 dark:text-white">
                          {detailWebhook.signatureScheme.header}
                        </code>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                          {t.detailModal.timestampHeader}
                        </p>
                        <code className="mt-1 block rounded bg-white px-2 py-1 text-xs text-dark dark:bg-dark-2 dark:text-white">
                          {detailWebhook.signatureScheme.timestampHeader}
                        </code>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                          {t.detailModal.encoding}
                        </p>
                        <p className="mt-1 text-sm text-dark dark:text-white">
                          {detailWebhook.signatureScheme.encoding}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                      {t.detailModal.signedPayloadFormat}
                    </p>
                    <code className="mt-1 block rounded bg-white px-2 py-1 text-xs text-dark dark:bg-dark-2 dark:text-white">
                      {detailWebhook.signatureScheme.signedPayloadFormat}
                    </code>
                  </div>
                )}

                <div className="rounded-lg border border-stroke bg-gray-1/70 p-4 dark:border-dark-3 dark:bg-dark">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-semibold text-dark dark:text-white">{t.detailModal.payloadExample}</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(detailPayload)}
                      className="rounded-md border border-stroke px-2 py-1 text-xs font-medium text-primary hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
                    >
                      {t.detailModal.copyJson}
                    </button>
                  </div>
                  <pre className="max-h-[40vh] overflow-auto rounded-md border border-stroke bg-white p-3 text-left text-xs leading-relaxed text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white">
                    {detailPayload}
                  </pre>
                </div>

                <div className="rounded-lg border border-stroke bg-gray-1/70 p-4 dark:border-dark-3 dark:bg-dark">
                  <p className="font-semibold text-dark dark:text-white">{t.detailModal.notes}</p>
                  {detailWebhook.notes && detailWebhook.notes.length > 0 ? (
                    <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-dark-6 dark:text-dark-6">
                      {detailWebhook.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-dark-6 dark:text-dark-6">
                      {t.detailModal.noNotes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!detailLoading && detailTab === "deliveries" && (
              <div className="mt-5 space-y-4">
                {deliveriesLoading && (
                  <p className="text-xs font-light text-dark-6 animate-pulse">{t.detailModal.loading}</p>
                )}
                {!deliveriesLoading && deliveries.length === 0 && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-xs font-light text-dark-6">
                    {t.detailModal.noDeliveries}
                  </div>
                )}
                {!deliveriesLoading &&
                  deliveries.map((delivery) => (
                    <div
                      key={delivery.deliveryId}
                      className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-xs font-light text-dark-6"
                    >
                      <div className="grid gap-3 md:grid-cols-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-dark-6">
                            {t.detailModal.deliveryStatus}
                          </p>
                          <p className="mt-1 font-normal text-dark">
                            {delivery.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-dark-6">
                            {t.detailModal.statusCode}
                          </p>
                          <p className="mt-1 font-normal text-dark">
                            {delivery.statusCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-dark-6">
                            {t.detailModal.attempt}
                          </p>
                          <p className="mt-1 font-normal text-dark">
                            {delivery.attempt}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-dark-6">
                            {t.detailModal.responseTime}
                          </p>
                          <p className="mt-1 font-normal text-dark">
                            {delivery.responseTimeMs} ms
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-dark-6">
                            {t.detailModal.requestId}
                          </p>
                          <code className="mt-1 block break-all rounded-lg border border-gray-100 bg-white px-2 py-1 text-[11px] font-mono text-dark">
                            {delivery.requestId}
                          </code>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-dark-6">
                            {t.detailModal.created}
                          </p>
                          <p className="mt-1 font-normal text-dark">
                            {formatLocalDateTime(delivery.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="font-normal text-dark">
                              {t.detailModal.payloadExample}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleCopy(stringifyJson(delivery.payload))}
                              className="rounded-xl border border-gray-200 bg-white px-2 py-1 text-xs font-light text-dark hover:bg-gray-50 transition active:scale-95"
                            >
                              {t.detailModal.copyJson}
                            </button>
                          </div>
                          <pre className="max-h-[28vh] overflow-auto rounded-xl border border-gray-100 bg-white p-3 text-left text-[11px] font-mono leading-relaxed text-dark">
                            {stringifyJson(delivery.payload)}
                          </pre>
                        </div>
                        <div>
                          <p className="font-normal text-dark">
                            {t.detailModal.responseBody}
                          </p>
                          <pre className="mt-2 max-h-[28vh] overflow-auto rounded-xl border border-gray-100 bg-white p-3 text-left text-[11px] font-mono leading-relaxed text-dark">
                            {delivery.responseBody || t.detailModal.notAvailable}
                          </pre>
                          {delivery.errorMessage && (
                            <p className="mt-3 text-xs text-red-600">
                              {delivery.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="mb-2 text-sm font-normal text-dark">
              {t.deleteModal.title}
            </h3>
            <p className="mb-6 text-xs font-light text-dark-6">
              {t.deleteModal.description}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-light text-dark hover:bg-gray-50 transition active:scale-95"
              >
                {t.deleteModal.cancel}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-light text-white hover:bg-red-700 transition active:scale-95"
              >
                {t.deleteModal.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
