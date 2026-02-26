"use server";

import { NextRequest, NextResponse } from "next/server";

const REMOTE_BASE_URL = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:3002";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "invalid-payload" }, { status: 400 });
  }
  console.log("[api/templates] Forwarding payload", JSON.stringify(payload));
  try {
    const response = await fetch(`${REMOTE_BASE_URL}/api/templates`, {
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
