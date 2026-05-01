export const EXPORT_STATUSES = ['queued', 'processing', 'completed', 'failed'] as const;

export type ExportStatus = typeof EXPORT_STATUSES[number];

export interface ExportJob {
  id: number;
  name: string;
  status: ExportStatus;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}
