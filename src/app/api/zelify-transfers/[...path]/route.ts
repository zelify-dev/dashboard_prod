"use server";

import { NextRequest, NextResponse } from "next/server";

function getRemoteBaseUrl(): string {
  // Por convención del dashboard, usamos el mismo backend configurado en NEXT_PUBLIC_AUTH_API_URL.
  // (Fallback opcional a ZELIFY_TRANSFERS_SERVICE_URL si alguien lo configuró legacy).
  const raw =
    process.env.NEXT_PUBLIC_AUTH_API_URL ??
    process.env.ZELIFY_TRANSFERS_SERVICE_URL ??
    "http://localhost:8080";
  return raw.replace(/\/$/, "");
}

function buildTargetUrl(request: NextRequest, pathSegments: string[]): string {
  const base = getRemoteBaseUrl();
  const joinedPath = pathSegments
    .filter(Boolean)
    .map((p) => String(p).replace(/^\/+|\/+$/g, ""))
    .join("/");

  const search = request.nextUrl.searchParams.toString();
  const endpoint = `${base}/api/zelify-transfers/${joinedPath}`;
  return search ? `${endpoint}?${search}` : endpoint;
}

async function forward(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const targetUrl = buildTargetUrl(request, pathSegments);
  const internalApiKey = process.env.ZELIFY_TRANSFERS_INTERNAL_API_KEY;
  const timeoutMs = Number(process.env.ZELIFY_TRANSFERS_TIMEOUT_MS ?? 20000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers();

    const accept = request.headers.get("accept");
    if (accept) headers.set("accept", accept);

    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    // Si el backend está protegido por header interno, inyectarlo desde env server-side.
    if (internalApiKey && internalApiKey.trim()) {
      headers.set("x-internal-api-key", internalApiKey.trim());
    }

    // Forward opcional (si el backend decide usar auth por token).
    const authorization = request.headers.get("authorization");
    if (authorization) headers.set("authorization", authorization);

    const method = request.method.toUpperCase();
    const hasBody = method !== "GET" && method !== "HEAD";
    const body = hasBody ? await request.text().catch(() => "") : undefined;

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? body : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    const upstreamContentType = upstream.headers.get("content-type") ?? "application/json";
    const payload = await upstream.arrayBuffer();

    return new NextResponse(payload, {
      status: upstream.status,
      headers: {
        "content-type": upstreamContentType,
      },
    });
  } catch (error: any) {
    const message =
      error?.name === "AbortError"
        ? `Tiempo de espera excedido (${timeoutMs}ms) consultando el proveedor`
        : "Error al contactar el servicio de transferencias";

    return NextResponse.json(
      {
        error: "upstream-error",
        message,
        details: error?.message ?? String(error),
        targetUrl,
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  const params = await context.params;
  return forward(request, params.path ?? []);
}

export async function POST(request: NextRequest, context: Context) {
  const params = await context.params;
  return forward(request, params.path ?? []);
}

export async function PATCH(request: NextRequest, context: Context) {
  const params = await context.params;
  return forward(request, params.path ?? []);
}

export async function DELETE(request: NextRequest, context: Context) {
  const params = await context.params;
  return forward(request, params.path ?? []);
}
