/**
 * Production DB deploy helper for Render / Neon.
 *
 * - Fresh DB or migration-tracked DB → `prisma migrate deploy`
 * - Legacy DB (created via db push, no _prisma_migrations) → `db push --accept-data-loss`
 */
import pg from "pg";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function run(command: string): void {
  execSync(command, { stdio: "inherit", cwd: path.resolve(__dirname, "..") });
}

async function tableExists(
  client: pg.Client,
  tableName: string
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName]
  );
  return result.rows[0]?.exists ?? false;
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const hasMigrationHistory = await tableExists(client, "_prisma_migrations");
    const hasLegacyTables = await tableExists(client, "User");

    if (!hasMigrationHistory && hasLegacyTables) {
      console.log(
        "[DB] Legacy database detected (no _prisma_migrations). Applying schema via db push…"
      );
      run("npx prisma db push --accept-data-loss");
      return;
    }

    console.log("[DB] Applying migrations via migrate deploy…");
    run("npx prisma migrate deploy");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("[DB] Deploy failed:", error);
  process.exit(1);
});
