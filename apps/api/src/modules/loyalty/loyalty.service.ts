import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

interface TierInfo {
  name: string;
  multiplier: number;
  freeShip: boolean;
}

const TIERS: { minPoints: number; tier: TierInfo }[] = [
  { minPoints: 5000, tier: { name: 'Kim Cuong', multiplier: 2, freeShip: true } },
  { minPoints: 1000, tier: { name: 'Vang', multiplier: 1.5, freeShip: false } },
  { minPoints: 0, tier: { name: 'Bac', multiplier: 1, freeShip: false } },
];

const TIER_THRESHOLDS = [
  { name: 'Bac', min: 0, max: 999 },
  { name: 'Vang', min: 1000, max: 4999 },
  { name: 'Kim Cuong', min: 5000, max: Infinity },
];

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  private getTier(totalEarned: number): TierInfo {
    for (const t of TIERS) {
      if (totalEarned >= t.minPoints) {
        return t.tier;
      }
    }
    return TIERS[TIERS.length - 1].tier;
  }

  private getNextTierInfo(totalEarned: number): {
    nextTier: string | null;
    pointsToNextTier: number;
  } {
    const currentTierIndex = TIER_THRESHOLDS.findIndex(
      (t) => totalEarned >= t.min && totalEarned <= t.max,
    );

    if (currentTierIndex === -1 || currentTierIndex === TIER_THRESHOLDS.length - 1) {
      return { nextTier: null, pointsToNextTier: 0 };
    }

    const next = TIER_THRESHOLDS[currentTierIndex + 1];
    return {
      nextTier: next.name,
      pointsToNextTier: next.min - totalEarned,
    };
  }

  async getBalance(userId: string) {
    const records = await this.prisma.loyaltyPoint.findMany({
      where: { userId },
    });

    let totalEarned = 0;
    let totalRedeemed = 0;

    for (const record of records) {
      if (record.type === 'EARN') {
        totalEarned += record.points;
      } else if (record.type === 'REDEEM') {
        totalRedeemed += Math.abs(record.points);
      }
    }

    const currentBalance = totalEarned - totalRedeemed;
    const tier = this.getTier(totalEarned);
    const { nextTier, pointsToNextTier } = this.getNextTierInfo(totalEarned);

    return {
      totalEarned,
      totalRedeemed,
      currentBalance,
      tier: tier.name,
      tierMultiplier: tier.multiplier,
      tierFreeShip: tier.freeShip,
      nextTier,
      pointsToNextTier,
    };
  }

  async getHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.loyaltyPoint.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loyaltyPoint.count({ where: { userId } }),
    ]);

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async earnPoints(
    userId: string,
    basePoints: number,
    description: string,
    orderId?: string,
  ) {
    // Get current tier to apply multiplier
    const balance = await this.getBalance(userId);
    const tier = this.getTier(balance.totalEarned);
    const points = Math.floor(basePoints * tier.multiplier);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 12);

    return this.prisma.loyaltyPoint.create({
      data: {
        userId,
        points,
        type: 'EARN',
        description,
        orderId: orderId || null,
        expiresAt,
      },
    });
  }

  async redeemPoints(userId: string, points: number, description: string) {
    const balance = await this.getBalance(userId);

    if (balance.currentBalance < points) {
      throw new BadRequestException(
        `Khong du diem. So du hien tai: ${balance.currentBalance} diem`,
      );
    }

    const record = await this.prisma.loyaltyPoint.create({
      data: {
        userId,
        points: -points,
        type: 'REDEEM',
        description,
      },
    });

    return record;
  }

  getRedemptionValue(points: number): number {
    // 1000 points = 10,000 VND => 1 point = 10 VND
    return points * 10;
  }
}
