# Testing Infrastructure Research Report

## 1. Vitest with NestJS Configuration

### Setup
Install dependencies:
```bash
npm i -D vitest @vitest/ui @swc/core unplugin-swc
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    setupFiles: ['./test/setup.ts'],
  },
  plugins: [swc.vite()],
});
```

### Using @nestjs/testing
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'vitest';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

**Key Points:**
- Use `unplugin-swc` for fast TypeScript transformation
- `@nestjs/testing` works identically with Vitest as with Jest
- Set `globals: true` to avoid importing test functions
- Compatible with NestJS 9.x, 10.x (2025-2026)

## 2. Prisma Mocking in Vitest

### Recommended Approach (2025-2026): vitest-mock-extended

```typescript
// test/prisma-mock.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { beforeEach } from 'vitest';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});
```

### Mock in Tests
```typescript
// user.service.spec.ts
import { vi } from 'vitest';
import { prismaMock } from '../test/prisma-mock';
import { PrismaService } from './prisma.service';

vi.mock('./prisma.service', () => ({
  PrismaService: vi.fn().mockImplementation(() => prismaMock),
}));

describe('UserService', () => {
  it('should find user', async () => {
    const mockUser = { id: 1, email: 'test@test.com' };
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await service.findOne(1);
    expect(result).toEqual(mockUser);
  });
});
```

### Alternative: jest-mock-extended
```typescript
import { mockDeep } from 'jest-mock-extended';
// Works with Vitest, widely adopted, more stable
```

**Recommendation:** Use `vitest-mock-extended` for native Vitest support. Fallback to `jest-mock-extended` if compatibility issues arise.

**Versions:** vitest-mock-extended@2.x, Prisma 5.x+ (2025-2026)

## 3. Redis/BullMQ Mocking

### ioredis Mock
```typescript
// test/redis-mock.ts
import { vi } from 'vitest';
import RedisMock from 'ioredis-mock';

export const createRedisMock = () => new RedisMock();
```

### BullMQ Queue Mock
```typescript
import { Queue } from 'bullmq';
import { vi } from 'vitest';

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: '1' }),
    process: vi.fn(),
    close: vi.fn(),
  })),
  Worker: vi.fn(),
}));
```

### NestJS BullMQ Testing
```typescript
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';

const mockQueue = {
  add: vi.fn(),
  process: vi.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    EmailService,
    {
      provide: getQueueToken('email'),
      useValue: mockQueue,
    },
  ],
}).compile();
```

**Packages:** ioredis-mock@8.x, bullmq@5.x (2025-2026)

## 4. Supertest with NestJS + Vitest

### Setup
```bash
npm i -D supertest @types/supertest
```

### Integration Test Example
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(0);
      });
  });
});
```

**Key Points:**
- Supertest works identically with Vitest as with Jest
- Use `beforeAll/afterAll` for app lifecycle
- No configuration changes needed

## 5. SePay Webhook Testing

### Signature Verification
```typescript
import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Unit Test
```typescript
import { describe, it, expect } from 'vitest';

describe('Webhook Signature Verification', () => {
  const secret = 'test-secret';

  it('should verify valid signature', () => {
    const payload = JSON.stringify({ amount: 1000 });
    const hmac = crypto.createHmac('sha256', secret);
    const signature = hmac.update(payload).digest('hex');

    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should reject invalid signature', () => {
    const payload = JSON.stringify({ amount: 1000 });
    const invalidSignature = 'invalid-sig';

    expect(verifyWebhookSignature(payload, invalidSignature, secret)).toBe(false);
  });
});
```

### Integration Test with Supertest
```typescript
it('POST /webhooks/sepay - valid signature', async () => {
  const payload = { transaction_id: '123', amount: 1000 };
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', process.env.SEPAY_SECRET)
    .update(payloadString)
    .digest('hex');

  return request(app.getHttpServer())
    .post('/webhooks/sepay')
    .set('X-Signature', signature)
    .send(payload)
    .expect(200);
});
```

**Security:** Always use `crypto.timingSafeEqual` to prevent timing attacks.

## Version Compatibility Summary
- Vitest: 2.x (2025-2026)
- NestJS: 9.x, 10.x
- Prisma: 5.x+
- vitest-mock-extended: 2.x
- ioredis-mock: 8.x
- BullMQ: 5.x
- Supertest: 7.x
- Node.js: 18+, 20+ (LTS)
