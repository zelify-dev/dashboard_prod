/**
 * Cliente para la API de autenticación (registro, login, refresh, logout, me, sesiones).
 * Base URL: NEXT_PUBLIC_AUTH_API_URL (ej: http://localhost:8080). Prefijo: /api.
 * Endpoints protegidos: header Authorization: Bearer <access_token>.
 *
 * Seguridad:
 * - Tokens y datos de sesión en sessionStorage (se borran al cerrar la pestaña).
 * - En producción usar HTTPS.
 * - No se exponen tokens en logs.
 * - Logout: POST /api/auth/logout y luego clearAuthSession.
 */

const getBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_AUTH_API_URL;
  if (!url) return "";
  return url.replace(/\/$/, "");
};

/**
 * GET /api/health — comprueba conexión con la API.
 * Útil para verificar que NEXT_PUBLIC_AUTH_API_URL responde.
 */
export async function checkHealth(): Promise<{ ok: boolean; status: number; data?: unknown }> {
  const base = getBaseUrl();
  if (!base) {
    return { ok: false, status: 0 };
  }
  try {
    const res = await fetch(`${base}/api/health`, { method: "GET" });
    const data = res.ok ? await res.json().catch(() => ({})) : undefined;
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: err };
  }
}

/** Para errores de auth con código HTTP (409, 401, 403, 423) */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Keys en sessionStorage para la sesión */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
  ORGANIZATION: "organization",
  ROLES: "roles",
  IS_AUTHENTICATED: "isAuthenticated",
  USER_EMAIL: "userEmail",
} as const;

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  must_change_password?: boolean;
};

export type AuthOrganization = {
  id: string;
  name: string;
  status: string;
};

/** Detalles completos de la organización (GET /api/organizations/:id). */
export type OrganizationDetails = {
  id: string;
  name: string;
  status: string;
  country?: string;
  company_legal_name?: string;
  website?: string;
  industry?: string;
  created_at?: string;
  updated_at?: string;
};

export type AuthSuccessResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
  organization: AuthOrganization;
  roles: string[];
  api_keys_created?: boolean;
};

export type RefreshResponse = {
  access_token: string;
  refresh_token: string;
};

export type RegisterPayload = {
  organization_name: string;
  country: string;
  company_legal_name: string;
  website: string;
  industry: string;
  full_name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  organization_id?: string;
};

export type Login409Response = {
  organizations?: { id: string; name: string }[];
  message?: string;
};

export type SessionItem = {
  id: string;
  created_at?: string;
  last_seen_at?: string;
  ip?: string;
  user_agent?: string;
  expires_at?: string;
  revoked_at?: string | null;
};

export type MeResponse = {
  user: AuthUser;
  organization?: AuthOrganization;
  roles?: string[];
  [key: string]: unknown;
};

/** Devuelve la URL base del API (sin barra final). */
export function getAuthBaseUrl(): string {
  return getBaseUrl();
}

/** Devuelve el access_token guardado o null. */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
}

/** Request genérico al API con Authorization Bearer. Si recibe 401, intenta refresh y reintenta una vez.
 * Si el refresh falla (token inválido/sesión revocada), limpia la sesión y lanza AuthError para redirigir a login. */
export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const base = getBaseUrl();
  if (!base) throw new Error("NEXT_PUBLIC_AUTH_API_URL no está configurado");
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && (options.body && typeof options.body === "string")) {
    headers.set("Content-Type", "application/json");
  }
  let res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    const refreshed = await refresh();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        res = await fetch(url, { ...options, headers });
      }
    } else {
      clearAuthSession();
      throw new AuthError("Sesión expirada. Inicia sesión de nuevo.", 401);
    }
  }
  return res;
}

/** POST /api/auth/register */
export async function register(
  payload: RegisterPayload
): Promise<AuthSuccessResponse> {
  const base = getBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_AUTH_API_URL no está configurado en .env");
  }
  const res = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    throw new AuthError(
      data.message || "Este correo ya tiene cuenta. Inicia sesión.",
      409,
      data
    );
  }
  if (!res.ok) {
    const msg = data.message || (res.status === 400 ? "Revisa los datos enviados." : res.status >= 500 ? "Algo falló. Intenta de nuevo." : "Error en el registro");
    throw new AuthError(msg, res.status, data);
  }
  return data as AuthSuccessResponse;
}

/** POST /api/auth/login */
export async function login(
  payload: LoginPayload
): Promise<AuthSuccessResponse | Login409Response> {
  const base = getBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_AUTH_API_URL no está configurado en .env");
  }
  const body: Record<string, string> = {
    email: payload.email,
    password: payload.password,
  };
  if (payload.organization_id) body.organization_id = payload.organization_id;
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) return data as Login409Response;
  if (!res.ok) {
    const msg = data.message || (res.status === 401 ? "Email o contraseña incorrectos." : res.status === 403 ? "Usuario u organización deshabilitados." : res.status === 423 ? "Usuario bloqueado temporalmente." : res.status >= 500 ? "Algo falló. Intenta de nuevo." : "Error en el inicio de sesión");
    throw new AuthError(msg, res.status, data);
  }
  return data as AuthSuccessResponse;
}

/** POST /api/auth/refresh. Actualiza tokens en sessionStorage. Devuelve true si hubo rotación. */
export async function refresh(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const k = AUTH_STORAGE_KEYS;
  const refreshToken = sessionStorage.getItem(k.REFRESH_TOKEN);
  if (!refreshToken) return false;
  const base = getBaseUrl();
  if (!base) return false;
  const res = await fetch(`${base}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status !== 201 || !data.access_token || !data.refresh_token) {
    return false;
  }
  sessionStorage.setItem(k.ACCESS_TOKEN, data.access_token);
  sessionStorage.setItem(k.REFRESH_TOKEN, data.refresh_token);
  return true;
}

/** POST /api/auth/logout (invalida sesión en el servidor) y luego limpia sessionStorage. */
export async function logout(): Promise<void> {
  const base = getBaseUrl();
  const token = getAccessToken();
  if (base && token) {
    try {
      await fetch(`${base}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Si falla la red, igual cerramos sesión local
    }
  }
  clearAuthSession();
}

/** Roles del usuario actual (ej: ["ORG_ADMIN"], ["OWNER"]). Acepta string[] o Array<{ code: string }> del API y normaliza a códigos en mayúsculas. */
function normalizeRoleCodes(roles: unknown): string[] {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return [];
  return roles
    .map((r: unknown) => (typeof r === "string" ? r : (r as { code?: string })?.code ?? "").toUpperCase())
    .filter(Boolean);
}

/** Guarda la sesión en sessionStorage. Se pierde al cerrar la pestaña. */
export function persistAuthSession(response: AuthSuccessResponse): void {
  if (typeof window === "undefined") return;
  const k = AUTH_STORAGE_KEYS;
  sessionStorage.setItem(k.ACCESS_TOKEN, response.access_token);
  sessionStorage.setItem(k.REFRESH_TOKEN, response.refresh_token);
  sessionStorage.setItem(k.USER, JSON.stringify(response.user));
  sessionStorage.setItem(k.ORGANIZATION, JSON.stringify(response.organization));
  sessionStorage.setItem(k.ROLES, JSON.stringify(normalizeRoleCodes(response.roles ?? [])));
  sessionStorage.setItem(k.IS_AUTHENTICATED, "true");
  sessionStorage.setItem(k.USER_EMAIL, response.user.email);
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(
    new CustomEvent("authchange", { detail: { authenticated: true } })
  );
}

/** Elimina todos los datos de sesión (sessionStorage). */
export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  Object.values(AUTH_STORAGE_KEYS).forEach((key) =>
    sessionStorage.removeItem(key)
  );
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(
    new CustomEvent("authchange", { detail: { authenticated: false } })
  );
}

/** Usuario guardado (para header/navbar). */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.USER);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Organización guardada (id = Client ID / Organization ID en Zelify Keys). */
export function getStoredOrganization(): AuthOrganization | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.ORGANIZATION);
    if (!raw) return null;
    return JSON.parse(raw) as AuthOrganization;
  } catch {
    return null;
  }
}

/** Roles del usuario actual (ej: ["ORG_ADMIN"], ["BUSINESS"], ["DEVELOPER"]). */
export function getStoredRoles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.ROLES);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/** GET /api/organizations/:id — detalles completos de la organización (Bearer). */
export async function getOrganization(id: string): Promise<OrganizationDetails> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener la organización",
      res.status,
      data
    );
  }
  return data as OrganizationDetails;
}

/** GET /api/me — perfil del usuario logueado. */
export async function getMe(): Promise<MeResponse> {
  const res = await fetchWithAuth("/api/me");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Error al obtener perfil", res.status, data);
  return data as MeResponse;
}

/** Llama GET /api/me y actualiza user/org/roles en sessionStorage. Útil tras login/register. */
export async function syncMe(): Promise<void> {
  if (typeof window === "undefined") return;
  const me = await getMe();
  const k = AUTH_STORAGE_KEYS;
  if (me.user) sessionStorage.setItem(k.USER, JSON.stringify(me.user));
  if (me.organization) sessionStorage.setItem(k.ORGANIZATION, JSON.stringify(me.organization));
  const topRoles = (me as { roles?: unknown }).roles;
  const userRoles = (me.user as { roles?: unknown })?.roles;
  const rolesInput = [].concat(topRoles ?? [], userRoles ?? []).filter(Boolean);
  sessionStorage.setItem(k.ROLES, JSON.stringify(normalizeRoleCodes(rolesInput)));
}

/** PATCH /api/me — actualizar perfil (ej: full_name). */
export async function updateMe(payload: Partial<Pick<AuthUser, "full_name">>): Promise<MeResponse> {
  const res = await fetchWithAuth("/api/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Error al actualizar perfil", res.status, data);
  if (data.user && typeof window !== "undefined") {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(data.user));
  }
  return data as MeResponse;
}

/** GET /api/me/sessions — listar sesiones del usuario. */
export async function getSessions(): Promise<SessionItem[]> {
  const res = await fetchWithAuth("/api/me/sessions");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Error al listar sesiones", res.status, data);
  return Array.isArray(data) ? data : data.sessions ?? [];
}

/**
 * Cambiar contraseña (flujo "debe cambiar en primer login").
 * Backend: POST /api/me/change-password con { new_password }. Debe devolver usuario con must_change_password: false.
 */
export async function changePassword(newPassword: string): Promise<MeResponse> {
  const res = await fetchWithAuth("/api/me/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password: newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al cambiar contraseña",
      res.status,
      data
    );
  }
  const me = data as MeResponse;
  if (typeof window !== "undefined" && me.user) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(me.user));
  }
  return me;
}

/** DELETE /api/me/sessions/:sessionId — revocar una sesión. */
export async function revokeSession(sessionId: string): Promise<void> {
  const res = await fetchWithAuth(`/api/me/sessions/${sessionId}`, {
    method: "DELETE",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Error al revocar sesión", res.status, data);
}
