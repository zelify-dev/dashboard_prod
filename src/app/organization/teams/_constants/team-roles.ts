/**
 * Mapeo entre equipos de la UI (Teams) y roles del backend.
 * OWNER puede asignar todos los roles; ORG_ADMIN solo ORG_ADMIN, BUSINESS, DEVELOPER.
 */

export const TEAM_ROLE = {
  OWNER: "OWNER",
  ORG_ADMIN: "ORG_ADMIN",
  BUSINESS: "BUSINESS",
  DEVELOPER: "DEVELOPER",
  ZELIFY_TEAM: "ZELIFY_TEAM",
} as const;

export type TeamRoleCode = (typeof TEAM_ROLE)[keyof typeof TEAM_ROLE];

/** Roles que solo el OWNER puede asignar al crear/editar miembros */
export const OWNER_ONLY_ROLES: TeamRoleCode[] = [
  TEAM_ROLE.OWNER,
  TEAM_ROLE.ZELIFY_TEAM,
];

/** Roles que puede asignar un ORG_ADMIN (sin OWNER ni ZELIFY_TEAM) */
export const ORG_ADMIN_ASSIGNABLE: TeamRoleCode[] = [
  TEAM_ROLE.ORG_ADMIN,
  TEAM_ROLE.BUSINESS,
  TEAM_ROLE.DEVELOPER,
];

/** Todos los roles que el OWNER puede asignar */
export const OWNER_ASSIGNABLE: TeamRoleCode[] = [
  TEAM_ROLE.OWNER,
  TEAM_ROLE.ORG_ADMIN,
  TEAM_ROLE.BUSINESS,
  TEAM_ROLE.DEVELOPER,
  TEAM_ROLE.ZELIFY_TEAM,
];

/** Devuelve los roles que el usuario actual puede asignar (según si es OWNER o ORG_ADMIN) */
export function getAssignableRoles(currentUserRoles: string[] | Array<{ code: string }>): TeamRoleCode[] {
  const codes = toRoleCodes(currentUserRoles);
  if (codes.includes(TEAM_ROLE.OWNER)) {
    return OWNER_ASSIGNABLE;
  }
  if (codes.includes(TEAM_ROLE.ORG_ADMIN)) {
    return ORG_ADMIN_ASSIGNABLE;
  }
  return [];
}

/** Normaliza roles del backend (string[] o Array<{ code: string }>) a códigos string[] en mayúsculas. */
export function toRoleCodes(roles: string[] | Array<{ code: string }> | undefined): string[] {
  if (!roles?.length) return [];
  return roles.map((r) => (typeof r === "string" ? r : r.code).toUpperCase());
}

/** ID del equipo en la UI (solo para los 3 equipos clásicos) ↔ rol del backend */
export const TEAM_ID_BY_ROLE: Partial<Record<TeamRoleCode, string>> = {
  [TEAM_ROLE.ORG_ADMIN]: "1",
  [TEAM_ROLE.BUSINESS]: "2",
  [TEAM_ROLE.DEVELOPER]: "3",
};

export const ROLE_BY_TEAM_ID: Record<string, TeamRoleCode> = {
  "1": TEAM_ROLE.ORG_ADMIN,
  "2": TEAM_ROLE.BUSINESS,
  "3": TEAM_ROLE.DEVELOPER,
};

export function getTeamIdByRole(role: TeamRoleCode): string | undefined {
  return TEAM_ID_BY_ROLE[role];
}

export function getRoleByTeamId(teamId: string): TeamRoleCode | undefined {
  return ROLE_BY_TEAM_ID[teamId];
}

/** Comprueba si el usuario tiene un rol concreto. */
export function userHasRole(roles: string[] | Array<{ code: string }>, role: TeamRoleCode): boolean {
  return toRoleCodes(roles).includes(role);
}

/** Indica si el usuario es OWNER (puede asignar todos los roles). */
export function isOwner(roles: string[] | Array<{ code: string }>): boolean {
  return toRoleCodes(roles).includes(TEAM_ROLE.OWNER);
}
