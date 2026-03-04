import * as SQLite from "expo-sqlite";

const DB_NAME = "mosaic_cache.db";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);
  }
  return db;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const database = await getDb();
  const now = Date.now();
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM cache WHERE key = ? AND expires_at > ?",
    [key, now]
  );
  if (row) {
    return JSON.parse(row.value) as T;
  }
  return null;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlMs: number
): Promise<void> {
  const database = await getDb();
  const expiresAt = Date.now() + ttlMs;
  await database.runAsync(
    "INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)",
    [key, JSON.stringify(value), expiresAt]
  );
}

export async function cacheClear(): Promise<void> {
  const database = await getDb();
  await database.runAsync("DELETE FROM cache");
}
