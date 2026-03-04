# Branding API — Pruebas con curl

Base: `NEXT_PUBLIC_AUTH_API_URL` **sin** `/api` (ej. `http://localhost:8080` o `https://rhdt3ppx7f.us-east-1.awsapprunner.com`).  
El front construye `{base}/api/organizations/:id/branding`, etc.  
En los curl, sustituir `ORG_ID_AQUI` y `ACCESS_TOKEN_AQUI` por valores reales.

## 1) Obtener branding (cargar pantalla) — **público, sin auth**

```bash
curl -X GET "http://localhost:8080/api/organizations/ORG_ID_AQUI/branding"
```

Respuesta 200: `{ "id": "...", "url_log": "https://..." | null, "color_a": "#RRGGBB" | null, "color_b": "#RRGGBB" | null }`  
Errores: 404 — Organización no encontrada.

## 2) Obtener organización completa (alternativa con auth)

```bash
curl -X GET "http://localhost:8080/api/organizations/ORG_ID_AQUI" \
  -H "Authorization: Bearer ACCESS_TOKEN_AQUI"
```

## 3) Subir logo (multipart/form-data) — **auth obligatoria** (OWNER, ORG_ADMIN, ZELIFY_TEAM)

```bash
curl -X POST "http://localhost:8080/api/organizations/ORG_ID_AQUI/branding/logo" \
  -H "Authorization: Bearer ACCESS_TOKEN_AQUI" \
  -F "logo=@/ruta/a/tu/logo.png"
```

Respuesta 201: `{ "url_log": "https://..." }`  
Errores: 400 (falta logo o inválido), 401, 403, 404.

## 4) Actualizar colores y/o url_log — **auth obligatoria** (OWNER, ORG_ADMIN, ZELIFY_TEAM)

```bash
curl -X PATCH "http://localhost:8080/api/organizations/ORG_ID_AQUI/branding" \
  -H "Authorization: Bearer ACCESS_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "color_a": "#D6FF12",
    "color_b": "#FF1212"
  }'
```

Respuesta 200: objeto organización actualizado.  
Errores: 400 (validación, ej. color no #RRGGBB), 401, 403, 404.  
Colores: formato `#RRGGBB` (regex `/^#[0-9A-Fa-f]{6}$/`).
