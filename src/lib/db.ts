import {
  copyFileSync,
  existsSync,
  mkdirSync,
  statSync,
  unlinkSync,
  watch,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const SQLITE_SIDECARS = ["", "-wal", "-shm"] as const;

/** Prisma SQLite URL: Unix needs file:///abs, Windows file:///C:/abs */
function toPrismaSqliteUrl(absPath: string): string {
  const normalized = resolve(absPath).replace(/\\/g, "/");
  if (normalized.startsWith("/")) return `file://${normalized}`;
  return `file:///${normalized}`;
}

function copySqliteBundle(from: string, to: string) {
  mkdirSync(dirname(to), { recursive: true });
  for (const suffix of SQLITE_SIDECARS) {
    const src = from + suffix;
    const dest = to + suffix;
    if (existsSync(src)) copyFileSync(src, dest);
    else if (suffix && existsSync(dest)) unlinkSync(dest);
  }
}

function fileSize(path: string): number {
  try {
    return existsSync(path) ? statSync(path).size : 0;
  } catch {
    return 0;
  }
}

/** Durable copy that survives Hostinger versioned deploys (outside hbuilds/). */
function resolveDurablePath(): string | null {
  const dataDir = process.env.DATA_DIR?.trim();
  if (dataDir) return resolve(join(dataDir, "app.db"));

  const cwd = process.cwd();
  if (!cwd.includes("hbuilds/versions") && !cwd.includes("hbuilds\\versions")) {
    return null;
  }
  return resolve(cwd, "../../../..", "data", "app.db");
}

function restoreFromDurable(localPath: string, durablePath: string | null) {
  if (!durablePath || resolve(durablePath) === resolve(localPath)) return;
  if (fileSize(durablePath) === 0) return;
  copySqliteBundle(durablePath, localPath);
  console.log(`[db] Restored persistent database to ${localPath}`);
}

function seedDurable(localPath: string, durablePath: string | null) {
  if (!durablePath || resolve(durablePath) === resolve(localPath)) return;
  if (fileSize(durablePath) > 0) return;
  if (fileSize(localPath) === 0) return;
  try {
    copySqliteBundle(localPath, durablePath);
    console.log(`[db] Seeded persistent database at ${durablePath}`);
  } catch (err) {
    console.warn("[db] Persistent storage is not writable; deploys will reset the database.", err);
  }
}

function persistNow(localPath: string, durablePath: string | null) {
  if (!durablePath || resolve(durablePath) === resolve(localPath)) return;
  if (fileSize(localPath) === 0) return;
  try {
    copySqliteBundle(localPath, durablePath);
  } catch (err) {
    console.warn("[db] Could not persist database:", err);
  }
}

function startPersistWatcher(localPath: string, durablePath: string | null) {
  if (!durablePath || resolve(durablePath) === resolve(localPath)) return;

  let timer: ReturnType<typeof setTimeout> | null = null;
  const kick = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => persistNow(localPath, durablePath), 800);
  };

  try {
    watch(dirname(localPath), { persistent: false }, (_event, filename) => {
      if (filename && String(filename).startsWith("app.db")) kick();
    });
  } catch {
    /* watch unavailable */
  }

  const flush = () => persistNow(localPath, durablePath);
  process.on("beforeExit", flush);
  process.on("SIGTERM", flush);
  process.on("SIGINT", flush);
}

function copyBuildDbIfNeeded(dest: string) {
  if (fileSize(dest) > 0) return;
  mkdirSync(dirname(dest), { recursive: true });
  const destResolved = resolve(dest);
  const candidates = [
    join(process.cwd(), "data", "app.db"),
    join(process.cwd(), "prisma", "dev.db"),
  ];
  for (const src of candidates) {
    if (fileSize(src) === 0) continue;
    if (resolve(src) === destResolved) continue;
    copySqliteBundle(src, dest);
    console.log(`[db] Copied SQLite from ${src} to ${dest}`);
    return;
  }
}

const sqlitePath = resolve(process.cwd(), "data", "app.db");
const durablePath = resolveDurablePath();

mkdirSync(dirname(sqlitePath), { recursive: true });
restoreFromDurable(sqlitePath, durablePath);
copyBuildDbIfNeeded(sqlitePath);
seedDurable(sqlitePath, durablePath);

const sqliteUrl = toPrismaSqliteUrl(sqlitePath);
process.env.DATABASE_URL = sqliteUrl;
console.log(`[db] SQLite path ${sqlitePath}`);
if (durablePath && resolve(durablePath) !== sqlitePath) {
  console.log(`[db] Persistent copy ${durablePath}`);
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  dbPersistStarted?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: sqliteUrl } },
  });

if (!globalForPrisma.dbPersistStarted) {
  globalForPrisma.dbPersistStarted = true;
  startPersistWatcher(sqlitePath, durablePath);
}

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
        persistNow(sqlitePath, durablePath);
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
