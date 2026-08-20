import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

function isInsideDir(filePath: string, dir: string): boolean {
  const rel = relative(resolve(dir), resolve(filePath));
  return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/"));
}

/** Prisma SQLite URL: Unix needs file:///abs, Windows file:///C:/abs */
function toPrismaSqliteUrl(absPath: string): string {
  const normalized = resolve(absPath).replace(/\\/g, "/");
  if (normalized.startsWith("/")) return `file://${normalized}`;
  return `file:///${normalized}`;
}

function resolveSqliteFilePath(): string {
  const cwd = process.cwd();
  const localDb = resolve(cwd, "data", "app.db");

  const dataDir = process.env.DATA_DIR?.trim();
  if (dataDir) {
    const candidate = resolve(join(dataDir, "app.db"));
    if (isInsideDir(candidate, cwd)) return candidate;
    console.warn(
      "[db] DATA_DIR liegt außerhalb des App-Ordners — Prisma kann die Datei auf Hostinger dort nicht öffnen. Nutze data/app.db im App-Verzeichnis.",
    );
  }

  return localDb;
}

function copyBuildDbIfNeeded(dest: string) {
  if (existsSync(dest)) return;
  mkdirSync(dirname(dest), { recursive: true });
  const destResolved = resolve(dest);
  const candidates = [
    join(process.cwd(), "data", "app.db"),
    join(process.cwd(), "prisma", "dev.db"),
  ];
  for (const src of candidates) {
    if (!existsSync(src)) continue;
    if (resolve(src) === destResolved) continue;
    copyFileSync(src, dest);
    console.log(`[db] Copied SQLite from ${src} to ${dest}`);
    return;
  }
}

const sqlitePath = resolveSqliteFilePath();
mkdirSync(dirname(sqlitePath), { recursive: true });
copyBuildDbIfNeeded(sqlitePath);

const sqliteUrl = toPrismaSqliteUrl(sqlitePath);
process.env.DATABASE_URL = sqliteUrl;
console.log(`[db] SQLite path ${sqlitePath}`);

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
          "[db] Datenbank nicht nutzbar. prisma db push muss beim Build gelaufen sein, und data/app.db muss im App-Ordner liegen.",
          err,
        );
      }
    })();
  }
  await legacyAssigned;
}
