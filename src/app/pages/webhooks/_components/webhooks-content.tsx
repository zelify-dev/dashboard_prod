"use client";

import { useState, useEffect } from "react";
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
  getWebhooks, 
  createWebhook, 
  deleteWebhook,
  rotateWebhookSecret,
  type WebhookCategory, 
  type WebhookRecord 
} from "@/lib/webhooks-api";
import { Eye, EyeOff, Copy, RefreshCw, CircleHelp } from "lucide-react";

/** Evento «Usuario Creado» (catálogo API / traducciones). */
const USER_CREATED_WEBHOOK_EVENT_ID = "auth.user.created";

const DAMASCO_USER_CREATED_JSON_EXAMPLE = `{
  "organization": "damasco-org",
  "data": {
    "zelifyUser": "usr_9823749823",
    "createdAt": "2026-05-04T14:24:58Z",
    "name": "Juan",
    "lastname": "Pérez",
    "documentNumber": "1723456789",
    "email": "juan.perez@email.com",
    "phone": "+593987654321",
    "address": "Av. Amazonas N45-123, Quito, Ecuador",
    "kycProcess": "success",
    "amlProcess": "success"
  }
}`;

function textMentionsDamasco(...parts: (string | undefined | null)[]): boolean {
  const blob = parts.filter(Boolean).join(" ").toLowerCase();
  return blob.includes("damasco");
}

function isDamascoOrganization(org: OrganizationDetails | null): boolean {
  if (!org) return false;
  return textMentionsDamasco(org.name, org.company_legal_name, org.website, org.id);
}

function isUserCreatedWebhookEvent(eventId: string): boolean {
  return eventId.trim().toLowerCase() === USER_CREATED_WEBHOOK_EVENT_ID;
}

function shouldShowUserCreatedHelp(
  org: OrganizationDetails | null,
  webhook: WebhookRecord
): boolean {
  return isDamascoOrganization(org) && isUserCreatedWebhookEvent(webhook.event);
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

  const canUseWebhooks = canUseOrganizationIntegrations(orgDetails, scopes);

  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [userCreatedHelpWebhookId, setUserCreatedHelpWebhookId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    event: "",
    endpoint: "",
  });
  const [errors, setErrors] = useState({
    event: "",
    endpoint: "",
  });

  const locale = language === "es" ? "es-ES" : "en-US";
  const webhooksLocked = orgLoading || !canUseWebhooks;

  const validateURL = (url: string): boolean => {
    return url.startsWith("http://") || url.startsWith("https://");
  };

  const eventLabel = (eventId: string) => {
    if (t.events[eventId]) {
      return t.events[eventId];
    }
    for (const cat of categories) {
      const found = cat.events.find(e => e.id === eventId);
      if (found) return found.name;
    }
    return eventId;
  };

  const selectOptions = [
    { value: "", label: t.sections.event.selectPlaceholder },
    ...categories.map(cat => ({
      label: cat.category,
      options: cat.events.map(evt => ({
        value: evt.id,
        label: t.events[evt.id] || evt.name
      }))
    }))
  ];

  const handleNewWebhook = () => {
    if (webhooksLocked) return;
    setShowNewWebhook(true);
    setFormData({ event: "", endpoint: "" });
    setErrors({ event: "", endpoint: "" });
  };

  const handleCancel = () => {
    setShowNewWebhook(false);
    setFormData({ event: "", endpoint: "" });
    setErrors({ event: "", endpoint: "" });
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
      await createWebhook({
        url: formData.endpoint,
        event: formData.event,
      });
      await fetchData(); // Refresh list
      setShowNewWebhook(false);
      setFormData({ event: "", endpoint: "" });
    } catch (err) {
      console.error("Error creating webhook:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (webhooksLocked) return;
    setShowDeleteModal(id);
  };

  const handleDeleteConfirm = async () => {
    if (showDeleteModal) {
      try {
        await deleteWebhook(showDeleteModal);
        setWebhooks(webhooks.filter((w) => w.id !== showDeleteModal));
        setShowDeleteModal(null);
      } catch (err) {
        console.error("Error deleting webhook:", err);
      }
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

  const handleCopySecret = (secret: string | undefined) => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    // Optional: add a "Copied!" toast if available. For now, quiet success.
  };

  const handleRotate = async (id: string) => {
    if (webhooksLocked || isRotating) return;
    setIsRotating(id);
    try {
      await rotateWebhookSecret(id);
      await fetchData();
    } catch (err) {
      console.error("Error rotating secret:", err);
    } finally {
      setIsRotating(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(null);
  };

  const helpWebhook =
    userCreatedHelpWebhookId != null
      ? webhooks.find((w) => w.id === userCreatedHelpWebhookId) ?? null
      : null;

  const handleCopyUserCreatedExample = () => {
    void navigator.clipboard.writeText(DAMASCO_USER_CREATED_JSON_EXAMPLE.trim());
  };

  const handleCopyHelpWebhookUrl = () => {
    if (helpWebhook?.url) void navigator.clipboard.writeText(helpWebhook.url);
  };

  return (
    <div className="space-y-6">
      {orgLoading && (
        <p className="text-sm text-dark-6 dark:text-dark-6">{t.loadingAccess}</p>
      )}
      {!orgLoading && !canUseWebhooks && (
        <div
          role="status"
          className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-dark dark:text-white/90 dark:border-primary/40 dark:bg-primary/15"
        >
          {t.lockedUntilOnboarding}
        </div>
      )}

      {/* Header with New Webhook button */}
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleNewWebhook}
          disabled={webhooksLocked}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {t.newWebhook}
        </button>
      </div>

      {/* New Webhook Form */}
      {showNewWebhook && canUseWebhooks && (
        <div className="space-y-6 rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark dark:text-white">
              {t.configureWebhook}
            </h3>
            <button
              onClick={handleCancel}
              className="text-sm text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            >
              {t.cancel}
            </button>
          </div>

          {/* Event Section */}
          <div className="space-y-3">
            <div>
              <h4 className="mb-2 text-base font-semibold text-dark dark:text-white">
                {t.sections.event.title}
              </h4>
              <p className="mb-3 text-sm text-dark-6 dark:text-dark-6">
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
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {errors.event}
                </p>
              )}
            </div>
          </div>

          {/* Webhook Configuration Section */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-dark dark:text-white">
              {t.sections.webhook.title}
            </h4>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t.sections.webhook.endpointPlaceholder}
                  value={formData.endpoint}
                  onChange={(e) => handleInputChange("endpoint", e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm font-medium text-dark shadow-sm outline-none transition-all placeholder:text-dark-6 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-dark dark:text-white dark:placeholder:text-dark-6 dark:focus:border-primary ${errors.endpoint
                      ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                      : "border-stroke bg-white dark:border-dark-3"
                    }`}
                />
                {errors.endpoint && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                    {errors.endpoint}
                  </p>
                )}
              </div>
              <button
                onClick={handleConfigure}
                className="rounded-lg border border-stroke bg-white px-6 py-2.5 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark dark:text-white dark:hover:bg-dark-3"
              >
                {t.sections.webhook.configureButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks Table */}
      {canUseWebhooks && webhooks.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-gray-1 dark:bg-dark-3 [&>th]:py-4 [&>th]:text-sm [&>th]:font-semibold [&>th]:text-dark [&>th]:dark:text-white">
                <TableHead>{t.table.endpoint}</TableHead>
                <TableHead>{t.table.events}</TableHead>
                <TableHead>{t.table.created}</TableHead>
                <TableHead>{t.table.signingSecret}</TableHead>
                <TableHead className="text-right">{t.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow
                  key={webhook.id}
                  className="text-sm text-dark dark:text-white"
                >
                  <TableCell className="font-medium">{webhook.url}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{eventLabel(webhook.event)}</span>
                      {shouldShowUserCreatedHelp(orgDetails, webhook) && (
                        <button
                          type="button"
                          onClick={() => setUserCreatedHelpWebhookId(webhook.id)}
                          className="inline-flex rounded-full border border-stroke p-1 text-dark-6 transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-dark-6 dark:hover:text-primary"
                          title={t.userCreatedHelp.buttonAria}
                          aria-label={t.userCreatedHelp.buttonAria}
                        >
                          <CircleHelp size={18} strokeWidth={1.75} aria-hidden />
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-dark-6 dark:text-dark-6">
                    {formatLocalDateTime(webhook.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center gap-2 rounded-md bg-gray-1 px-3 py-1.5 font-mono text-xs dark:bg-dark-3">
                        <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-dark-6 dark:text-dark-6">
                          {revealedSecrets.has(webhook.id) ? webhook.secret : "••••••••••••••••••••••••"}
                        </span>
                        <div className="flex items-center gap-1 border-l border-stroke pl-2 dark:border-dark-4">
                          <button
                            onClick={() => handleToggleSecret(webhook.id)}
                            className="text-dark-6 hover:text-primary dark:text-dark-6 dark:hover:text-primary"
                            title={revealedSecrets.has(webhook.id) ? "Hide" : "Show"}
                          >
                            {revealedSecrets.has(webhook.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => handleCopySecret(webhook.secret)}
                            className="text-dark-6 hover:text-primary dark:text-dark-6 dark:hover:text-primary"
                            title="Copy"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRotate(webhook.id)}
                        disabled={!!isRotating}
                        className={`text-dark-6 hover:text-primary dark:text-dark-6 dark:hover:text-primary ${isRotating === webhook.id ? "animate-spin" : ""}`}
                        title="Rotate Secret"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleDeleteClick(webhook.id)}
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:bg-dark dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      {t.table.delete}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty State */}
      {canUseWebhooks && webhooks.length === 0 && !showNewWebhook && (
        <div className="rounded-lg border border-stroke bg-white p-12 text-center shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <p className="text-dark-6 dark:text-dark-6">
            {t.empty.message}
          </p>
        </div>
      )}

      {/* Usuario Creado (Damasco): cómo utilizar — POST + x-signature */}
      {helpWebhook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-created-help-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUserCreatedHelpWebhookId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setUserCreatedHelpWebhookId(null);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">
            <h3
              id="user-created-help-title"
              className="text-lg font-semibold text-dark dark:text-white"
            >
              {t.userCreatedHelp.modalTitle}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-dark-6 dark:text-dark-6">
              {t.userCreatedHelp.modalIntro}
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-dark dark:text-white">
              <li>
                <span className="font-mono text-xs font-semibold">{t.userCreatedHelp.postLabel}</span>
              </li>
              <li>
                <span className="font-mono text-xs font-semibold">{t.userCreatedHelp.signatureHeaderLabel}</span>
              </li>
            </ul>

            <div className="mt-5 rounded-lg border border-stroke bg-gray-1/80 p-4 dark:border-dark-3 dark:bg-dark">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="user-created-help-destination-url"
                  className="text-sm font-semibold text-dark dark:text-white"
                >
                  {t.userCreatedHelp.destinationUrlLabel}
                </label>
                <button
                  type="button"
                  onClick={handleCopyHelpWebhookUrl}
                  className="rounded-md border border-stroke bg-white px-2 py-1 text-xs font-medium text-primary hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-3"
                >
                  {t.userCreatedHelp.copyUrl}
                </button>
              </div>
              <p className="mb-2 text-xs text-dark-6 dark:text-dark-6">{t.userCreatedHelp.destinationUrlHint}</p>
              <input
                id="user-created-help-destination-url"
                readOnly
                value={helpWebhook.url}
                className="w-full break-all rounded-md border border-stroke bg-white px-3 py-2 font-mono text-xs text-dark outline-none dark:border-dark-3 dark:bg-dark dark:text-white"
              />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-dark dark:text-white">
                  {t.userCreatedHelp.exampleJsonTitle}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUserCreatedExample}
                  className="rounded-md border border-stroke px-2 py-1 text-xs font-medium text-primary hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
                >
                  {t.userCreatedHelp.copyJson}
                </button>
              </div>
              <pre className="max-h-[40vh] overflow-auto rounded-md border border-stroke bg-gray-1 p-3 text-left text-xs leading-relaxed text-dark dark:border-dark-3 dark:bg-dark dark:text-dark-6">
                {DAMASCO_USER_CREATED_JSON_EXAMPLE.trim()}
              </pre>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setUserCreatedHelpWebhookId(null)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                {t.userCreatedHelp.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-stroke bg-white p-6 shadow-lg dark:border-dark-3 dark:bg-dark-2">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
              {t.deleteModal.title}
            </h3>
            <p className="mb-6 text-sm text-dark-6 dark:text-dark-6">
              {t.deleteModal.description}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark dark:text-white dark:hover:bg-dark-3"
              >
                {t.deleteModal.cancel}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
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
