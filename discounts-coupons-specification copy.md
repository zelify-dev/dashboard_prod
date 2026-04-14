# Especificación Técnica Absoluta: Ecosistema Descuentos y Cupones (Zelify)

Esta especificación es el documento de referencia definitivo para el módulo de fidelización y beneficios. Define cada punto de entrada, reglas de validación y flujos de datos para desarrolladores e ingenieros de QA.

---

## 1. Arquitectura y Seguridad

### 1.1 Multi-Tenancy (Multi-org)
El sistema opera bajo un modelo multi-inquilino. Cada petición debe estar contextualizada a una organización.
- **Header Requerido**: `x-org-id` (UUID de la organización cliente o merchant).
- **Contexto x-org-id**: En flujos B2B (API), este header define quién realiza la operación. En flujos de dashboard, suele derivarse de la sesión del usuario.

### 1.2 Matriz de Roles y Permisos
| Rol | Código | Alcance |
| :--- | :--- | :--- |
| **Owner / Zelify Team** | `OWNER`, `ZELIFY_TEAM` | Control total sobre todas las organizaciones, merchants y configuraciones globales. |
| **Merchant Admin** | `MERCHANT_ADMIN` | Administra su propio comercio (sucursales, productos, descuentos). |
| **Merchant Operator** | `MERCHANT_OPERATOR` | Consulta reportes y verifica canjes de cupones (`confirm-use`). |
| **Org Admin** | `ORG_ADMIN` | Gestiona la red de beneficios visibles para sus usuarios finales. |
| **User App** | `USER_APP` | Usuario final que consume los beneficios en la aplicación móvil/web. |

---

## 2. Fase 1: Multi-Tenant Onboarding

### 2.1 Onboarding Maestro de Comercio
Crea automáticamente la estructura organizacional necesaria para un nuevo comerciante.
- **POST** `/api/discounts/merchants/onboarding`
- **Payload (`OnboardMerchantDto`):**
```json
{
  "country_code": "EC", // Código ISO de 2 letras
  "merchant_name": "KFC Ecuador", // Nombre comercial
  "merchant_slug": "kfc", // Único por país (ej: panama-kfc)
  "admin_email": "admin@kfc.com.ec", // Email del administrador inicial
  "admin_full_name": "Gerente KFC", // Nombre del administrador
  "merchant_description": "Pollo frito receta original", // Opcional
  "merchant_logo_url": "https://cdn.zelify.com/kfc.png", // Opcional
  "merchant_type": "RESTAURANT", // Opcional (Categoría ejecutiva)
  "organization_name": "KFC Corp S.A.", // Opcional (Nombre de la entidad legal)
  "fiscal_id": "1790012345001", // Opcional (RUC/NIT/Tax ID)
  "admin_phone": "+593999999999", // Opcional
  "admin_username": "@kfc_admin", // Opcional (Comienza con @)
  "admin_password": "TempPassword123*" // Opcional (Min 8 caracteres)
}
```
- **Respuesta (201):** Objeto con datos de la `organization`, `merchant` y el usuario `admin_user` creado (incluyendo password temporal si fue generado).

---

## 3. Fase 2: Configuración de Catálogo y Ubicación

### 3.1 Gestión de Sucursales (Branches)
- **POST** `/api/discounts/merchants/:merchantId/branches` (Crea sucursal)
- **PATCH** `/api/discounts/merchants/:merchantId/branches/:branchId` (Actualiza datos)
- **PATCH** `/api/discounts/merchants/:merchantId/branches/:branchId/geolocation` (Solo coordenadas/dirección)
- **Payload (`CreateBranchDto`):**
```json
{
  "name": "KFC Quito Norte", 
  "city": "Quito",
  "address": "Av. Amazonas y Naciones Unidas",
  "lat": -0.180653,
  "lng": -78.484180
}
```

### 3.2 Categorías de Productos
- **POST** `/api/discounts/merchants/:merchantId/categories`
- **Payload (`CreateCategoryDto`):** `{ "name": "Hamburguesas", "slug": "hamburguesas", "sort_order": 1 }`

### 3.3 Catálogo de Productos
- **POST** `/api/discounts/merchants/:merchantId/products`
- **Payload (`CreateProductDto`):**
```json
{
  "name": "Combo Super Económico",
  "description": "2 presas de pollo + papas + soda",
  "price": 5.99,
  "currency": "USD",
  "category_id": "uuid-cat-123", // Opcional
  "image_url": "https://...", // Opcional
  "sort_order": 0 // Opcional
}
```

---

## 4. Fase 3: Motor de Descuentos y Cupones

### 4.1 Creación de Reglas de Descuento
Define las condiciones comerciales de la oferta.
- **POST** `/api/discounts/merchants/:merchantId/discounts`
- **Payload (`CreateDiscountDto`):**
```json
{
  "name": "25% Martes de Locura",
  "discount_type": "PERCENTAGE", // "PERCENTAGE" o "FIXED_AMOUNT"
  "discount_value": 25,
  "min_purchase": 10.00, // Opcional (Compra mínima)
  "max_uses_total": 500, // Opcional (Tope de redenciones en la red)
  "max_uses_per_user": 1, // Opcional (Tope por cliente único)
  "valid_from": "2024-10-01T00:00:00Z", // Opcional
  "valid_until": "2024-12-31T23:59:59Z", // Opcional
  "available_days": ["TUESDAY"], // Opcional (Días de la semana permitidos)
  "restrict_by_hours": true, // Activa validación horaria
  "available_hours_start": "11:00", // HH:mm
  "available_hours_end": "18:00", // HH:mm
  "timezone": "America/Guayaquil", // IANA Timezone para validación
  "applicable_product_ids": ["uuid-prod-1"] // Opcional (Restricción a SKUs)
}
```

### 4.2 Emisión de Cupones (Lotes)
- **POST** `/api/discounts/discounts/:discountId/coupons`
- **Payload (`CreateCouponDto`):**
```json
{
  "code": "KFC-TUESDAY-25", // Opcional (Si no se envía, se genera uno aleatorio)
  "max_redemptions": 500 // Opcional (Límite de este código específico)
}
```

---

## 5. Fase 4: Distribución y Red de Visibilidad

### 5.1 Asignación a Organización Cliente (Red de Beneficios)
El Owner decide qué comercios están disponibles para qué bancos o empresas.
- **POST** `/api/organizations/:id/discounts/merchants/:merchantId`
- **Payload (`UpsertOrganizationMerchantDto`):** `{ "status": "ACTIVE" }`
> [!IMPORTANT]
> **Regla de Oro de Visibilidad:** Si una organización cliente tiene **CERO** registros en su red, por defecto ve **TODOS** los comercios (Modo Abierto). Al asignar el primer comercio, el sistema pasa a **Modo Restringido** y solo muestra los explícitamente asignados.

### 5.2 Supervisión Global (Admin Dashboard)
Endpoint para ver la relación global de visibilidad.
- **GET** `/api/discounts/admin/visibility-relations`
- **Query Params:** `page`, `limit`, `search` (opcionales).
- **Respuesta:** `{ "relations": [{ merchant_name, organization_name, status, ... }], "meta": { total, pages, ... } }`

---

## 6. Fase 5: Ciclo de Vida Operativo (El "Camino del Usuario")

### 6.1 Búsqueda y Geocercas (Geofencing)
- **GET** `/api/discounts/merchants/nearby?lat=0.1&lng=-78.4&country_code=EC&radius_km=10`
- **Respuesta:** Arreglo de sucursales abiertas con la data del comercio embebida.

### 6.2 El "Claim": Reservar el Beneficio
El usuario toca en "Obtener Cupón". El sistema verifica todas las reglas de negocio.
- **POST** `/api/organizations/:id/discounts/coupons/redeem`
- **Payload:** `{ "code": "KFC-TUESDAY-25", "user_id": "uuid-user-123" }`
- **Proceso Interno (Validaciones en orden):**
  1. Status del cupón y descuento (ACTIVE).
  2. Vigencia de fechas (`valid_from` / `valid_until`).
  3. Disponibilidad por día de la semana.
  4. **Disponibilidad Horaria:** Se ajusta la hora del servidor a la `timezone` del descuento y se valida el rango.
  5. Límite de stock del cupón (`max_redemptions`).
  6. Límite global del descuento (`max_uses_total`).
  7. Límite personal del usuario (`max_uses_per_user`).
- **Respuesta (201):** Objeto `claim` con un `claim_code` único (ej: `XJ92K801`).

### 6.3 La "Redemption": Canje en Punto de Venta
El usuario muestra el código en el establecimiento. El operador del comercio confirma el uso.
- **POST** `/api/discounts/coupons/confirm-use`
- **Payload (`ConfirmUseCouponDto`):** `{ "claim_code": "XJ92K801" }`
- **Respuesta (201):** Marca el claim como `REDEEMED`, registra la fecha y dispara el contador de analytics.

---

## 7. Fase 6: Analytics y Reportes

### 7.1 Reportes Transaccionales (B2B)
- **GET** `/api/organizations/:id/discounts/reports/summary?from=2024-01-01&to=2024-01-31`
- **GET** `/api/organizations/:id/discounts/reports/redemptions`
- **Output:** Métricas agregadas y listado de canjes para conciliación financiera.

### 7.2 Analytics de Negocio
- **GET** `/api/discounts/admin/analytics/overview` (Resumen de salud de red).
- **GET** `/api/discounts/admin/analytics/top-merchants` (Comercios con mayor tracción).

---

## 8. Guía de Errores y Validaciones (Checklist para QA)

| Código | Mensaje de Error (Real de Backend) | Escenario de Prueba |
| :--- | :--- | :--- |
| **400** | "El descuento no está disponible en este horario" | Intentar claim fuera del rango `available_hours`. |
| **400** | "El descuento no está disponible hoy" | Intentar claim en un día no incluido en `available_days`. |
| **400** | "Cupón agotado" | Crear cupón con `max_redemptions: 1` y redimirlo dos veces. |
| **400** | "El usuario alcanzó su límite de uso..." | Intentar redimir más de lo permitido en `max_uses_per_user`. |
| **400** | "El usuario ya tiene un claim pendiente para este cupón" | Intentar generar 2 claims activos del mismo cupón simultáneamente. |
| **403** | "Este comercio no está habilitado para la organización" | Intentar usar un cupón de un merchant que no ha sido asignado a la red de la Org. |
| **404** | "Cupón no encontrado" | Código de cupón errado o inexistente. |
| **409** | "Ya existe un cupón con ese código" | Intentar crear un cupón manual con un código que ya usa otro merchant. |

---
*Documento Final - Versión 2.0 / Absolute Specification*
