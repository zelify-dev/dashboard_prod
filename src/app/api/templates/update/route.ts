"use server";

import { NextRequest, NextResponse } from "next/server";

const REMOTE_BASE_URL = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:3002";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${REMOTE_BASE_URL}/api/templates/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream update failed with status ${response.status}` },
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
    console.error("Error proxying template update", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}
