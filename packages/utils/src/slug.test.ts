import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('should convert basic text to slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should remove Vietnamese diacritics', () => {
    expect(generateSlug('Kem dưỡng da mặt')).toBe('kem-duong-da-mat');
  });

  it('should handle Vietnamese đ character', () => {
    expect(generateSlug('Đồng hồ thông minh')).toBe('dong-ho-thong-minh');
  });

  it('should remove special characters', () => {
    expect(generateSlug('Product @#$% Name!')).toBe('product-name');
  });

  it('should trim leading/trailing hyphens', () => {
    expect(generateSlug('  -Hello- ')).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(generateSlug('')).toBe('');
  });
});
