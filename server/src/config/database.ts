import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import config from "./env.js";

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RETENTION_DAYS = 30;

const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log("[DB] PostgreSQL connected via Prisma");

  await initSensorReadingsTable();
  await cleanupOldReadings();

  setInterval(cleanupOldReadings, CLEANUP_INTERVAL_MS);
}

async function initSensorReadingsTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      time        TIMESTAMPTZ      NOT NULL,
      sensor_id   VARCHAR(50)      NOT NULL,
      floor       VARCHAR(50)      NOT NULL,
      sensor_type VARCHAR(20)      NOT NULL,
      value       DOUBLE PRECISION NOT NULL,
      unit        VARCHAR(10)      NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_readings_time
    ON sensor_readings (time DESC);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_readings_sensor
    ON sensor_readings (sensor_id, sensor_type, time DESC);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_readings_floor
    ON sensor_readings (floor, time DESC);
  `);

  console.log("[DB] sensor_readings table and indexes ensured");
}

export async function cleanupOldReadings(): Promise<void> {
  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM sensor_readings WHERE time < NOW() - INTERVAL '${RETENTION_DAYS} days'`
  );
  console.log(`[DB] Cleanup: removed ${result} readings older than ${RETENTION_DAYS} days`);
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
  console.log("[DB] PostgreSQL disconnected");
}

export default prisma;
