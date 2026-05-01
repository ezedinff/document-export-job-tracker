import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildCsvContent, getExportFilePath, writeCsvFile } from '../../src/services/csvService';
import { ExportJob } from '../../src/models/exportJob';

describe('csvService', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'csv-service-test-'));

  beforeEach(() => {
    process.env.EXPORT_DIR = tmpRoot;
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.mkdirSync(tmpRoot, { recursive: true });
  });

  afterAll(() => {
    delete process.env.EXPORT_DIR;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('generates deterministic filename', () => {
    const filePath = getExportFilePath(3);
    expect(path.basename(filePath)).toBe('export-job-3.csv');
  });

  it('builds csv with headers and rows', () => {
    const jobs: ExportJob[] = [
      {
        id: 1,
        name: 'Export all jobs',
        status: 'queued',
        filePath: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      }
    ];
    const csv = buildCsvContent(jobs);
    expect(csv.split('\n')[0]).toBe('id,name,status,createdAt,updatedAt');
    expect(csv).toContain('1,Export all jobs,queued,2026-01-01T00:00:00.000Z,2026-01-01T00:00:00.000Z');
  });

  it('writes csv file', () => {
    const jobs: ExportJob[] = [
      {
        id: 1,
        name: 'Generate csv',
        status: 'processing',
        filePath: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:01.000Z'
      }
    ];
    const filePath = writeCsvFile(7, jobs);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('id,name,status,createdAt,updatedAt');
    expect(content).toContain('1,Generate csv,processing');
  });
});
