import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

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
        console.error("[db] Datenbank nicht erreichbar. Prüfe DATABASE_URL und prisma db push.", err);
      }
    })();
  }
  await legacyAssigned;
}
