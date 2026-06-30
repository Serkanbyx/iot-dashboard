import jwt from "jsonwebtoken";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { protect, adminOnly } from "../src/middlewares/auth.js";
import { generateToken } from "../src/utils/generateToken.js";
import config from "../src/config/env.js";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock("../src/config/database.js", () => ({
  default: prismaMock,
}));

function createMockResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res as Response & { statusCode: number; body: unknown };
}

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateToken", () => {
    it("creates a JWT that verifies with the configured secret", () => {
      const token = generateToken("user-123");
      const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };

      expect(decoded.userId).toBe("user-123");
    });
  });

  describe("protect middleware", () => {
    it("returns 401 when no bearer token is provided", async () => {
      const req = { headers: {} } as Request;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      await protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: "Not authorized — no token provided" });
      expect(next).not.toHaveBeenCalled();
    });

    it("attaches the active user when the token is valid", async () => {
      const token = generateToken("user-123");
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-123",
        name: "Admin",
        email: "admin@iot-dashboard.com",
        role: "ADMIN",
        isActive: true,
      });

      const req = {
        headers: { authorization: `Bearer ${token}` },
      } as Request;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      await protect(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.user).toEqual({
        id: "user-123",
        name: "Admin",
        email: "admin@iot-dashboard.com",
        role: "ADMIN",
      });
    });

    it("returns 401 for inactive users", async () => {
      const token = generateToken("user-123");
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-123",
        name: "Viewer",
        email: "viewer@example.com",
        role: "VIEWER",
        isActive: false,
      });

      const req = {
        headers: { authorization: `Bearer ${token}` },
      } as Request;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      await protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        error: "Not authorized — user not found or inactive",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("adminOnly middleware", () => {
    it("returns 403 for non-admin users", () => {
      const req = {
        user: {
          id: "user-1",
          name: "Viewer",
          email: "viewer@example.com",
          role: "VIEWER" as const,
        },
      } as Request;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      adminOnly(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({ error: "Forbidden — admin access required" });
      expect(next).not.toHaveBeenCalled();
    });

    it("allows admin users to continue", () => {
      const req = {
        user: {
          id: "admin-1",
          name: "Admin",
          email: "admin@example.com",
          role: "ADMIN" as const,
        },
      } as Request;
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      adminOnly(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });
});
