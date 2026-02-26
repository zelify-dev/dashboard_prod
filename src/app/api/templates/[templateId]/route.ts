"use server";

import { NextRequest, NextResponse } from "next/server";

const REMOTE_BASE_URL = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:3002";

export async function DELETE(request: NextRequest) {
  const url = request.nextUrl;
  const segments = url.pathname.split("/").filter(Boolean);
  const templateId = segments[segments.length - 1];
  if (!templateId) {
    return NextResponse.json({ error: "missing-template-id" }, { status: 400 });
  }
  try {
    const response = await fetch(`${REMOTE_BASE_URL}/api/templates/${encodeURIComponent(templateId)}`, {
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
