import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsFilterDto,
  TopProductsFilterDto,
  RecentOrdersFilterDto,
} from './dto/analytics-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Query() filter: AnalyticsFilterDto) {
    const { startDate, endDate } = this.parseDateRange(filter);
    return this.analyticsService.getOverview(startDate, endDate);
  }

  @Get('revenue')
  async getRevenueChart(@Query() filter: AnalyticsFilterDto) {
    const { startDate, endDate } = this.parseDateRange(filter);
    return this.analyticsService.getRevenueChart(startDate, endDate);
  }

  @Get('orders-by-status')
  async getOrdersByStatus() {
    return this.analyticsService.getOrdersByStatus();
  }

  @Get('top-products')
  async getTopProducts(@Query() filter: TopProductsFilterDto) {
    const limit = filter.limit || 10;
    const sortBy = filter.sortBy || 'revenue';
    return this.analyticsService.getTopProducts(limit, sortBy);
  }

  @Get('recent-orders')
  async getRecentOrders(@Query() filter: RecentOrdersFilterDto) {
    const limit = filter.limit || 10;
    return this.analyticsService.getRecentOrders(limit);
  }

  @Get('revenue-by-category')
  async getRevenueByCategory() {
    return this.analyticsService.getRevenueByCategory();
  }

  private parseDateRange(filter: AnalyticsFilterDto): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();
    const startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  }
}
