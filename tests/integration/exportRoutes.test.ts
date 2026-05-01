import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Express } from 'express';
import request from 'supertest';
import type Database from 'better-sqlite3';

describe('exportRoutes integration', () => {
  let app: Express;
  let api: ReturnType<typeof request>;
  let testDir: string;
  let dbPath: string;
  let exportDir: string;
  let db: Database.Database;

  beforeAll(async () => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-routes-test-'));
    dbPath = path.join(testDir, 'test.db');
    exportDir = path.join(testDir, 'exports');

    process.env.DB_PATH = dbPath;
    process.env.EXPORT_DIR = exportDir;

    jest.resetModules();
    app = (await import('../../src/app')).default;
    db = (await import('../../src/db/connection')).db;
    api = request(app);
  });

  beforeEach(() => {
    db.exec('DELETE FROM export_jobs');
    fs.rmSync(exportDir, { recursive: true, force: true });
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
    delete process.env.DB_PATH;
    delete process.env.EXPORT_DIR;
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('creates and lists jobs', async () => {
    const create = await api.post('/api/exports').send({ name: 'Create list CSV' });
    expect(create.status).toBe(201);
    expect(create.body.status).toBe('queued');

    const list = await api.get('/api/exports');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBe(1);
    expect(list.body[0].name).toBe('Create list CSV');
  });

  it('rejects invalid transition', async () => {
    const create = await api.post('/api/exports').send({ name: 'Bad transition' });
    const id = create.body.id;

    const complete = await api.post(`/api/exports/${id}/complete`).send();
    expect(complete.status).toBe(400);
    expect(complete.body.error).toContain('Cannot complete');
  });

  it('completes job and downloads csv', async () => {
    const create = await api.post('/api/exports').send({ name: 'Download CSV' });
    const id = create.body.id;

    const start = await api.post(`/api/exports/${id}/start`).send();
    expect(start.status).toBe(200);

    const complete = await api.post(`/api/exports/${id}/complete`).send();
    expect(complete.status).toBe(200);
    expect(complete.body.status).toBe('completed');

    const download = await api.get(`/api/exports/${id}/download`).send();
    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toContain('text/csv');
    expect(download.text).toContain('id,name,status,createdAt,updatedAt');
  });

  it('returns 404 for unknown job', async () => {
    const response = await api.get('/api/exports/9999').send();
    expect(response.status).toBe(404);
  });
});
