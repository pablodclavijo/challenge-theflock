/**
 * Cart E2E tests
 *
 * All HTTP requests go through the full Express stack. Sequelize model calls
 * are mocked so the tests run without a live database.
 * A real JWT is signed using the test secret so middleware passes.
 */
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../src/presentation/http/app";

// Test constants
const TEST_COMPRADOR_ROLE_ID = "test-comprador-role-id";

// ──────────────────────────────────────────────────────────────────────────────
// Mock Sequelize database – prevents initModels from running (no live DB needed)
// ──────────────────────────────────────────────────────────────────────────────
jest.mock("../../src/infrastructure/database/sequelize", () => ({
  sequelize: {
    transaction: jest.fn((cb: (t: unknown) => Promise<unknown>) => cb({}))
  },
  connectDatabase: jest.fn()
}));

// ──────────────────────────────────────────────────────────────────────────────
// Mock Sequelize models
// ──────────────────────────────────────────────────────────────────────────────

jest.mock(
  "../../src/infrastructure/persistence/sequelize/models/cartItem.model",
  () => ({
    CartItem: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      upsert: jest.fn(),
      destroy: jest.fn(),
      init: jest.fn()
    }
  })
);

jest.mock(
  "../../src/infrastructure/persistence/sequelize/models/product.model",
  () => ({
    Product: {
      findOne: jest.fn(),
      findAndCountAll: jest.fn(),
      init: jest.fn()
    }
  })
);

jest.mock(
  "../../src/infrastructure/persistence/sequelize/models/aspNetRole.model",
  () => ({
    AspNetRole: {
      findOne: jest.fn(),
      init: jest.fn()
    }
  })
);

// ──────────────────────────────────────────────────────────────────────────────
// Import mocked models
// ──────────────────────────────────────────────────────────────────────────────

import { CartItem } from "../../src/infrastructure/persistence/sequelize/models/cartItem.model";
import { Product } from "../../src/infrastructure/persistence/sequelize/models/product.model";
import { AspNetRole } from "../../src/infrastructure/persistence/sequelize/models/aspNetRole.model";

const mockCartFindAll = CartItem.findAll as jest.Mock;
const mockRoleFindOne = AspNetRole.findOne as jest.Mock;
const mockCartFindOne = CartItem.findOne as jest.Mock;
const mockCartUpsert = CartItem.upsert as jest.Mock;
const mockCartDestroy = CartItem.destroy as jest.Mock;
const mockProductFindOne = Product.findOne as jest.Mock;

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const USER_ID = "00000000-0000-0000-0000-000000000010";
const JWT_SECRET = process.env.JWT_SECRET!;

function makeToken(overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    { sub: USER_ID, email: "buyer@cart.test", roleId: TEST_COMPRADOR_ROLE_ID, ...overrides },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function makeCartRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    userId: USER_ID,
    productId: 10,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: {
      id: 10,
      name: "Widget",
      price: 25.0,
      stock: 100,
      imageUrl: null
    },
    ...overrides
  };
}

function makeProductRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 10,
    name: "Widget",
    description: "A fine widget",
    price: 25.0,
    stock: 100,
    categoryId: 1,
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { name: "Tools" },
    ...overrides
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/cart
// ──────────────────────────────────────────────────────────────────────────────

describe("GET /api/cart", () => {
  beforeEach(() => {
    mockRoleFindOne.mockResolvedValue({ Id: TEST_COMPRADOR_ROLE_ID });
  });

  it("200 – returns empty cart", async () => {
    mockCartFindAll.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], subtotal: 0 });
  });

  it("200 – returns cart items with lineTotals", async () => {
    mockCartFindAll.mockResolvedValue([makeCartRow()]);

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      productId: 10,
      productName: "Widget",
      productPrice: 25,
      quantity: 2,
      lineTotal: 50
    });
    expect(res.body.subtotal).toBe(50);
  });

  it("401 – no token", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("403 – wrong role", async () => {
    const vendorToken = makeToken({ roleId: "vendor-role-id" });
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${vendorToken}`);
    expect(res.status).toBe(403);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cart
// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/cart", () => {
  beforeEach(() => {
    mockRoleFindOne.mockResolvedValue({ Id: TEST_COMPRADOR_ROLE_ID });
  });

  it("201 – adds new item to cart", async () => {
    mockProductFindOne.mockResolvedValue(makeProductRow());
    mockCartFindOne
      .mockResolvedValueOnce(null)  // findItem – not yet in cart
      .mockResolvedValueOnce(makeCartRow({ quantity: 2 }));  // reload after upsert
    mockCartUpsert.mockResolvedValue([makeCartRow({ quantity: 2 })]);

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ productId: 10, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ productId: 10, quantity: 2, lineTotal: 50 });
  });

  it("201 – upserts when item already in cart", async () => {
    mockProductFindOne.mockResolvedValue(makeProductRow({ stock: 100 }));
    mockCartFindOne
      .mockResolvedValueOnce(makeCartRow({ quantity: 1 }))  // findItem – already in cart
      .mockResolvedValueOnce(makeCartRow({ quantity: 4 }));  // reload after upsert
    mockCartUpsert.mockResolvedValue([makeCartRow({ quantity: 4 })]);

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ productId: 10, quantity: 3 });

    expect(res.status).toBe(201);
    expect(res.body.quantity).toBe(4);
  });

  it("400 – missing productId", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(400);
  });

  it("400 – quantity < 1", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ productId: 10, quantity: 0 });
    expect(res.status).toBe(400);
  });

  it("404 – product not found", async () => {
    mockProductFindOne.mockResolvedValue(null);
    mockCartFindOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ productId: 999, quantity: 1 });
    expect(res.status).toBe(404);
  });

  it("409 – quantity exceeds stock", async () => {
    mockProductFindOne.mockResolvedValue(makeProductRow({ stock: 5 }));
    mockCartFindOne.mockResolvedValue(makeCartRow({ quantity: 4 }));

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ productId: 10, quantity: 3 }); // 4 existing + 3 new = 7 > 5
    expect(res.status).toBe(409);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/cart/:productId
// ──────────────────────────────────────────────────────────────────────────────

describe("PUT /api/cart/:productId", () => {
  beforeEach(() => {
    mockRoleFindOne.mockResolvedValue({ Id: TEST_COMPRADOR_ROLE_ID });
  });

  it("200 – updates quantity", async () => {
    mockProductFindOne.mockResolvedValue(makeProductRow({ stock: 50 }));
    // updateQuantity: findOne then save then reload
    mockCartFindOne
      .mockResolvedValueOnce(makeCartRow({ quantity: 2 }))   // row found
      .mockResolvedValueOnce(makeCartRow({ quantity: 5 }));  // reload
    const mockSave = jest.fn().mockResolvedValue(undefined);
    mockCartFindOne.mockResolvedValueOnce({ ...makeCartRow({ quantity: 2 }), save: mockSave });

    // Simpler: just mock the second findOne to return the updated row
    mockCartFindOne.mockReset();
    mockCartFindOne
      .mockResolvedValueOnce({ ...makeCartRow({ quantity: 2 }), save: jest.fn() })
      .mockResolvedValueOnce(makeCartRow({ quantity: 5 }));

    const res = await request(app)
      .put("/api/cart/10")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(5);
  });

  it("400 – missing quantity in body", async () => {
    const res = await request(app)
      .put("/api/cart/10")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("404 – item not in cart", async () => {
    mockProductFindOne.mockResolvedValue(makeProductRow({ stock: 50 }));
    mockCartFindOne.mockResolvedValue(null);

    const res = await request(app)
      .put("/api/cart/10")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(404);
  });

  it("409 – quantity exceeds stock", async () => {
    mockProductFindOne.mockResolvedValue(makeProductRow({ stock: 3 }));

    const res = await request(app)
      .put("/api/cart/10")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ quantity: 10 });
    expect(res.status).toBe(409);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/cart/:productId
// ──────────────────────────────────────────────────────────────────────────────

describe("DELETE /api/cart/:productId", () => {
  beforeEach(() => {
    mockRoleFindOne.mockResolvedValue({ Id: TEST_COMPRADOR_ROLE_ID });
  });

  it("204 – removes item", async () => {
    mockCartDestroy.mockResolvedValue(1); // 1 row deleted

    const res = await request(app)
      .delete("/api/cart/10")
      .set("Authorization", `Bearer ${makeToken()}`);
    expect(res.status).toBe(204);
  });

  it("404 – item not in cart", async () => {
    mockCartDestroy.mockResolvedValue(0); // nothing deleted

    const res = await request(app)
      .delete("/api/cart/10")
      .set("Authorization", `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });

  it("400 – invalid productId", async () => {
    const res = await request(app)
      .delete("/api/cart/abc")
      .set("Authorization", `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });
});
