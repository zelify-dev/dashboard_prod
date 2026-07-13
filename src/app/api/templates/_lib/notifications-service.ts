export function getNotificationsServiceBaseUrl(): string | null {
  const raw = process.env.NOTIFICATIONS_SERVICE_URL;
  if (!raw || typeof raw !== "string") {
    return null;
  }

  const baseUrl = raw.trim().replace(/\/$/, "");
  if (!baseUrl) {
    return null;
  }

  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    console.error("[notifications-service] NOTIFICATIONS_SERVICE_URL must be absolute:", raw);
    return null;
  }

  return baseUrl;
}
