import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env");

function readDatabaseUrlFromFile() {
  if (!existsSync(envPath)) return null;
  const match = readFileSync(envPath, "utf8").match(/^\s*DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
  return match?.[1]?.trim() ?? null;
}

const databaseUrl = process.env.DATABASE_URL?.trim() || readDatabaseUrlFromFile();

if (!databaseUrl) {
  console.error(
    "DATABASE_URL fehlt. Trage die MySQL-Verbindung in den Hostinger-Umgebungsvariablen ein.",
  );
  console.error("Beispiel: mysql://USER:PASS@localhost:3306/DATABASE");
  process.exit(1);
}

if (!databaseUrl.startsWith("mysql://")) {
  console.error("DATABASE_URL muss mit mysql:// beginnen (nicht mehr file:… für SQLite).");
  console.error(`Aktuell: ${databaseUrl.slice(0, 40)}${databaseUrl.length > 40 ? "…" : ""}`);
  console.error("Hostinger: hPanel → Node.js-App → Umgebungsvariablen → DATABASE_URL anpassen");
  process.exit(1);
}
