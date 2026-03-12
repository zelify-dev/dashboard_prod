# Branding API — Especificación y pruebas

Base: `NEXT_PUBLIC_AUTH_API_URL` (ej. `http://localhost:8080`).  
El front construye `{base}/api/organizations/:id/branding`, etc.  
GET branding es **público**; PATCH y POST logo requieren **Bearer JWT** y header **x-org-id**.

## 1) Obtener branding — **público, sin auth**

```bash
curl -X GET "http://localhost:8080/api/organizations/ORG_ID_AQUI/branding"
```

Respuesta 200: objeto con `id`, `url_log`, `url_log_dark`, `url_log_light`, `url_icon`, `color_a`, `color_b` (cualquiera puede ser `null`).

## 2) Actualizar branding (URLs y/o colores) — **auth: Bearer + x-org-id**

```bash
curl -X PATCH "http://localhost:8080/api/organizations/ORG_ID_AQUI/branding" \
  -H "Authorization: Bearer ACCESS_TOKEN_AQUI" \
  -H "x-org-id: ORG_ID_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"color_a": "#D6FF12", "color_b": "#FF1212"}'
```

Body: solo los campos a cambiar (todos opcionales): `url_log`, `url_log_dark`, `url_log_light`, `url_icon`, `color_a`, `color_b`.  
Respuesta 200: **objeto branding completo** (mismo formato que GET).  
Colores: formato `#RRGGBB` (6 hex).

## 3) Subir logo / ícono — **auth: Bearer + x-org-id**, solo PNG

```bash
curl -X POST "http://localhost:8080/api/organizations/ORG_ID_AQUI/branding/logo" \
  -H "Authorization: Bearer ACCESS_TOKEN_AQUI" \
  -H "x-org-id: ORG_ID_AQUI" \
  -F "logo=@/ruta/a/logo.png"
```

Campos form-data: `logo` (principal), `logoDark` (fondo oscuro), `logoLight` (fondo claro), `icon` (ícono). Solo **PNG**; otro tipo → 400 con mensaje "Solo se permiten archivos PNG para los logos de branding."  
Cada subida reemplaza el archivo anterior (clave fija por org).  
Respuesta **201**: **objeto branding completo** con las nuevas URLs.

## Resumen

| Acción              | Método | Endpoint                          | Auth        |
|---------------------|--------|-----------------------------------|-------------|
| Cargar pantalla     | GET    | /api/organizations/:id/branding    | No          |
| Cambiar colores/URLs| PATCH  | /api/organizations/:id/branding    | Bearer + x-org-id |
| Subir logo/ícono    | POST   | /api/organizations/:id/branding/logo | Bearer + x-org-id |
