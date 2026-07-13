"use server";

import { NextRequest, NextResponse } from "next/server";
import { getNotificationsServiceBaseUrl } from "../_lib/notifications-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const baseUrl = getNotificationsServiceBaseUrl();
    if (!baseUrl) {
      return NextResponse.json({ error: "notifications-service-url-missing" }, { status: 503 });
    }
    const response = await fetch(`${baseUrl}/api/templates/active`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream activation failed with status ${response.status}` },
        { status: response.status },
      );
    }

    const rawResult = await response.text().catch(() => null);
    let payload: unknown = rawResult;
    if (rawResult) {
      try {
        payload = JSON.parse(rawResult);
      } catch {
        payload = rawResult.trim();
      }
    }
    return NextResponse.json(payload ?? "success");
  } catch (error) {
    console.error("Error proxying template activation", error);
    return NextResponse.json({ error: "Failed to activate template" }, { status: 500 });
  }
}
