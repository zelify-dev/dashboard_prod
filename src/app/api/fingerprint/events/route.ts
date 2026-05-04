import { NextRequest, NextResponse } from "next/server";
import {
  FingerprintJsServerApiClient,
  Region,
} from "@fingerprintjs/fingerprintjs-pro-server-api";

const client = new FingerprintJsServerApiClient({
  apiKey: "BkJOKE0smKeyHIjqKQng",
  region: Region.Global,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const visitorId = searchParams.get("visitor_id");
    const requestId = searchParams.get("request_id");
    const limit = parseInt(searchParams.get("limit") || "10");

    let result;

    if (requestId) {
      // Get a specific event by request ID
      result = await client.getEvent(requestId);
    } else if (visitorId) {
      // Search events by visitor ID
      result = await client.searchEvents({ visitor_id: visitorId, limit });
    } else {
      // Get recent events (search without filters)
      result = await client.searchEvents({ limit });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Error fetching FingerprintJS data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch events",
        details: error,
      },
      { status: 500 }
    );
  }
}

