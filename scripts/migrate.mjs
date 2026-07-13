import { Pool } from "pg";
import { readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "..", "db", "migrations");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL env var is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await pool.query("SELECT filename FROM _migrations")).rows.map((r) => r.filename)
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log("skip (already applied):", file);
      continue;
    }
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    console.log("applying:", file);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log("  done");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("  failed:", err.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log("all migrations applied");
}

main();
