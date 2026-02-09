import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomerFilterDto } from "./dto";
import { UserRole, Prisma } from "@prisma/client";

const TIER_THRESHOLDS = [
  { name: "Bac", min: 0, max: 999 },
  { name: "Vang", min: 1000, max: 4999 },
  { name: "Kim Cuong", min: 5000, max: Infinity },
];

function getTierName(totalEarned: number): string {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalEarned >= TIER_THRESHOLDS[i].min) {
      return TIER_THRESHOLDS[i].name;
    }
  }
  return "Bac";
}

@Injectable()
export class AdminCustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: CustomerFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: UserRole.CUSTOMER,
    };

    if (filter.search) {
      where.OR = [
        { fullName: { contains: filter.search, mode: "insensitive" } },
        { email: { contains: filter.search, mode: "insensitive" } },
        { phone: { contains: filter.search } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (filter.sortBy === "totalOrders" || filter.sortBy === "totalSpent") {
      // These are computed fields, we'll sort in-memory after fetching
    } else {
      orderBy.createdAt = (filter.sortOrder === "asc" ? "asc" : "desc") as Prisma.SortOrder;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: Object.keys(orderBy).length > 0 ? orderBy : { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: { orders: true },
          },
          orders: {
            select: { total: true },
          },
          loyaltyPoints: {
            select: { points: true, type: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = users.map((user) => {
      const totalSpent = user.orders.reduce(
        (sum, order) => sum + Number(order.total),
        0,
      );

      let totalEarned = 0;
      let totalRedeemed = 0;
      for (const lp of user.loyaltyPoints) {
        if (lp.type === "EARN" || lp.type === "ADMIN_ADJUST") {
          if (lp.points > 0) totalEarned += lp.points;
          else totalRedeemed += Math.abs(lp.points);
        } else if (lp.type === "REDEEM") {
          totalRedeemed += Math.abs(lp.points);
        }
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        totalOrders: user._count.orders,
        totalSpent,
        loyaltyBalance: totalEarned - totalRedeemed,
        tier: getTierName(totalEarned),
      };
    });

    // Sort by computed fields if requested
    if (filter.sortBy === "totalOrders") {
      items.sort((a, b) =>
        filter.sortOrder === "asc"
          ? a.totalOrders - b.totalOrders
          : b.totalOrders - a.totalOrders,
      );
    } else if (filter.sortBy === "totalSpent") {
      items.sort((a, b) =>
        filter.sortOrder === "asc"
          ? a.totalSpent - b.totalSpent
          : b.totalSpent - a.totalSpent,
      );
    }

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
          },
        },
        loyaltyPoints: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("Khong tim thay khach hang");
    }

    // Calculate order stats
    const allOrders = await this.prisma.order.findMany({
      where: { customerId: id },
      select: { total: true },
    });

    const totalOrders = allOrders.length;
    const totalSpent = allOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

    // Calculate loyalty info
    let totalEarned = 0;
    let totalRedeemed = 0;
    for (const lp of user.loyaltyPoints) {
      if (lp.type === "EARN" || lp.type === "ADMIN_ADJUST") {
        if (lp.points > 0) totalEarned += lp.points;
        else totalRedeemed += Math.abs(lp.points);
      } else if (lp.type === "REDEEM") {
        totalRedeemed += Math.abs(lp.points);
      }
    }

    const loyaltyBalance = totalEarned - totalRedeemed;
    const tier = getTierName(totalEarned);

    // Next tier info
    let nextTier: string | null = null;
    let pointsToNextTier = 0;
    const currentTierIndex = TIER_THRESHOLDS.findIndex(
      (t) => totalEarned >= t.min && totalEarned <= t.max,
    );
    if (currentTierIndex >= 0 && currentTierIndex < TIER_THRESHOLDS.length - 1) {
      nextTier = TIER_THRESHOLDS[currentTierIndex + 1].name;
      pointsToNextTier = TIER_THRESHOLDS[currentTierIndex + 1].min - totalEarned;
    }

    return {
      ...user,
      orders: user.orders.map((o) => ({
        ...o,
        total: Number(o.total),
      })),
      stats: {
        totalOrders,
        totalSpent,
        avgOrderValue,
      },
      loyalty: {
        balance: loyaltyBalance,
        totalEarned,
        totalRedeemed,
        tier,
        nextTier,
        pointsToNextTier,
      },
      loyaltyHistory: user.loyaltyPoints,
    };
  }

  async toggleStatus(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true, role: true },
    });

    if (!user) {
      throw new NotFoundException("Khong tim thay khach hang");
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new BadRequestException("Chi co the thay doi trang thai khach hang");
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        isActive: true,
      },
    });

    return updated;
  }

  async adjustLoyaltyPoints(userId: string, points: number, description: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException("Khong tim thay khach hang");
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new BadRequestException("Chi co the dieu chinh diem cho khach hang");
    }

    // If deducting, check balance
    if (points < 0) {
      const records = await this.prisma.loyaltyPoint.findMany({
        where: { userId },
        select: { points: true, type: true },
      });

      let totalEarned = 0;
      let totalRedeemed = 0;
      for (const lp of records) {
        if (lp.type === "EARN" || lp.type === "ADMIN_ADJUST") {
          if (lp.points > 0) totalEarned += lp.points;
          else totalRedeemed += Math.abs(lp.points);
        } else if (lp.type === "REDEEM") {
          totalRedeemed += Math.abs(lp.points);
        }
      }

      const balance = totalEarned - totalRedeemed;
      if (balance + points < 0) {
        throw new BadRequestException(
          `Khong du diem de tru. So du hien tai: ${balance}`,
        );
      }
    }

    const record = await this.prisma.loyaltyPoint.create({
      data: {
        userId,
        points,
        type: "ADMIN_ADJUST",
        description,
      },
    });

    return record;
  }

  async getLoyaltyOverview() {
    // Total active members (users with any loyalty points)
    const activeMembers = await this.prisma.loyaltyPoint.findMany({
      distinct: ["userId"],
      select: { userId: true },
    });
    const totalActiveMembers = activeMembers.length;

    // Get all loyalty point records
    const allRecords = await this.prisma.loyaltyPoint.findMany({
      select: {
        userId: true,
        points: true,
        type: true,
        createdAt: true,
      },
    });

    // Total points in circulation (earned - redeemed across all users)
    let totalEarnedAll = 0;
    let totalRedeemedAll = 0;

    // This month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let issuedThisMonth = 0;
    let redeemedThisMonth = 0;

    // Per-user totals for tier calculation
    const userTotalEarned: Record<string, number> = {};

    for (const record of allRecords) {
      const isEarning = record.type === "EARN" || (record.type === "ADMIN_ADJUST" && record.points > 0);
      const isRedeeming = record.type === "REDEEM" || (record.type === "ADMIN_ADJUST" && record.points < 0);

      if (isEarning) {
        totalEarnedAll += record.points;
        if (!userTotalEarned[record.userId]) userTotalEarned[record.userId] = 0;
        userTotalEarned[record.userId] += record.points;
      }

      if (isRedeeming) {
        totalRedeemedAll += Math.abs(record.points);
      }

      // This month checks
      if (record.createdAt >= startOfMonth && record.createdAt <= endOfMonth) {
        if (isEarning) {
          issuedThisMonth += record.points;
        }
        if (isRedeeming) {
          redeemedThisMonth += Math.abs(record.points);
        }
      }
    }

    const totalPointsInCirculation = totalEarnedAll - totalRedeemedAll;

    // Tier distribution
    const tierCounts: Record<string, number> = {
      Bac: 0,
      Vang: 0,
      "Kim Cuong": 0,
    };

    for (const userId of Object.keys(userTotalEarned)) {
      const earned = userTotalEarned[userId];
      const tier = getTierName(earned);
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    }

    return {
      totalActiveMembers,
      totalPointsInCirculation,
      issuedThisMonth,
      redeemedThisMonth,
      tierDistribution: tierCounts,
    };
  }

  async getRecentTransactions(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.loyaltyPoint.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.loyaltyPoint.count(),
    ]);

    return {
      items: records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchCustomers(search: string) {
    const users = await this.prisma.user.findMany({
      where: {
        role: UserRole.CUSTOMER,
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    return users;
  }
}
