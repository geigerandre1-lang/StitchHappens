import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

function toFileUrl(absPath: string): string {
  return `file:${absPath.replace(/\\/g, "/")}`;
}

/** Absolute SQLite path from file:/, file:/// or file:C:/… — not file:../relative. */
function absolutePathFromFileUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed.startsWith("file:")) return null;
  let rest = trimmed.slice("file:".length);
  if (rest.startsWith("///")) {
    rest = rest.slice(3);
    if (/^[A-Za-z]:/.test(rest)) return rest;
    return `/${rest}`;
  }
  if (rest.startsWith("//")) return null;
  if (rest.startsWith("/")) return rest;
  if (/^[A-Za-z]:[\\/]/.test(rest)) return rest;
  return null;
}

function tryHostingerPersistentDb(): string | null {
  const cwd = process.cwd();
  if (!cwd.includes("hbuilds/versions") && !cwd.includes("hbuilds\\versions")) {
    return null;
  }
  const dest = resolve(cwd, "../../../..", "data", "app.db");
  try {
    mkdirSync(dirname(dest), { recursive: true });
    return dest;
  } catch (err) {
    console.warn("[db] Hostinger persistent data dir is not writable, falling back to cwd:", err);
    return null;
  }
}

function resolveSqliteFilePath(): string {
  const fromEnv = process.env.DATABASE_URL;
  if (fromEnv) {
    const abs = absolutePathFromFileUrl(fromEnv);
    if (abs && isAbsolute(abs)) return abs;
  }

  const dataDir = process.env.DATA_DIR?.trim();
  if (dataDir) return join(dataDir, "app.db");

  return tryHostingerPersistentDb() ?? join(process.cwd(), "data", "app.db");
}

function copyBuildDbIfNeeded(dest: string) {
  if (existsSync(dest)) return;
  const destResolved = resolve(dest);
  const candidates = [
    join(process.cwd(), "data", "app.db"),
    join(process.cwd(), "prisma", "dev.db"),
  ];
  for (const src of candidates) {
    if (!existsSync(src)) continue;
    if (resolve(src) === destResolved) continue;
    copyFileSync(src, dest);
    console.log(`[db] Copied SQLite from ${src} → ${dest}`);
    return;
  }
}

const sqlitePath = resolveSqliteFilePath();
mkdirSync(dirname(sqlitePath), { recursive: true });
copyBuildDbIfNeeded(sqlitePath);

const sqliteUrl = toFileUrl(sqlitePath);
process.env.DATABASE_URL = sqliteUrl;
console.log(`[db] SQLite ${sqliteUrl}`);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: sqliteUrl } },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

let legacyAssigned: Promise<void> | null = null;

export async function assignLegacyPatterns() {
  if (!legacyAssigned) {
    legacyAssigned = (async () => {
      try {
        const orphans = await prisma.pattern.count({ where: { userId: null } });
        if (orphans === 0) return;
        const user = await prisma.user.upsert({
          where: { name: "Lokal" },
          create: { name: "Lokal" },
          update: {},
        });
        await prisma.pattern.updateMany({
          where: { userId: null },
          data: { userId: user.id },
        });
      } catch (err) {
        console.error(
          "[db] Schema missing or database not open. Rebuild so prisma db push runs, or copy data/app.db into DATA_DIR.",
          err,
        );
      }
    })();
  }
  await legacyAssigned;
}
