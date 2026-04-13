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
      // Degradar a lista vacía para no romper el dashboard si el upstream está caído o responde error.
      // El cliente de la UI espera un array; una respuesta no-200 termina en error en consola.
      return NextResponse.json([], {
        status: 200,
        headers: {
          "x-upstream-status": String(response.status),
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying template filters", error);
    // Degradar a lista vacía para evitar 500s en la UI.
    return NextResponse.json([], {
      status: 200,
      headers: {
        "x-upstream-error": "fetch_failed",
      },
    });
  }
}
