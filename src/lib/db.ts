import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

function persistSqliteFile() {
  const dataDir = join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  const dest = join(dataDir, "app.db");
  const legacy = join(process.cwd(), "prisma", "dev.db");
  if (!existsSync(dest) && existsSync(legacy)) {
    copyFileSync(legacy, dest);
  }
}

persistSqliteFile();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

let legacyAssigned: Promise<void> | null = null;

export async function assignLegacyPatterns() {
  if (!legacyAssigned) {
    legacyAssigned = (async () => {
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
    })();
  }
  await legacyAssigned;
}
