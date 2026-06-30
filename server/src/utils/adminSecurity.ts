import bcrypt from "bcryptjs";
import prisma from "../config/database.js";

export const DEMO_ADMIN_EMAIL = "admin@iot-dashboard.com";
export const DEMO_ADMIN_PASSWORD = "admin123";
export const MIN_SEED_ADMIN_PASSWORD_LENGTH = 8;

export function resolveSeedAdminCredentials(): {
  email: string;
  password: string;
  name: string;
  syncPasswordOnUpsert: boolean;
} {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";

  const email =
    process.env.SEED_ADMIN_EMAIL?.trim() ||
    (isProduction ? "" : DEMO_ADMIN_EMAIL);
  const password =
    process.env.SEED_ADMIN_PASSWORD ||
    (isProduction ? "" : DEMO_ADMIN_PASSWORD);
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Admin";

  if (isProduction) {
    if (!email || !password) {
      throw new Error(
        "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required when NODE_ENV=production"
      );
    }

    if (password.length < MIN_SEED_ADMIN_PASSWORD_LENGTH) {
      throw new Error(
        `SEED_ADMIN_PASSWORD must be at least ${MIN_SEED_ADMIN_PASSWORD_LENGTH} characters in production`
      );
    }

    if (password === DEMO_ADMIN_PASSWORD) {
      throw new Error(
        "SEED_ADMIN_PASSWORD cannot be the default demo password in production"
      );
    }
  }

  return {
    email,
    password,
    name,
    syncPasswordOnUpsert: isProduction,
  };
}

export async function assertProductionAdminSecurity(
  nodeEnv: string
): Promise<void> {
  if (nodeEnv !== "production") return;

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", isActive: true },
    select: { email: true, password: true },
  });

  if (!admin) return;

  const usesDefaultPassword = await bcrypt.compare(
    DEMO_ADMIN_PASSWORD,
    admin.password
  );

  if (usesDefaultPassword) {
    throw new Error(
      "[SECURITY] Admin account uses the default demo password in production. " +
        "Re-run seed with SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, or update the password."
    );
  }
}
