import { execSync, spawn } from "node:child_process";
import { resolveDatabaseUrl } from "./resolve-database-url.mjs";

process.env.DATABASE_URL = resolveDatabaseUrl();
console.log("[start] MySQL-Verbindung aus Umgebungsvariablen aufgebaut");

function runDbPush() {
  console.log("[start] Datenbank-Schema anwenden (prisma db push)…");
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: process.env,
  });
}

try {
  runDbPush();
} catch (err) {
  console.error("[start] prisma db push fehlgeschlagen:", err);
  process.exit(1);
}

const port = process.env.PORT ?? "3000";
console.log(`[start] Next.js startet auf Port ${port}`);
const child = spawn("npx", ["next", "start", "-p", port], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
