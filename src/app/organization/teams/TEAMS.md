# Teams y roles

## Mapeo equipos ↔ roles backend

| Equipo (UI)     | Team ID | Rol backend |
|-----------------|---------|-------------|
| Administrators  | `1`     | `ORG_ADMIN` |
| Business Team   | `2`     | `BUSINESS`  |
| Developers Team | `3`     | `DEVELOPER`  |

El frontend usa `_constants/team-roles.ts` para traducir entre `teamId` y rol. Los roles del usuario logueado vienen en la sesión (`getStoredRoles()` desde `@/lib/auth-api`).

---

## Flujo de añadir miembros (contraseña temporal + pendiente)

Flujo tipo **Google Workspace**: el admin asigna una contraseña temporal; el usuario queda "pendiente" y **debe cambiarla en el primer inicio de sesión**.

### 1. En el frontend (Add Member)

- **Email** (obligatorio)
- **Nombre completo** (obligatorio)
- **Contraseña temporal** (obligatoria, mín. 8 caracteres) + confirmación
- ~~Teléfono (opcional)~~ — no se maneja en back; el formulario no lo incluye.

El formulario muestra un texto de ayuda: *"El usuario quedará pendiente y deberá cambiar esta contraseña en su primer inicio de sesión."*

### 2. En el backend (al crear el miembro)

- Crear usuario con el rol correspondiente al equipo (`getRoleByTeamId(teamId)` → `ORG_ADMIN` | `BUSINESS` | `DEVELOPER`).
- Guardar la contraseña temporal (hash).
- Marcar al usuario con **`must_change_password: true`** (pendiente).

### 3. Primer login del usuario invitado

- El usuario inicia sesión con email + contraseña temporal.
- Tras el login, el frontend comprueba `user.must_change_password`.
- Si es `true`, se muestra una **miniventana/modal obligatoria** (no se puede cerrar): "Cambia tu contraseña".
- El usuario introduce la nueva contraseña dos veces y envía.
- El backend actualiza la contraseña y devuelve el usuario con **`must_change_password: false`**.
- El frontend actualiza la sesión y cierra el modal; el usuario ya puede usar el dashboard.

### API implicadas

- **Crear miembro (admin):** enviar email, full_name, password, role. Backend crea usuario con `must_change_password: true`.
- **Cambiar contraseña (usuario pendiente):** `POST /api/me/change-password` con `{ new_password }`. Backend responde con el usuario actualizado (`must_change_password: false`) y el frontend actualiza la sesión.

Resumen: el admin asigna una contraseña temporal en "Añadir miembro"; el usuario solo la usa una vez para entrar y en seguida debe poner una contraseña nueva en el modal obligatorio.
