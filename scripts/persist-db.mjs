import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env");

function envFileHasDatabaseUrl(contents) {
  return /^\s*DATABASE_URL\s*=/m.test(contents);
}

if (!process.env.DATABASE_URL) {
  if (existsSync(envPath) && envFileHasDatabaseUrl(readFileSync(envPath, "utf8"))) {
    // Prisma CLI lädt .env selbst
  } else {
    console.error(
      "DATABASE_URL fehlt. Trage die MySQL-Verbindung in .env oder in den Hostinger-Umgebungsvariablen ein.",
    );
    process.exit(1);
  }
}
