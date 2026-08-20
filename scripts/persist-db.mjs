import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveDatabaseUrl } from "./resolve-database-url.mjs";

const envPath = join(process.cwd(), ".env");

function readDatabaseUrlFromFile() {
  if (!existsSync(envPath)) return null;
  const match = readFileSync(envPath, "utf8").match(/^\s*DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
  return match?.[1]?.trim() ?? null;
}

function writeDatabaseUrlToEnv(url) {
  const line = `DATABASE_URL="${url}"`;
  if (!existsSync(envPath)) {
    writeFileSync(envPath, `${line}\n`);
    console.log("DATABASE_URL in .env geschrieben (für Prisma CLI).");
    return;
  }

  const contents = readFileSync(envPath, "utf8");
  if (/^\s*DATABASE_URL\s*=/m.test(contents)) {
    writeFileSync(envPath, contents.replace(/^\s*DATABASE_URL\s*=.*$/m, line));
  } else {
    const prefix = contents.length === 0 || contents.endsWith("\n") ? "" : "\n";
    writeFileSync(envPath, `${contents}${prefix}${line}\n`);
  }
  console.log("DATABASE_URL in .env aktualisiert (für Prisma CLI).");
}

if (!process.env.DATABASE_URL) {
  const fromFile = readDatabaseUrlFromFile();
  if (fromFile) process.env.DATABASE_URL = fromFile;
}

const databaseUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

if (!databaseUrl.startsWith("mysql://")) {
  console.error("DATABASE_URL muss mit mysql:// beginnen.");
  process.exit(1);
}

writeDatabaseUrlToEnv(databaseUrl);
