import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const SQLITE_URL = "file:../data/app.db";
const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });
const dest = join(dataDir, "app.db");
const legacy = join(process.cwd(), "prisma", "dev.db");
if (!existsSync(dest) && existsSync(legacy)) {
  copyFileSync(legacy, dest);
  console.log("Bestehende Datenbank nach data/app.db kopiert.");
}

const envPath = join(process.cwd(), ".env");

function envFileHasDatabaseUrl(contents) {
  return /^\s*DATABASE_URL\s*=/m.test(contents);
}

if (!process.env.DATABASE_URL) {
  if (!existsSync(envPath)) {
    writeFileSync(envPath, `DATABASE_URL="${SQLITE_URL}"\n`);
    console.log("DATABASE_URL in .env gesetzt (Prisma-Build).");
  } else {
    const contents = readFileSync(envPath, "utf8");
    if (!envFileHasDatabaseUrl(contents)) {
      const prefix = contents.length === 0 || contents.endsWith("\n") ? "" : "\n";
      appendFileSync(envPath, `${prefix}DATABASE_URL="${SQLITE_URL}"\n`);
      console.log("DATABASE_URL an .env angehängt (Prisma-Build).");
    }
  }
}
