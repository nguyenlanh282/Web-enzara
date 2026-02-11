# Phase 6: E2E Tests (Playwright)

## Context

- **Parent plan:** [plan.md](./plan.md)
- **Dependencies:** [Phase 1](./phase-01.md) (Playwright config + installation)
- **Research:** [researcher-02](./research/researcher-02-report.md) (Playwright config, auth fixtures, i18n testing, checkout flow)
- **Scout:** [scout-01](./scout/scout-01-report.md) (app routes, components)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Description | End-to-end tests using Playwright against a running dev/preview instance. Cover 6 critical user journeys: auth flow, product browsing, search, cart + checkout, i18n switching, and order tracking. |
| Priority | P2 |
| Implementation status | pending |
| Review status | pending |

## Key Insights

- Playwright `webServer` config auto-starts `pnpm run dev` -- requires both API and Web running
- For E2E, need real or seeded database (not mocked) -- use a test database with seed data
- Auth flow requires email verification step -- may need to bypass or mock email in E2E
- i18n uses path prefix: `/vi/...` and `/en/...`
- Cart persists in localStorage (Zustand persist) -- can pre-seed via `page.evaluate()`
- SePay payment uses QR code display -- cannot truly test payment completion in E2E; test up to QR display
- Need `data-testid` attributes on key interactive elements for stable selectors

## Requirements

1. Auth flow: register, login, logout (~3 test cases)
2. Product browsing: homepage, category page, product detail (~3 test cases)
3. Search: open modal, type query, see results (~2 test cases)
4. Cart + Checkout: add to cart, view cart, proceed to checkout, shipping form, order summary (~4 test cases)
5. i18n: switch language, verify content changes (~2 test cases)
6. Order tracking: view order status page (~1 test case)

## Architecture

```
apps/web/
  e2e/
    auth.spec.ts ................ Auth user journey
    products.spec.ts ............ Product browsing journey
    search.spec.ts .............. Search functionality
    checkout.spec.ts ............ Cart + checkout journey
    i18n.spec.ts ................ Language switching
    order-tracking.spec.ts ...... Order tracking page
    fixtures/
      auth.fixture.ts ........... Authenticated page fixture
    helpers/
      seed.ts ................... Test data seeding helpers
  playwright.config.ts .......... (from Phase 1)
```

## Related Code Files

- `Z:\Web-enzara\apps\web\playwright.config.ts` (from Phase 1)
- `Z:\Web-enzara\apps\web\src\app\[locale]\page.tsx` (homepage)
- `Z:\Web-enzara\apps\web\src\app\[locale]\products\page.tsx`
- `Z:\Web-enzara\apps\web\src\app\[locale]\products\[slug]\page.tsx`
- `Z:\Web-enzara\apps\web\src\app\[locale]\cart\page.tsx`
- `Z:\Web-enzara\apps\web\src\app\[locale]\checkout\page.tsx`
- `Z:\Web-enzara\apps\web\src\app\[locale]\auth\login\page.tsx`
- `Z:\Web-enzara\apps\web\src\app\[locale]\auth\register\page.tsx`

## Implementation Steps

### Step 6.0 - Prerequisites

1. Create a `.env.test` in `apps/api` pointing to a test database
2. Seed test database with: at least 1 user, 3 products, 1 category, 1 voucher
3. Ensure both API and Web can start with test env
4. Update `playwright.config.ts` webServer to start both services (or use a combined dev command)

Updated webServer config (if needed for both API + Web):
```typescript
webServer: [
  {
    command: 'pnpm --filter @enzara/api dev',
    url: 'http://localhost:4000/api',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  {
    command: 'pnpm --filter @enzara/web dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
],
```

### Step 6.1 - Auth Fixture

File: `apps/web/e2e/fixtures/auth.fixture.ts`

```typescript
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login via UI
    await page.goto('/vi/auth/login');
    await page.fill('[name="email"]', 'test@enzara.vn');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/vi'); // redirects to home after login

    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### Step 6.2 - Auth E2E Tests

File: `apps/web/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/vi/auth/register');

    await page.fill('[name="fullName"]', 'E2E Test User');
    await page.fill('[name="email"]', `e2e-${Date.now()}@test.vn`);
    await page.fill('[name="password"]', 'TestPass123!');

    await page.click('button[type="submit"]');

    // Should redirect to home or show success message
    await expect(page).toHaveURL(/\/(vi|en)/);
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/vi/auth/login');

    await page.fill('[name="email"]', 'test@enzara.vn');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // Should redirect and show user indicator
    await expect(page).toHaveURL('/vi');
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/vi/auth/login');

    await page.fill('[name="email"]', 'wrong@enzara.vn');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[role="alert"], .error, .toast')).toBeVisible();
  });
});
```

### Step 6.3 - Product Browsing E2E Tests

File: `apps/web/e2e/products.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Product Browsing', () => {
  test('homepage should display products', async ({ page }) => {
    await page.goto('/vi');

    // Should have product cards on homepage
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
  });

  test('should navigate to product detail', async ({ page }) => {
    await page.goto('/vi');

    // Click first product card
    await page.locator('[data-testid="product-card"] a').first().click();

    // Should be on product detail page
    await expect(page).toHaveURL(/\/vi\/products\/.+/);
    // Should show product name
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/vi/products');

    // Click a category filter (adjust selector based on actual UI)
    const categoryLink = page.locator('[data-testid="category-filter"]').first();
    if (await categoryLink.isVisible()) {
      await categoryLink.click();
      await expect(page).toHaveURL(/category|danh-muc/);
    }
  });
});
```

### Step 6.4 - Search E2E Tests

File: `apps/web/e2e/search.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('should open search modal and accept input', async ({ page }) => {
    await page.goto('/vi');

    // Click search trigger
    await page.locator('[data-testid="search-trigger"], button:has-text("Tìm")').first().click();

    // Search input should be visible
    const searchInput = page.locator('input[type="search"], input[placeholder*="tìm" i], input[placeholder*="search" i]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('kem dưỡng');
    await searchInput.press('Enter');

    // Should show results or navigate to search results page
    await expect(page).toHaveURL(/search|tim-kiem/);
  });

  test('should display search results', async ({ page }) => {
    await page.goto('/vi/products?search=kem');

    // Should show at least one result or a "no results" message
    const hasResults = await page.locator('[data-testid="product-card"]').count();
    const hasNoResults = await page.locator('text=/không tìm thấy|no results/i').count();
    expect(hasResults + hasNoResults).toBeGreaterThan(0);
  });
});
```

### Step 6.5 - Cart + Checkout E2E Tests

File: `apps/web/e2e/checkout.spec.ts`

```typescript
import { test, expect } from './fixtures/auth.fixture';

test.describe('Cart & Checkout', () => {
  test('should add product to cart and see cart badge update', async ({ page }) => {
    await page.goto('/vi');

    // Click add to cart on first product
    await page.locator('[data-testid="add-to-cart"]').first().click();

    // Cart badge should show count
    const badge = page.locator('[data-testid="cart-badge"]');
    await expect(badge).toHaveText(/[1-9]/);
  });

  test('should view cart and see added items', async ({ page }) => {
    // Add item first
    await page.goto('/vi');
    await page.locator('[data-testid="add-to-cart"]').first().click();

    // Navigate to cart
    await page.goto('/vi/cart');

    // Should show cart items
    await expect(page.locator('[data-testid="cart-item"]').first()).toBeVisible();
  });

  test('should proceed to checkout with shipping form', async ({ authenticatedPage }) => {
    // Pre-seed cart via localStorage
    await authenticatedPage.evaluate(() => {
      const cartData = {
        state: {
          items: [{
            productId: 'test-prod-1',
            name: 'Test Product',
            image: '/img.jpg',
            price: 100000,
            quantity: 1,
            maxQuantity: 10,
          }],
          voucherCode: null,
          voucherDiscount: 0,
        },
        version: 0,
      };
      localStorage.setItem('enzara-cart', JSON.stringify(cartData));
    });

    await authenticatedPage.goto('/vi/checkout');

    // Fill shipping form
    await authenticatedPage.fill('[name="fullName"]', 'Test User');
    await authenticatedPage.fill('[name="phone"]', '0901234567');
    await authenticatedPage.fill('[name="address"]', '123 Le Loi, Q1, HCMC');

    // Should show order summary
    await expect(authenticatedPage.locator('text=/100\.000|tổng/i')).toBeVisible();
  });

  test('should apply voucher code', async ({ authenticatedPage }) => {
    // Pre-seed cart
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('enzara-cart', JSON.stringify({
        state: { items: [{ productId: 'p1', name: 'P', image: '', price: 200000, quantity: 1, maxQuantity: 10 }], voucherCode: null, voucherDiscount: 0 },
        version: 0,
      }));
    });

    await authenticatedPage.goto('/vi/checkout');

    // Enter voucher code
    const voucherInput = authenticatedPage.locator('[data-testid="voucher-input"] input, input[placeholder*="voucher" i], input[placeholder*="mã" i]');
    await voucherInput.fill('TESTCODE');
    await authenticatedPage.locator('[data-testid="apply-voucher"], button:has-text("Áp dụng")').click();

    // Should show success or error message
    await expect(authenticatedPage.locator('[role="alert"], .toast, .voucher-message')).toBeVisible();
  });
});
```

### Step 6.6 - i18n E2E Tests

File: `apps/web/e2e/i18n.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
  test('should display Vietnamese content by default', async ({ page }) => {
    await page.goto('/vi');

    // Check for Vietnamese text content
    await expect(page.locator('body')).toContainText(/Trang chủ|Sản phẩm|Giỏ hàng/);
  });

  test('should switch to English and back', async ({ page }) => {
    await page.goto('/vi');

    // Click language switcher
    await page.locator('[data-testid="language-switcher"]').click();

    // Select English
    await page.locator('text=/English|EN/i').click();

    // URL should change to /en
    await expect(page).toHaveURL(/\/en/);

    // Content should be in English
    await expect(page.locator('body')).toContainText(/Home|Products|Cart/);
  });
});
```

### Step 6.7 - Order Tracking E2E Test

File: `apps/web/e2e/order-tracking.spec.ts`

```typescript
import { test, expect } from './fixtures/auth.fixture';

test.describe('Order Tracking', () => {
  test('should display order status for authenticated user', async ({ authenticatedPage }) => {
    // Navigate to orders page
    await authenticatedPage.goto('/vi/orders');

    // Should show orders list or empty state
    const hasOrders = await authenticatedPage.locator('[data-testid="order-item"]').count();
    const hasEmpty = await authenticatedPage.locator('text=/chưa có|no orders/i').count();
    expect(hasOrders + hasEmpty).toBeGreaterThan(0);
  });
});
```

## Todo List

- [ ] Decide on test database strategy (separate DB, seed script, or API mocking)
- [ ] Update playwright.config.ts for dual webServer if needed (Step 6.0)
- [ ] Add `data-testid` attributes to key components (before or during test writing)
- [ ] Create auth fixture (Step 6.1)
- [ ] Write auth E2E tests (Step 6.2)
- [ ] Write product browsing tests (Step 6.3)
- [ ] Write search tests (Step 6.4)
- [ ] Write checkout tests (Step 6.5)
- [ ] Write i18n tests (Step 6.6)
- [ ] Write order tracking tests (Step 6.7)
- [ ] Run full E2E suite locally: `pnpm --filter @enzara/web test:e2e`
- [ ] Verify CI pipeline runs E2E successfully

## Success Criteria

1. All 6 E2E spec files running with Playwright
2. ~15 E2E scenarios total
3. Tests pass on Chromium in CI (GitHub Actions ubuntu-latest)
4. Total E2E suite completes in <2 minutes
5. Screenshots captured on failure for debugging
6. No hardcoded waits (use Playwright auto-waiting)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| E2E tests flaky due to timing/network | High | High | Use Playwright auto-waiting, increase timeouts, add retries in CI |
| Test database not seeded properly | Medium | High | Create idempotent seed script; run before test suite |
| API not running when Playwright starts | Medium | High | Use webServer array config with health check URLs |
| Email verification blocks registration E2E | High | Medium | Use test account with pre-verified email, or disable verification in test env |
| localStorage seeding format mismatch with Zustand persist | Medium | Medium | Match exact Zustand persist serialization format |
| CI lacks Chromium dependencies | Low | High | Use `playwright install --with-deps chromium` in CI |

## Security Considerations

- E2E test database must be isolated; never run against production
- Test user credentials must be clearly fake and only valid in test env
- Do not commit `.env.test` with real secrets to version control
- Playwright traces may contain sensitive page content; excluded from git via `.gitignore`

## Next Steps

Phase 6 is the final phase. Upon completion, the full testing pyramid is in place:
- **Unit tests** (Phases 2, 4): Fast, isolated, high coverage
- **Integration tests** (Phase 3): HTTP contract validation
- **Component tests** (Phase 5): UI rendering and interaction
- **E2E tests** (Phase 6): Full user journey validation

Post-completion considerations:
1. Set coverage thresholds (e.g., 70% for new code)
2. Add pre-commit hook to run affected tests
3. Add test badges to README
4. Consider visual regression testing with Playwright screenshots
