import { db } from './connection';
import { ExportJob, ExportStatus } from '../models/exportJob';

interface ExportJobRow {
  id: number;
  name: string;
  status: ExportStatus;
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ExportJobRow): ExportJob {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    filePath: row.file_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createExportJob(name: string): ExportJob {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO export_jobs (name, status, file_path, created_at, updated_at)
     VALUES (@name, 'queued', NULL, @createdAt, @updatedAt)`
  );
  const result = stmt.run({ name, createdAt: now, updatedAt: now });
  const created = getExportJobById(Number(result.lastInsertRowid));
  if (!created) {
    throw new Error('Failed to create export job');
  }
  return created;
}

export function getAllExportJobs(): ExportJob[] {
  const rows = db.prepare('SELECT * FROM export_jobs ORDER BY id ASC').all() as ExportJobRow[];
  return rows.map(mapRow);
}

export function getExportJobById(id: number): ExportJob | null {
  const row = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(id) as ExportJobRow | undefined;
  return row ? mapRow(row) : null;
}

export function updateExportJobStatus(id: number, status: ExportStatus): ExportJob | null {
  const now = new Date().toISOString();
  const result = db
    .prepare('UPDATE export_jobs SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, now, id);

  if (result.changes === 0) {
    return null;
  }
  return getExportJobById(id);
}

export function updateExportJobCompletion(id: number, filePath: string): ExportJob | null {
  const now = new Date().toISOString();
  const result = db
    .prepare('UPDATE export_jobs SET status = ?, file_path = ?, updated_at = ? WHERE id = ?')
    .run('completed', filePath, now, id);

  if (result.changes === 0) {
    return null;
  }
  return getExportJobById(id);
}

export function clearExportJobs(): void {
  db.exec('DELETE FROM export_jobs');
}
