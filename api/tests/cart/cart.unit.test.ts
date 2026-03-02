/**
 * Unit tests for Cart use-cases
 *
 * All repositories are fully mocked — no database, no HTTP.
 */
import { GetCartUseCase } from "../../src/application/use-cases/cart/get-cart.use-case";
import { AddToCartUseCase } from "../../src/application/use-cases/cart/add-to-cart.use-case";
import { UpdateCartItemUseCase } from "../../src/application/use-cases/cart/update-cart-item.use-case";
import { RemoveCartItemUseCase } from "../../src/application/use-cases/cart/remove-cart-item.use-case";
import { ICartRepository } from "../../src/domain/repositories/cart.repository";
import { IProductRepository } from "../../src/domain/repositories/product.repository";
import { CartItem } from "../../src/domain/entities/cart-item";
import { Product } from "../../src/domain/entities/product";
import { AppError, NotFoundError } from "../../src/shared/errors/AppError";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const USER_ID = "user-001";

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 1,
    userId: USER_ID,
    productId: 10,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    productName: "Widget",
    productPrice: 25.0,
    productStock: 100,
    productImageUrl: null,
    ...overrides
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
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

function makeProductRepo(
  overrides: Partial<IProductRepository> = {}
): jest.Mocked<IProductRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    ...overrides
  } as jest.Mocked<IProductRepository>;
}

// ──────────────────────────────────────────────────────────────────────────────
// GetCartUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("GetCartUseCase", () => {
  it("returns empty cart when no items", async () => {
    const cartRepo = makeCartRepo({ findByUserId: jest.fn().mockResolvedValue([]) });
    const useCase = new GetCartUseCase(cartRepo);

    const result = await useCase.execute(USER_ID);

    expect(result.items).toHaveLength(0);
    expect(result.subtotal).toBe(0);
  });

  it("computes lineTotals and subtotal correctly", async () => {
    const items = [
      makeCartItem({ productId: 10, productPrice: 25.0, quantity: 2 }),
      makeCartItem({ id: 2, productId: 11, productPrice: 10.5, quantity: 3 })
    ];
    const cartRepo = makeCartRepo({ findByUserId: jest.fn().mockResolvedValue(items) });
    const useCase = new GetCartUseCase(cartRepo);

    const result = await useCase.execute(USER_ID);

    expect(result.items[0].lineTotal).toBe(50.0);
    expect(result.items[1].lineTotal).toBe(31.5);
    expect(result.subtotal).toBe(81.5);
  });

  it("defaults productName to 'Unknown' when not hydrated", async () => {
    const item = makeCartItem({ productName: undefined });
    const cartRepo = makeCartRepo({ findByUserId: jest.fn().mockResolvedValue([item]) });
    const useCase = new GetCartUseCase(cartRepo);

    const result = await useCase.execute(USER_ID);
    expect(result.items[0].productName).toBe("Unknown");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// AddToCartUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("AddToCartUseCase", () => {
  it("adds new item when cart is empty", async () => {
    const product = makeProduct();
    const cartRepo = makeCartRepo({
      findItem: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(makeCartItem({ quantity: 3 }))
    });
    const productRepo = makeProductRepo({ findById: jest.fn().mockResolvedValue(product) });
    const useCase = new AddToCartUseCase(cartRepo, productRepo);

    const result = await useCase.execute(USER_ID, 10, 3);

    expect(cartRepo.upsert).toHaveBeenCalledWith(USER_ID, 10, 3);
    expect(result.quantity).toBe(3);
  });

  it("upserts (adds to existing) when item already in cart", async () => {
    const product = makeProduct({ stock: 100 });
    const cartRepo = makeCartRepo({
      findItem: jest.fn().mockResolvedValue(makeCartItem({ quantity: 2 })),
      upsert: jest.fn().mockResolvedValue(makeCartItem({ quantity: 5 }))
    });
    const productRepo = makeProductRepo({ findById: jest.fn().mockResolvedValue(product) });
    const useCase = new AddToCartUseCase(cartRepo, productRepo);

    const result = await useCase.execute(USER_ID, 10, 3); // existing 2 + new 3 = 5

    expect(cartRepo.upsert).toHaveBeenCalledWith(USER_ID, 10, 5);
    expect(result.quantity).toBe(5);
  });

  it("throws 404 when product does not exist", async () => {
    const cartRepo = makeCartRepo({ findItem: jest.fn().mockResolvedValue(null) });
    const productRepo = makeProductRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new AddToCartUseCase(cartRepo, productRepo);

    await expect(useCase.execute(USER_ID, 99, 1)).rejects.toThrow(NotFoundError);
  });

  it("throws 409 when requested quantity exceeds stock", async () => {
    const product = makeProduct({ stock: 5 });
    const cartRepo = makeCartRepo({
      findItem: jest.fn().mockResolvedValue(makeCartItem({ quantity: 4 })),
      upsert: jest.fn()
    });
    const productRepo = makeProductRepo({ findById: jest.fn().mockResolvedValue(product) });
    const useCase = new AddToCartUseCase(cartRepo, productRepo);

    await expect(useCase.execute(USER_ID, 10, 3)).rejects.toThrow(AppError);
    await expect(useCase.execute(USER_ID, 10, 3)).rejects.toMatchObject({ statusCode: 409 });
    expect(cartRepo.upsert).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// UpdateCartItemUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("UpdateCartItemUseCase", () => {
  it("updates quantity and returns updated item", async () => {
    const product = makeProduct({ stock: 50 });
    const updatedItem = makeCartItem({ quantity: 10 });
    const cartRepo = makeCartRepo({ updateQuantity: jest.fn().mockResolvedValue(updatedItem) });
    const productRepo = makeProductRepo({ findById: jest.fn().mockResolvedValue(product) });
    const useCase = new UpdateCartItemUseCase(cartRepo, productRepo);

    const result = await useCase.execute(USER_ID, 10, 10);

    expect(cartRepo.updateQuantity).toHaveBeenCalledWith(USER_ID, 10, 10);
    expect(result.quantity).toBe(10);
    expect(result.lineTotal).toBe(250.0);
  });

  it("throws 409 when quantity exceeds stock", async () => {
    const product = makeProduct({ stock: 5 });
    const cartRepo = makeCartRepo({ updateQuantity: jest.fn() });
    const productRepo = makeProductRepo({ findById: jest.fn().mockResolvedValue(product) });
    const useCase = new UpdateCartItemUseCase(cartRepo, productRepo);

    await expect(useCase.execute(USER_ID, 10, 10)).rejects.toMatchObject({ statusCode: 409 });
    expect(cartRepo.updateQuantity).not.toHaveBeenCalled();
  });

  it("throws 404 when cart item does not exist", async () => {
    const product = makeProduct({ stock: 100 });
    const cartRepo = makeCartRepo({ updateQuantity: jest.fn().mockResolvedValue(null) });
    const productRepo = makeProductRepo({ findById: jest.fn().mockResolvedValue(product) });
    const useCase = new UpdateCartItemUseCase(cartRepo, productRepo);

    await expect(useCase.execute(USER_ID, 10, 2)).rejects.toThrow(NotFoundError);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// RemoveCartItemUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("RemoveCartItemUseCase", () => {
  it("removes item successfully", async () => {
    const cartRepo = makeCartRepo({ removeItem: jest.fn().mockResolvedValue(true) });
    const useCase = new RemoveCartItemUseCase(cartRepo);

    await expect(useCase.execute(USER_ID, 10)).resolves.toBeUndefined();
    expect(cartRepo.removeItem).toHaveBeenCalledWith(USER_ID, 10);
  });

  it("throws 404 when item not in cart", async () => {
    const cartRepo = makeCartRepo({ removeItem: jest.fn().mockResolvedValue(false) });
    const useCase = new RemoveCartItemUseCase(cartRepo);

    await expect(useCase.execute(USER_ID, 99)).rejects.toThrow(NotFoundError);
  });
});
