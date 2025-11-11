import type { RequestHandler } from './$types';
import { db } from '$lib/db';

export const POST: RequestHandler = async ({ request }) => {
  const { file_path, key, suggested_text, author } = await request.json();

  if (!db) return new Response('Database not available', { status: 500 });
  await db.execute({
    sql: `INSERT INTO translation_suggestions (file_path, key, suggested_text, author)
          VALUES (?, ?, ?, ?)`,
    args: [file_path, key, suggested_text, author ?? null],
  });

  return new Response(JSON.stringify({ ok: true }), { status: 201 });
};

export const GET: RequestHandler = async ({ url }) => {
  const file = url.searchParams.get('file');
  if (!file) {
    return new Response('Missing file parameter', { status: 400 });
  }

  if (!db) return new Response('Database not available', { status: 500 });
  const { rows } = await db.execute({
    sql: `SELECT * FROM translation_suggestions
          WHERE file_path = ?
          ORDER BY created_at DESC`,
    args: [file],
  });

  return new Response(JSON.stringify(rows), { status: 200 });
};
