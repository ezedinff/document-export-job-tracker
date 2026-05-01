import {
  createExportJob,
  getAllExportJobs,
  getExportJobById,
  updateExportJobCompletion,
  updateExportJobStatus
} from '../db/exportJobRepository';
import { ExportJob } from '../models/exportJob';
import { canTransitionStatus, validateExportName } from '../validation/exportValidation';
import { writeCsvFile } from './csvService';

export function createJob(name: string): ExportJob {
  const validationError = validateExportName(name);
  if (validationError) {
    throw new Error(validationError);
  }
  return createExportJob(name.trim());
}

export function listJobs(): ExportJob[] {
  return getAllExportJobs();
}

export function getJob(id: number): ExportJob | null {
  return getExportJobById(id);
}

export function startJob(id: number): ExportJob {
  const job = getExportJobById(id);
  if (!job) {
    throw new Error('Job not found');
  }
  if (!canTransitionStatus(job.status, 'processing')) {
    throw new Error(`Cannot start job from status ${job.status}`);
  }
  const updated = updateExportJobStatus(id, 'processing');
  if (!updated) {
    throw new Error('Failed to update job status');
  }
  return updated;
}

export function failJob(id: number): ExportJob {
  const job = getExportJobById(id);
  if (!job) {
    throw new Error('Job not found');
  }
  if (!canTransitionStatus(job.status, 'failed')) {
    throw new Error(`Cannot fail job from status ${job.status}`);
  }
  const updated = updateExportJobStatus(id, 'failed');
  if (!updated) {
    throw new Error('Failed to update job status');
  }
  return updated;
}

export function completeJob(id: number): ExportJob {
  const job = getExportJobById(id);
  if (!job) {
    throw new Error('Job not found');
  }
  if (!canTransitionStatus(job.status, 'completed')) {
    throw new Error(`Cannot complete job from status ${job.status}`);
  }

  const completionTimestamp = new Date().toISOString();
  const jobsSnapshot = getAllExportJobs().map((snapshotJob) => {
    if (snapshotJob.id !== id) {
      return snapshotJob;
    }
    return {
      ...snapshotJob,
      status: 'completed' as const,
      updatedAt: completionTimestamp
    };
  });
  const filePath = writeCsvFile(id, jobsSnapshot);
  const updated = updateExportJobCompletion(id, filePath);
  if (!updated) {
    throw new Error('Failed to complete job');
  }
  return updated;
}
