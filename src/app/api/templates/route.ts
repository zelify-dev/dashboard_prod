"use server";

import { NextRequest, NextResponse } from "next/server";
import { getNotificationsServiceBaseUrl } from "./_lib/notifications-service";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "invalid-payload" }, { status: 400 });
  }
  const baseUrl = getNotificationsServiceBaseUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "notifications-service-url-missing" }, { status: 503 });
  }
  try {
    const response = await fetch(`${baseUrl}/api/templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "failed");
      console.warn("[api/templates] Remote error", errorText);
      return NextResponse.json({ error: "failed" }, { status: response.status });
    }
    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? "success");
  } catch (error) {
    console.error("[api/templates] Request error", error);
    return NextResponse.json({ error: "request-error" }, { status: 500 });
  }
}
