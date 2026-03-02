# API Endpoints Summary

Base URL: `http://localhost:3000/api`

All protected routes require:
```
Authorization: Bearer <JWT>
```

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Returns `{ status: "ok" }` |

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register a new buyer account |
| POST | `/auth/login` | — | Login and receive a JWT |

### POST `/auth/register`
**Body**
```json
{
  "email": "buyer@example.com",
  "password": "SecurePass1!",
  "fullName": "Jane Doe",
  "shippingAddress": "123 Main St"   // optional
}
```
**Response `201`**
```json
{
  "accessToken": "<jwt>",
  "user": { "id": "...", "email": "...", "fullName": "...", "shippingAddress": null }
}
```

### POST `/auth/login`
**Body**
```json
{ "email": "buyer@example.com", "password": "SecurePass1!" }
```
**Response `200`** — same shape as register.

---

## Usuarios

Todas las rutas requieren autenticación + rol de comprador.

| Método | Ruta | Autenticación | Descripción |
|--------|------|-------|-------------|
| GET | `/users/profile` | ✅ Comprador | Obtiene el perfil del usuario autenticado |
| PUT | `/users/profile` | ✅ Comprador | Actualiza el nombre completo y/o dirección de envío |

### PUT `/users/profile`
**Cuerpo** (todos los campos opcionales)
```json
{ "fullName": "Nuevo Nombre", "shippingAddress": "456 Avenida Roble" }
```

---

## Productos

| Método | Ruta | Autenticación | Descripción |
|--------|------|-------|-------------|
| GET | `/products` | — | Lista paginada de productos activos |
| GET | `/products/:id` | — | Obtiene el detalle del producto por ID |

### GET `/products` — Parámetros de consulta

| Parámetro | Tipo | Por defecto | Descripción |
|-----------|------|---------|-------------|
| `page` | entero | 1 | Número de página |
| `limit` | entero | 20 | Resultados por página (máx 100) |
| `category` | entero | — | Filtrar por ID de categoría |
| `minPrice` | número | — | Precio mínimo |
| `maxPrice` | número | — | Precio máximo |
| `search` | cadena | — | Búsqueda de nombre insensible a mayúsculas |

---

## Categorías

| Método | Ruta | Autenticación | Descripción |
|--------|------|-------|-------------|
| GET | `/categories` | — | Lista todas las categorías activas |

---

## Carrito

Todas las rutas requieren autenticación + rol de comprador.

| Método | Ruta | Autenticación | Descripción |
|--------|------|-------|-------------|
| GET | `/cart` | ✅ Comprador | Obtiene el carrito actual del usuario con instantáneas de productos |
| POST | `/cart` | ✅ Comprador | Agrega un artículo al carrito (actualiza si ya está presente) |
| PUT | `/cart/:productId` | ✅ Comprador | Actualiza la cantidad del artículo |
| DELETE | `/cart/:productId` | ✅ Comprador | Elimina un artículo del carrito |

### GET `/cart`
**Respuesta `200`**
```json
{
  "items": [
    {
      "id": 1,
      "productId": 10,
      "productName": "Widget",
      "productPrice": 25.00,
      "productImageUrl": null,
      "quantity": 2,
      "lineTotal": 50.00
    }
  ],
  "subtotal": 50.00
}
```

### POST `/cart`
**Cuerpo**
```json
{ "productId": 10, "quantity": 2 }
```
- Agrega `quantity` a cualquier cantidad existente en el carrito.
- Devuelve `409` si la cantidad combinada excede el stock disponible.

**Respuesta `201`** — el artículo del carrito actualizado.

### PUT `/cart/:productId`
**Cuerpo**
```json
{ "quantity": 5 }
```
- Establece la cantidad al valor dado (reemplaza, no suma).
- Devuelve `409` si `quantity` excede el stock disponible.

### DELETE `/cart/:productId`
**Respuesta `204`** — sin cuerpo.

---

## Pedidos

Todas las rutas requieren autenticación + rol de comprador.

| Método | Ruta | Autenticación | Descripción |
|--------|------|-------|-------------|
| POST | `/orders` | ✅ Comprador | Checkout: crear pedido desde el carrito |
| GET | `/orders` | ✅ Comprador | Historial de pedidos del comprador (paginado) |
| GET | `/orders/:id` | ✅ Comprador | Detalle del pedido con artículos de línea |
| POST | `/orders/:id/payment` | ✅ Comprador | Procesar pago (servicio simulado) |

### POST `/orders`
**Cuerpo**
```json
{ "shippingAddress": "42 Calle Olmo" }
```
- Valida que el carrito no esté vacío.
- Calcula `subtotal`, `tax` (21 %), y `total`.
- Guarda instantáneas de precios para cada artículo de línea.
- Limpia el carrito en caso de éxito.

**Respuesta `201`**
```json
{
  "id": 1,
  "status": "Pendiente",
  "subtotal": 100.00,
  "tax": 21.00,
  "total": 121.00,
  "shippingAddress": "42 Calle Olmo",
  "createdAt": "2026-03-02T10:00:00.000Z",
  "items": [
    {
      "id": 1,
      "productId": 10,
      "productNameSnapshot": "Widget",
      "unitPriceSnapshot": 50.00,
      "quantity": 2,
      "lineTotal": 100.00
    }
  ]
}
```

### GET `/orders` — Parámetros de consulta

| Parámetro | Tipo | Por defecto | Descripción |
|-----------|------|---------|-------------|
| `page` | entero | 1 | Número de página |
| `limit` | entero | 10 | Resultados por página (máx 100) |

**Respuesta `200`**
```json
{
  "data": [{ "id": 1, "status": "Pendiente", "subtotal": 100.00, "tax": 21.00, "total": 121.00, "shippingAddress": "...", "createdAt": "..." }],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### GET `/orders/:id`
Devuelve el detalle del pedido incluyendo todos los artículos de línea (misma estructura que la respuesta de checkout).

### POST `/orders/:id/payment`
Procesa el pago a través del servicio de pago simulado.

**Comportamiento simulado:** aprueba 4 de cada 5 llamadas consecutivas; la 5ª es rechazada. Esto se repite indefinidamente para permitir probar ambos resultados.

**Respuesta `200`**
```json
{
  "orderId": 1,
  "status": "Pagado",
  "transactionId": "txn_approved_1_1709380800000",
  "message": "Pago aprobado"
}
```
O en caso de rechazo:
```json
{
  "orderId": 1,
  "status": "PagoFallido",
  "transactionId": "txn_rejected_1_1709380800000",
  "message": "Pago rechazado por el emisor"
}
```

---

## Estados de Pedidos

| Estado | Significado |
|--------|---------|
| `Pendiente` | Pedido creado, pago no intentado todavía |
| `Pagado` | Pago aprobado |
| `PagoFallido` | Pago rechazado por el servicio simulado |
| `Confirmado` | Confirmado manualmente |
| `Enviado` | Pedido enviado |
| `Entregado` | Pedido entregado |

---

## Respuestas de error comunes

| Estado | Cuerpo | Causa |
|--------|------|---------|
| 400 | `{ "error": "..." }` | Error de validación o carrito vacío |
| 401 | `{ "error": "No token provided" }` | JWT faltante o inválido |
| 403 | `{ "error": "Access restricted to buyers" }` | Rol incorrecto |
| 404 | `{ "error": "..." }` | Recurso no encontrado |
| 409 | `{ "error": "Insufficient stock..." }` | Stock excedido |
| 500 | `{ "error": "Internal server error" }` | Error inesperado |
