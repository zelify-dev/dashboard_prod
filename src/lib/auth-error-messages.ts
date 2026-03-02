/**
 * Errores de la API de auth → mensaje UX recomendado para el frontend.
 *
 * Tabla referencia:
 *
 * | Endpoint                          | Código | Mensaje UX |
 * |-----------------------------------|--------|------------|
 * | Comunes (casi todos)              |        |            |
 * | (cualquiera)                      | 400    | Mostrar message del API y marcar campos si vienen en body |
 * | (cualquiera)                      | 401    | Ver contexto: login → "Email/contraseña incorrectos"; protegido → refresh o "Sesión expirada" |
 * | (cualquiera)                      | 403    | "No tienes acceso / cuenta deshabilitada" |
 * | (cualquiera)                      | 500    | "Algo falló. Intenta de nuevo." |
 * | POST /api/auth/register           | 201    | OK         |
 * | POST /api/auth/register           | 409    | "Este correo ya tiene cuenta. Inicia sesión." |
 * | POST /api/auth/login              | 201    | OK         |
 * | POST /api/auth/login              | 401    | "Email o contraseña incorrectos" |
 * | POST /api/auth/login              | 403    | "Usuario u organización deshabilitados" |
 * | POST /api/auth/login              | 409    | Email en múltiples orgs (elegir organización) |
 * | POST /api/auth/login              | 423    | "Usuario bloqueado temporalmente" |
 * | POST /api/auth/refresh            | 201    | OK         |
 * | POST /api/auth/refresh            | 401    | Refresh inválido/sesión revocada → cerrar sesión, "Sesión expirada" |
 * | POST /api/auth/logout             | 201    | OK         |
 * | POST /api/auth/logout             | 401    | Si no mandas Bearer (igual cerramos sesión local) |
 * | GET /api/me, /api/me/sessions, DEL | 200/201| OK         |
 * | GET /api/me, etc.                 | 401    | Token expirado → intentar refresh; si falla → "Sesión expirada" |
 * | GET /api/me, etc.                 | 403    | Cuenta deshabilitada |
 */

export type AuthErrorContext = "login" | "register" | "protected" | "generic";

const MESSAGES_ES: Record<number, string> = {
  400: "Revisa los datos enviados.",
  401: "Sesión expirada. Inicia sesión de nuevo.",
  403: "No tienes acceso o la cuenta está deshabilitada.",
  404: "No encontrado.",
  423: "Usuario bloqueado temporalmente.",
  500: "Algo falló. Intenta de nuevo.",
};

const MESSAGES_LOGIN_ES: Record<number, string> = {
  401: "Email o contraseña incorrectos.",
  403: "Usuario u organización deshabilitados.",
  423: "Usuario bloqueado temporalmente.",
};

const MESSAGES_REGISTER_ES: Record<number, string> = {
  409: "Este correo ya tiene cuenta. Inicia sesión.",
};

const MESSAGES_EN: Record<number, string> = {
  400: "Please check the data you entered.",
  401: "Session expired. Please sign in again.",
  403: "Access denied or account disabled.",
  404: "Not found.",
  423: "Account temporarily locked.",
  500: "Something went wrong. Please try again.",
};

const MESSAGES_LOGIN_EN: Record<number, string> = {
  401: "Incorrect email or password.",
  403: "User or organization disabled.",
  423: "Account temporarily locked.",
};

const MESSAGES_REGISTER_EN: Record<number, string> = {
  409: "This email is already registered. Sign in.",
};

/**
 * Devuelve el mensaje UX recomendado para un código HTTP del API de auth.
 * @param statusCode Código HTTP (400, 401, 403, 404, 423, 500)
 * @param context "login" | "register" | "protected" (endpoint con Bearer) | "generic"
 * @param lang "es" | "en"
 * @param apiMessage Si el API devolvió un message, se puede usar en lugar del genérico para 400/500
 */
export function getAuthErrorMessage(
  statusCode: number,
  context: AuthErrorContext = "generic",
  lang: "es" | "en" = "es",
  apiMessage?: string
): string {
  if (apiMessage && (statusCode === 400 || statusCode === 500)) return apiMessage;
  const loginMap = lang === "es" ? MESSAGES_LOGIN_ES : MESSAGES_LOGIN_EN;
  const registerMap = lang === "es" ? MESSAGES_REGISTER_ES : MESSAGES_REGISTER_EN;
  const genericMap = lang === "es" ? MESSAGES_ES : MESSAGES_EN;
  if (context === "login" && loginMap[statusCode]) return loginMap[statusCode];
  if (context === "register" && registerMap[statusCode]) return registerMap[statusCode];
  return genericMap[statusCode] ?? genericMap[500];
}
