import prisma from "../config/database.js";
import type { AuditAction, AuditEntityType, Prisma } from "../generated/prisma/client.js";

interface AuditLogInput {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actorId: string;
  summary: string;
  changes?: Prisma.InputJsonValue;
}

export async function logAudit(entry: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      actorId: entry.actorId,
      summary: entry.summary,
      changes: entry.changes,
    },
  });
}

export function buildChangeSet<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: (keyof T)[]
): Prisma.InputJsonValue | undefined {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const field of fields) {
    if (before[field] !== after[field]) {
      changes[String(field)] = { from: before[field], to: after[field] };
    }
  }

  return Object.keys(changes).length > 0
    ? (changes as Prisma.InputJsonValue)
    : undefined;
}
