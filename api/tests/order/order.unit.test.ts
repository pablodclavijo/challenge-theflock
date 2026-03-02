/**
 * Unit tests for Order use-cases
 *
 * Focuses on:
 *  – CheckoutUseCase: total / tax calculation
 *  – ProcessPaymentUseCase: status update logic
 *  – MockPaymentService: 4-approve / 1-reject cycle
 */
import { CheckoutUseCase, TAX_RATE } from "../../src/application/use-cases/order/checkout.use-case";
import { ProcessPaymentUseCase } from "../../src/application/use-cases/order/process-payment.use-case";
import { ListOrdersUseCase } from "../../src/application/use-cases/order/list-orders.use-case";
import { GetOrderUseCase } from "../../src/application/use-cases/order/get-order.use-case";
import { MockPaymentService } from "../../src/infrastructure/services/mock-payment.service";
import { ICartRepository } from "../../src/domain/repositories/cart.repository";
import { IOrderRepository } from "../../src/domain/repositories/order.repository";
import { CartItem } from "../../src/domain/entities/cart-item";
import { Order } from "../../src/domain/entities/order";
import { OrderStatus } from "../../src/domain/enums/order-status";
import { AppError, NotFoundError } from "../../src/shared/errors/AppError";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const USER_ID = "user-001";
const SHIPPING = "123 Main St";

function makeCartItem(price: number, qty: number, productId = 10): CartItem {
  return {
    id: productId,
    userId: USER_ID,
    productId,
    quantity: qty,
    createdAt: new Date(),
    updatedAt: new Date(),
    productName: `Product ${productId}`,
    productPrice: price,
    productStock: 100,
    productImageUrl: null
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
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
    items: [],
    ...overrides
  };
}

function makeCartRepo(
  overrides: Partial<ICartRepository> = {}
): jest.Mocked<ICartRepository> {
  return {
    findByUserId: jest.fn(),
    findItem: jest.fn(),
    upsert: jest.fn(),
    updateQuantity: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    ...overrides
  } as jest.Mocked<ICartRepository>;
}

function makeOrderRepo(
  overrides: Partial<IOrderRepository> = {}
): jest.Mocked<IOrderRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    updateStatus: jest.fn(),
    ...overrides
  } as jest.Mocked<IOrderRepository>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Tax/total calculation (CheckoutUseCase)
// ──────────────────────────────────────────────────────────────────────────────

describe("CheckoutUseCase – tax and total calculations", () => {
  it("TAX_RATE constant is 21%", () => {
    expect(TAX_RATE).toBe(0.21);
  });

  it("calculates subtotal, tax and total correctly for a single item", async () => {
    // price=50, qty=2  → subtotal=100, tax=21, total=121
    const cartItems = [makeCartItem(50, 2, 10)];
    const expectedSubtotal = 100;
    const expectedTax = parseFloat((expectedSubtotal * TAX_RATE).toFixed(2));
    const expectedTotal = parseFloat((expectedSubtotal + expectedTax).toFixed(2));

    let capturedInput: Parameters<IOrderRepository["create"]>[0] | undefined;
    const orderRepo = makeOrderRepo({
      create: jest.fn().mockImplementation((input) => {
        capturedInput = input;
        return Promise.resolve(makeOrder({ subtotal: input.subtotal, tax: input.tax, total: input.total, items: [] }));
      })
    });
    const cartRepo = makeCartRepo({
      findByUserId: jest.fn().mockResolvedValue(cartItems),
      clearCart: jest.fn().mockResolvedValue(undefined)
    });

    await new CheckoutUseCase(cartRepo, orderRepo).execute(USER_ID, SHIPPING);

    expect(capturedInput!.subtotal).toBe(expectedSubtotal);
    expect(capturedInput!.tax).toBe(expectedTax);
    expect(capturedInput!.total).toBe(expectedTotal);
  });

  it("calculates correctly for multiple items with different prices", async () => {
    // item1: price=19.99 qty=3 → 59.97
    // item2: price=5.50 qty=4  → 22.00
    // subtotal = 81.97, tax = 17.21, total = 99.18
    const cartItems = [makeCartItem(19.99, 3, 10), makeCartItem(5.5, 4, 11)];
    const expectedSubtotal = parseFloat((19.99 * 3 + 5.5 * 4).toFixed(2));
    const expectedTax = parseFloat((expectedSubtotal * 0.21).toFixed(2));
    const expectedTotal = parseFloat((expectedSubtotal + expectedTax).toFixed(2));

    let capturedInput: Parameters<IOrderRepository["create"]>[0] | undefined;
    const orderRepo = makeOrderRepo({
      create: jest.fn().mockImplementation((input) => {
        capturedInput = input;
        return Promise.resolve(makeOrder({ subtotal: input.subtotal, tax: input.tax, total: input.total, items: [] }));
      })
    });
    const cartRepo = makeCartRepo({
      findByUserId: jest.fn().mockResolvedValue(cartItems),
      clearCart: jest.fn().mockResolvedValue(undefined)
    });

    await new CheckoutUseCase(cartRepo, orderRepo).execute(USER_ID, SHIPPING);

    expect(capturedInput!.subtotal).toBe(expectedSubtotal);
    expect(capturedInput!.tax).toBe(expectedTax);
    expect(capturedInput!.total).toBe(expectedTotal);
  });

  it("creates order items with price snapshots matching cart state", async () => {
    const cartItems = [makeCartItem(29.99, 2, 10)];
    let capturedInput: Parameters<IOrderRepository["create"]>[0] | undefined;
    const orderRepo = makeOrderRepo({
      create: jest.fn().mockImplementation((input) => {
        capturedInput = input;
        return Promise.resolve(makeOrder({ items: [] }));
      })
    });
    const cartRepo = makeCartRepo({
      findByUserId: jest.fn().mockResolvedValue(cartItems),
      clearCart: jest.fn()
    });

    await new CheckoutUseCase(cartRepo, orderRepo).execute(USER_ID, SHIPPING);

    expect(capturedInput!.items).toHaveLength(1);
    expect(capturedInput!.items[0].unitPriceSnapshot).toBe(29.99);
    expect(capturedInput!.items[0].quantity).toBe(2);
    expect(capturedInput!.items[0].lineTotal).toBe(59.98);
  });

  it("throws 400 when cart is empty", async () => {
    const cartRepo = makeCartRepo({ findByUserId: jest.fn().mockResolvedValue([]) });
    const orderRepo = makeOrderRepo();
    const useCase = new CheckoutUseCase(cartRepo, orderRepo);

    await expect(useCase.execute(USER_ID, SHIPPING)).rejects.toThrow(AppError);
    await expect(useCase.execute(USER_ID, SHIPPING)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("clears the cart after successful checkout", async () => {
    const cartRepo = makeCartRepo({
      findByUserId: jest.fn().mockResolvedValue([makeCartItem(10, 1)]),
      clearCart: jest.fn().mockResolvedValue(undefined)
    });
    const orderRepo = makeOrderRepo({
      create: jest.fn().mockResolvedValue(makeOrder({ items: [] }))
    });

    await new CheckoutUseCase(cartRepo, orderRepo).execute(USER_ID, SHIPPING);

    expect(cartRepo.clearCart).toHaveBeenCalledWith(USER_ID);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// MockPaymentService – 4-approve / 1-reject cycle
// ──────────────────────────────────────────────────────────────────────────────

describe("MockPaymentService", () => {
  it("approves first 4 calls and rejects the 5th", async () => {
    const svc = new MockPaymentService();
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => svc.processPayment(i + 1, 100))
    );

    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);
    expect(results[3].success).toBe(true);
    expect(results[4].success).toBe(false); // 5th call rejected
  });

  it("cycles: 6th call is approved again", async () => {
    const svc = new MockPaymentService();
    for (let i = 0; i < 5; i++) await svc.processPayment(i, 50);
    const sixth = await svc.processPayment(6, 50);
    expect(sixth.success).toBe(true);
  });

  it("rejected payment contains a transactionId and message", async () => {
    const svc = new MockPaymentService();
    // skip to 5th
    for (let i = 0; i < 4; i++) await svc.processPayment(i, 50);
    const result = await svc.processPayment(5, 50);
    expect(result.success).toBe(false);
    expect(result.transactionId).toMatch(/txn_rejected/);
    expect(result.message).toBeTruthy();
  });

  it("reset() restarts the cycle", async () => {
    const svc = new MockPaymentService();
    for (let i = 0; i < 5; i++) await svc.processPayment(i, 50);
    svc.reset();
    const first = await svc.processPayment(1, 50);
    expect(first.success).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ProcessPaymentUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("ProcessPaymentUseCase", () => {
  it("marks order as Paid on successful payment", async () => {
    const order = makeOrder({ id: 1, userId: USER_ID, total: 121 });
    const orderRepo = makeOrderRepo({
      findById: jest.fn().mockResolvedValue(order),
      updateStatus: jest.fn().mockResolvedValue(undefined)
    });
    const paymentSvc = { processPayment: jest.fn().mockResolvedValue({ success: true, transactionId: "txn_1", message: "Approved" }) };
    const useCase = new ProcessPaymentUseCase(orderRepo, paymentSvc);

    const result = await useCase.execute(USER_ID, 1);

    expect(orderRepo.updateStatus).toHaveBeenCalledWith(1, OrderStatus.Paid);
    expect(result.status).toBe(OrderStatus.Paid);
  });

  it("marks order as PaymentFailed on rejected payment", async () => {
    const order = makeOrder({ id: 1, userId: USER_ID, total: 121 });
    const orderRepo = makeOrderRepo({
      findById: jest.fn().mockResolvedValue(order),
      updateStatus: jest.fn().mockResolvedValue(undefined)
    });
    const paymentSvc = { processPayment: jest.fn().mockResolvedValue({ success: false, transactionId: "txn_2", message: "Declined" }) };
    const useCase = new ProcessPaymentUseCase(orderRepo, paymentSvc);

    const result = await useCase.execute(USER_ID, 1);

    expect(orderRepo.updateStatus).toHaveBeenCalledWith(1, OrderStatus.PaymentFailed);
    expect(result.status).toBe(OrderStatus.PaymentFailed);
  });

  it("throws 404 when order belongs to different user", async () => {
    const order = makeOrder({ id: 1, userId: "other-user" });
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(order) });
    const paymentSvc = { processPayment: jest.fn() };
    const useCase = new ProcessPaymentUseCase(orderRepo, paymentSvc);

    await expect(useCase.execute(USER_ID, 1)).rejects.toThrow(NotFoundError);
    expect(paymentSvc.processPayment).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GetOrderUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("GetOrderUseCase", () => {
  it("returns order detail for the owning user", async () => {
    const order = makeOrder({ items: [] });
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(order) });
    const useCase = new GetOrderUseCase(orderRepo);

    const result = await useCase.execute(USER_ID, 1);

    expect(result.id).toBe(1);
    expect(result.subtotal).toBe(100);
  });

  it("throws 404 for non-existent order", async () => {
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new GetOrderUseCase(orderRepo);

    await expect(useCase.execute(USER_ID, 999)).rejects.toThrow(NotFoundError);
  });

  it("throws 404 when order belongs to a different user", async () => {
    const order = makeOrder({ userId: "other-user" });
    const orderRepo = makeOrderRepo({ findById: jest.fn().mockResolvedValue(order) });
    const useCase = new GetOrderUseCase(orderRepo);

    await expect(useCase.execute(USER_ID, 1)).rejects.toThrow(NotFoundError);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ListOrdersUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("ListOrdersUseCase", () => {
  it("returns paginated orders for the user", async () => {
    const orders = [makeOrder({ id: 1 }), makeOrder({ id: 2 })];
    const orderRepo = makeOrderRepo({
      findByUserId: jest.fn().mockResolvedValue({ data: orders, total: 2, page: 1, limit: 10, totalPages: 1 })
    });
    const useCase = new ListOrdersUseCase(orderRepo);

    const result = await useCase.execute(USER_ID, { page: 1, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
  });
});
