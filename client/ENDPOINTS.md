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

## Users

All routes require auth + buyer role.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/profile` | ✅ Buyer | Get authenticated user's profile |
| PUT | `/users/profile` | ✅ Buyer | Update fullName and/or shippingAddress |

### PUT `/users/profile`
**Body** (all fields optional)
```json
{ "fullName": "New Name", "shippingAddress": "456 Oak Ave" }
```

---

## Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | — | Paginated list of active products |
| GET | `/products/:id` | — | Get product detail by ID |

### GET `/products` — Query params

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Results per page (max 100) |
| `category` | integer | — | Filter by category ID |
| `minPrice` | number | — | Minimum price |
| `maxPrice` | number | — | Maximum price |
| `search` | string | — | Case-insensitive name search |

---

## Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | — | List all active categories |

---

## Cart

All routes require auth + buyer role.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cart` | ✅ Buyer | Get current user's cart with product snapshots |
| POST | `/cart` | ✅ Buyer | Add item to cart (upserts if already present) |
| PUT | `/cart/:productId` | ✅ Buyer | Update item quantity |
| DELETE | `/cart/:productId` | ✅ Buyer | Remove item from cart |

### GET `/cart`
**Response `200`**
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
**Body**
```json
{ "productId": 10, "quantity": 2 }
```
- Adds `quantity` to any existing quantity in the cart.
- Returns `409` if combined quantity exceeds available stock.

**Response `201`** — the upserted cart item.

### PUT `/cart/:productId`
**Body**
```json
{ "quantity": 5 }
```
- Sets the quantity to the given value (replaces, does not add).
- Returns `409` if `quantity` exceeds available stock.

### DELETE `/cart/:productId`
**Response `204`** — no body.

---

## Orders

All routes require auth + buyer role.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | ✅ Buyer | Checkout: create order from cart |
| GET | `/orders` | ✅ Buyer | Buyer's order history (paginated) |
| GET | `/orders/:id` | ✅ Buyer | Order detail with line items |
| POST | `/orders/:id/payment` | ✅ Buyer | Process payment (mock service) |

### POST `/orders`
**Body**
```json
{ "shippingAddress": "42 Elm Street" }
```
- Validates that the cart is not empty.
- Calculates `subtotal`, `tax` (21 %), and `total`.
- Saves price snapshots for each line item.
- Clears the cart on success.

**Response `201`**
```json
{
  "id": 1,
  "status": "Pending",
  "subtotal": 100.00,
  "tax": 21.00,
  "total": 121.00,
  "shippingAddress": "42 Elm Street",
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

### GET `/orders` — Query params

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Results per page (max 100) |

**Response `200`**
```json
{
  "data": [{ "id": 1, "status": "Pending", "subtotal": 100.00, "tax": 21.00, "total": 121.00, "shippingAddress": "...", "createdAt": "..." }],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### GET `/orders/:id`
Returns the order detail including all line items (same shape as the checkout response).

### POST `/orders/:id/payment`
Processes payment through the mock payment service.

**Mock behaviour:** approves 4 out of every 5 consecutive calls; the 5th is rejected. This cycles indefinitely to allow testing both outcomes.

**Response `200`**
```json
{
  "orderId": 1,
  "status": "Paid",
  "transactionId": "txn_approved_1_1709380800000",
  "message": "Payment approved"
}
```
Or on rejection:
```json
{
  "orderId": 1,
  "status": "PaymentFailed",
  "transactionId": "txn_rejected_1_1709380800000",
  "message": "Payment declined by issuer"
}
```

---

## Order statuses

| Status | Meaning |
|--------|---------|
| `Pending` | Order created, payment not yet attempted |
| `Paid` | Payment approved |
| `PaymentFailed` | Payment rejected by the mock service |
| `Confirmed` | Manually confirmed |
| `Shipped` | Order dispatched |
| `Delivered` | Order delivered |

---

## Common error responses

| Status | Body | Trigger |
|--------|------|---------|
| 400 | `{ "error": "..." }` | Validation failure or empty cart |
| 401 | `{ "error": "No token provided" }` | Missing or invalid JWT |
| 403 | `{ "error": "Access restricted to buyers" }` | Wrong role |
| 404 | `{ "error": "..." }` | Resource not found |
| 409 | `{ "error": "Insufficient stock..." }` | Stock exceeded |
| 500 | `{ "error": "Internal server error" }` | Unexpected error |
