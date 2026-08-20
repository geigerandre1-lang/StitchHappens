import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });
const dest = join(dataDir, "app.db");
const legacy = join(process.cwd(), "prisma", "dev.db");
if (!existsSync(dest) && existsSync(legacy)) {
  copyFileSync(legacy, dest);
  console.log("Bestehende Datenbank nach data/app.db kopiert.");
}
