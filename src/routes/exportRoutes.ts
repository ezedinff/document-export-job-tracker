import fs from 'node:fs';
import { Router } from 'express';
import { completeJob, createJob, failJob, getJob, listJobs, startJob } from '../services/exportService';

const router = Router();

function parseId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid job id');
  }
  return id;
}

function handleMutationError(error: unknown, res: any): void {
  const message = error instanceof Error ? error.message : 'Unknown error';
  if (message === 'Job not found') {
    res.status(404).json({ error: message });
    return;
  }
  if (message.startsWith('Cannot') || message === 'Name is required.' || message === 'Invalid job id') {
    res.status(400).json({ error: message });
    return;
  }
  res.status(500).json({ error: message });
}

router.post('/exports', (req, res) => {
  try {
    const job = createJob(String(req.body?.name ?? ''));
    res.status(201).json(job);
  } catch (error) {
    handleMutationError(error, res);
  }
});

router.get('/exports', (_req, res) => {
  res.json(listJobs());
});

router.get('/exports/:id', (req, res) => {
  try {
    const job = getJob(parseId(req.params.id));
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json(job);
  } catch (error) {
    handleMutationError(error, res);
  }
});

router.post('/exports/:id/start', (req, res) => {
  try {
    const job = startJob(parseId(req.params.id));
    res.json(job);
  } catch (error) {
    handleMutationError(error, res);
  }
});

router.post('/exports/:id/complete', (req, res) => {
  try {
    const job = completeJob(parseId(req.params.id));
    res.json(job);
  } catch (error) {
    handleMutationError(error, res);
  }
});

router.post('/exports/:id/fail', (req, res) => {
  try {
    const job = failJob(parseId(req.params.id));
    res.json(job);
  } catch (error) {
    handleMutationError(error, res);
  }
});

router.get('/exports/:id/download', (req, res) => {
  try {
    const job = getJob(parseId(req.params.id));
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    if (job.status !== 'completed' || !job.filePath) {
      res.status(400).json({ error: 'Job is not completed or has no export file' });
      return;
    }
    if (!fs.existsSync(job.filePath)) {
      res.status(404).json({ error: 'Export file not found' });
      return;
    }
    res.download(job.filePath, `export-job-${job.id}.csv`);
  } catch (error) {
    handleMutationError(error, res);
  }
});

export default router;
