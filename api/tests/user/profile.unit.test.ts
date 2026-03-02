/**
 * Unit tests for GetProfileUseCase and UpdateProfileUseCase
 *
 * The repository is fully mocked — no database, no HTTP.
 */
import { GetProfileUseCase } from "../../src/application/use-cases/user/get-profile.use-case";
import { UpdateProfileUseCase } from "../../src/application/use-cases/user/update-profile.use-case";
import { IUserRepository } from "../../src/domain/repositories/user.repository";
import { User } from "../../src/domain/entities/user";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
const TEST_EMAIL = "buyer@example.com";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    normalizedEmail: TEST_EMAIL.toUpperCase(),
    userName: TEST_EMAIL,
    normalizedUserName: TEST_EMAIL.toUpperCase(),
    fullName: "Test Buyer",
    passwordHash: "hashed",
    shippingAddress: null,
    isActive: true,
    emailConfirmed: false,
    createdAt: new Date(),
    securityStamp: "stamp",
    concurrencyStamp: "concurrency",
    ...overrides
  };
}

function makeRepo(overrides: Partial<IUserRepository> = {}): jest.Mocked<IUserRepository> {
  return {
    findByNormalizedEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    assignRole: jest.fn(),
    hasRole: jest.fn(),
    update: jest.fn(),
    ...overrides
  } as jest.Mocked<IUserRepository>;
}

// ──────────────────────────────────────────────────────────────────────────────
// GetProfileUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("GetProfileUseCase", () => {
  it("returns profile data for an existing user", async () => {
    const user = makeUser({ shippingAddress: "123 Main St" });
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(user) });
    const useCase = new GetProfileUseCase(repo);

    const result = await useCase.execute(TEST_USER_ID);

    expect(repo.findById).toHaveBeenCalledWith(TEST_USER_ID);
    expect(result).toEqual({
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      fullName: "Test Buyer",
      shippingAddress: "123 Main St"
    });
  });

  it("returns null shippingAddress when not set", async () => {
    const user = makeUser({ shippingAddress: null });
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(user) });
    const useCase = new GetProfileUseCase(repo);

    const result = await useCase.execute(TEST_USER_ID);

    expect(result.shippingAddress).toBeNull();
  });

  it("throws 404 NotFoundError when user does not exist", async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new GetProfileUseCase(repo);

    await expect(useCase.execute("non-existent-id")).rejects.toMatchObject({
      statusCode: 404,
      message: "User not found"
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// UpdateProfileUseCase
// ──────────────────────────────────────────────────────────────────────────────

describe("UpdateProfileUseCase", () => {
  it("updates fullName and returns updated profile", async () => {
    const original = makeUser();
    const updated = makeUser({ fullName: "New Name" });
    const repo = makeRepo({
      findById: jest.fn()
        .mockResolvedValueOnce(original)   // existence check
        .mockResolvedValueOnce(updated),   // re-fetch after update
      update: jest.fn().mockResolvedValue(undefined)
    });
    const useCase = new UpdateProfileUseCase(repo);

    const result = await useCase.execute(TEST_USER_ID, { fullName: "New Name" });

    expect(repo.update).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ fullName: "New Name" })
    );
    expect(result.fullName).toBe("New Name");
  });

  it("updates shippingAddress and returns updated profile", async () => {
    const original = makeUser();
    const updated = makeUser({ shippingAddress: "456 New Ave" });
    const repo = makeRepo({
      findById: jest.fn()
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(updated),
      update: jest.fn().mockResolvedValue(undefined)
    });
    const useCase = new UpdateProfileUseCase(repo);

    const result = await useCase.execute(TEST_USER_ID, { shippingAddress: "456 New Ave" });

    expect(repo.update).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ shippingAddress: "456 New Ave" })
    );
    expect(result.shippingAddress).toBe("456 New Ave");
  });

  it("updates both fields at once", async () => {
    const original = makeUser();
    const updated = makeUser({ fullName: "Updated", shippingAddress: "789 Oak Rd" });
    const repo = makeRepo({
      findById: jest.fn()
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(updated),
      update: jest.fn().mockResolvedValue(undefined)
    });
    const useCase = new UpdateProfileUseCase(repo);

    const result = await useCase.execute(TEST_USER_ID, {
      fullName: "Updated",
      shippingAddress: "789 Oak Rd"
    });

    expect(repo.update).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ fullName: "Updated", shippingAddress: "789 Oak Rd" })
    );
    expect(result.fullName).toBe("Updated");
    expect(result.shippingAddress).toBe("789 Oak Rd");
  });

  it("does not send undefined fields to the repository", async () => {
    const original = makeUser();
    const updated = makeUser({ shippingAddress: "Only Address" });
    const repo = makeRepo({
      findById: jest.fn()
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(updated),
      update: jest.fn().mockResolvedValue(undefined)
    });
    const useCase = new UpdateProfileUseCase(repo);

    await useCase.execute(TEST_USER_ID, { shippingAddress: "Only Address" });

    const updateArg = (repo.update as jest.Mock).mock.calls[0][1];
    expect(updateArg).not.toHaveProperty("fullName");
    expect(updateArg).toHaveProperty("shippingAddress", "Only Address");
  });

  it("throws 404 NotFoundError when user does not exist", async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new UpdateProfileUseCase(repo);

    await expect(useCase.execute("non-existent-id", { fullName: "X" })).rejects.toMatchObject({
      statusCode: 404,
      message: "User not found"
    });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("always includes a new concurrencyStamp in the update payload", async () => {
    const original = makeUser();
    const updated = makeUser();
    const repo = makeRepo({
      findById: jest.fn()
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(updated),
      update: jest.fn().mockResolvedValue(undefined)
    });
    const useCase = new UpdateProfileUseCase(repo);

    await useCase.execute(TEST_USER_ID, { fullName: "Test" });

    const updateArg = (repo.update as jest.Mock).mock.calls[0][1];
    expect(typeof updateArg.concurrencyStamp).toBe("string");
    expect(updateArg.concurrencyStamp).not.toBe("concurrency"); // new UUID, not the old one
  });
});
