# Phase 2: API Unit Tests (Critical Business Logic)

## Context

- **Parent plan:** [plan.md](./plan.md)
- **Dependencies:** [Phase 1](./phase-01.md) must be complete
- **Research:** [researcher-01](./research/researcher-01-report.md) (Prisma mock, NestJS testing, BullMQ mock)
- **Scout:** [scout-01](./scout/scout-01-report.md) (service inventory)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Description | Unit test the 6 highest-risk API services: Auth, Orders, Payments/SePay, Vouchers, Loyalty, Products. All use mocked Prisma, mocked Redis, mocked external services. |
| Priority | P0 |
| Implementation status | pending |
| Review status | pending |

## Key Insights

- AuthService depends on PrismaService, JwtService, ConfigService, EmailService, LoyaltyService (forwardRef)
- All services use `this.prisma.<model>.<method>` -- every call is mockable via `prismaMock`
- SePay webhook uses HMAC-SHA256 signature verification
- OrdersService likely calculates totals, manages status transitions (state machine)
- VouchersService has time-based expiry logic -- test with fake dates via `vi.useFakeTimers()`
- LoyaltyService has tier calculation logic -- needs edge case testing at tier boundaries

## Requirements

1. ~10 test cases for AuthService (login, register, password hashing, JWT, email verify, inactive account)
2. ~12 test cases for OrdersService (create, status transitions, total calculation, invalid states)
3. ~10 test cases for PaymentsService + SepayService (webhook verify, payment processing, idempotency)
4. ~8 test cases for VouchersService (validate, redeem, expired, usage limits)
5. ~8 test cases for LoyaltyService (earn points, redeem points, tier upgrade, insufficient points)
6. ~8 test cases for ProductsService (CRUD, inventory check, slug generation, variant handling)

## Architecture

```
apps/api/src/modules/
  auth/
    auth.service.spec.ts ............ NEW (~10 tests)
  orders/
    orders.service.spec.ts .......... NEW (~12 tests)
  payments/
    payments.service.spec.ts ........ NEW (~5 tests)
    sepay/
      sepay.service.spec.ts ......... NEW (~5 tests)
  marketing/
    vouchers.service.spec.ts ........ NEW (~8 tests)
  loyalty/
    loyalty.service.spec.ts ......... NEW (~8 tests)
  products/
    products.service.spec.ts ........ NEW (~8 tests)
```

## Related Code Files

- `Z:\Web-enzara\apps\api\src\modules\auth\auth.service.ts`
- `Z:\Web-enzara\apps\api\src\modules\orders\orders.service.ts`
- `Z:\Web-enzara\apps\api\src\modules\payments\payments.service.ts`
- `Z:\Web-enzara\apps\api\src\modules\payments\sepay\sepay.service.ts`
- `Z:\Web-enzara\apps\api\src\modules\marketing\vouchers.service.ts`
- `Z:\Web-enzara\apps\api\src\modules\loyalty\loyalty.service.ts`
- `Z:\Web-enzara\apps\api\src\modules\products\products.service.ts`
- `Z:\Web-enzara\apps\api\src\modules\auth\dto\index.ts`
- `Z:\Web-enzara\apps\api\src\common\services\prisma.service.ts`
- `Z:\Web-enzara\apps\api\test\prisma-mock.ts` (from Phase 1)
- `Z:\Web-enzara\apps\api\test\helpers.ts` (from Phase 1)

## Implementation Steps

### Step 2.1 - AuthService Unit Tests

File: `apps/api/src/modules/auth/auth.service.spec.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/services/prisma.service';
import { EmailService } from '../notifications/email.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { prismaMock } from '../../../test/prisma-mock';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('mock-jwt-token'),
    verifyAsync: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  const mockEmailService = {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
  };

  const mockLoyaltyService = {
    initializeLoyalty: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@enzara.vn',
        password: hashedPassword,
        isActive: true,
        role: 'CUSTOMER',
        // ... other fields as needed
      } as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      const result = await service.login({
        email: 'test@enzara.vn',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(prismaMock.user.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@enzara.vn',
        password: await bcrypt.hash('correct-password', 10),
        isActive: true,
      } as any);

      await expect(
        service.login({ email: 'test@enzara.vn', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@enzara.vn', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive account', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@enzara.vn',
        password: await bcrypt.hash('password123', 10),
        isActive: false,
      } as any);

      await expect(
        service.login({ email: 'test@enzara.vn', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create user and return tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'new-user',
        email: 'new@enzara.vn',
        role: 'CUSTOMER',
      } as any);

      const result = await service.register({
        email: 'new@enzara.vn',
        password: 'StrongPass1!',
        fullName: 'Test User',
      });

      expect(result).toHaveProperty('accessToken');
      expect(prismaMock.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

      await expect(
        service.register({
          email: 'existing@enzara.vn',
          password: 'StrongPass1!',
          fullName: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // Additional tests to implement:
  // - verifyEmail: valid token, expired token, already verified
  // - forgotPassword: sends email, user not found
  // - resetPassword: valid token, expired token, password updated
  // - refreshToken: valid refresh, expired refresh
});
```

**Pattern for remaining tests:** Read each service file, identify its constructor dependencies, mock them all, test happy path + error paths for each public method.

### Step 2.2 - OrdersService Unit Tests

File: `apps/api/src/modules/orders/orders.service.spec.ts`

Before writing, read `orders.service.ts` to identify:
- Constructor dependencies (PrismaService, and likely PaymentsService, EmailService, GhnShippingService)
- Public methods: `create`, `findAll`, `findOne`, `updateStatus`, `cancel`
- Status enum values (PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED)

Key test cases:
```
describe('OrdersService')
  describe('create')
    - should create order with correct total calculation
    - should validate stock availability before creating
    - should apply voucher discount to total
    - should throw BadRequest if cart is empty
    - should decrement product stock on creation
  describe('updateStatus')
    - should transition PENDING -> CONFIRMED
    - should transition CONFIRMED -> SHIPPING
    - should reject invalid transitions (e.g., DELIVERED -> PENDING)
    - should throw NotFoundException for invalid order ID
  describe('cancel')
    - should cancel PENDING order and restore stock
    - should reject cancellation of DELIVERED order
  describe('findOne')
    - should return order with items for valid ID
    - should throw NotFoundException for invalid ID
```

### Step 2.3 - PaymentsService + SepayService Unit Tests

File: `apps/api/src/modules/payments/payments.service.spec.ts`
File: `apps/api/src/modules/payments/sepay/sepay.service.spec.ts`

SePay-specific tests:
```typescript
import crypto from 'crypto';

describe('SepayService', () => {
  describe('verifyWebhookSignature', () => {
    it('should verify valid HMAC-SHA256 signature', () => {
      const secret = 'test-webhook-secret';
      const payload = JSON.stringify({ amount: 500000, transactionId: 'TXN001' });
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(service.verifySignature(payload, signature)).toBe(true);
    });

    it('should reject tampered payload', () => {
      const secret = 'test-webhook-secret';
      const payload = JSON.stringify({ amount: 500000 });
      const tamperedPayload = JSON.stringify({ amount: 1000000 });
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(service.verifySignature(tamperedPayload, signature)).toBe(false);
    });
  });

  describe('processWebhook', () => {
    it('should update order payment status on success', async () => { /* ... */ });
    it('should handle duplicate webhook (idempotency)', async () => { /* ... */ });
    it('should reject webhook with mismatched amount', async () => { /* ... */ });
  });
});
```

### Step 2.4 - VouchersService Unit Tests

File: `apps/api/src/modules/marketing/vouchers.service.spec.ts`

Key test cases with time mocking:
```typescript
describe('VouchersService', () => {
  describe('validate', () => {
    it('should validate active voucher with sufficient subtotal', async () => { /* ... */ });
    it('should reject expired voucher', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-01'));
      // voucher expired 2026-02-28
      // ... expect rejection
      vi.useRealTimers();
    });
    it('should reject voucher exceeding usage limit', async () => { /* ... */ });
    it('should reject voucher below minimum order amount', async () => { /* ... */ });
    it('should calculate percentage discount correctly', async () => { /* ... */ });
    it('should cap discount at maxDiscount value', async () => { /* ... */ });
  });

  describe('redeem', () => {
    it('should increment usage count', async () => { /* ... */ });
    it('should reject already-fully-redeemed voucher', async () => { /* ... */ });
  });
});
```

### Step 2.5 - LoyaltyService Unit Tests

File: `apps/api/src/modules/loyalty/loyalty.service.spec.ts`

Key test cases:
```
describe('LoyaltyService')
  describe('earnPoints')
    - should calculate points from order total (e.g., 1 point per 10,000 VND)
    - should credit points to user account
  describe('redeemPoints')
    - should deduct points and return discount amount
    - should throw if insufficient points
  describe('getTier')
    - should return BRONZE for 0-999 points
    - should return SILVER for 1000-4999 points
    - should return GOLD for 5000+ points
  describe('checkTierUpgrade')
    - should upgrade tier when threshold crossed
    - should not downgrade tier
```

### Step 2.6 - ProductsService Unit Tests

File: `apps/api/src/modules/products/products.service.spec.ts`

Key test cases:
```
describe('ProductsService')
  describe('findAll')
    - should return paginated products
    - should filter by category
    - should filter by brand
    - should sort by price
  describe('findBySlug')
    - should return product with variants and images
    - should throw NotFoundException for invalid slug
  describe('create')
    - should create product with slug generated from name
    - should handle Vietnamese names in slug generation
  describe('updateStock')
    - should decrement stock quantity
    - should throw if stock would go negative
  describe('findVariant')
    - should return specific variant by attributes
```

## Todo List

- [ ] Read each service file to identify exact method signatures and dependencies
- [ ] Write AuthService tests (Step 2.1)
- [ ] Write OrdersService tests (Step 2.2)
- [ ] Write PaymentsService + SepayService tests (Step 2.3)
- [ ] Write VouchersService tests (Step 2.4)
- [ ] Write LoyaltyService tests (Step 2.5)
- [ ] Write ProductsService tests (Step 2.6)
- [ ] Run `pnpm --filter @enzara/api test` and verify all pass
- [ ] Check coverage report for critical paths

## Success Criteria

1. All 6 service spec files created and passing
2. ~56 test cases total, all green
3. Coverage >80% on the 6 target service files
4. No tests depend on real database, Redis, or external APIs
5. Tests run in <10 seconds total

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Services have circular dependencies (forwardRef) | High | Medium | Use targeted `useValue` mocks, avoid importing full modules |
| Prisma model types change when schema updates | Medium | Medium | Use `as any` for mock return values; revisit after schema stabilizes |
| bcrypt.compare is slow in tests | Medium | Low | Tests still fast enough with mocked DB; could use lower salt rounds in test env |
| Service methods have undocumented side effects | Medium | Medium | Read each service thoroughly before writing tests |

## Security Considerations

- Never use real passwords in test fixtures; use clearly fake ones like `'TestPass123!'`
- SePay webhook secret in tests must be a dummy value, never a real key
- JWT secrets in tests must differ from production values

## Next Steps

Once Phase 2 is complete, proceed to Phase 3 (API Integration Tests) which builds on these unit tests by testing the HTTP layer with Supertest.
