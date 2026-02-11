import { describe, it, expect } from 'vitest';
import { formatVND, formatVNDCompact } from './currency';

describe('formatVND', () => {
  it('should format zero', () => {
    const result = formatVND(0);
    expect(result).toContain('0');
  });

  it('should format a positive number', () => {
    const result = formatVND(150000);
    expect(result).toContain('150');
  });
});

describe('formatVNDCompact', () => {
  it('should append dong symbol', () => {
    const result = formatVNDCompact(85000);
    expect(result).toContain('đ');
  });

  it('should format with thousands separator', () => {
    const result = formatVNDCompact(85000);
    expect(result).toBe('85.000đ');
  });
});
