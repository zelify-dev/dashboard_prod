"use server";

import { NextRequest, NextResponse } from "next/server";

const REMOTE_BASE_URL = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:3002";

export async function GET(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const templateName = segments[segments.length - 1];
  if (!templateName) {
    return NextResponse.json({ error: "missing-name" }, { status: 400 });
  }
  const encodedName = encodeURIComponent(templateName);
  try {
    const response = await fetch(`${REMOTE_BASE_URL}/api/templates/name/${encodedName}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch template by name (${response.status})` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching template by name", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
