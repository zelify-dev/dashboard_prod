# Backend: equipos, roles y gestión de contraseñas

Especificación para implementar en el backend la lógica de **añadir miembros a la organización** (por ORG_ADMIN) y la **gestión de contraseñas** (temporal + cambio obligatorio en primer login).

---

## 1. Roles y quién puede hacer qué

| Rol          | Descripción                         | Puede añadir miembros | Puede eliminar miembros |
|-------------|--------------------------------------|------------------------|--------------------------|
| `OWNER`     | Propietario de la organización       | Sí (todos los roles)   | Sí                       |
| `ORG_ADMIN` | Administrador de la organización    | Sí (solo ORG_ADMIN, BUSINESS, DEVELOPER) | Sí (cualquier miembro de la org) |
| `BUSINESS`  | Usuario equipo negocio               | No                    | No                       |
| `DEVELOPER` | Usuario equipo desarrollo            | No                    | No                       |
| `ZELIFY_TEAM` | Usuario equipo Zelify              | No                    | No                       |

- **OWNER** puede asignar al crear/editar miembros cualquiera de: `OWNER`, `ORG_ADMIN`, `BUSINESS`, `DEVELOPER`, `ZELIFY_TEAM`.
- **ORG_ADMIN** solo puede asignar: `ORG_ADMIN`, `BUSINESS`, `DEVELOPER` (no puede asignar OWNER ni ZELIFY_TEAM).
- La gestión de miembros (tabla, añadir, editar roles) la ven tanto OWNER como ORG_ADMIN; el resto no ve la sección.

---

## 2. Añadir miembro a la organización (solo ORG_ADMIN)

### Endpoint propuesto

```
POST /api/organizations/members
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Permiso:** el token debe corresponder a un usuario con rol `ORG_ADMIN` **en la misma organización** que se use en el body (o la org del token).

### Body

```json
{
  "email": "nuevo@ejemplo.com",
  "full_name": "Nombre Apellido",
  "password": "contraseña_temporal_min_8_chars",
  "role": "BUSINESS"
}
```

| Campo       | Tipo   | Obligatorio | Descripción |
|------------|--------|-------------|-------------|
| `email`    | string | Sí          | Email único del nuevo usuario (y login). |
| `full_name` | string | Sí        | Nombre completo. |
| `password` | string | Sí          | Contraseña temporal (mín. 8 caracteres). Se guardará hasheada. |
| `role`     | string | Sí          | Uno de: `ORG_ADMIN`, `BUSINESS`, `DEVELOPER`. |

- **Organización:** la del usuario autenticado (org_id del token/sesión). No hace falta enviarla en el body si el backend la toma del contexto de auth.
- **Teléfono:** no se maneja a nivel back en esta versión; el frontend no envía `phone`.

### Lógica en el backend

1. Comprobar que el usuario autenticado tiene rol `ORG_ADMIN` (y opcionalmente que la org del token sea la correcta).
2. Validar body (email formato válido, password mínimo 8 caracteres, `role` uno de los tres valores).
3. Comprobar que el `email` no exista ya en la misma organización (o globalmente si el modelo es un usuario por org).
4. Crear el usuario:
   - `email`, `full_name`.
   - Contraseña: guardar **hash** de `password` (nunca en claro).
   - Asignar el `role` indicado.
   - Asignar la **misma organización** que el admin.
   - **Importante:** marcar al usuario con `must_change_password: true` (pendiente de cambio de contraseña).
5. Respuesta: devolver el usuario creado (sin el hash de la contraseña) y, si aplica, el rol/org asignados.

### Respuesta sugerida (201 Created)

```json
{
  "id": "uuid-del-usuario",
  "email": "nuevo@ejemplo.com",
  "full_name": "Nombre Apellido",
  "status": "active",
  "must_change_password": true,
  "organization_id": "org-del-admin",
  "roles": ["BUSINESS"]
}
```

El frontend usa este endpoint cuando el ORG_ADMIN hace "Add Member" en un equipo: envía `role` según el equipo elegido (ver mapeo en el front en `team-roles.ts`).

### Errores típicos

- **401** – No autenticado.
- **403** – Autenticado pero sin rol `ORG_ADMIN` (o org distinta).
- **400** – Validación (email inválido, password corto, role no permitido).
- **409** – El email ya existe en la organización.

---

## 3. Eliminar miembro de la organización (solo ORG_ADMIN)

### Endpoint propuesto

```
DELETE /api/organizations/members/:userId
Authorization: Bearer <access_token>
```

**Permiso:** el token debe corresponder a un usuario con rol `ORG_ADMIN` en la misma organización que el miembro a eliminar.

### Parámetros

- **userId** (path): identificador del usuario a eliminar (UUID o ID interno).

### Lógica en el backend

1. Comprobar que el usuario autenticado tiene rol `ORG_ADMIN`.
2. Comprobar que el usuario a eliminar (`userId`) pertenece a la **misma organización** que el admin. No se puede eliminar a un usuario de otra org.
3. (Opcional) Impedir que el admin se elimine a sí mismo si es el único ORG_ADMIN, según reglas de negocio.
4. Eliminar o desvincular al usuario de la organización según el modelo de datos:
   - **Opción A:** borrado lógico: marcar al usuario como inactivo o “eliminado” y quitarle la relación con la org.
   - **Opción B:** borrado físico: eliminar el registro del usuario (y sus sesiones/tokens) si no se reutiliza en otras orgs.
5. Respuesta: **204 No Content** (sin body) o **200 OK** con un mensaje de confirmación.

### Errores típicos

- **401** – No autenticado.
- **403** – Sin rol `ORG_ADMIN` o intentando eliminar usuario de otra org.
- **404** – Usuario `userId` no encontrado o no pertenece a la org del admin.

---

## 4. Login y campo `must_change_password`

El flujo de login existente debe seguir devolviendo el usuario con el campo **`must_change_password`**:

- Usuario creado por ORG_ADMIN con contraseña temporal → en BD `must_change_password = true`.
- En la respuesta de **POST /api/auth/dashboard/login** (y en **GET /api/me**), incluir en el objeto `user`:

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "full_name": "...",
    "status": "active",
    "must_change_password": true
  },
  "access_token": "...",
  "refresh_token": "...",
  "roles": ["BUSINESS"]
}
```

Si el usuario ya ha cambiado la contraseña, `must_change_password` debe ser `false`. El frontend, si ve `true`, muestra el modal de “Cambia tu contraseña” y no permite usar el dashboard hasta completar el cambio.

---

## 5. Cambio de contraseña (obligatorio en primer login)

### Endpoint (ya usado por el frontend)

```
POST /api/me/change-password
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Body

```json
{
  "new_password": "nueva_contraseña_min_8_chars"
}
```

### Lógica en el backend

1. Identificar al usuario por el token (JWT o sesión).
2. Validar `new_password` (mínimo 8 caracteres, y las políticas que tengáis).
3. Actualizar en BD:
   - Guardar el **hash** de `new_password`.
   - Poner **`must_change_password = false`**.
4. Respuesta: devolver el **usuario actualizado** (incluyendo `must_change_password: false`) para que el frontend actualice la sesión sin hacer otro GET /api/me.

### Respuesta sugerida (200 OK)

Mismo formato que **GET /api/me**, con el usuario actualizado:

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "full_name": "...",
    "status": "active",
    "must_change_password": false
  }
}
```

Si el backend devuelve también `organization` y `roles`, el frontend puede seguir usando la misma estructura que en `/api/me`. Lo importante es que **`user.must_change_password` sea `false`** después del cambio.

### Errores típicos

- **401** – No autenticado.
- **400** – Contraseña no válida (muy corta, etc.).

---

## 6. Resumen para el backend

| Funcionalidad              | Quién              | Endpoint                              | Detalle clave |
|---------------------------|--------------------|----------------------------------------|----------------|
| Añadir miembro            | Solo ORG_ADMIN     | POST /api/organizations/members        | Body: email, full_name, password, role. Crear usuario con `must_change_password: true`. |
| Eliminar miembro          | Solo ORG_ADMIN     | DELETE /api/organizations/members/:userId | Solo usuarios de la misma org. 204 o 200. |
| Login                     | Cualquiera         | POST /api/auth/dashboard/login        | Incluir en `user` el campo `must_change_password`. |
| Perfil                    | Cualquiera         | GET /api/me                           | Incluir en `user` el campo `must_change_password`. |
| Cambio de contraseña      | Usuario logueado   | POST /api/me/change-password           | Body: new_password. Actualizar hash y poner `must_change_password: false`. Devolver usuario actualizado. |

---

## 7. Listar miembros

**GET /api/organizations/{orgId}/users**

Query opcional: `page` (default 1), `limit` (default 20), `search`, `status` (ACTIVE | DISABLED).

Para que el frontend muestre la columna **Team/Role**, cada elemento de `items` debe incluir **`roles`** con la misma estructura que en el detalle de usuario. Si el backend no envía `roles` en el listado, la columna mostrará "—".

### Respuesta recomendada (200 OK)

```json
{
  "items": [
    {
      "id": "uuid",
      "organization_id": "uuid-org",
      "email": "user@company.com",
      "full_name": "User Name",
      "status": "ACTIVE",
      "must_change_password": true,
      "created_at": "2026-..",
      "updated_at": "2026-..",
      "roles": [
        { "id": "uuid-role", "code": "BUSINESS", "name": "Business" }
      ]
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

Solo usuarios con rol `ORG_ADMIN` o `OWNER` deberían poder llamar a este endpoint.

---

Con esta lógica en el back, el ORG_ADMIN puede añadir miembros con contraseña temporal y la gestión de “usuario pendiente” y “cambio obligatorio de contraseña en el primer login” queda cerrada entre front y back.

---

## 8. Seguridad: validación en backend (obligatoria)

El frontend solo muestra los roles que el usuario puede asignar (OWNER → 5 roles, ORG_ADMIN → 3). **Eso es UX, no seguridad.** Un atacante puede omitir la UI y enviar peticiones con `role` o `role_codes` arbitrarios. Por tanto, el backend **debe** hacer lo siguiente para que el flujo sea seguro:

### Crear miembro (POST crear usuario en la org)

1. Comprobar que el usuario autenticado tiene rol **OWNER** o **ORG_ADMIN** en la misma organización. Si no, responder **403**.
2. Si el usuario es **ORG_ADMIN**, validar que el `role` (o `roles`) en el body **no** incluya `OWNER` ni `ZELIFY_TEAM`. Si intenta asignar alguno de esos dos, responder **403** (o **400** con mensaje claro).
3. Si el usuario es **OWNER**, aceptar cualquiera de: `OWNER`, `ORG_ADMIN`, `BUSINESS`, `DEVELOPER`, `ZELIFY_TEAM`.
4. Validar que el resto del body (email, full_name, etc.) sea correcto.

### Asignar roles (PUT/PATCH asignar roles a un miembro)

1. Comprobar que el usuario autenticado es **OWNER** o **ORG_ADMIN** en la misma organización. Si no, **403**.
2. Si es **ORG_ADMIN**, validar que `role_codes` **no** contenga `OWNER` ni `ZELIFY_TEAM**. Si los incluye, **403** (o **400**).
3. Si es **OWNER**, aceptar cualquier combinación de los 5 roles permitidos.

### Listar / editar / deshabilitar / reset password

- Permitir a usuarios con rol **OWNER** o **ORG_ADMIN** en la misma organización. Rechazar con **403** al resto.

Con estas comprobaciones en el backend, el flujo queda seguro aunque alguien intente saltarse el frontend.
