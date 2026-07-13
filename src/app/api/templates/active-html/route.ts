"use server";

import { NextRequest, NextResponse } from "next/server";
import { getNotificationsServiceBaseUrl } from "../_lib/notifications-service";

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

  const baseUrl = getNotificationsServiceBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      {
        channel,
        category,
        name: null,
        template: null,
        updatedAt: null,
        message: "Notifications service URL is not configured.",
      },
      { status: 503, headers: { "x-upstream-error": "missing_base_url" } },
    );
  }

  try {
    const filtersUrl = new URL(`${baseUrl}/api/templates/by-filters`);
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
      `${baseUrl}/api/templates/name/${encodeURIComponent(activeTemplate.name)}`,
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
    // Degradar a payload vacío para evitar 500s en la UI.
    return NextResponse.json(
      {
        channel,
        category,
        name: null,
        template: null,
        updatedAt: null,
        message: "Upstream unavailable. No active template could be resolved.",
      },
      { status: 200, headers: { "x-upstream-error": "fetch_failed" } },
    );
  }
}
