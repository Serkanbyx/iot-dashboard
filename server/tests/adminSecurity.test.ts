import { afterEach, describe, expect, it } from "vitest";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  resolveSeedAdminCredentials,
} from "../src/utils/adminSecurity.js";

const originalNodeEnv = process.env.NODE_ENV;
const originalSeedEmail = process.env.SEED_ADMIN_EMAIL;
const originalSeedPassword = process.env.SEED_ADMIN_PASSWORD;

function restoreEnv(): void {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalSeedEmail === undefined) {
    delete process.env.SEED_ADMIN_EMAIL;
  } else {
    process.env.SEED_ADMIN_EMAIL = originalSeedEmail;
  }
  if (originalSeedPassword === undefined) {
    delete process.env.SEED_ADMIN_PASSWORD;
  } else {
    process.env.SEED_ADMIN_PASSWORD = originalSeedPassword;
  }
}

describe("resolveSeedAdminCredentials", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("uses demo defaults in development when env is unset", () => {
    process.env.NODE_ENV = "development";
    delete process.env.SEED_ADMIN_EMAIL;
    delete process.env.SEED_ADMIN_PASSWORD;

    expect(resolveSeedAdminCredentials()).toEqual({
      email: DEMO_ADMIN_EMAIL,
      password: DEMO_ADMIN_PASSWORD,
      name: "Admin",
      syncPasswordOnUpsert: false,
    });
  });

  it("requires env credentials in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.SEED_ADMIN_EMAIL;
    delete process.env.SEED_ADMIN_PASSWORD;

    expect(() => resolveSeedAdminCredentials()).toThrow(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required"
    );
  });

  it("rejects the default demo password in production", () => {
    process.env.NODE_ENV = "production";
    process.env.SEED_ADMIN_EMAIL = "ops@example.com";
    process.env.SEED_ADMIN_PASSWORD = DEMO_ADMIN_PASSWORD;

    expect(() => resolveSeedAdminCredentials()).toThrow(
      "cannot be the default demo password"
    );
  });

  it("accepts custom credentials in production", () => {
    process.env.NODE_ENV = "production";
    process.env.SEED_ADMIN_EMAIL = "ops@example.com";
    process.env.SEED_ADMIN_PASSWORD = "strong-production-password";

    expect(resolveSeedAdminCredentials()).toEqual({
      email: "ops@example.com",
      password: "strong-production-password",
      name: "Admin",
      syncPasswordOnUpsert: true,
    });
  });
});
