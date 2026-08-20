import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveDatabaseUrl } from "./resolve-database-url.mjs";

const envPath = join(process.cwd(), ".env");

function readDatabaseUrlFromFile() {
  if (!existsSync(envPath)) return null;
  const match = readFileSync(envPath, "utf8").match(/^\s*DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
  return match?.[1]?.trim() ?? null;
}

if (!process.env.DATABASE_URL) {
  const fromFile = readDatabaseUrlFromFile();
  if (fromFile) process.env.DATABASE_URL = fromFile;
}

process.env.DATABASE_URL = resolveDatabaseUrl();

if (!process.env.DATABASE_URL.startsWith("mysql://")) {
  console.error("DATABASE_URL muss mit mysql:// beginnen.");
  process.exit(1);
}
