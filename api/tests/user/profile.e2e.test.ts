/**
 * Profile E2E tests
 *
 * All HTTP requests go through the full Express stack. Sequelize model calls are
 * mocked so the tests run without a live database. A real JWT is signed using the
 * test secret so the authenticate/requireComprador middleware passes.
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

import { AspNetUser } from "../../src/infrastructure/persistence/sequelize/models/aspNetUser.model";
import { AspNetRole } from "../../src/infrastructure/persistence/sequelize/models/aspNetRole.model";

const mockFindByPk = AspNetUser.findByPk as jest.Mock;
const mockUpdate = AspNetUser.update as jest.Mock;
const mockRoleFindOne = AspNetRole.findOne as jest.Mock;

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const TEST_USER_ID = "00000000-0000-0000-0000-000000000002";
const TEST_EMAIL = "buyer2@example.com";
const JWT_SECRET = process.env.JWT_SECRET!;

function makeToken(overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    { sub: TEST_USER_ID, email: TEST_EMAIL, roleId: TEST_COMPRADOR_ROLE_ID, ...overrides },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function makeDbUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    Id: TEST_USER_ID,
    Email: TEST_EMAIL,
    NormalizedEmail: TEST_EMAIL.toUpperCase(),
    UserName: TEST_EMAIL,
    NormalizedUserName: TEST_EMAIL.toUpperCase(),
    EmailConfirmed: false,
    PasswordHash: "hashed",
    SecurityStamp: "stamp",
    ConcurrencyStamp: "concurrency",
    FullName: "Test Buyer Two",
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
// GET /api/users/profile
// ──────────────────────────────────────────────────────────────────────────────

describe("GET /api/users/profile", () => {
  beforeEach(() => {
    mockRoleFindOne.mockResolvedValue({ Id: TEST_COMPRADOR_ROLE_ID });
  });

  it("200 – returns profile for authenticated buyer", async () => {
    mockFindByPk.mockResolvedValue(makeDbUser());

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      fullName: "Test Buyer Two",
      shippingAddress: null
    });
  });

  it("200 – includes shippingAddress when set", async () => {
    mockFindByPk.mockResolvedValue(makeDbUser({ ShippingAddress: "42 Baker St" }));

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.shippingAddress).toBe("42 Baker St");
  });

  it("401 – no Authorization header", async () => {
    const res = await request(app).get("/api/users/profile");

    expect(res.status).toBe(401);
  });

  it("401 – malformed token", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", "Bearer not.a.jwt");

    expect(res.status).toBe(401);
  });

  it("403 – token has wrong role", async () => {
    const vendorToken = makeToken({ roleId: "vendor-role-id" });

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${vendorToken}`);

    expect(res.status).toBe(403);
  });

  it("404 – user in token does not exist in DB", async () => {
    mockFindByPk.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: "User not found" });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/users/profile
// ──────────────────────────────────────────────────────────────────────────────

describe("PUT /api/users/profile", () => {
  beforeEach(() => {
    mockRoleFindOne.mockResolvedValue({ Id: TEST_COMPRADOR_ROLE_ID });
  });

  it("200 – updates fullName and returns updated profile", async () => {
    const original = makeDbUser();
    const updated = makeDbUser({ FullName: "Updated Name" });
    mockFindByPk
      .mockResolvedValueOnce(original)  // existence check
      .mockResolvedValueOnce(updated);  // re-fetch after update
    mockUpdate.mockResolvedValue([1]);

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ fullName: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe("Updated Name");
  });

  it("200 – updates shippingAddress", async () => {
    const original = makeDbUser();
    const updated = makeDbUser({ ShippingAddress: "New Address 123" });
    mockFindByPk
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(updated);
    mockUpdate.mockResolvedValue([1]);

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ shippingAddress: "New Address 123" });

    expect(res.status).toBe(200);
    expect(res.body.shippingAddress).toBe("New Address 123");
  });

  it("200 – updates both fields simultaneously", async () => {
    const original = makeDbUser();
    const updated = makeDbUser({ FullName: "Full Update", ShippingAddress: "Both Fields" });
    mockFindByPk
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(updated);
    mockUpdate.mockResolvedValue([1]);

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ fullName: "Full Update", shippingAddress: "Both Fields" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      fullName: "Full Update",
      shippingAddress: "Both Fields"
    });
  });

  it("400 – rejects empty fullName string", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ fullName: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("200 – empty body accepted (no-op update)", async () => {
    const user = makeDbUser();
    mockFindByPk.mockResolvedValue(user);
    mockUpdate.mockResolvedValue([1]);

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({});

    expect(res.status).toBe(200);
  });

  it("401 – no token", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .send({ fullName: "X" });

    expect(res.status).toBe(401);
  });

  it("403 – wrong role", async () => {
    const vendorToken = makeToken({ roleId: "vendor-role-id" });

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send({ fullName: "X" });

    expect(res.status).toBe(403);
  });

  it("404 – user not found in DB", async () => {
    mockFindByPk.mockResolvedValue(null);

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ fullName: "Ghost" });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: "User not found" });
  });
});
