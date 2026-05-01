import { ExportJob } from '../../src/models/exportJob';
import { completeJob, createJob, failJob, startJob } from '../../src/services/exportService';
import * as repository from '../../src/db/exportJobRepository';
import * as csvService from '../../src/services/csvService';

jest.mock('../../src/db/exportJobRepository');
jest.mock('../../src/services/csvService');

const mockedRepository = repository as jest.Mocked<typeof repository>;
const mockedCsvService = csvService as jest.Mocked<typeof csvService>;

function buildJob(overrides: Partial<ExportJob> = {}): ExportJob {
  return {
    id: 1,
    name: 'Export data',
    status: 'queued',
    filePath: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('exportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects create with empty name', () => {
    expect(() => createJob('')).toThrow('Name is required.');
  });

  it('starts queued job', () => {
    mockedRepository.getExportJobById.mockReturnValue(buildJob({ status: 'queued' }));
    mockedRepository.updateExportJobStatus.mockReturnValue(buildJob({ status: 'processing' }));

    const updated = startJob(1);
    expect(updated.status).toBe('processing');
  });

  it('fails completing from queued status', () => {
    mockedRepository.getExportJobById.mockReturnValue(buildJob({ status: 'queued' }));
    expect(() => completeJob(1)).toThrow('Cannot complete job from status queued');
  });

  it('completes processing job and writes csv', () => {
    mockedRepository.getExportJobById.mockReturnValue(buildJob({ status: 'processing' }));
    mockedRepository.getAllExportJobs.mockReturnValue([buildJob({ id: 1, status: 'processing' })]);
    mockedCsvService.writeCsvFile.mockReturnValue('/tmp/export-job-1.csv');
    mockedRepository.updateExportJobCompletion.mockReturnValue(
      buildJob({ status: 'completed', filePath: '/tmp/export-job-1.csv' })
    );

    const result = completeJob(1);
    expect(result.status).toBe('completed');
    expect(mockedCsvService.writeCsvFile).toHaveBeenCalledWith(1, expect.any(Array));
    const writtenJobs = mockedCsvService.writeCsvFile.mock.calls[0][1];
    expect(writtenJobs[0].status).toBe('completed');
  });

  it('fails processing job', () => {
    mockedRepository.getExportJobById.mockReturnValue(buildJob({ status: 'processing' }));
    mockedRepository.updateExportJobStatus.mockReturnValue(buildJob({ status: 'failed' }));

    const result = failJob(1);
    expect(result.status).toBe('failed');
  });
});
