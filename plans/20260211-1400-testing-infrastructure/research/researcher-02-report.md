# Testing Infrastructure Research Report

## 1. Vitest with Next.js 15 App Router

### Configuration for Next.js 15 + React 19 + Server Components

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib')
    }
  }
})
```

**Key Points**
- Use `@vitejs/plugin-react` for React 19 support
- Server Components require separate testing approach (unit test server actions directly)
- Path aliases must mirror tsconfig.json paths
- React 19 requires `@testing-library/react` ^14.0.0

**Version Compatibility**
- Next.js 15.x
- Vitest ^2.0.0
- @vitejs/plugin-react ^4.3.0
- React 19

## 2. React Testing Library with Vitest

### Client Component Testing

**tests/setup.ts**
```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => cleanup())

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))
```

### Mocking next-intl

**Test wrapper for next-intl**
```typescript
import { NextIntlClientProvider } from 'next-intl'
import { render } from '@testing-library/react'

const renderWithIntl = (component: React.ReactElement, locale = 'en') => {
  const messages = require(`@/locales/${locale}.json`)

  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {component}
    </NextIntlClientProvider>
  )
}
```

### Mocking next/navigation

```typescript
import { vi } from 'vitest'

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams('?foo=bar'),
}))
```

## 3. Zustand Store Testing with Vitest

### Best Practices for Store Testing

**cartStore.test.ts**
```typescript
import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from '@/store/cartStore'

describe('cartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({ items: [], total: 0 })
  })

  it('should add item to cart', () => {
    const { addItem } = useCartStore.getState()

    addItem({ id: '1', name: 'Product', price: 100, quantity: 1 })

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('1')
  })

  it('should calculate total correctly', () => {
    const { addItem, total } = useCartStore.getState()

    addItem({ id: '1', price: 100, quantity: 2 })
    addItem({ id: '2', price: 50, quantity: 1 })

    expect(useCartStore.getState().total).toBe(250)
  })
})
```

### Key Patterns
- Reset state in `beforeEach` using `setState`
- Use `getState()` to access store directly (no React required)
- Test actions and selectors separately
- Test persistence separately if using middleware

## 4. Playwright for Next.js E2E

### Configuration

**playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Testing i18n Routes

```typescript
import { test, expect } from '@playwright/test'

test.describe('i18n routing', () => {
  test('should navigate between locales', async ({ page }) => {
    await page.goto('/en')
    expect(await page.textContent('h1')).toBe('Welcome')

    await page.goto('/fr')
    expect(await page.textContent('h1')).toBe('Bienvenue')
  })
})
```

### Testing Auth Flows with Fixtures

```typescript
import { test as base } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
}

const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await use(page)
  },
})

test('should access protected route', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/profile')
  await expect(authenticatedPage).toHaveURL('/profile')
})
```

### Testing Checkout Flow

```typescript
test('complete checkout flow', async ({ page }) => {
  await page.goto('/products')
  await page.click('[data-testid="add-to-cart"]')
  await page.goto('/cart')
  await page.click('[data-testid="checkout"]')
  await page.fill('[name="name"]', 'John Doe')
  await page.fill('[name="email"]', 'john@example.com')
  await page.click('[data-testid="place-order"]')
  await expect(page).toHaveURL(/\/order\/.*/)
})
```

## 5. Turborepo Test Pipeline

### turbo.json Configuration

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**", "tests/**", "vitest.config.ts"],
      "cache": true
    },
    "test:unit": {
      "dependsOn": [],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**", "test-results/**"],
      "cache": false
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "cache": true
    }
  }
}
```

### Workspace-Specific Test Commands

**package.json (root)**
```json
{
  "scripts": {
    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "test:e2e": "turbo run test:e2e"
  }
}
```

### Key Strategies
- Use `dependsOn: ["^build"]` for tests requiring built artifacts
- Separate unit and E2E tests (different cache strategies)
- Cache unit test results, avoid caching E2E (environment-dependent)
- Use `inputs` to invalidate cache when test files change
- Parallel execution across workspaces with `--concurrency` flag

### Running Tests Efficiently

```bash
# Run all tests across workspaces
turbo test

# Run only changed workspaces
turbo test --filter=[HEAD^1]

# Force re-run without cache
turbo test --force

# Run with specific concurrency
turbo test --concurrency=3
```

## Summary

Testing infrastructure for Next.js 15 with Turborepo requires:
1. Vitest config with proper React 19 + App Router support
2. Mock next-intl and next/navigation for component tests
3. Direct state testing for Zustand stores
4. Playwright fixtures for auth/checkout E2E flows
5. Smart Turborepo pipeline with cache optimization

Critical: Server Components need separate testing strategy from client components.
