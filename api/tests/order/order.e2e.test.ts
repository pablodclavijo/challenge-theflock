/**
 * Order E2E tests
 *
 * All HTTP requests go through the full Express stack. Sequelize model calls
 * and the payment service are mocked so the tests run without a live database.
 */
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../src/presentation/http/app";
import { OrderStatus } from "../../src/domain/enums/order-status";

// Test constants
const TEST_COMPRADOR_ROLE_ID = "test-comprador-role-id";

// ──────────────────────────────────────────────────────────────────────────────
// Mock Sequelize database (needed for SequelizeOrderRepository.create transaction)
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
  "../../src/infrastructure/persistence/sequelize/models/order.model",
  () => ({
    Order: {
      create: jest.fn(),
      findByPk: jest.fn(),
      findAndCountAll: jest.fn(),
      update: jest.fn(),
      init: jest.fn()
    }
  })
);

jest.mock(
  "../../src/infrastructure/persistence/sequelize/models/orderItem.model",
  () => ({
    OrderItem: {
      bulkCreate: jest.fn(),
      init: jest.fn()
    }
  })
);

jest.mock(
  "../../src/infrastructure/persistence/sequelize/models/product.model",
  () => ({
    Product: {
      decrement: jest.fn(),
      sequelize: {
        transaction: jest.fn(() => Promise.resolve({
          commit: jest.fn(),
          rollback: jest.fn()
        }))
      },
      init: jest.fn()
    }
  })
);

// ──────────────────────────────────────────────────────────────────────────────
// Mock payment service
// ──────────────────────────────────────────────────────────────────────────────

jest.mock("../../src/infrastructure/services/mock-payment.service", () => ({
  MockPaymentService: jest.fn().mockImplementation(() => ({
    processPayment: jest.fn()
  }))
}));

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
import { Order } from "../../src/infrastructure/persistence/sequelize/models/order.model";
import { OrderItem } from "../../src/infrastructure/persistence/sequelize/models/orderItem.model";
import { Product } from "../../src/infrastructure/persistence/sequelize/models/product.model";
import { MockPaymentService } from "../../src/infrastructure/services/mock-payment.service";
import { AspNetRole } from "../../src/infrastructure/persistence/sequelize/models/aspNetRole.model";

const mockCartFindAll = CartItem.findAll as jest.Mock;
const mockRoleFindOne = AspNetRole.findOne as jest.Mock;
const mockCartDestroy = CartItem.destroy as jest.Mock;
const mockOrderCreate = Order.create as jest.Mock;
const mockOrderFindByPk = Order.findByPk as jest.Mock;
const mockOrderFindAndCount = Order.findAndCountAll as jest.Mock;
const mockOrderUpdate = Order.update as jest.Mock;
const mockOrderItemBulkCreate = OrderItem.bulkCreate as jest.Mock;
const mockProductDecrement = Product.decrement as jest.Mock;

// The order controller creates one MockPaymentService instance at module load time.
// Capture the processPayment mock fn via mock.results before clearMocks runs.
let mockProcessPayment: jest.Mock;

beforeAll(() => {
  const ctor = MockPaymentService as unknown as jest.Mock;
  // mock.results[0].value is the object returned by the factory (`{ processPayment: jest.fn() }`)
  mockProcessPayment = (ctor.mock.results[0]?.value as { processPayment: jest.Mock })?.processPayment;
});

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const USER_ID = "00000000-0000-0000-0000-000000000020";
const JWT_SECRET = process.env.JWT_SECRET!;
const SHIPPING = "42 Elm Street";

function makeToken(overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    { sub: USER_ID, email: "buyer@order.test", roleId: TEST_COMPRADOR_ROLE_ID, ...overrides },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function makeCartRow(productPrice = 50, quantity = 2): Record<string, unknown> {
  return {
    id: 1,
    userId: USER_ID,
    productId: 10,
    quantity,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: { id: 10, name: "Widget", price: productPrice, stock: 100, imageUrl: null }
  };
}

function makeOrderRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    userId: USER_ID,
    status: OrderStatus.Pending,
    subtotal: 100,
    tax: 21,
    total: 121,
    shippingAddress: SHIPPING,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function makeOrderItemRow(orderId = 1): Record<string, unknown> {
  return {
    id: 1,
    orderId,
    productId: 10,
    productNameSnapshot: "Widget",
    unitPriceSnapshot: 50,
    quantity: 2,
    lineTotal: 100
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/orders (checkout)
// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/orders", () => {
  beforeEach(() => {
    mockRoleFindOne.mockResolvedValue({ Id: TEST_COMPRADOR_ROLE_ID });
  });

  it("201 – creates order from cart; subtotal/tax/total correct", async () => {
    // Cart has 2 × $50 = $100 subtotal
    mockCartFindAll.mockResolvedValue([makeCartRow(50, 2)]);
    mockOrderCreate.mockResolvedValue(makeOrderRow({ id: 1 }));
    mockOrderItemBulkCreate.mockResolvedValue([makeOrderItemRow()]);
    mockCartDestroy.mockResolvedValue(1);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ shippingAddress: SHIPPING });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 1,
      subtotal: 100,
      tax: 21,
      total: 121,
      shippingAddress: SHIPPING,
      status: OrderStatus.Pending
    });
  });

  it("400 – empty cart", async () => {
    mockCartFindAll.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ shippingAddress: SHIPPING });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
  });

  it("400 – missing shippingAddress", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("401 – no token", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ shippingAddress: SHIPPING });
    expect(res.status).toBe(401);
  });

  it("403 – wrong role", async () => {
    const vendorToken = makeToken({ roleId: "vendor-role" });
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({ shippingAddress: SHIPPING });
    expect(res.status).toBe(403);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/orders
// ──────────────────────────────────────────────────────────────────────────────

describe("GET /api/orders", () => {
  beforeEach(() => {
    mockRoleFindOne.mockResolvedValue({ Id: TEST_COMPRADOR_ROLE_ID });
  });

  it("200 – returns paginated order list", async () => {
    mockOrderFindAndCount.mockResolvedValue({
      count: 2,
      rows: [makeOrderRow({ id: 1 }), makeOrderRow({ id: 2 })]
    });

    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      data: expect.arrayContaining([expect.objectContaining({ id: 1 })]),
      total: 2,
      page: 1,
      totalPages: 1
    });
  });

  it("200 – respects page/limit query params", async () => {
    mockOrderFindAndCount.mockResolvedValue({ count: 0, rows: [] });

    const res = await request(app)
      .get("/api/orders?page=2&limit=5")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(5);
  });

  it("401 – no token", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id
// ──────────────────────────────────────────────────────────────────────────────

describe("GET /api/orders/:id", () => {
  beforeEach(() => {
    mockRoleFindOne.mockResolvedValue({ Id: TEST_COMPRADOR_ROLE_ID });
  });

  it("200 – returns order with items", async () => {
    const orderWithItems = { ...makeOrderRow(), items: [makeOrderItemRow()] };
    mockOrderFindByPk.mockResolvedValue(orderWithItems);

    const res = await request(app)
      .get("/api/orders/1")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      productId: 10,
      productNameSnapshot: "Widget",
      unitPriceSnapshot: 50,
      quantity: 2,
      lineTotal: 100
    });
  });

  it("404 – order not found", async () => {
    mockOrderFindByPk.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/orders/999")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  it("404 – order belongs to different user", async () => {
    mockOrderFindByPk.mockResolvedValue(makeOrderRow({ userId: "other-user" }));

    const res = await request(app)
      .get("/api/orders/1")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  it("400 – invalid order ID", async () => {
    const res = await request(app)
      .get("/api/orders/abc")
      .set("Authorization", `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/orders/:id/payment
// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/orders/:id/payment", () => {
  beforeEach(() => {
    mockRoleFindOne.mockResolvedValue({ Id: TEST_COMPRADOR_ROLE_ID });
  });
  it("200 – approved payment → status Paid", async () => {
    mockOrderFindByPk.mockResolvedValue(makeOrderRow({ total: 121 }));
    mockOrderUpdate.mockResolvedValue([1]);
    mockProcessPayment.mockResolvedValue({
      success: true,
      transactionId: "txn_approved_1",
      message: "Payment approved"
    });

    const res = await request(app)
      .post("/api/orders/1/payment")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      orderId: 1,
      status: OrderStatus.Paid,
      transactionId: "txn_approved_1"
    });
  });

  it("200 – rejected payment → status PaymentFailed", async () => {
    mockOrderFindByPk.mockResolvedValue(makeOrderRow({ total: 121 }));
    mockOrderUpdate.mockResolvedValue([1]);
    mockProcessPayment.mockResolvedValue({
      success: false,
      transactionId: "txn_rejected_1",
      message: "Payment declined by issuer"
    });

    const res = await request(app)
      .post("/api/orders/1/payment")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      orderId: 1,
      status: OrderStatus.PaymentFailed,
      transactionId: "txn_rejected_1"
    });
  });

  it("404 – order not found", async () => {
    mockOrderFindByPk.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/orders/999/payment")
      .set("Authorization", `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });

  it("404 – order belongs to different user", async () => {
    mockOrderFindByPk.mockResolvedValue(makeOrderRow({ userId: "other-user" }));

    const res = await request(app)
      .post("/api/orders/1/payment")
      .set("Authorization", `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });

  it("401 – no token", async () => {
    const res = await request(app).post("/api/orders/1/payment");
    expect(res.status).toBe(401);
  });
});
