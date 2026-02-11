import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AdminNotificationsService } from '../notifications/admin-notifications.service';
import { PancakeService } from '../pancake/pancake.service';
import { GhnShippingService } from '../shipping/ghn.service';
import { prismaMock } from '../../../test/prisma-mock';
import { createTestModule } from '../../../test/helpers';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockNotificationsService = {
    notifyOrderUpdate: vi.fn(),
    sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
    sendShippingUpdate: vi.fn().mockResolvedValue(undefined),
    sendDeliveryConfirmation: vi.fn().mockResolvedValue(undefined),
    sendOrderCancellation: vi.fn().mockResolvedValue(undefined),
    sendPaymentSuccess: vi.fn().mockResolvedValue(undefined),
  };

  const mockLoyaltyService = {
    earnPoints: vi.fn().mockResolvedValue(undefined),
    getBalance: vi.fn().mockResolvedValue({ currentBalance: 0 }),
    getRedemptionValue: vi.fn().mockReturnValue(0),
    redeemPoints: vi.fn().mockResolvedValue(undefined),
  };

  const mockAdminNotificationsService = {
    notifyNewOrder: vi.fn(),
    createNotification: vi.fn().mockResolvedValue(undefined),
  };

  const mockPancakeService = {
    syncOrderToPancake: vi.fn(),
    isConfigured: false,
  };

  const mockGhnShippingService = {
    calculateShippingFee: vi.fn().mockResolvedValue(30000),
    calculateFee: vi.fn().mockResolvedValue({ total: 30000 }),
    isConfigured: false,
  };

  beforeEach(async () => {
    const module = await createTestModule({
      providers: [
        OrdersService,
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
        { provide: AdminNotificationsService, useValue: mockAdminNotificationsService },
        { provide: PancakeService, useValue: mockPancakeService },
        { provide: GhnShippingService, useValue: mockGhnShippingService },
      ],
    });

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findById ──────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return the order when found', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'PENDING',
        totalAmount: 500000,
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);

      const result = await service.findById('order-1');

      expect(result).toEqual(mockOrder);
      expect(prismaMock.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'order-1' } }),
      );
    });

    it('should throw NotFoundException when order is not found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findByOrderNumber ─────────────────────────────────────────────────

  describe('findByOrderNumber', () => {
    it('should return the order when found by order number', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'PENDING',
        totalAmount: 500000,
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);

      const result = await service.findByOrderNumber('ORD-001');

      expect(result).toEqual(mockOrder);
      expect(prismaMock.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orderNumber: 'ORD-001' } }),
      );
    });

    it('should throw NotFoundException when order number is not found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(
        service.findByOrderNumber('INVALID-ORDER'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should update the order status and add a timeline entry', async () => {
      const existingOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'CONFIRMED',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PAID',
        customerId: 'user-1',
      };

      const updatedOrder = {
        ...existingOrder,
        status: 'SHIPPING',
        items: [],
        timeline: [],
      };

      prismaMock.order.findUnique.mockResolvedValue(existingOrder as any);
      prismaMock.order.update.mockResolvedValue(updatedOrder as any);
      prismaMock.orderTimeline.create.mockResolvedValue({} as any);

      const result = await service.updateStatus(
        'order-1',
        'SHIPPING' as any,
        'Order shipped',
        'admin-1',
      );

      expect(result.status).toBe('SHIPPING');
      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: expect.objectContaining({ status: 'SHIPPING' }),
        }),
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', 'SHIPPING' as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── cancelOrder ───────────────────────────────────────────────────────

  describe('cancelOrder', () => {
    it('should cancel a PENDING order and restore stock', async () => {
      const pendingOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'PENDING',
        customerId: 'user-1',
        voucherId: null,
        items: [
          { productId: 'prod-1', variantId: null, quantity: 2 },
        ],
      };

      const cancelledOrder = {
        ...pendingOrder,
        status: 'CANCELLED',
        items: pendingOrder.items,
        timeline: [],
      };

      prismaMock.order.findUnique.mockResolvedValue(pendingOrder as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return fn(prismaMock);
      });
      prismaMock.order.update.mockResolvedValue(cancelledOrder as any);
      prismaMock.orderTimeline.create.mockResolvedValue({} as any);
      prismaMock.product.update.mockResolvedValue({} as any);

      const result = await service.cancelOrder(
        'order-1',
        'Changed my mind',
        'user-1',
      );

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw BadRequestException when order is not PENDING', async () => {
      const shippingOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'SHIPPING',
        customerId: 'user-1',
        items: [],
      };

      prismaMock.order.findUnique.mockResolvedValue(shippingOrder as any);

      await expect(
        service.cancelOrder('order-1', 'Too late', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── confirmPayment ────────────────────────────────────────────────────

  describe('confirmPayment', () => {
    it('should confirm payment and update paymentStatus to PAID', async () => {
      const pendingOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        customerId: 'user-1',
      };

      const confirmedOrder = {
        ...pendingOrder,
        paymentStatus: 'PAID',
        sepayTxId: 'sepay-tx-123',
      };

      prismaMock.order.findUnique.mockResolvedValue(pendingOrder as any);
      prismaMock.order.update.mockResolvedValue(confirmedOrder as any);
      prismaMock.orderTimeline.create.mockResolvedValue({} as any);

      const paidAt = new Date('2026-02-10T12:00:00Z');
      const result = await service.confirmPayment(
        'order-1',
        'sepay-tx-123',
        paidAt,
      );

      expect(result.paymentStatus).toBe('PAID');
      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: expect.objectContaining({
            paymentStatus: 'PAID',
            sepayTxId: 'sepay-tx-123',
          }),
        }),
      );
    });
  });

  // ── validateVoucher ───────────────────────────────────────────────────

  describe('validateVoucher', () => {
    const mockVoucher = {
      id: 'v1',
      code: 'SAVE10',
      name: 'Save 10%',
      type: 'PERCENTAGE',
      value: 10,
      minOrderAmount: 100000,
      maxDiscount: 50000,
      usageLimit: 100,
      usedCount: 5,
      perUserLimit: 1,
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2027-12-31'),
    };

    it('should return valid result when voucher conditions are met', async () => {
      prismaMock.voucher.findUnique.mockResolvedValue(mockVoucher as any);

      const result = await service.validateVoucher('SAVE10', 200000);

      expect(result.valid).toBe(true);
      expect(result.discount).toBeGreaterThan(0);
    });

    it('should return invalid when voucher is expired', async () => {
      const expiredVoucher = {
        ...mockVoucher,
        endDate: new Date('2024-12-31'),
      };

      prismaMock.voucher.findUnique.mockResolvedValue(expiredVoucher as any);

      const result = await service.validateVoucher('SAVE10', 200000);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when subtotal is below minimum order amount', async () => {
      prismaMock.voucher.findUnique.mockResolvedValue(mockVoucher as any);

      const result = await service.validateVoucher('SAVE10', 50000);

      expect(result.valid).toBe(false);
    });
  });

  // ── getCustomerOrders ─────────────────────────────────────────────────

  describe('getCustomerOrders', () => {
    it('should return paginated orders for the given user', async () => {
      const mockOrders = [
        { id: 'order-1', orderNumber: 'ORD-001', status: 'PENDING' },
        { id: 'order-2', orderNumber: 'ORD-002', status: 'CONFIRMED' },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders as any);
      prismaMock.order.count.mockResolvedValue(2);

      const result = await service.getCustomerOrders('user-1', 1, 10);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'user-1' }),
          skip: 0,
          take: 10,
        }),
      );
      expect(prismaMock.order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'user-1' }),
        }),
      );
    });
  });
});
