import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import Module from 'module';

// The source code uses require('@/stores/authStore') which is CJS.
// Vitest's vi.mock doesn't intercept CJS require with path aliases.
// We hook into Node's require to handle the @/ alias.
const mockAuthStore = {
  useAuthStore: {
    getState: () => ({
      accessToken: 'test-token',
      refreshToken: vi.fn().mockResolvedValue('new-token'),
    }),
  },
};

beforeAll(() => {
  // Intercept require('@/stores/authStore') to return our mock
  const _require = Module.prototype.require;
  (Module.prototype as any).require = function (id: string) {
    if (id === '@/stores/authStore') {
      return mockAuthStore;
    }
    return _require.apply(this, arguments as any);
  };
});

const mockFetch = vi.fn();

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  it('should make GET request with auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const { apiClient } = await import('./api');
    const result = await apiClient.get('/products');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/products'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
    expect(result).toEqual({ data: 'test' });
  });

  it('should make POST request with body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '1' }),
    });

    const { apiClient } = await import('./api');
    await apiClient.post('/orders', { items: [] });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/orders'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ items: [] }),
      }),
    );
  });

  it('should throw ApiError on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found' }),
    });

    const { apiClient } = await import('./api');

    await expect(apiClient.get('/missing')).rejects.toThrow('Not found');
  });

  it('should handle 204 No Content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    });

    const { apiClient } = await import('./api');
    const result = await apiClient.delete('/items/1');

    expect(result).toBeUndefined();
  });

  it('should include Content-Type header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const { apiClient } = await import('./api');
    await apiClient.get('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('should include credentials: include', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const { apiClient } = await import('./api');
    await apiClient.get('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        credentials: 'include',
      }),
    );
  });
});
