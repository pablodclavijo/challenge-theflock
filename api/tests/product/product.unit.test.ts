/**
 * Unit tests for ListProductsUseCase and GetProductUseCase
 *
 * The repository is fully mocked — no database, no HTTP.
 */
import { ListProductsUseCase } from "../../src/application/use-cases/product/list-products.use-case";
import { GetProductUseCase } from "../../src/application/use-cases/product/get-product.use-case";
import { IProductRepository, PaginatedResult } from "../../src/domain/repositories/product.repository";
import { Product } from "../../src/domain/entities/product";
import { NotFoundError } from "../../src/shared/errors/AppError";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "Test Product",
    description: "A great product",
    price: 49.99,
    stock: 10,
    categoryId: 2,
    categoryName: "Electronics",
    imageUrl: "https://example.com/img.png",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  };
}

function makePaginated(products: Product[], page = 1, limit = 20): PaginatedResult<Product> {
  const total = products.length;
  return {
    data: products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

function makeRepo(overrides: Partial<IProductRepository> = {}): jest.Mocked<IProductRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    ...overrides
  } as jest.Mocked<IProductRepository>;
}

// ──────────────────────────────────────────────────────────────────────────────
// ListProductsUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("ListProductsUseCase", () => {
  it("returns a paginated DTO list for existing products", async () => {
    const products = [makeProduct({ id: 1 }), makeProduct({ id: 2, name: "Other" })];
    const repo = makeRepo({ findAll: jest.fn().mockResolvedValue(makePaginated(products)) });
    const useCase = new ListProductsUseCase(repo);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(repo.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(1);
  });

  it("maps domain product fields to DTO correctly", async () => {
    const product = makeProduct({
      id: 42,
      name: "Widget",
      description: "A widget",
      price: 9.99,
      stock: 5,
      categoryId: 3,
      categoryName: "Tools",
      imageUrl: null
    });
    const repo = makeRepo({ findAll: jest.fn().mockResolvedValue(makePaginated([product])) });
    const useCase = new ListProductsUseCase(repo);

    const result = await useCase.execute({ page: 1, limit: 20 });
    const dto = result.data[0];

    expect(dto).toEqual({
      id: 42,
      name: "Widget",
      description: "A widget",
      price: 9.99,
      stock: 5,
      categoryId: 3,
      categoryName: "Tools",
      imageUrl: null,
      isActive: true
    });
  });

  it("passes all filters through to the repository", async () => {
    const repo = makeRepo({
      findAll: jest.fn().mockResolvedValue(makePaginated([], 2, 10))
    });
    const useCase = new ListProductsUseCase(repo);

    const filters = { page: 2, limit: 10, category: 5, minPrice: 10, maxPrice: 100, search: "hat" };
    await useCase.execute(filters);

    expect(repo.findAll).toHaveBeenCalledWith(filters);
  });

  it("returns an empty list when no products match", async () => {
    const repo = makeRepo({ findAll: jest.fn().mockResolvedValue(makePaginated([])) });
    const useCase = new ListProductsUseCase(repo);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it("computes totalPages correctly for partial last page", async () => {
    const products = Array.from({ length: 3 }, (_, i) => makeProduct({ id: i + 1 }));
    const paginated: PaginatedResult<Product> = {
      data: products,
      total: 23,
      page: 3,
      limit: 10,
      totalPages: 3
    };
    const repo = makeRepo({ findAll: jest.fn().mockResolvedValue(paginated) });
    const useCase = new ListProductsUseCase(repo);

    const result = await useCase.execute({ page: 3, limit: 10 });

    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(23);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GetProductUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("GetProductUseCase", () => {
  it("returns a product DTO when the product exists", async () => {
    const product = makeProduct({ id: 7, name: "Gadget", imageUrl: null });
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(product) });
    const useCase = new GetProductUseCase(repo);

    const result = await useCase.execute(7);

    expect(repo.findById).toHaveBeenCalledWith(7);
    expect(result).toEqual({
      id: 7,
      name: "Gadget",
      description: "A great product",
      price: 49.99,
      stock: 10,
      categoryId: 2,
      categoryName: "Electronics",
      imageUrl: null,
      isActive: true
    });
  });

  it("throws NotFoundError when the product does not exist", async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new GetProductUseCase(repo);

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundError);
    await expect(useCase.execute(999)).rejects.toThrow("Product not found");
  });

  it("includes categoryName when present", async () => {
    const product = makeProduct({ categoryName: "Books" });
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(product) });
    const useCase = new GetProductUseCase(repo);

    const result = await useCase.execute(product.id);

    expect(result.categoryName).toBe("Books");
  });

  it("returns undefined categoryName when category association is not loaded", async () => {
    const product = makeProduct({ categoryName: undefined });
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(product) });
    const useCase = new GetProductUseCase(repo);

    const result = await useCase.execute(product.id);

    expect(result.categoryName).toBeUndefined();
  });
});
