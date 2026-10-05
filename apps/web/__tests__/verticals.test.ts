import { describe, expect, it } from 'vitest';
import { getVerticalManifest, normalizeVerticalId, workItemLabel } from '@/lib/verticals';

describe('vertical helpers', () => {
  it('normalizes legacy aliases', () => {
    expect(normalizeVerticalId('AUTO')).toBe('AUTOMOTIVE');
    expect(normalizeVerticalId('TECH')).toBe('MSP');
  });

  it('returns ticket label for MSP', () => {
    expect(workItemLabel('MSP')).toBe('Ticket');
    expect(getVerticalManifest('TELECOM').workItemLabelPlural).toBe('Service Orders');
  });
});
