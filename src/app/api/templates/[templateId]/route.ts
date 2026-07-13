"use server";

import { NextRequest, NextResponse } from "next/server";
import { getNotificationsServiceBaseUrl } from "../_lib/notifications-service";

const jsonHeaders = {
  "Content-Type": "application/json",
};

function getTemplateId(request: NextRequest) {
  const url = request.nextUrl;
  const segments = url.pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? null;
}

async function tryUpdateTemplate(baseUrl: string, templateId: string, payload: unknown) {
  const directResponse = await fetch(`${baseUrl}/api/templates/${encodeURIComponent(templateId)}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (directResponse.ok) {
    return directResponse;
  }

  if (![404, 405].includes(directResponse.status)) {
    return directResponse;
  }

  const fallbackBody =
    payload && typeof payload === "object"
      ? { templateId, ...(payload as Record<string, unknown>) }
      : { templateId };

  return fetch(`${baseUrl}/api/templates/update`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(fallbackBody),
    cache: "no-store",
  });
}

export async function PATCH(request: NextRequest) {
  const templateId = getTemplateId(request);
  if (!templateId) {
    return NextResponse.json({ error: "missing-template-id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "invalid-payload" }, { status: 400 });
  }

  const baseUrl = getNotificationsServiceBaseUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "notifications-service-url-missing" }, { status: 503 });
  }

  try {
    const response = await tryUpdateTemplate(baseUrl, templateId, payload);
    if (!response.ok) {
      const errorText = await response.text().catch(() => "failed");
      console.warn("[api/templates/update-by-id] Remote error", errorText);
      return NextResponse.json({ error: "failed" }, { status: response.status });
    }

    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? { status: "success" });
  } catch (error) {
    console.error("[api/templates/update-by-id] Request error", error);
    return NextResponse.json({ error: "request-error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const templateId = getTemplateId(request);
  if (!templateId) {
    return NextResponse.json({ error: "missing-template-id" }, { status: 400 });
  }
  const baseUrl = getNotificationsServiceBaseUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "notifications-service-url-missing" }, { status: 503 });
  }
  try {
    const response = await fetch(`${baseUrl}/api/templates/${encodeURIComponent(templateId)}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "failed");
      console.warn("[api/templates/delete] Remote error", errorText);
      return NextResponse.json({ error: "failed" }, { status: response.status });
    }
    const result = await response.text().catch(() => null);
    return NextResponse.json(result ?? "success");
  } catch (error) {
    console.error("[api/templates/delete] Request error", error);
    return NextResponse.json({ error: "request-error" }, { status: 500 });
  }
}
