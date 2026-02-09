import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { Prisma } from '@prisma/client';

export interface OverviewResult {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  ordersChange: number;
  revenueChange: number;
  customersChange: number;
}

export interface RevenueChartItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrdersByStatusItem {
  status: string;
  count: number;
}

export interface TopProductItem {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalQuantity: number;
  image?: string;
}

export interface RecentOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
}

export interface RevenueByCategoryItem {
  categoryName: string;
  revenue: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(startDate: Date, endDate: Date): Promise<OverviewResult> {
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate);

    // Current period metrics
    const [currentOrders, currentRevenue, currentCustomers, totalProducts] =
      await Promise.all([
        this.prisma.order.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: { notIn: ['CANCELLED', 'REFUNDED'] },
          },
        }),
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: { notIn: ['CANCELLED', 'REFUNDED'] },
          },
        }),
        this.prisma.order.findMany({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            customerId: { not: null },
          },
          select: { customerId: true },
          distinct: ['customerId'],
        }),
        this.prisma.product.count({
          where: { isActive: true },
        }),
      ]);

    // Previous period metrics
    const [prevOrders, prevRevenue, prevCustomers] = await Promise.all([
      this.prisma.order.count({
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      }),
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          customerId: { not: null },
        },
        select: { customerId: true },
        distinct: ['customerId'],
      }),
    ]);

    const totalRevenue = Number(currentRevenue._sum.total || 0);
    const prevTotalRevenue = Number(prevRevenue._sum.total || 0);
    const totalCustomers = currentCustomers.length;
    const prevTotalCustomers = prevCustomers.length;

    return {
      totalOrders: currentOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      ordersChange: this.calcPercentChange(currentOrders, prevOrders),
      revenueChange: this.calcPercentChange(totalRevenue, prevTotalRevenue),
      customersChange: this.calcPercentChange(
        totalCustomers,
        prevTotalCustomers,
      ),
    };
  }

  async getRevenueChart(
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueChartItem[]> {
    const results = await this.prisma.$queryRaw<
      Array<{ date: Date; revenue: Prisma.Decimal; orders: bigint }>
    >`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
        AND status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return results.map((row) => ({
      date: new Date(row.date).toISOString().split('T')[0],
      revenue: Number(row.revenue),
      orders: Number(row.orders),
    }));
  }

  async getOrdersByStatus(): Promise<OrdersByStatusItem[]> {
    const results = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return results.map((row) => ({
      status: row.status,
      count: row._count.id,
    }));
  }

  async getTopProducts(
    limit: number,
    sortBy: 'revenue' | 'quantity',
  ): Promise<TopProductItem[]> {
    const orderByClause =
      sortBy === 'revenue'
        ? Prisma.sql`total_revenue DESC`
        : Prisma.sql`total_quantity DESC`;

    const results = await this.prisma.$queryRaw<
      Array<{
        product_id: string;
        product_name: string;
        total_revenue: Prisma.Decimal;
        total_quantity: bigint;
        image: string | null;
      }>
    >`
      SELECT
        oi.product_id,
        oi.product_name,
        SUM(oi.total) as total_revenue,
        SUM(oi.quantity) as total_quantity,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = oi.product_id AND pi.is_primary = true LIMIT 1) as image
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY oi.product_id, oi.product_name
      ORDER BY ${orderByClause}
      LIMIT ${limit}
    `;

    return results.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      totalRevenue: Number(row.total_revenue),
      totalQuantity: Number(row.total_quantity),
      image: row.image || undefined,
    }));
  }

  async getRecentOrders(limit: number): Promise<RecentOrderItem[]> {
    const orders = await this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        customer: {
          select: { fullName: true },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.fullName || 'Khach vang lai',
      total: Number(order.total),
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    }));
  }

  async getRevenueByCategory(): Promise<RevenueByCategoryItem[]> {
    const results = await this.prisma.$queryRaw<
      Array<{ category_name: string; revenue: Prisma.Decimal }>
    >`
      SELECT
        COALESCE(c.name, 'Khac') as category_name,
        SUM(oi.total) as revenue
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY c.name
      ORDER BY revenue DESC
    `;

    return results.map((row) => ({
      categoryName: row.category_name,
      revenue: Number(row.revenue),
    }));
  }

  private calcPercentChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }
}
