"use server";

import { NextRequest, NextResponse } from "next/server";

const REMOTE_BASE_URL = process.env.CONFIGURATION_SERVICE_URL ?? "http://localhost:3002";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = params?.id as string;
  
  try {
    const response = await fetch(`${REMOTE_BASE_URL}/api/configuration/${id}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch configuration by id (${response.status})` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching configuration by id", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = params?.id as string;
  
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

    const response = await fetch(`${REMOTE_BASE_URL}/api/configuration/${id}`, {
      method: "PATCH",
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
        id: id,
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
          error: errorData.message || `Failed to update configuration (${response.status})`,
          details: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[api/configuration] Error updating configuration:", error);
    return NextResponse.json(
      { 
        error: "Failed to update configuration",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}




