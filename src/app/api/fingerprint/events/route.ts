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
      console.log("🔍 Fetching event by requestId:", requestId);
      result = await client.getEvent(requestId);
      console.log("✅ Event data received:", JSON.stringify(result, null, 2));
    } else if (visitorId) {
      // Search events by visitor ID
      console.log("🔍 Searching events by visitorId:", visitorId);
      result = await client.searchEvents({ visitor_id: visitorId, limit });
      console.log("✅ Events data received:", JSON.stringify(result, null, 2));
    } else {
      // Get recent events (search without filters)
      console.log("🔍 Fetching recent events (limit:", limit, ")");
      result = await client.searchEvents({ limit });
      console.log("✅ Recent events data received:", JSON.stringify(result, null, 2));
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

