# Especificación: Invitar miembros al equipo (Dashboard)

Referencia para el equipo del dashboard. Implementación alineada con el backend.

---

## 1. Endpoint para crear el miembro

- **Método y URL:** `POST /api/organizations/{orgId}/dashboard/members`
- **Headers obligatorios:** `Authorization: Bearer <access_token>` (token del usuario logueado, ej. ORG_ADMIN). Sin token la API puede devolver 403.

**Body (JSON):**

| Campo       | Tipo     | Obligatorio | Descripción |
|------------|----------|-------------|-------------|
| email      | string   | Sí          | Email del nuevo miembro (se guarda en minúsculas). |
| full_name  | string   | Sí          | Nombre completo. |
| roles      | string[] | No          | Roles a asignar. Valores válidos: `ORG_ADMIN`, `BUSINESS`, `DEVELOPER`, `USER_APP`. En el dashboard, **ORG_ADMIN** solo puede asignar `ORG_ADMIN`, `BUSINESS` y `DEVELOPER`; **USER_APP** solo lo asigna el OWNER. |
| send_invite| boolean  | No          | Si es `true`, la respuesta incluye además `invite_token`. El backend no envía correo; solo cambia la respuesta. |

**Ejemplo con envío por correo (dashboard enviará el email después):**
```json
{
  "email": "nuevo@empresa.com",
  "full_name": "María López",
  "roles": ["BUSINESS"],
  "send_invite": true
}
```

**Ejemplo sin envío por correo:**
```json
{
  "email": "nuevo@empresa.com",
  "full_name": "María López",
  "roles": ["BUSINESS"]
}
```

---

## 2. Respuesta del backend (201)

- `user`: objeto con `id`, `email`, `full_name`, `status`, `must_change_password`.
- `temporary_password`: contraseña temporal (primer login).
- Si en el body se envió `send_invite: true`, además: `invite_token` (contraseña temporal que queda activa; para “enviar por correo” usar esta o `temporary_password` de forma consistente).

Si no enviaste `send_invite`, el usuario debe usar `temporary_password` para el primer login.

---

## 3. Dos flujos: con envío por correo y sin envío

### Caso A: Sí se envía la invitación por correo

1. Dashboard llama a `POST /api/organizations/{orgId}/dashboard/members` con `email`, `full_name`, `roles` y `send_invite: true`.
2. Guardar de la respuesta: `user.id`, `user.email`, `user.full_name`. Para el correo, usar `invite_token` como contraseña temporal (es la que queda activa si enviaste `send_invite: true`).
3. Dashboard llama a `POST /api/send-email` con `recipient`, `purpose` (ej. "Invitación al equipo"), `message` (incluir que fue añadido, email, contraseña temporal, y que debe cambiarla en el primer acceso).

### Caso B: No se envía por correo

1. Dashboard llama a `POST /api/organizations/{orgId}/dashboard/members` con `email`, `full_name`, `roles` (sin `send_invite` o `send_invite: false`).
2. Respuesta solo trae `user` y `temporary_password` (no `invite_token`).
3. Mostrar en pantalla: email del nuevo usuario, contraseña temporal, mensaje de que debe cambiarla en el primer inicio de sesión. No se llama a `POST /api/send-email`.

---

## 4. Envío del correo

- **Método y URL:** `POST /api/send-email`
- **Body (JSON):** `recipient`, `purpose`, `message` (texto; saltos de línea se pueden convertir a `<br>` en HTML).

El backend no envía este correo al crear el miembro; quien lo envía es siempre el dashboard cuando corresponda.

---

## 5. Primer login y cambio obligatorio de contraseña

1. El nuevo usuario hace login con `POST /api/auth/login` (email + contraseña temporal).
2. La respuesta incluye `access_token` y en el usuario suele ir `mustChangePassword: true`.
3. El dashboard debe:
   - Detectar `mustChangePassword: true`.
   - Mostrar solo la pantalla de “Cambiar contraseña” hasta que cambie.
   - Llamar con el Bearer del nuevo usuario a uno de:
     - **Recomendado:** `POST /api/auth/organizations/{orgId}/members/password/reset`  
       Body: `{ "current_password": "<contraseña temporal>", "new_password": "<nueva contraseña>" }`
     - **Alternativo:** `POST /api/auth/password/change`  
       Mismo body.

Tras 201, el usuario puede usar el dashboard con normalidad (`must_change_password = false`). El frontend actualiza la sesión con `syncMe()`.

---

## 6. Resumen para el dashboard

| Acción                         | Endpoint                                                                 | Quién        | Cuándo |
|--------------------------------|-------------------------------------------------------------------------|--------------|--------|
| Crear miembro                  | `POST /api/organizations/{orgId}/dashboard/members`                     | ORG_ADMIN (JWT) | Al hacer “Add Member”. |
| Enviar correo con credenciales | `POST /api/send-email`                                                  | Dashboard    | Solo si se decide enviar por correo; después de crear el miembro. |
| Primer login                   | `POST /api/auth/login`                                                  | Nuevo usuario | Desde la app del dashboard. |
| Cambio de contraseña obligatorio | `POST /api/auth/organizations/{orgId}/members/password/reset` o `POST /api/auth/password/change` | Nuevo usuario (con su JWT) | Tras el primer login, cuando `mustChangePassword === true`. |

- **Con envío por correo:** crear miembro con `send_invite: true` → usar `invite_token` (o `temporary_password` según decisión) en el mensaje → llamar `POST /api/send-email`.
- **Sin envío por correo:** crear miembro sin `send_invite` → mostrar solo `temporary_password` en la UI y no llamar a `POST /api/send-email`.
