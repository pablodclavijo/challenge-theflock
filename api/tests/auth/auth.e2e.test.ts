/**
 * Auth E2E tests
 *
 * All HTTP requests go through the full Express stack — routing, validation, use-cases,
 * middleware, error handler — while only Sequelize model calls are mocked so the tests
 * run without a live database.
 */
import request from "supertest";
import { app } from "../../src/presentation/http/app";
import { hashPassword } from "../../src/infrastructure/auth/aspnet-identity-hasher";
import { COMPRADOR_ROLE_ID } from "../../src/shared/constants";

// ──────────────────────────────────────────────────────────────────────────────
// Mock Sequelize models – hoisted to top by Jest before any imports are resolved
// ──────────────────────────────────────────────────────────────────────────────
jest.mock(
  "../../src/infrastructure/persistence/sequelize/models/aspNetUser.model",
  () => ({
    AspNetUser: {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      init: jest.fn()
    }
  })
);

jest.mock(
  "../../src/infrastructure/persistence/sequelize/models/aspNetUserRole.model",
  () => ({
    AspNetUserRole: {
      findOne: jest.fn(),
      create: jest.fn(),
      init: jest.fn()
    }
  })
);

// ──────────────────────────────────────────────────────────────────────────────
// Import mocks AFTER jest.mock declarations so we can configure return values
// ──────────────────────────────────────────────────────────────────────────────
import { AspNetUser } from "../../src/infrastructure/persistence/sequelize/models/aspNetUser.model";
import { AspNetUserRole } from "../../src/infrastructure/persistence/sequelize/models/aspNetUserRole.model";

const mockFindOne = AspNetUser.findOne as jest.Mock;
const mockFindByPk = AspNetUser.findByPk as jest.Mock;
const mockCreate = AspNetUser.create as jest.Mock;
const mockUserRoleFindOne = AspNetUserRole.findOne as jest.Mock;
const mockUserRoleCreate = AspNetUserRole.create as jest.Mock;

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
const TEST_EMAIL = "buyer@example.com";
const TEST_PASSWORD = "SecurePass1!";

/** Builds a mock AspNetUser row (all fields). Extra overrides accepted. */
function makeDbUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    Id: TEST_USER_ID,
    Email: TEST_EMAIL,
    NormalizedEmail: TEST_EMAIL.toUpperCase(),
    UserName: TEST_EMAIL,
    NormalizedUserName: TEST_EMAIL.toUpperCase(),
    EmailConfirmed: false,
    PasswordHash: hashPassword(TEST_PASSWORD),
    SecurityStamp: "stamp",
    ConcurrencyStamp: "concurrency",
    FullName: "Test Buyer",
    ShippingAddress: null,
    IsActive: true,
    PhoneNumber: null,
    PhoneNumberConfirmed: false,
    TwoFactorEnabled: false,
    LockoutEnd: null,
    LockoutEnabled: false,
    AccessFailedCount: 0,
    CreatedAt: new Date(),
    ...overrides
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("201 – creates account and returns JWT + user data", async () => {
    mockFindOne.mockResolvedValue(null); // no existing user
    const createdUser = makeDbUser();
    mockCreate.mockResolvedValue(createdUser);
    mockUserRoleCreate.mockResolvedValue({});

    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      fullName: "Test Buyer"
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      user: {
        email: TEST_EMAIL,
        fullName: "Test Buyer",
        shippingAddress: null
      }
    });
    expect(res.body.accessToken.split(".")).toHaveLength(3); // valid JWT structure
  });

  it("201 – shippingAddress is optional and stored when provided", async () => {
    mockFindOne.mockResolvedValue(null);
    const createdUser = makeDbUser({ ShippingAddress: "123 Test St" });
    mockCreate.mockResolvedValue(createdUser);
    mockUserRoleCreate.mockResolvedValue({});

    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      fullName: "Test Buyer",
      shippingAddress: "123 Test St"
    });

    expect(res.status).toBe(201);
    expect(res.body.user.shippingAddress).toBe("123 Test St");
  });

  it("409 – returns Conflict when email is already registered", async () => {
    mockFindOne.mockResolvedValue(makeDbUser());

    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      fullName: "Test Buyer"
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it("400 – rejects missing required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("400 – rejects invalid email format", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
      password: TEST_PASSWORD,
      fullName: "Test Buyer"
    });

    expect(res.status).toBe(400);
  });

  it("400 – rejects password shorter than 6 characters", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: "abc",
      fullName: "Test Buyer"
    });

    expect(res.status).toBe(400);
  });

  it("400 – rejects empty fullName", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      fullName: ""
    });

    expect(res.status).toBe(400);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("200 – returns JWT and user info for valid Comprador credentials", async () => {
    mockFindOne.mockResolvedValue(makeDbUser());
    mockUserRoleFindOne.mockResolvedValue({ UserId: TEST_USER_ID, RoleId: COMPRADOR_ROLE_ID });

    const res = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      user: {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        fullName: "Test Buyer"
      }
    });
  });

  it("401 – rejects wrong password", async () => {
    mockFindOne.mockResolvedValue(makeDbUser());

    const res = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: "WrongPassword!"
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it("401 – rejects unknown email", async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: TEST_PASSWORD
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it("403 – rejects disabled account (IsActive = false)", async () => {
    mockFindOne.mockResolvedValue(makeDbUser({ IsActive: false }));

    const res = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/disabled/i);
  });

  it("403 – rejects user without the Comprador role", async () => {
    mockFindOne.mockResolvedValue(makeDbUser());
    mockUserRoleFindOne.mockResolvedValue(null); // not in AspNetUserRoles

    const res = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/buyers/i);
  });

  it("400 – rejects missing body fields", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
  });

  it("400 – rejects invalid email format", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "badformat",
      password: TEST_PASSWORD
    });

    expect(res.status).toBe(400);
  });
});
