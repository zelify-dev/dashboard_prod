import { fetchWithAuth } from "./auth-api";

export interface WebhookEvent {
  id: string;
  name: string;
  description: string;
}

export interface WebhookCategory {
  category: string;
  events: WebhookEvent[];
}

export interface WebhookEventTypesResponse {
  categories: WebhookCategory[];
}

export interface WebhookRecord {
  id: string;
  url: string;
  event: string;
  is_active: boolean;
  created_at: string;
  secret?: string;
}

/** Fetch all available event types for the catalog */
export async function getWebhookEventTypes(): Promise<WebhookEventTypesResponse> {
  const result = await fetchWithAuth("/api/webhooks/event-types");
  if (!result.ok) {
    const errorData = await result.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch webhook event types");
  }
  return (await result.json()) as WebhookEventTypesResponse;
}

/** List all webhooks configured for the current organization */
export async function getWebhooks(): Promise<WebhookRecord[]> {
  const result = await fetchWithAuth("/api/webhooks");
  if (!result.ok) {
    const errorData = await result.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch webhooks");
  }
  return (await result.json()) as WebhookRecord[];
}

/** Create a new webhook config */
export async function createWebhook(data: { url: string; event: string }): Promise<WebhookRecord> {
  const result = await fetchWithAuth("/api/webhooks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!result.ok) {
    const errorData = await result.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create webhook");
  }
  return (await result.json()) as WebhookRecord;
}

/** Delete (deactivate) a webhook config */
export async function deleteWebhook(id: string): Promise<void> {
  const result = await fetchWithAuth(`/api/webhooks/${id}`, {
    method: "DELETE",
  });
  if (!result.ok) {
    const errorData = await result.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete webhook");
  }
}

/** Rotate the secret for a webhook */
export async function rotateWebhookSecret(id: string): Promise<WebhookRecord> {
  const result = await fetchWithAuth(`/api/webhooks/${id}/rotate-secret`, {
    method: "POST",
  });
  if (!result.ok) {
    const errorData = await result.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to rotate secret");
  }
  return (await result.json()) as WebhookRecord;
}
