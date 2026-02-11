# Phase 3: API Integration Tests (HTTP/Supertest)

## Context

- **Parent plan:** [plan.md](./plan.md)
- **Dependencies:** [Phase 1](./phase-01.md) (config), [Phase 2](./phase-02.md) (unit tests for service logic)
- **Research:** [researcher-01](./research/researcher-01-report.md) (Supertest + NestJS, SePay webhook integration)
- **Scout:** [scout-01](./scout/scout-01-report.md) (controller inventory)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Description | Integration test key HTTP endpoints using Supertest. Tests boot a real NestJS app instance with mocked providers (Prisma, Redis, email). Validates request/response contracts, guards, validation pipes, error handling. |
| Priority | P1 |
| Implementation status | pending |
| Review status | pending |

## Key Insights

- Controllers use decorators: `@UseGuards(JwtAuthGuard)`, `@Roles('ADMIN')`, validation pipes
- Public endpoints exist on separate controllers (e.g., `products-public.controller.ts`, `orders-public.controller.ts`)
- SePay webhook controller likely has its own guard or signature check middleware
- All controllers return JSON responses; error responses follow NestJS `{ statusCode, message, error }` format
- ThrottlerGuard is global -- must be overridden or disabled in integration tests

## Requirements

1. Auth endpoints: login, register, verify-email (4-5 tests)
2. Product endpoints: list, detail by slug (3-4 tests)
3. Order endpoints: create order, get order (4-5 tests)
4. Webhook endpoint: SePay payment callback (3-4 tests)
5. Validate guards block unauthorized access
6. Validate validation pipes reject bad input

## Architecture

```
apps/api/test/
  integration/
    auth.integration.spec.ts ....... Auth endpoint tests
    products.integration.spec.ts ... Product endpoint tests
    orders.integration.spec.ts ..... Order endpoint tests
    webhooks.integration.spec.ts ... SePay webhook tests
  app-factory.ts ................... Shared app bootstrap helper
```

## Related Code Files

- `Z:\Web-enzara\apps\api\src\modules\auth\auth.controller.ts`
- `Z:\Web-enzara\apps\api\src\modules\products\products-public.controller.ts`
- `Z:\Web-enzara\apps\api\src\modules\orders\orders.controller.ts`
- `Z:\Web-enzara\apps\api\src\modules\orders\orders-public.controller.ts`
- `Z:\Web-enzara\apps\api\src\modules\payments\sepay\sepay-webhook.controller.ts`
- `Z:\Web-enzara\apps\api\src\app.module.ts`
- `Z:\Web-enzara\apps\api\src\common\filters\http-exception.filter.ts`
- `Z:\Web-enzara\apps\api\src\modules\auth\guards\jwt-auth.guard.ts`

## Implementation Steps

### Step 3.1 - Create shared app factory

File: `apps/api/test/app-factory.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { prismaMock } from './prisma-mock';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Create a fully bootstrapped NestJS app with mocked external dependencies.
 * Mirrors production bootstrap (validation pipes, filters) but uses mock DB.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true }) // Disable rate limiting in tests
    .compile();

  const app = moduleFixture.createNestApplication();

  // Mirror production setup
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  await app.init();
  return app;
}
```

**Note:** If AppModule imports modules that connect to Redis, those providers also need overriding. Check the actual AppModule imports and override CacheModule/BullMQ providers as needed.

### Step 3.2 - Auth Integration Tests

File: `apps/api/test/integration/auth.integration.spec.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { createTestApp } from '../app-factory';
import { prismaMock } from '../prisma-mock';

describe('Auth Endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with access token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@enzara.vn',
        password: hashedPassword,
        isActive: true,
        role: 'CUSTOMER',
      } as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@enzara.vn', password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'no@enzara.vn', password: 'wrong' })
        .expect(401);
    });

    it('should return 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 with access token for valid registration', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'new-user',
        email: 'new@enzara.vn',
        role: 'CUSTOMER',
      } as any);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'new@enzara.vn',
          password: 'StrongPass1!',
          fullName: 'New User',
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('should return 409 for duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'existing@enzara.vn',
          password: 'StrongPass1!',
          fullName: 'Dup User',
        })
        .expect(409);
    });
  });
});
```

### Step 3.3 - Product Integration Tests

File: `apps/api/test/integration/products.integration.spec.ts`

```typescript
describe('Product Endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });

  describe('GET /api/products', () => {
    it('should return paginated product list', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        { id: '1', name: 'Product 1', slug: 'product-1' },
      ] as any);
      prismaMock.product.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support pagination query params', async () => {
      prismaMock.product.findMany.mockResolvedValue([] as any);
      prismaMock.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/products?page=2&limit=10')
        .expect(200);

      // Verify Prisma was called with skip/take
      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('GET /api/products/:slug', () => {
    it('should return product detail for valid slug', async () => {
      prismaMock.product.findFirst.mockResolvedValue({
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        variants: [],
        images: [],
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/products/test-product')
        .expect(200);

      expect(res.body.slug).toBe('test-product');
    });

    it('should return 404 for non-existent slug', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/products/non-existent')
        .expect(404);
    });
  });
});
```

### Step 3.4 - Order Integration Tests

File: `apps/api/test/integration/orders.integration.spec.ts`

Key tests:
```
describe('Order Endpoints')
  describe('POST /api/orders')
    - should create order for authenticated user (need JWT in header)
    - should return 401 for unauthenticated request
    - should return 400 for invalid order data
  describe('GET /api/orders/:id')
    - should return order detail for order owner
    - should return 403 for non-owner access
    - should return 404 for non-existent order
```

**Auth helper:** For protected endpoints, generate a real JWT using JwtService from the test module, or mock the JwtAuthGuard to extract user from a test token.

```typescript
// Helper to get auth header
function getAuthHeader(userId: string, role = 'CUSTOMER'): string {
  // Use the test app's JwtService to sign a real token
  // Or override JwtAuthGuard to accept a test header
  return `Bearer test-token-${userId}`;
}
```

### Step 3.5 - Webhook Integration Tests

File: `apps/api/test/integration/webhooks.integration.spec.ts`

```typescript
import crypto from 'crypto';

describe('SePay Webhook', () => {
  let app: INestApplication;

  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });

  describe('POST /api/webhooks/sepay', () => {
    it('should process valid webhook with correct signature', async () => {
      const payload = {
        id: 12345,
        transferAmount: 500000,
        content: 'ENZARA ORDER-001',
        // ... match SePay webhook format
      };

      // Generate valid signature (read actual implementation to know header name)
      const signature = crypto
        .createHmac('sha256', 'test-webhook-secret')
        .update(JSON.stringify(payload))
        .digest('hex');

      prismaMock.order.findFirst.mockResolvedValue({
        id: 'ORDER-001',
        totalAmount: 500000,
        paymentStatus: 'PENDING',
      } as any);
      prismaMock.order.update.mockResolvedValue({} as any);

      await request(app.getHttpServer())
        .post('/api/webhooks/sepay')
        .set('X-Signature', signature) // verify actual header name
        .send(payload)
        .expect(200);
    });

    it('should reject webhook with invalid signature', async () => {
      await request(app.getHttpServer())
        .post('/api/webhooks/sepay')
        .set('X-Signature', 'invalid-signature')
        .send({ amount: 500000 })
        .expect(401);
    });

    it('should handle duplicate webhook idempotently', async () => {
      // Mock order already paid
      prismaMock.order.findFirst.mockResolvedValue({
        id: 'ORDER-001',
        paymentStatus: 'PAID',
      } as any);

      // Should return 200 (idempotent) not error
      await request(app.getHttpServer())
        .post('/api/webhooks/sepay')
        .set('X-Signature', 'valid-sig')
        .send({ content: 'ENZARA ORDER-001', transferAmount: 500000 })
        .expect(200);
    });
  });
});
```

**Important:** Before implementing, read `sepay-webhook.controller.ts` and `sepay.service.ts` to determine:
- Exact webhook payload shape (SePay API docs)
- Which header carries the signature
- How order matching works (content field parsing?)

## Todo List

- [ ] Read all target controller files to confirm route paths and decorators
- [ ] Read AppModule to identify all providers that need overriding
- [ ] Create app-factory.ts (Step 3.1)
- [ ] Write auth integration tests (Step 3.2)
- [ ] Write product integration tests (Step 3.3)
- [ ] Write order integration tests (Step 3.4)
- [ ] Write webhook integration tests (Step 3.5)
- [ ] Run all integration tests and verify pass
- [ ] Verify tests clean up (app.close) properly

## Success Criteria

1. All 4 integration spec files passing
2. ~16-18 integration test cases total
3. App bootstrap time <3 seconds per suite
4. No real DB or Redis connections made during tests
5. Tests validate both success and error HTTP status codes
6. Validation pipe correctly rejects malformed requests

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AppModule has too many transitive dependencies to mock | High | High | Override individual providers rather than importing full AppModule; or create a TestAppModule with only needed modules |
| ThrottlerGuard blocks test requests | Medium | Medium | Override globally in app-factory.ts |
| JWT guard prevents testing protected routes | Medium | Medium | Override JwtAuthGuard or generate test tokens via JwtService |
| Redis/BullMQ modules fail to initialize without connection | High | High | Override CacheModule and BullMQ queue providers in app-factory |

## Security Considerations

- Integration tests must not connect to any real database
- Test JWT tokens should use a separate secret from production
- Webhook signature tests should use dummy secrets
- Do not log sensitive data in test output

## Next Steps

Phase 3 completion means full API test coverage (unit + integration). Move to Phase 4 for frontend testing or Phase 6 for E2E if frontend testing is lower priority.
