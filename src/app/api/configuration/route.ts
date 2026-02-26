"use server";

import { NextRequest, NextResponse } from "next/server";

const REMOTE_BASE_URL = process.env.CONFIGURATION_SERVICE_URL ?? "http://localhost:3002";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${REMOTE_BASE_URL}/api/configuration${searchParams ? `?${searchParams}` : ""}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch configuration (${response.status})` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching configuration", error);
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar tamaño del payload (máximo 10MB)
    const payloadSize = JSON.stringify(body).length;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (payloadSize > maxSize) {
      console.error("[api/configuration] Payload too large:", payloadSize, "bytes");
      return NextResponse.json(
        { error: "Payload too large. Please optimize your images." },
        { status: 413 },
      );
    }

    const response = await fetch(`${REMOTE_BASE_URL}/api/configuration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "failed");
      console.error("[api/configuration] Remote error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        payloadSize: payloadSize,
      });
      
      // Intentar parsear el error como JSON
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      return NextResponse.json(
        { 
          error: errorData.message || `Failed to create configuration (${response.status})`,
          details: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[api/configuration] Error creating configuration:", error);
    return NextResponse.json(
      { 
        error: "Failed to create configuration",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}




