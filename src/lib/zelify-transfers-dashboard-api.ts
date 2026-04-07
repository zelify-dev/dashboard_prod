export class ZelifyTransfersApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ZelifyTransfersApiError";
  }
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = `/api/zelify-transfers${cleanPath}`;
  if (!query) return base;

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

async function parseResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return undefined;
    }
  }
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}

export async function zelifyGet<T = unknown>(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const res = await fetch(buildUrl(path, query), {
    method: "GET",
    cache: "no-store",
  });
  const body = await parseResponse(res);
  if (!res.ok) {
    const message =
      (typeof body === "object" && body && "message" in body && typeof (body as any).message === "string")
        ? (body as any).message
        : `Error consultando ${path} (${res.status})`;
    throw new ZelifyTransfersApiError(message, res.status, body);
  }
  return body as T;
}

export async function zelifyPost<T = unknown>(
  path: string,
  payload: unknown,
  query?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const res = await fetch(buildUrl(path, query), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
    cache: "no-store",
  });
  const body = await parseResponse(res);
  if (!res.ok) {
    const message =
      (typeof body === "object" && body && "message" in body && typeof (body as any).message === "string")
        ? (body as any).message
        : `Error consultando ${path} (${res.status})`;
    throw new ZelifyTransfersApiError(message, res.status, body);
  }
  return body as T;
}

