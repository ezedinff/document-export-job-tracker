import { ExportStatus } from '../models/exportJob';

export function validateExportName(name: string): string | null {
  if (!name || !name.trim()) {
    return 'Name is required.';
  }
  return null;
}

const allowedTransitions: Record<ExportStatus, ExportStatus[]> = {
  queued: ['processing'],
  processing: ['completed', 'failed'],
  completed: [],
  failed: []
};

export function canTransitionStatus(current: ExportStatus, next: ExportStatus): boolean {
  return allowedTransitions[current].includes(next);
}
