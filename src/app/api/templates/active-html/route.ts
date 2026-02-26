"use server";

import { NextRequest, NextResponse } from "next/server";

const REMOTE_BASE_URL = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:3002";

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Remote request failed with status ${response.status}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const channel = searchParams.get("channel") ?? "mailing";

  if (!category) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  try {
    const filtersUrl = new URL(`${REMOTE_BASE_URL}/api/templates/by-filters`);
    filtersUrl.searchParams.set("channel", channel);
    filtersUrl.searchParams.set("category", category);
    const templates = (await fetchJson(filtersUrl.toString())) as { name: string; active: boolean | string }[];

    const activeTemplate = templates.find(
      (item) => item.active === true || item.active === "true",
    );
    if (!activeTemplate) {
      return NextResponse.json({
        channel,
        category,
        name: null,
        template: null,
        message: "No active template found for this category.",
      });
    }

    const templateData = await fetchJson(
      `${REMOTE_BASE_URL}/api/templates/name/${encodeURIComponent(activeTemplate.name)}`,
    );

    return NextResponse.json({
      channel,
      category,
      name: activeTemplate.name,
      template: templateData?.template ?? null,
      updatedAt: templateData?.updatedAt ?? null,
    });
  } catch (error) {
    console.error("Error fetching active template HTML", error);
    return NextResponse.json({ error: "Failed to fetch active template HTML" }, { status: 500 });
  }
}
