"use client";

import { useState } from "react";
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

interface Webhook {
  id: string;
  endpoint: string;
  event: string;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  "Wallet transaction event",
  "Bank Income Refresh Update",
  "Bank Income Refresh Complete",
  "Account Update",
  "Transaction Update",
  "Identity Verification Complete",
  "Link Event",
  "Payment Status Update",
];

// Datos de ejemplo
const MOCK_WEBHOOKS: Webhook[] = [
  {
    id: "1",
    endpoint: "https://api.example.com/webhooks/income",
    event: "Bank Income Refresh Update",
    createdAt: "2024-10-11T16:12:00-05:00",
  },
];

export function WebhooksPageContent() {
  const { language } = useLanguage();
  const t = useUiTranslations().webhooksPage;
  const [webhooks, setWebhooks] = useState<Webhook[]>(MOCK_WEBHOOKS);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    event: "",
    endpoint: "",
  });
  const [errors, setErrors] = useState({
    event: "",
    endpoint: "",
  });

  const locale = language === "es" ? "es-ES" : "en-US";

  const validateURL = (url: string): boolean => {
    return url.startsWith("http://") || url.startsWith("https://");
  };

  const eventLabel = (event: string) => {
    switch (event) {
      case "Wallet transaction event":
        return t.events.walletTransactionEvent;
      case "Bank Income Refresh Update":
        return t.events.bankIncomeRefreshUpdate;
      case "Bank Income Refresh Complete":
        return t.events.bankIncomeRefreshComplete;
      case "Account Update":
        return t.events.accountUpdate;
      case "Transaction Update":
        return t.events.transactionUpdate;
      case "Identity Verification Complete":
        return t.events.identityVerificationComplete;
      case "Link Event":
        return t.events.linkEvent;
      case "Payment Status Update":
        return t.events.paymentStatusUpdate;
      default:
        return event;
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      };
      return date.toLocaleString(locale, options);
    } catch {
      return dateString;
    }
  };

  const handleNewWebhook = () => {
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

  const handleConfigure = () => {
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

    // Crear nuevo webhook
    const newWebhook: Webhook = {
      id: Date.now().toString(),
      endpoint: formData.endpoint,
      event: formData.event,
      createdAt: new Date().toISOString(),
    };

    setWebhooks([...webhooks, newWebhook]);
    setShowNewWebhook(false);
    setFormData({ event: "", endpoint: "" });
    setErrors({ event: "", endpoint: "" });
  };

  const handleDeleteClick = (id: string) => {
    setShowDeleteModal(id);
  };

  const handleDeleteConfirm = () => {
    if (showDeleteModal) {
      setWebhooks(webhooks.filter((w) => w.id !== showDeleteModal));
      setShowDeleteModal(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with New Webhook button */}
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <button
          onClick={handleNewWebhook}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          {t.newWebhook}
        </button>
      </div>

      {/* New Webhook Form */}
      {showNewWebhook && (
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
                options={[
                  { value: "", label: t.sections.event.selectPlaceholder },
                  ...AVAILABLE_EVENTS.map((event) => ({
                    value: event,
                    label: eventLabel(event),
                  })),
                ]}
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
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm font-medium text-dark shadow-sm outline-none transition-all placeholder:text-dark-6 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-dark dark:text-white dark:placeholder:text-dark-6 dark:focus:border-primary ${
                    errors.endpoint
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
      {webhooks.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-gray-1 dark:bg-dark-3 [&>th]:py-4 [&>th]:text-sm [&>th]:font-semibold [&>th]:text-dark [&>th]:dark:text-white">
                <TableHead>{t.table.endpoint}</TableHead>
                <TableHead>{t.table.events}</TableHead>
                <TableHead>{t.table.created}</TableHead>
                <TableHead className="text-right">{t.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow
                  key={webhook.id}
                  className="text-sm text-dark dark:text-white"
                >
                  <TableCell className="font-medium">{webhook.endpoint}</TableCell>
                  <TableCell>{eventLabel(webhook.event)}</TableCell>
                  <TableCell className="text-dark-6 dark:text-dark-6">
                    {formatDate(webhook.createdAt)}
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
      {webhooks.length === 0 && !showNewWebhook && (
        <div className="rounded-lg border border-stroke bg-white p-12 text-center shadow-sm dark:border-dark-3 dark:bg-dark-2">
          <p className="text-dark-6 dark:text-dark-6">
            {t.empty.message}
          </p>
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
