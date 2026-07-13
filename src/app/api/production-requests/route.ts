import { NextRequest, NextResponse } from "next/server";

// Estructura en memoria global para simular persistencia
if (!(global as any)._mockProductionRequests) {
  (global as any)._mockProductionRequests = [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organization_id");

  let requests = (global as any)._mockProductionRequests;

  if (organizationId) {
    requests = requests.filter((r: any) => r.organization_id === organizationId);
  }

  return NextResponse.json(requests);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.organization_id) {
      return NextResponse.json({ error: "missing-organization-id" }, { status: 400 });
    }

    const newRequest = {
      id: `req_${Math.random().toString(36).substring(2, 9)}`,
      status: "PENDING", // PENDING, APPROVED, REJECTED
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      observations: "",
      ...body,
    };

    (global as any)._mockProductionRequests.push(newRequest);

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "invalid-payload" }, { status: 400 });
  }
}
