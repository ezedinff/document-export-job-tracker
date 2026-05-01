import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const defaultDbPath = path.join(process.cwd(), 'data', 'app.db');
const dbPath = process.env.DB_PATH ?? defaultDbPath;

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
