/** Build a Prisma MySQL URL — prefers separate vars to avoid password encoding issues. */
export function resolveDatabaseUrl(): string {
  const existing = process.env.DATABASE_URL?.trim();
  if (existing?.startsWith("mysql://")) return existing;

  const host = process.env.MYSQL_HOST ?? process.env.DB_HOST ?? "127.0.0.1";
  const port = process.env.MYSQL_PORT ?? process.env.DB_PORT ?? "3306";
  const user = process.env.MYSQL_USER ?? process.env.DB_USER;
  const password = process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD;
  const database =
    process.env.MYSQL_DATABASE ?? process.env.DB_NAME ?? process.env.DB_DATABASE;

  if (user && password != null && password !== "" && database) {
    return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  if (existing) return existing;

  throw new Error(
    "DATABASE_URL fehlt. Setze entweder DATABASE_URL=mysql://… oder DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in Hostinger.",
  );
}

export function logDatabaseTarget(url: string) {
  try {
    const parsed = new URL(url);
    console.log(
      `[db] MySQL ${parsed.hostname}:${parsed.port || "3306"}${parsed.pathname} as ${decodeURIComponent(parsed.username)}`,
    );
  } catch {
    console.log("[db] MySQL verbunden (DATABASE_URL gesetzt)");
  }
}
