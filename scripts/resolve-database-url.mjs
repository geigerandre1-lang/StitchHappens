function resolveDatabaseUrl() {
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

  console.error(
    "DATABASE_URL fehlt. Setze DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in Hostinger (empfohlen).",
  );
  process.exit(1);
}

export { resolveDatabaseUrl };
