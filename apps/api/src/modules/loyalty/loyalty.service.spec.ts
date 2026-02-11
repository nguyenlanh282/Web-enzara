import { BadRequestException } from '@nestjs/common';
import { createTestModule } from '../../../test/helpers';
import { prismaMock } from '../../../test/prisma-mock';
import { LoyaltyService } from './loyalty.service';

let service: LoyaltyService;

beforeEach(async () => {
  const module = await createTestModule({
    providers: [LoyaltyService],
  });
  service = module.get(LoyaltyService);
});

describe('LoyaltyService', () => {
  describe('getBalance', () => {
    it('should return correct balance with Bac tier when totalEarned < 1000', async () => {
      prismaMock.loyaltyPoint.findMany.mockResolvedValue([
        { id: '1', userId: 'u1', points: 500, type: 'EARN', description: 'Order', orderId: null, expiresAt: null, createdAt: new Date() },
        { id: '2', userId: 'u1', points: -100, type: 'REDEEM', description: 'Redeem', orderId: null, expiresAt: null, createdAt: new Date() },
      ] as any);

      const result = await service.getBalance('u1');

      expect(result.totalEarned).toBe(500);
      expect(result.totalRedeemed).toBe(100);
      expect(result.currentBalance).toBe(400);
      expect(result.tier).toBe('Bac');
      expect(result.tierMultiplier).toBe(1);
      expect(result.nextTier).toBe('Vang');
      expect(result.pointsToNextTier).toBe(500);
    });

    it('should return Vang tier when totalEarned >= 1000', async () => {
      prismaMock.loyaltyPoint.findMany.mockResolvedValue([
        { id: '1', userId: 'u1', points: 800, type: 'EARN', description: 'Order 1', orderId: null, expiresAt: null, createdAt: new Date() },
        { id: '2', userId: 'u1', points: 500, type: 'EARN', description: 'Order 2', orderId: null, expiresAt: null, createdAt: new Date() },
        { id: '3', userId: 'u1', points: -200, type: 'REDEEM', description: 'Redeem', orderId: null, expiresAt: null, createdAt: new Date() },
      ] as any);

      const result = await service.getBalance('u1');

      expect(result.totalEarned).toBe(1300);
      expect(result.currentBalance).toBe(1100);
      expect(result.tier).toBe('Vang');
      expect(result.tierMultiplier).toBe(1.5);
      expect(result.nextTier).toBe('Kim Cuong');
    });

    it('should return Kim Cuong tier when totalEarned >= 5000 with nextTier null', async () => {
      prismaMock.loyaltyPoint.findMany.mockResolvedValue([
        { id: '1', userId: 'u1', points: 3000, type: 'EARN', description: 'Order 1', orderId: null, expiresAt: null, createdAt: new Date() },
        { id: '2', userId: 'u1', points: 2500, type: 'EARN', description: 'Order 2', orderId: null, expiresAt: null, createdAt: new Date() },
        { id: '3', userId: 'u1', points: -400, type: 'REDEEM', description: 'Redeem', orderId: null, expiresAt: null, createdAt: new Date() },
      ] as any);

      const result = await service.getBalance('u1');

      expect(result.totalEarned).toBe(5500);
      expect(result.currentBalance).toBe(5100);
      expect(result.tier).toBe('Kim Cuong');
      expect(result.tierMultiplier).toBe(2);
      expect(result.tierFreeShip).toBe(true);
      expect(result.nextTier).toBeNull();
    });
  });

  describe('earnPoints', () => {
    it('should earn points with 1x multiplier for Bac tier', async () => {
      prismaMock.loyaltyPoint.findMany.mockResolvedValue([
        { id: '1', userId: 'u1', points: 200, type: 'EARN', description: 'Previous', orderId: null, expiresAt: null, createdAt: new Date() },
      ] as any);

      const createdRecord = {
        id: 'new-1', userId: 'u1', points: 100, type: 'EARN',
        description: 'Purchase order', orderId: 'order-1',
        expiresAt: new Date(), createdAt: new Date(),
      };
      prismaMock.loyaltyPoint.create.mockResolvedValue(createdRecord as any);

      const result = await service.earnPoints('u1', 100, 'Purchase order', 'order-1');

      expect(prismaMock.loyaltyPoint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          points: 100,
          type: 'EARN',
        }),
      });
      expect(result.points).toBe(100);
    });

    it('should earn points with 1.5x multiplier for Vang tier', async () => {
      prismaMock.loyaltyPoint.findMany.mockResolvedValue([
        { id: '1', userId: 'u1', points: 1200, type: 'EARN', description: 'Previous', orderId: null, expiresAt: null, createdAt: new Date() },
      ] as any);

      const createdRecord = {
        id: 'new-2', userId: 'u1', points: 150, type: 'EARN',
        description: 'Purchase order', orderId: null,
        expiresAt: new Date(), createdAt: new Date(),
      };
      prismaMock.loyaltyPoint.create.mockResolvedValue(createdRecord as any);

      const result = await service.earnPoints('u1', 100, 'Purchase order');

      expect(prismaMock.loyaltyPoint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          points: 150,
          type: 'EARN',
        }),
      });
      expect(result.points).toBe(150);
    });
  });

  describe('redeemPoints', () => {
    it('should successfully redeem when balance is sufficient', async () => {
      prismaMock.loyaltyPoint.findMany.mockResolvedValue([
        { id: '1', userId: 'u1', points: 500, type: 'EARN', description: 'Order', orderId: null, expiresAt: null, createdAt: new Date() },
      ] as any);

      const createdRecord = {
        id: 'redeem-1', userId: 'u1', points: -200, type: 'REDEEM',
        description: 'Discount redemption', orderId: null,
        expiresAt: null, createdAt: new Date(),
      };
      prismaMock.loyaltyPoint.create.mockResolvedValue(createdRecord as any);

      const result = await service.redeemPoints('u1', 200, 'Discount redemption');

      expect(prismaMock.loyaltyPoint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          points: -200,
          type: 'REDEEM',
        }),
      });
      expect(result.points).toBe(-200);
    });

    it('should throw BadRequestException when balance is insufficient', async () => {
      prismaMock.loyaltyPoint.findMany.mockResolvedValue([
        { id: '1', userId: 'u1', points: 100, type: 'EARN', description: 'Order', orderId: null, expiresAt: null, createdAt: new Date() },
      ] as any);

      await expect(
        service.redeemPoints('u1', 500, 'Discount redemption'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRedemptionValue', () => {
    it('should return 10000 VND for 1000 points', () => {
      const value = service.getRedemptionValue(1000);

      expect(value).toBe(10000);
    });
  });
});
