import { describe, expect, it } from "vitest";
import {
  loginRules,
  registerRules,
} from "../src/validators/authValidator.js";
import { runValidationRules } from "./helpers/runValidation.js";

describe("auth validators", () => {
  describe("registerRules", () => {
    it("accepts valid registration input", async () => {
      const result = await runValidationRules(registerRules, {
        name: "Test User",
        email: "user@example.com",
        password: "secret123",
      });

      expect(result.isEmpty()).toBe(true);
    });

    it("rejects short names and passwords", async () => {
      const result = await runValidationRules(registerRules, {
        name: "A",
        email: "user@example.com",
        password: "123",
      });

      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((error) => error.path === "name")).toBe(true);
      expect(result.array().some((error) => error.path === "password")).toBe(true);
    });

    it("rejects invalid email addresses", async () => {
      const result = await runValidationRules(registerRules, {
        name: "Test User",
        email: "not-an-email",
        password: "secret123",
      });

      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((error) => error.path === "email")).toBe(true);
    });
  });

  describe("loginRules", () => {
    it("accepts valid login input", async () => {
      const result = await runValidationRules(loginRules, {
        email: "admin@iot-dashboard.com",
        password: "admin123",
      });

      expect(result.isEmpty()).toBe(true);
    });

    it("requires a password", async () => {
      const result = await runValidationRules(loginRules, {
        email: "admin@iot-dashboard.com",
        password: "",
      });

      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((error) => error.path === "password")).toBe(true);
    });
  });
});
