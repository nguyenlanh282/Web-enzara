import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../app-factory';
import { prismaMock } from '../prisma-mock';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

describe('SePay Webhook Endpoint', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Set SEPAY_API_KEY before app init so SepayService reads it from env
    process.env.SEPAY_API_KEY = 'test-api-key';
    process.env.SEPAY_PREFIX = 'ENZARA';
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.SEPAY_API_KEY;
    delete process.env.SEPAY_PREFIX;
  });

  const validPayload = {
    id: 12345,
    gateway: 'Vietcombank',
    transactionDate: '2026-02-10T12:00:00Z',
    accountNumber: '1234567890',
    subAccount: null,
    transferType: 'in',
    transferAmount: 500000,
    accumulated: 500000,
    code: null,
    content: 'ENZARA ENZ-20260210-0001',
    referenceCode: 'REF-001',
    description: 'Payment for ENZARA ENZ-20260210-0001',
  };

  describe('POST /api/webhook/sepay', () => {
    it('should return 401 without authorization header', async () => {
      await request(app.getHttpServer())
        .post('/api/webhook/sepay')
        .send(validPayload)
        .expect(401);
    });

    it('should return 401 with invalid API key', async () => {
      await request(app.getHttpServer())
        .post('/api/webhook/sepay')
        .set('Authorization', 'Apikey wrong-key')
        .send(validPayload)
        .expect(401);
    });

    it('should skip non-incoming transfers', async () => {
      const outgoingPayload = { ...validPayload, transferType: 'out' };

      const res = await request(app.getHttpServer())
        .post('/api/webhook/sepay')
        .set('Authorization', 'Apikey test-api-key')
        .send(outgoingPayload)
        .expect(200);

      expect(res.body.message).toContain('Skipped');
    });

    it('should process valid payment webhook', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ENZ-20260210-0001',
        total: 500000,
        paymentStatus: 'PENDING',
        customerId: 'user-1',
        status: 'PENDING',
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);
      prismaMock.order.update.mockResolvedValue({
        ...mockOrder,
        paymentStatus: 'PAID',
      } as any);
      prismaMock.orderTimeline.create.mockResolvedValue({} as any);

      const res = await request(app.getHttpServer())
        .post('/api/webhook/sepay')
        .set('Authorization', 'Apikey test-api-key')
        .send(validPayload)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should handle order not found gracefully', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/webhook/sepay')
        .set('Authorization', 'Apikey test-api-key')
        .send(validPayload)
        .expect(200);

      // Controller catches NotFoundException and returns success (idempotent)
      expect(res.body.success).toBe(true);
    });
  });
});
