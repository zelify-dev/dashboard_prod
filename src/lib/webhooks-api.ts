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

export interface WebhookSignatureScheme {
  algorithm: string;
  header: string;
  timestampHeader: string;
  signedPayloadFormat: string;
  encoding: string;
}

export interface WebhookEventDetail {
  category: string;
  id: string;
  name: string;
  description: string;
  method: string;
  contentType: string;
  headers: string[];
  signatureScheme: WebhookSignatureScheme;
  payloadExample: unknown;
  notes: string[];
}

export interface WebhookRecord {
  id: string;
  url: string;
  event: string;
  eventId?: string;
  eventLabel?: string;
  eventDescription?: string;
  category?: string;
  secret?: string;
  method?: string;
  contentType?: string;
  headers?: string[];
  signatureScheme?: WebhookSignatureScheme;
  payloadExample?: unknown;
  notes?: string[];
  is_active: boolean;
  organization_id?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebhookDelivery {
  deliveryId: string;
  webhookId: string;
  eventId: string;
  status: string;
  statusCode: number;
  attempt: number;
  createdAt: string;
  responseTimeMs: number;
  requestId: string;
  payload: unknown;
  errorMessage: string | null;
  responseBody: string | null;
}

export interface WebhookDeliveriesResponse {
  deliveries: WebhookDelivery[];
}

async function parseOrThrow<T>(result: Response, fallbackMessage: string): Promise<T> {
  if (!result.ok) {
    const errorData = await result.json().catch(() => ({}));
    throw new Error(errorData.message || fallbackMessage);
  }
  return (await result.json()) as T;
}

/** Fetch all available event types for the catalog */
export async function getWebhookEventTypes(): Promise<WebhookEventTypesResponse> {
  const result = await fetchWithAuth("/api/webhooks/event-types");
  return parseOrThrow<WebhookEventTypesResponse>(result, "Failed to fetch webhook event types");
}

/** Fetch enriched technical metadata for an event */
export async function getWebhookEventTypeDetail(eventId: string): Promise<WebhookEventDetail> {
  const result = await fetchWithAuth(`/api/webhooks/event-types/${encodeURIComponent(eventId)}`);
  return parseOrThrow<WebhookEventDetail>(result, "Failed to fetch webhook event detail");
}

/** List all webhooks configured for the current organization */
export async function getWebhooks(): Promise<WebhookRecord[]> {
  const result = await fetchWithAuth("/api/webhooks");
  return parseOrThrow<WebhookRecord[]>(result, "Failed to fetch webhooks");
}

/** Fetch enriched detail for a single webhook */
export async function getWebhookDetail(id: string): Promise<WebhookRecord> {
  const result = await fetchWithAuth(`/api/webhooks/${id}/detail`);
  return parseOrThrow<WebhookRecord>(result, "Failed to fetch webhook detail");
}

/** Create a new webhook config */
export async function createWebhook(data: { url: string; event: string }): Promise<WebhookRecord> {
  const result = await fetchWithAuth("/api/webhooks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return parseOrThrow<WebhookRecord>(result, "Failed to create webhook");
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
  return parseOrThrow<WebhookRecord>(result, "Failed to rotate secret");
}

/** Fetch real delivery history for a webhook */
export async function getWebhookDeliveries(id: string): Promise<WebhookDeliveriesResponse> {
  const result = await fetchWithAuth(`/api/webhooks/${id}/deliveries`);
  return parseOrThrow<WebhookDeliveriesResponse>(result, "Failed to fetch webhook deliveries");
}
