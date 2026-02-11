# Phase 1: Framework Setup & Config

## Context

- **Parent plan:** [plan.md](./plan.md)
- **Dependencies:** None (this is the foundation phase)
- **Research:** [researcher-01](./research/researcher-01-report.md), [researcher-02](./research/researcher-02-report.md)
- **Scout:** [scout-01](./scout/scout-01-report.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Description | Install all test dependencies, create Vitest configs for API and Web, create Playwright config, set up mocks and test helpers, wire Turborepo pipeline, update CI |
| Priority | P0 - blocker for all other phases |
| Implementation status | pending |
| Review status | pending |

## Key Insights

- `@nestjs/testing ^10.4.0` already in API devDeps -- no need to install
- Turbo uses `tasks` key (not `pipeline`) in current turbo.json schema
- API uses `commonjs` module + decorators -- requires `unplugin-swc` for Vitest
- Web uses path alias `@/* -> ./src/*` -- must mirror in vitest resolve.alias
- Messages live at `apps/web/src/messages/{vi,en}.json` for next-intl
- PrismaService extends PrismaClient directly -- mock via `vitest-mock-extended`

## Requirements

1. Install test dependencies in `apps/api`, `apps/web`, `packages/utils`, and root
2. Create `vitest.config.ts` in `apps/api` and `apps/web`
3. Create `playwright.config.ts` in `apps/web`
4. Create test setup files: prisma mock, redis mock, next-intl wrapper, jsdom setup
5. Add `test`, `test:unit`, `test:e2e` scripts to relevant package.json files
6. Add `test`, `test:unit`, `test:e2e` tasks to `turbo.json`
7. Add test job to `.github/workflows/ci.yml`

## Architecture

```
monorepo root
  turbo.json .............. + test, test:unit, test:e2e tasks
  package.json ............ + test scripts
  .github/workflows/ci.yml + test job

apps/api/
  vitest.config.ts ........ NEW (unplugin-swc, globals, setup)
  test/
    setup.ts .............. NEW (global hooks)
    prisma-mock.ts ........ NEW (vitest-mock-extended DeepMockProxy)
    redis-mock.ts ......... NEW (ioredis-mock factory)
    helpers.ts ............ NEW (createTestingModule helper)
  package.json ............ + devDeps, + test scripts

apps/web/
  vitest.config.ts ........ NEW (@vitejs/plugin-react, jsdom, aliases)
  playwright.config.ts .... NEW (chromium, webServer)
  tests/
    setup.ts .............. NEW (jest-dom, cleanup, next mocks)
    render-with-intl.tsx .. NEW (NextIntlClientProvider wrapper)
  package.json ............ + devDeps, + test scripts

packages/utils/
  vitest.config.ts ........ NEW (minimal, no plugins)
  package.json ............ + devDeps, + test script
```

## Related Code Files

- `Z:\Web-enzara\turbo.json`
- `Z:\Web-enzara\package.json`
- `Z:\Web-enzara\.github\workflows\ci.yml`
- `Z:\Web-enzara\apps\api\package.json`
- `Z:\Web-enzara\apps\api\tsconfig.json`
- `Z:\Web-enzara\apps\web\package.json`
- `Z:\Web-enzara\apps\web\tsconfig.json`
- `Z:\Web-enzara\packages\utils\package.json`
- `Z:\Web-enzara\apps\api\src\common\services\prisma.service.ts`

## Implementation Steps

### Step 1.1 - Install API test dependencies

```bash
cd apps/api
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 @swc/core unplugin-swc vitest-mock-extended ioredis-mock supertest @types/supertest
```

### Step 1.2 - Install Web test dependencies

```bash
cd apps/web
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test
```

Then install Playwright browsers:
```bash
npx playwright install --with-deps chromium
```

### Step 1.3 - Install packages/utils test dependencies

```bash
cd packages/utils
pnpm add -D vitest
```

### Step 1.4 - Create `apps/api/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.module.ts', 'src/**/*.dto.ts', 'src/main.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
```

### Step 1.5 - Create `apps/api/test/setup.ts`

```typescript
import { beforeEach } from 'vitest';

// Global test setup for API
// Individual mocks (prisma, redis) are imported per-test
beforeEach(() => {
  // Reset any global state between tests
});
```

### Step 1.6 - Create `apps/api/test/prisma-mock.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { beforeEach } from 'vitest';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});
```

### Step 1.7 - Create `apps/api/test/redis-mock.ts`

```typescript
import RedisMock from 'ioredis-mock';

export function createRedisMock() {
  return new RedisMock();
}
```

### Step 1.8 - Create `apps/api/test/helpers.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/common/services/prisma.service';
import { prismaMock } from './prisma-mock';
import { ModuleMetadata } from '@nestjs/common';

/**
 * Create a NestJS testing module with PrismaService already mocked.
 * Pass additional providers/imports via `metadata`.
 */
export async function createTestModule(
  metadata: ModuleMetadata,
): Promise<TestingModule> {
  return Test.createTestingModule({
    ...metadata,
    providers: [
      ...(metadata.providers || []),
      { provide: PrismaService, useValue: prismaMock },
    ],
  }).compile();
}
```

### Step 1.9 - Create `apps/web/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/app/**/layout.tsx', 'src/app/**/page.tsx'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Step 1.10 - Create `apps/web/tests/setup.ts`

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Auto-cleanup after each test
afterEach(() => cleanup());

// Mock next/navigation globally
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return props;
  },
}));
```

### Step 1.11 - Create `apps/web/tests/render-with-intl.tsx`

```tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import viMessages from '@/messages/vi.json';
import enMessages from '@/messages/en.json';

const messages: Record<string, Record<string, unknown>> = {
  vi: viMessages,
  en: enMessages,
};

interface IntlRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: 'vi' | 'en';
}

export function renderWithIntl(
  ui: React.ReactElement,
  { locale = 'vi', ...options }: IntlRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
```

### Step 1.12 - Create `apps/web/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### Step 1.13 - Create `packages/utils/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
```

### Step 1.14 - Add test scripts to `apps/api/package.json`

Add to `scripts`:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage"
}
```

### Step 1.15 - Add test scripts to `apps/web/package.json`

Add to `scripts`:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

### Step 1.16 - Add test script to `packages/utils/package.json`

Add to `scripts`:
```json
{
  "test": "vitest run"
}
```

### Step 1.17 - Add root test scripts to `package.json`

Add to `scripts`:
```json
{
  "test": "turbo run test",
  "test:unit": "turbo run test",
  "test:e2e": "turbo run test:e2e"
}
```

### Step 1.18 - Update `turbo.json` with test tasks

Add these tasks to the existing `tasks` object:

```json
{
  "test": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"],
    "inputs": ["src/**", "test/**", "tests/**", "vitest.config.ts"],
    "cache": true
  },
  "test:e2e": {
    "dependsOn": ["build"],
    "outputs": ["playwright-report/**", "test-results/**"],
    "cache": false
  }
}
```

### Step 1.19 - Update `.github/workflows/ci.yml`

Add a `test` job after the existing `build` job:

```yaml
  test:
    runs-on: ubuntu-latest
    needs: build

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm run test

  e2e:
    runs-on: ubuntu-latest
    needs: build

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: pnpm run test:e2e
```

### Step 1.20 - Add test directories to .gitignore (if not already present)

Ensure these are ignored:
```
coverage/
playwright-report/
test-results/
```

### Step 1.21 - Verify setup with a smoke test

Create `packages/utils/src/currency.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { formatVND, formatVNDCompact } from './currency';

describe('formatVND', () => {
  it('should format zero', () => {
    const result = formatVND(0);
    expect(result).toContain('0');
  });
});

describe('formatVNDCompact', () => {
  it('should append dong symbol', () => {
    const result = formatVNDCompact(85000);
    expect(result).toContain('d');
  });
});
```

Run: `pnpm --filter @enzara/utils test` to validate the pipeline works.

## Todo List

- [ ] Install API test deps (Step 1.1)
- [ ] Install Web test deps (Step 1.2)
- [ ] Install packages/utils test deps (Step 1.3)
- [ ] Create API vitest.config.ts (Step 1.4)
- [ ] Create API test setup files (Steps 1.5-1.8)
- [ ] Create Web vitest.config.ts (Step 1.9)
- [ ] Create Web test setup files (Steps 1.10-1.11)
- [ ] Create Playwright config (Step 1.12)
- [ ] Create packages/utils vitest.config.ts (Step 1.13)
- [ ] Add test scripts to all package.json files (Steps 1.14-1.17)
- [ ] Update turbo.json (Step 1.18)
- [ ] Update CI workflow (Step 1.19)
- [ ] Update .gitignore (Step 1.20)
- [ ] Verify with smoke test (Step 1.21)

## Success Criteria

1. `pnpm --filter @enzara/utils test` passes the smoke test
2. `pnpm --filter @enzara/api test` runs (0 tests, no errors)
3. `pnpm --filter @enzara/web test` runs (0 tests, no errors)
4. `pnpm run test` executes all workspace tests via Turborepo
5. CI workflow runs test job successfully

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `unplugin-swc` incompatible with NestJS decorator metadata | Low | High | Fallback: use `@swc/core` with `.swcrc` config |
| `vitest-mock-extended` incompatible with Prisma 6.3.0 | Medium | High | Fallback: use `jest-mock-extended` (Vitest-compatible) |
| `jsdom` missing APIs for Radix UI components | Medium | Medium | Use `happy-dom` as alternative |
| Turbo cache invalidation not working for test files | Low | Low | Add explicit `inputs` array |

## Security Considerations

- Test env must never connect to production database
- Supertest integration tests must use mocked/in-memory providers
- `.env.test` should be added to `.gitignore` if created
- Never commit real API keys or secrets in test fixtures

## Next Steps

After Phase 1 is complete, Phase 2 (API Unit Tests), Phase 4 (Web Unit Tests), and Phase 6 (E2E Tests) can all begin in parallel since they only depend on this phase.
