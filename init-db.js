let createClient;

try {
  const libsql = await import("@libsql/client");
  createClient = libsql.createClient;
} catch (err) {
  console.warn("libsql not available, falling back");
  createClient = null;
}

if (createClient) {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const db = createClient({ url, authToken });

  async function initDb() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS translation_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        key TEXT NOT NULL,
        suggested_text TEXT NOT NULL,
        author TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(file_path, key, suggested_text)
      )
    `);
  }
  (async () => {
    await initDb();
  })();
}
