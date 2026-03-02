/**
 * Middleware tests: authenticate + requireComprador
 *
 * A minimal Express app is created inline so middleware is tested in isolation
 * without touching the real routes.
 */
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { authenticate, requireComprador } from "../../src/presentation/http/middlewares/authenticate.middleware";
import { AppError } from "../../src/shared/errors/AppError";
import { COMPRADOR_ROLE_ID } from "../../src/shared/constants";

// ──────────────────────────────────────────────────────────────────────────────
// Minimal app that exercises the middleware chain
// ──────────────────────────────────────────────────────────────────────────────

const testApp = express();
testApp.use(express.json());

// Route 1: requires a valid JWT (any role)
testApp.get("/protected", authenticate, (_req, res) => {
  res.status(200).json({ ok: true });
});

// Route 2: requires a valid JWT AND Comprador role
testApp.get("/comprador-only", authenticate, requireComprador, (_req, res) => {
  res.status(200).json({ ok: true });
});

// Error handler that mirrors the production one
// eslint-disable-next-line @typescript-eslint/no-unused-vars
testApp.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
});

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET!;
const USER_ID = "user-123";
const OTHER_ROLE_ID = "vendor-role-id";

function signToken(payload: Record<string, unknown>, expiresIn = "1h"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

// ──────────────────────────────────────────────────────────────────────────────
// authenticate middleware
// ──────────────────────────────────────────────────────────────────────────────

describe("authenticate middleware", () => {
  it("401 – no Authorization header", async () => {
    const res = await request(testApp).get("/protected");

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no token/i);
  });

  it("401 – Authorization header without Bearer prefix", async () => {
    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", "Basic somecredentials");

    expect(res.status).toBe(401);
  });

  it("401 – malformed / tampered token", async () => {
    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", "Bearer this.is.garbage");

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it("401 – expired token", async () => {
    const token = signToken(
      { sub: USER_ID, email: "x@x.com", roleId: COMPRADOR_ROLE_ID },
      "-1s" // already expired
    );

    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it("401 – token signed with the wrong secret", async () => {
    const token = jwt.sign(
      { sub: USER_ID, email: "x@x.com", roleId: COMPRADOR_ROLE_ID },
      "wrong_secret",
      { expiresIn: "1h" }
    );

    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it("200 – valid Comprador token is accepted", async () => {
    const token = signToken({ sub: USER_ID, email: "buyer@example.com", roleId: COMPRADOR_ROLE_ID });

    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("200 – valid token with any role passes authenticate", async () => {
    const token = signToken({ sub: USER_ID, email: "vendor@example.com", roleId: OTHER_ROLE_ID });

    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// requireComprador middleware
// ──────────────────────────────────────────────────────────────────────────────

describe("requireComprador middleware", () => {
  it("200 – Comprador role passes through", async () => {
    const token = signToken({ sub: USER_ID, email: "buyer@example.com", roleId: COMPRADOR_ROLE_ID });

    const res = await request(testApp)
      .get("/comprador-only")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("403 – different role is rejected", async () => {
    const token = signToken({ sub: USER_ID, email: "vendor@example.com", roleId: OTHER_ROLE_ID });

    const res = await request(testApp)
      .get("/comprador-only")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/buyers/i);
  });

  it("403 – token with no roleId is rejected", async () => {
    const token = signToken({ sub: USER_ID, email: "unknown@example.com" }); // no roleId

    const res = await request(testApp)
      .get("/comprador-only")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("401 – no token returns 401 from authenticate, not 403", async () => {
    const res = await request(testApp).get("/comprador-only");

    expect(res.status).toBe(401);
  });
});
