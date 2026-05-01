import { db } from './connection';

export function initializeSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS export_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('queued', 'processing', 'completed', 'failed')),
      file_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

if (require.main === module) {
  initializeSchema();
  console.log('Database schema initialized.');
}
