# Especificación: Invitar miembros al equipo (Dashboard)

Referencia para el equipo del dashboard. Implementación alineada con el backend.

---

## Para el backend: flujo que usa el dashboard (sin `send_invite`)

**El dashboard ya no utiliza "Include invite link (invite_token)" ni el parámetro `send_invite`.**

- El dashboard **solo** usa este flujo:
  1. Llama a `POST /api/organizations/{orgId}/dashboard/members` con `email`, `full_name` y `roles` (**sin enviar `send_invite`**).
  2. Recibe `user` y `temporary_password` en la respuesta.
  3. Muestra la contraseña temporal en pantalla y ofrece un botón para enviar las credenciales por correo vía `POST /api/send-email` (opcional, lo hace el front).

- Por tanto, el dashboard **nunca** enviará `send_invite: true` ni consumirá `invite_token`. Pueden considerar ese flujo fuera de uso para el dashboard. La respuesta que esperamos es siempre la estándar: `user` + `temporary_password`.

---

## 1. Endpoint para crear el miembro

- **Método y URL:** `POST /api/organizations/{orgId}/dashboard/members`
- **Headers obligatorios:** `Authorization: Bearer <access_token>`, `x-org-id: {orgId}` (token del usuario logueado, ej. ORG_ADMIN). Sin ellos la API puede devolver 403.

**Body (JSON):**

| Campo       | Tipo     | Obligatorio | Descripción |
|------------|----------|-------------|-------------|
| email      | string   | Sí          | Email del nuevo miembro (se guarda en minúsculas). |
| full_name  | string   | Sí          | Nombre completo. |
| roles      | string[] | No          | Roles a asignar. Valores válidos: `ORG_ADMIN`, `BUSINESS`, `DEVELOPER`, `USER_APP`. En el dashboard, **ORG_ADMIN** solo puede asignar `ORG_ADMIN`, `BUSINESS` y `DEVELOPER`; **USER_APP** solo lo asigna el OWNER. |
| send_invite| boolean  | No          | **El dashboard no lo usa.** Si fuera `true`, la respuesta incluiría `invite_token`. El dashboard siempre omite este campo. |

**Ejemplo (lo que envía el dashboard):**
```json
{
  "email": "nuevo@empresa.com",
  "full_name": "María López",
  "roles": ["BUSINESS"]
}
```

---

## 2. Respuesta del backend (201)

El dashboard solo espera (y usa) esta respuesta:

- `user`: objeto con `id`, `email`, `full_name`, `status`, `must_change_password`.
- `temporary_password`: contraseña temporal para el primer login.

El dashboard no usa `invite_token`; si el backend lo incluye o no en la respuesta es indiferente para el front.

---

## 3. Flujo actual del dashboard

1. Dashboard llama a `POST /api/organizations/{orgId}/dashboard/members` con `email`, `full_name`, `roles` (sin `send_invite`).
2. Respuesta: `user` y `temporary_password`.
3. El dashboard muestra en pantalla la contraseña temporal y un botón **"Enviar credenciales por correo"**.
4. Si el admin pulsa ese botón, el dashboard llama a `POST /api/send-email` con el email del nuevo usuario y un mensaje que incluye `temporary_password`. Si no pulsa, no se envía correo.

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

## 7. Resumen para el dashboard

| Acción                         | Endpoint                                                                 | Quién        | Cuándo |
|--------------------------------|-------------------------------------------------------------------------|--------------|--------|
| Crear miembro                  | `POST /api/organizations/{orgId}/dashboard/members`                     | ORG_ADMIN (JWT) | Al hacer “Add Member”. |
| Enviar correo con credenciales | `POST /api/send-email`                                                  | Dashboard    | Solo si se decide enviar por correo; después de crear el miembro. |
| Primer login                   | `POST /api/auth/login`                                                  | Nuevo usuario | Desde la app del dashboard. |
| Cambio de contraseña obligatorio | `POST /api/auth/organizations/{orgId}/members/password/reset` o `POST /api/auth/password/change` | Nuevo usuario (con su JWT) | Tras el primer login, cuando `mustChangePassword === true`. |

- **Con envío por correo:** crear miembro con `send_invite: true` → usar `invite_token` (o `temporary_password` según decisión) en el mensaje → llamar `POST /api/send-email`.
- **Sin envío por correo:** crear miembro sin `send_invite` → mostrar solo `temporary_password` en la UI y no llamar a `POST /api/send-email`.
