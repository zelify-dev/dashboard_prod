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
      // Degradar a payload vacío para no romper el editor si el upstream está caído.
      return NextResponse.json(
        {
          templateId: null,
          id: null,
          name: templateName,
          template: null,
          subject: null,
          from: null,
          updatedAt: null,
          active: false,
          error: `upstream_status_${response.status}`,
        },
        { status: 200, headers: { "x-upstream-status": String(response.status) } },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching template by name", error);
    // Degradar a payload vacío para evitar 500s en la UI.
    return NextResponse.json(
      {
        templateId: null,
        id: null,
        name: templateName,
        template: null,
        subject: null,
        from: null,
        updatedAt: null,
        active: false,
        error: "fetch_failed",
      },
      { status: 200, headers: { "x-upstream-error": "fetch_failed" } },
    );
  }
}
