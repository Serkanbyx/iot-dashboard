import crypto from "node:crypto";
import prisma from "../config/database.js";
import config from "../config/env.js";

const REFRESH_TOKEN_BYTES = 40;

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + parseDurationToMs(config.JWT_REFRESH_EXPIRES_IN)
  );

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

export async function rotateRefreshToken(
  rawToken: string
): Promise<{ userId: string; refreshToken: string } | null> {
  const tokenHash = hashToken(rawToken);

  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, isActive: true } } },
  });

  if (!existing || !existing.user.isActive || existing.expiresAt < new Date()) {
    if (existing) {
      await prisma.refreshToken.delete({ where: { id: existing.id } });
    }
    return null;
  }

  await prisma.refreshToken.delete({ where: { id: existing.id } });
  const refreshToken = await createRefreshToken(existing.userId);

  return { userId: existing.userId, refreshToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function cleanupExpiredRefreshTokens(): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
