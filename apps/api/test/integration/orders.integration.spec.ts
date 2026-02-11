import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, getAuthToken } from '../app-factory';
import { prismaMock } from '../prisma-mock';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

describe('Order Endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/orders/my', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/orders/my')
        .expect(401);
    });

    it('should return customer orders with valid auth', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@enzara.vn',
        fullName: 'Test User',
        role: 'CUSTOMER',
        isActive: true,
      };

      // JwtStrategy validates user
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.order.findMany.mockResolvedValue([
        { id: 'order-1', orderNumber: 'ORD-001', status: 'PENDING' },
      ] as any);
      prismaMock.order.count.mockResolvedValue(1);

      const token = getAuthToken(app, 'user-1');

      const res = await request(app.getHttpServer())
        .get('/api/orders/my')
        .set('Authorization', token)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/orders/:orderNumber/tracking', () => {
    it('should return order for valid order number', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'SHIPPING',
        total: 500000,
        items: [],
        timeline: [],
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);

      const res = await request(app.getHttpServer())
        .get('/api/orders/ORD-001/tracking')
        .expect(200);

      expect(res.body.orderNumber).toBe('ORD-001');
    });

    it('should return 404 for non-existent order number', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/orders/INVALID/tracking')
        .expect(404);
    });
  });

  describe('GET /api/orders/:id/payment-status', () => {
    it('should return payment status for valid order', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        paymentStatus: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        total: 500000,
        paidAt: null,
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);

      const res = await request(app.getHttpServer())
        .get('/api/orders/order-1/payment-status')
        .expect(200);

      expect(res.body).toHaveProperty('paymentStatus', 'PENDING');
      expect(res.body).toHaveProperty('orderId', 'order-1');
    });
  });

  describe('POST /api/orders', () => {
    it('should return 400 for invalid order data (empty items)', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .send({
          items: [],
          shippingName: 'Test',
          shippingPhone: '0123456789',
          shippingProvince: 'HCM',
          shippingDistrict: 'Q1',
          shippingWard: 'P1',
          shippingAddress: '123 Main St',
          paymentMethod: 'BANK_TRANSFER',
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .send({
          items: [{ productId: 'p1', quantity: 1 }],
        })
        .expect(400);
    });
  });
});
