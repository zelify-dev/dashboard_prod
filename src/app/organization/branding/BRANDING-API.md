# Branding API — Pruebas con curl

Base: `API_URL` = `http://localhost:8080` (o tu `NEXT_PUBLIC_AUTH_API_URL`).  
Sustituir `ORG_ID_AQUI` y `ACCESS_TOKEN_AQUI` por valores reales.

## 1) Obtener organización (branding actual)

```bash
curl -X GET "http://localhost:8080/api/organizations/ORG_ID_AQUI" \
  -H "Authorization: Bearer ACCESS_TOKEN_AQUI"
```

## 2) Subir logo (multipart/form-data)

Requiere Bearer (ORG_ADMIN / OWNER / ZELIFY_TEAM).

```bash
curl -X POST "http://localhost:8080/api/organizations/ORG_ID_AQUI/branding/logo" \
  -H "Authorization: Bearer ACCESS_TOKEN_AQUI" \
  -F "logo=@/ruta/a/tu/logo.png"
```

Respuesta 201: `{ "url_log": "https://..." }`

## 3) Actualizar colores (y opcionalmente url_log)

Requiere Bearer (ORG_ADMIN / OWNER / ZELIFY_TEAM).

```bash
curl -X PATCH "http://localhost:8080/api/organizations/ORG_ID_AQUI/branding" \
  -H "Authorization: Bearer ACCESS_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "color_a": "#D6FF12",
    "color_b": "#FF1212"
  }'
```

Opcional: incluir `"url_log": "https://.../logo.png"` en el body.

Respuesta: objeto organización actualizado.
