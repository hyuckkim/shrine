let createClient: typeof import('@libsql/client').createClient | null = null;

try {
  const libsql = await import('@libsql/client');
  createClient = libsql.createClient;
} catch (err) {
  console.warn('libsql not available, falling back');
  createClient = null;
}

const url = process.env.TURSO_DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

export const db = createClient?.({ url, authToken }) ?? null;