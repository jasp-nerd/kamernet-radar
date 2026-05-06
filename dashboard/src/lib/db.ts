import postgres from "postgres";

let sqlInstance: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!sqlInstance) {
    const url = process.env.DATABASE_URL!;
    const ssl = /[?&]sslmode=disable\b/i.test(url)
      ? false
      : { rejectUnauthorized: false };
    sqlInstance = postgres(url, { ssl });
  }
  return sqlInstance;
}
