import fs from 'node:fs';
import path from 'node:path';
import { ExportJob } from '../models/exportJob';

const CSV_HEADERS = ['id', 'name', 'status', 'createdAt', 'updatedAt'];

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsvContent(jobs: ExportJob[]): string {
  const rows = jobs.map((job) =>
    [
      String(job.id),
      escapeCsvCell(job.name),
      job.status,
      escapeCsvCell(job.createdAt),
      escapeCsvCell(job.updatedAt)
    ].join(',')
  );

  return [CSV_HEADERS.join(','), ...rows].join('\n');
}

export function getExportFilePath(jobId: number): string {
  const exportDir = process.env.EXPORT_DIR ?? path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  return path.join(exportDir, `export-job-${jobId}.csv`);
}

export function writeCsvFile(jobId: number, jobs: ExportJob[]): string {
  const filePath = getExportFilePath(jobId);
  const csvContent = buildCsvContent(jobs);
  fs.writeFileSync(filePath, csvContent, 'utf8');
  return filePath;
}
