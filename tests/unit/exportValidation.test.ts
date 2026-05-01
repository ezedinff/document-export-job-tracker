import { canTransitionStatus, validateExportName } from '../../src/validation/exportValidation';

describe('exportValidation', () => {
  it('fails when name is empty', () => {
    expect(validateExportName('')).toBe('Name is required.');
    expect(validateExportName('   ')).toBe('Name is required.');
  });

  it('passes when name is not empty', () => {
    expect(validateExportName('Quarterly CSV')).toBeNull();
  });

  it('allows valid transitions', () => {
    expect(canTransitionStatus('queued', 'processing')).toBe(true);
    expect(canTransitionStatus('processing', 'completed')).toBe(true);
    expect(canTransitionStatus('processing', 'failed')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransitionStatus('queued', 'completed')).toBe(false);
    expect(canTransitionStatus('completed', 'processing')).toBe(false);
    expect(canTransitionStatus('failed', 'completed')).toBe(false);
  });
});
