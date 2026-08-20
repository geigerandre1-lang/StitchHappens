import { PrismaClient } from "@prisma/client";
import { logDatabaseTarget, resolveDatabaseUrl } from "@/lib/database-url";

const databaseUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;
logDatabaseTarget(databaseUrl);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
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
        console.error("[db] Datenbank nicht erreichbar. Prüfe DB_* Variablen oder DATABASE_URL.", err);
      }
    })();
  }
  await legacyAssigned;
}
