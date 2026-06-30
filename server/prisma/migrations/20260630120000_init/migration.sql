-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('TEMPERATURE', 'HUMIDITY', 'PRESSURE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('ABOVE', 'BELOW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThresholdConfig" (
    "id" TEXT NOT NULL,
    "sensorType" "SensorType" NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "criticalMin" DOUBLE PRECISION NOT NULL,
    "criticalMax" DOUBLE PRECISION NOT NULL,
    "unit" VARCHAR(10) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThresholdConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "sensorId" VARCHAR(50) NOT NULL,
    "floor" VARCHAR(50) NOT NULL,
    "sensorType" "SensorType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "severity" "Severity" NOT NULL,
    "direction" "Direction" NOT NULL,
    "message" VARCHAR(200) NOT NULL,
    "isAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedById" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgeNote" VARCHAR(500),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "sensorId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "floor" VARCHAR(50) NOT NULL,
    "types" "SensorType"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ThresholdConfig_sensorType_key" ON "ThresholdConfig"("sensorType");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Alert_sensorId_sensorType_isAcknowledged_idx" ON "Alert"("sensorId", "sensorType", "isAcknowledged");

-- CreateIndex
CREATE INDEX "Alert_isAcknowledged_severity_idx" ON "Alert"("isAcknowledged", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "Device_sensorId_key" ON "Device"("sensorId");

-- CreateIndex
CREATE INDEX "Device_floor_idx" ON "Device"("floor");

-- CreateIndex
CREATE INDEX "Device_isActive_idx" ON "Device"("isActive");

-- AddForeignKey
ALTER TABLE "ThresholdConfig" ADD CONSTRAINT "ThresholdConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
