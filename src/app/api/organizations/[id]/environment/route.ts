import { NextRequest, NextResponse } from "next/server";

if (!(global as any)._mockOrganizationsEnv) {
  (global as any)._mockOrganizationsEnv = {};
}

function getOrgId(urlStr: string) {
  const url = new URL(urlStr);
  const segments = url.pathname.split("/").filter(Boolean);
  // URL: /api/organizations/[id]/environment
  // segments: ['api', 'organizations', '[id]', 'environment']
  const orgIndex = segments.indexOf("organizations");
  if (orgIndex !== -1 && segments[orgIndex + 1]) {
    return segments[orgIndex + 1];
  }
  return null;
}

export async function GET(request: NextRequest) {
  const orgId = getOrgId(request.url);
  if (!orgId) {
    return NextResponse.json({ error: "missing-organization-id" }, { status: 400 });
  }

  const envs = (global as any)._mockOrganizationsEnv;
  const currentEnv = envs[orgId] || "SANDBOX";

  return NextResponse.json({ environment: currentEnv });
}

export async function PUT(request: NextRequest) {
  try {
    const orgId = getOrgId(request.url);
    if (!orgId) {
      return NextResponse.json({ error: "missing-organization-id" }, { status: 400 });
    }

    const body = await request.json();
    const env = body.environment;

    if (env !== "SANDBOX" && env !== "PRODUCTION") {
      return NextResponse.json({ error: "invalid-environment" }, { status: 400 });
    }

    (global as any)._mockOrganizationsEnv[orgId] = env;

    return NextResponse.json({ environment: env });
  } catch (error) {
    return NextResponse.json({ error: "invalid-payload" }, { status: 400 });
  }
}
