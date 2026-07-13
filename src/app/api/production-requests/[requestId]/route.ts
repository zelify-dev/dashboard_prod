import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const requestId = segments[segments.length - 1];

    if (!requestId) {
      return NextResponse.json({ error: "missing-request-id" }, { status: 400 });
    }

    const body = await request.json();
    const requests = (global as any)._mockProductionRequests || [];
    const index = requests.findIndex((r: any) => r.id === requestId);

    if (index === -1) {
      return NextResponse.json({ error: "request-not-found" }, { status: 404 });
    }

    const currentRequest = requests[index];

    const updatedRequest = {
      ...currentRequest,
      status: body.status ?? currentRequest.status,
      observations: body.observations ?? currentRequest.observations,
      updated_at: new Date().toISOString(),
    };

    requests[index] = updatedRequest;
    (global as any)._mockProductionRequests = requests;

    return NextResponse.json(updatedRequest);
  } catch (error) {
    return NextResponse.json({ error: "invalid-payload" }, { status: 400 });
  }
}
