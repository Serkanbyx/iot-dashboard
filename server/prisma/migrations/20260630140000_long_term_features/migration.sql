-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('DEVICE', 'THRESHOLD', 'USER');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable RefreshToken
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorId" TEXT NOT NULL,
    "summary" VARCHAR(255) NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- ThresholdConfig: add per-device support
ALTER TABLE "ThresholdConfig" ADD COLUMN "sensorId" VARCHAR(50) NOT NULL DEFAULT '';
DROP INDEX IF EXISTS "ThresholdConfig_sensorType_key";
CREATE UNIQUE INDEX "ThresholdConfig_sensorType_sensorId_key" ON "ThresholdConfig"("sensorType", "sensorId");
CREATE INDEX "ThresholdConfig_sensorId_idx" ON "ThresholdConfig"("sensorId");

-- RefreshToken indexes & FK
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AuditLog indexes & FK
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- TimescaleDB (optional — ignored if extension unavailable)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'TimescaleDB extension not available, skipping hypertable setup';
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    IF NOT EXISTS (
      SELECT 1 FROM timescaledb_information.hypertables
      WHERE hypertable_name = 'sensor_readings'
    ) THEN
      PERFORM create_hypertable('sensor_readings', 'time', if_not_exists => TRUE);
    END IF;
    PERFORM add_retention_policy('sensor_readings', INTERVAL '30 days', if_not_exists => TRUE);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'TimescaleDB hypertable setup skipped: %', SQLERRM;
END $$;
