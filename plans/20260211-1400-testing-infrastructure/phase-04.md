# Phase 4: Web Unit Tests (Stores, Utils, API Client)

## Context

- **Parent plan:** [plan.md](./plan.md)
- **Dependencies:** [Phase 1](./phase-01.md) (config + setup files)
- **Research:** [researcher-02](./research/researcher-02-report.md) (Zustand testing, Vitest + Next.js)
- **Scout:** [scout-01](./scout/scout-01-report.md) (stores, utils, lib files)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Description | Unit test Zustand stores (cartStore, authStore), shared utility functions (formatVND, generateSlug), SEO helpers (generatePageMetadata, JSON-LD), and the API client (request handling, error handling, token refresh). |
| Priority | P1 |
| Implementation status | pending |
| Review status | pending |

## Key Insights

- Zustand stores testable without React via `getState()` / `setState()` -- no RTL needed
- cartStore uses `persist` middleware -- test state logic separately from persistence
- authStore depends on `apiClient` -- mock `@/lib/api` module
- apiClient uses `fetch` + token refresh logic -- mock `global.fetch` via `vi.fn()`
- formatVND uses `Intl.NumberFormat('vi-VN')` -- works in Node.js 18+
- generateSlug handles Vietnamese diacritics -- important edge cases
- `seo.ts` returns `Metadata` objects -- pure function, easy to test

## Requirements

1. cartStore: add, remove, update quantity, subtotal/total selectors, voucher, clearCart (~10 tests)
2. authStore: login, register, logout, refreshToken, setUser (~8 tests)
3. packages/utils: formatVND, formatVNDCompact, generateSlug (~8 tests)
4. lib/seo.ts: generatePageMetadata, productJsonLd (~6 tests)
5. lib/api.ts: request success, error handling, 401 retry (~6 tests)

## Architecture

```
apps/web/src/
  stores/
    cartStore.test.ts ........... NEW (~10 tests)
    authStore.test.ts ........... NEW (~8 tests)
  lib/
    seo.test.ts ................. NEW (~6 tests)
    api.test.ts ................. NEW (~6 tests)

packages/utils/src/
  currency.test.ts .............. NEW (~4 tests)
  slug.test.ts .................. NEW (~4 tests)
```

## Related Code Files

- `Z:\Web-enzara\apps\web\src\stores\cartStore.ts`
- `Z:\Web-enzara\apps\web\src\stores\authStore.ts`
- `Z:\Web-enzara\apps\web\src\lib\api.ts`
- `Z:\Web-enzara\apps\web\src\lib\seo.ts`
- `Z:\Web-enzara\packages\utils\src\currency.ts`
- `Z:\Web-enzara\packages\utils\src\slug.ts`

## Implementation Steps

### Step 4.1 - cartStore Tests

File: `apps/web/src/stores/cartStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, selectSubtotal, selectTotalItems, selectTotal } from './cartStore';

const mockItem = {
  productId: 'prod-1',
  name: 'Test Product',
  image: '/img.jpg',
  price: 100000,
  maxQuantity: 10,
};

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      voucherCode: null,
      voucherDiscount: 0,
    });
  });

  describe('addItem', () => {
    it('should add new item to empty cart', () => {
      useCartStore.getState().addItem(mockItem);
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('prod-1');
      expect(items[0].quantity).toBe(1);
    });

    it('should increment quantity for existing item', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().addItem(mockItem);
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('should clamp quantity to maxQuantity', () => {
      useCartStore.getState().addItem({ ...mockItem, maxQuantity: 2 });
      useCartStore.getState().addItem({ ...mockItem, maxQuantity: 2 });
      useCartStore.getState().addItem({ ...mockItem, maxQuantity: 2 });
      const { items } = useCartStore.getState();
      expect(items[0].quantity).toBe(2);
    });

    it('should treat different variantIds as separate items', () => {
      useCartStore.getState().addItem({ ...mockItem, variantId: 'v1' });
      useCartStore.getState().addItem({ ...mockItem, variantId: 'v2' });
      expect(useCartStore.getState().items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('should remove item by productId', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().removeItem('prod-1');
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should remove correct variant', () => {
      useCartStore.getState().addItem({ ...mockItem, variantId: 'v1' });
      useCartStore.getState().addItem({ ...mockItem, variantId: 'v2' });
      useCartStore.getState().removeItem('prod-1', 'v1');
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].variantId).toBe('v2');
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity for matching item', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().updateQuantity('prod-1', undefined, 5);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('should remove item when quantity set to 0', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().updateQuantity('prod-1', undefined, 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should clamp to maxQuantity', () => {
      useCartStore.getState().addItem({ ...mockItem, maxQuantity: 3 });
      useCartStore.getState().updateQuantity('prod-1', undefined, 99);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });
  });

  describe('selectors', () => {
    it('selectSubtotal should sum price * quantity', () => {
      useCartStore.setState({
        items: [
          { ...mockItem, productId: '1', price: 100000, quantity: 2 },
          { ...mockItem, productId: '2', price: 50000, quantity: 1 },
        ],
        voucherCode: null,
        voucherDiscount: 0,
      });
      expect(selectSubtotal(useCartStore.getState())).toBe(250000);
    });

    it('selectTotalItems should sum quantities', () => {
      useCartStore.setState({
        items: [
          { ...mockItem, productId: '1', quantity: 2 },
          { ...mockItem, productId: '2', quantity: 3 },
        ],
        voucherCode: null,
        voucherDiscount: 0,
      });
      expect(selectTotalItems(useCartStore.getState())).toBe(5);
    });

    it('selectTotal should subtract voucher discount', () => {
      useCartStore.setState({
        items: [{ ...mockItem, price: 200000, quantity: 1 }],
        voucherCode: 'SAVE50K',
        voucherDiscount: 50000,
      });
      expect(selectTotal(useCartStore.getState())).toBe(150000);
    });

    it('selectTotal should not go below 0', () => {
      useCartStore.setState({
        items: [{ ...mockItem, price: 10000, quantity: 1 }],
        voucherCode: 'BIG',
        voucherDiscount: 999999,
      });
      expect(selectTotal(useCartStore.getState())).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('should reset items and voucher', () => {
      useCartStore.setState({
        items: [{ ...mockItem, quantity: 1 }],
        voucherCode: 'CODE',
        voucherDiscount: 10000,
      });
      useCartStore.getState().clearCart();
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.voucherCode).toBeNull();
      expect(state.voucherDiscount).toBe(0);
    });
  });
});
```

### Step 4.2 - authStore Tests

File: `apps/web/src/stores/authStore.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';

// Mock apiClient module
vi.mock('@/lib/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isLoading: false,
    });
    vi.clearAllMocks();
    document.cookie = '';
  });

  describe('login', () => {
    it('should set accessToken and user on success', async () => {
      const { apiClient } = await import('@/lib/api');
      (apiClient.post as any).mockResolvedValue({ accessToken: 'test-token' });
      (apiClient.get as any).mockResolvedValue({
        id: 'u1',
        email: 'test@enzara.vn',
        fullName: 'Test',
        role: 'CUSTOMER',
      });

      await useAuthStore.getState().login('test@enzara.vn', 'pass');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('test-token');
      expect(state.user?.email).toBe('test@enzara.vn');
      expect(state.isLoading).toBe(false);
    });

    it('should clear state on login failure', async () => {
      const { apiClient } = await import('@/lib/api');
      (apiClient.post as any).mockRejectedValue(new Error('Invalid'));

      await expect(
        useAuthStore.getState().login('bad@enzara.vn', 'wrong'),
      ).rejects.toThrow();

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear user and token', async () => {
      useAuthStore.setState({
        user: { id: 'u1', email: 'a@b.com', fullName: 'A', role: 'CUSTOMER', avatar: null, emailVerified: true },
        accessToken: 'token',
      });
      const { apiClient } = await import('@/lib/api');
      (apiClient.post as any).mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should update user directly', () => {
      const user = { id: 'u1', email: 'a@b.com', fullName: 'A', role: 'CUSTOMER' as const, avatar: null, emailVerified: true };
      useAuthStore.getState().setUser(user);
      expect(useAuthStore.getState().user).toEqual(user);
    });
  });
});
```

### Step 4.3 - packages/utils Currency Tests

File: `packages/utils/src/currency.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { formatVND, formatVNDCompact } from './currency';

describe('formatVND', () => {
  it('should format 0', () => {
    expect(formatVND(0)).toMatch(/0/);
  });

  it('should format large number with VND', () => {
    const result = formatVND(1500000);
    // Intl.NumberFormat('vi-VN') produces something like "1.500.000 ₫"
    expect(result).toContain('1.500.000');
  });

  it('should not include decimal places', () => {
    expect(formatVND(99999)).not.toContain(',');
  });
});

describe('formatVNDCompact', () => {
  it('should append dong symbol', () => {
    const result = formatVNDCompact(85000);
    expect(result).toMatch(/85\.000đ/);
  });

  it('should format zero', () => {
    expect(formatVNDCompact(0)).toBe('0đ');
  });
});
```

### Step 4.4 - packages/utils Slug Tests

File: `packages/utils/src/slug.test.ts`

```typescript
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
```

### Step 4.5 - SEO Helpers Tests

File: `apps/web/src/lib/seo.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { generatePageMetadata } from './seo';

describe('generatePageMetadata', () => {
  it('should generate metadata with correct title and description', () => {
    const meta = generatePageMetadata({
      title: 'Test Page',
      description: 'Test description',
      path: '/test',
    });

    expect(meta.title).toBe('Test Page');
    expect(meta.description).toBe('Test description');
  });

  it('should generate canonical URL with locale', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/products',
      locale: 'en',
    });

    expect(meta.alternates?.canonical).toContain('/en/products');
  });

  it('should default to vi locale', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/products',
    });

    expect(meta.alternates?.canonical).toContain('/vi/products');
  });

  it('should include noIndex when specified', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/admin',
      noIndex: true,
    });

    expect((meta.robots as any)?.index).toBe(false);
  });

  it('should include OG image when provided', () => {
    const meta = generatePageMetadata({
      title: 'T',
      description: 'D',
      path: '/p',
      image: 'https://enzara.vn/og.jpg',
    });

    expect((meta.openGraph as any)?.images).toHaveLength(1);
  });
});
```

### Step 4.6 - API Client Tests

File: `apps/web/src/lib/api.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Must mock authStore before importing api.ts
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      accessToken: 'test-token',
      refreshToken: vi.fn().mockResolvedValue('new-token'),
    })),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('should throw ApiError on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found' }),
    });

    const { apiClient, ApiError } = await import('./api');

    await expect(apiClient.get('/missing')).rejects.toThrow();
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
});
```

**Note:** The api.ts file uses `require()` for authStore to avoid circular deps. The vi.mock approach above handles this. If issues arise, use `vi.doMock` with dynamic imports.

## Todo List

- [ ] Write cartStore tests (Step 4.1)
- [ ] Write authStore tests (Step 4.2)
- [ ] Write currency utility tests (Step 4.3)
- [ ] Write slug utility tests (Step 4.4)
- [ ] Write SEO helper tests (Step 4.5)
- [ ] Write API client tests (Step 4.6)
- [ ] Run `pnpm --filter @enzara/web test` and verify all pass
- [ ] Run `pnpm --filter @enzara/utils test` and verify all pass

## Success Criteria

1. All 6 test files created and passing
2. ~38 test cases total
3. cartStore selectors (selectSubtotal, selectTotalItems, selectTotal) fully covered
4. Vietnamese diacritics edge cases tested in generateSlug
5. API client token refresh logic tested
6. Tests run in <5 seconds total

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `Intl.NumberFormat('vi-VN')` output differs between Node versions | Medium | Low | Use `.toContain()` / `.toMatch()` instead of exact string match |
| authStore `require()` pattern breaks vi.mock | Medium | Medium | Use vi.doMock with async import, or refactor to injection pattern |
| Zustand persist middleware interferes with setState in tests | Low | Low | persist only wraps storage; setState bypasses it |
| api.ts module-level state (isRefreshing) leaks between tests | Medium | Medium | Use vi.resetModules() between tests if needed |

## Security Considerations

- Do not test with real API endpoints
- Mock fetch at global level to prevent any network calls
- Test tokens must be clearly fake values

## Next Steps

After Phase 4, proceed to Phase 5 (Web Component Tests) which builds on the store and utility patterns established here.
