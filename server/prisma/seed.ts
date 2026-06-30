import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSeedAdminCredentials } from "../src/utils/adminSecurity.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const { email, password, name, syncPasswordOnUpsert } =
    resolveSeedAdminCredentials();

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: syncPasswordOnUpsert
      ? { name, password: hashedPassword }
      : {},
    create: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`[SEED] Admin user: ${admin.email} (${admin.id})`);

  // 2. Upsert default threshold configs
  const thresholds = [
    {
      sensorType: "TEMPERATURE" as const,
      minValue: 15,
      maxValue: 35,
      criticalMin: 5,
      criticalMax: 45,
      unit: "°C",
    },
    {
      sensorType: "HUMIDITY" as const,
      minValue: 30,
      maxValue: 70,
      criticalMin: 20,
      criticalMax: 90,
      unit: "%",
    },
    {
      sensorType: "PRESSURE" as const,
      minValue: 980,
      maxValue: 1040,
      criticalMin: 960,
      criticalMax: 1060,
      unit: "hPa",
    },
  ];

  for (const t of thresholds) {
    const config = await prisma.thresholdConfig.upsert({
      where: { sensorType: t.sensorType },
      update: {
        minValue: t.minValue,
        maxValue: t.maxValue,
        criticalMin: t.criticalMin,
        criticalMax: t.criticalMax,
        unit: t.unit,
      },
      create: {
        sensorType: t.sensorType,
        minValue: t.minValue,
        maxValue: t.maxValue,
        criticalMin: t.criticalMin,
        criticalMax: t.criticalMax,
        unit: t.unit,
      },
    });
    console.log(`[SEED] Threshold: ${config.sensorType} (${config.unit})`);
  }

  // 3. Upsert default devices (matching simulator)
  const devices = [
    { sensorId: "sensor01", name: "Sensor 01", floor: "floor1" },
    { sensorId: "sensor02", name: "Sensor 02", floor: "floor1" },
    { sensorId: "sensor03", name: "Sensor 03", floor: "floor2" },
    { sensorId: "sensor04", name: "Sensor 04", floor: "floor2" },
    { sensorId: "sensor05", name: "Sensor 05", floor: "floor3" },
    { sensorId: "sensor06", name: "Sensor 06", floor: "floor3" },
  ];

  const allTypes: ("TEMPERATURE" | "HUMIDITY" | "PRESSURE")[] = [
    "TEMPERATURE",
    "HUMIDITY",
    "PRESSURE",
  ];

  for (const d of devices) {
    const device = await prisma.device.upsert({
      where: { sensorId: d.sensorId },
      update: { name: d.name, floor: d.floor, types: allTypes },
      create: {
        sensorId: d.sensorId,
        name: d.name,
        floor: d.floor,
        types: allTypes,
        createdById: admin.id,
      },
    });
    console.log(`[SEED] Device: ${device.name} (${device.sensorId})`);
  }

  console.log("[SEED] Seeding complete");
}

main()
  .catch((error) => {
    console.error("[SEED] Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
