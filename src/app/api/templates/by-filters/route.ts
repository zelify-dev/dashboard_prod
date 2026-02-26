"use server";

import { NextRequest, NextResponse } from "next/server";

const REMOTE_BASE_URL = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:3002";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${REMOTE_BASE_URL}/api/templates/by-filters${searchParams ? `?${searchParams}` : ""}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      // prevent caching to keep data in sync
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream request failed with status ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying template filters", error);
    return NextResponse.json({ error: "Failed to fetch remote templates" }, { status: 500 });
  }
}
