import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FlashSalesService } from './flash-sales.service';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { UpdateFlashSaleDto } from './dto/update-flash-sale.dto';
import { FlashSaleFilterDto } from './dto/flash-sale-filter.dto';
import { AddFlashSaleItemDto } from './dto/add-flash-sale-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '../../common/interceptors/cache-ttl.decorator';
import { CacheInvalidationService } from '../../common/services/cache-invalidation.service';

@Controller('flash-sales')
export class FlashSalesController {
  constructor(
    private readonly flashSalesService: FlashSalesService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  /**
   * PUBLIC: Get the currently active flash sale
   * No authentication required
   */
  @Get('active')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(60)
  async getActive() {
    const sale = await this.flashSalesService.getActive();
    return sale ?? { id: null, items: [] };
  }

  /**
   * ADMIN: List all flash sales with pagination
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async findAll(@Query() filter: FlashSaleFilterDto) {
    return this.flashSalesService.findAll(filter);
  }

  /**
   * ADMIN: Get a single flash sale by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async findOne(@Param('id') id: string) {
    return this.flashSalesService.findOne(id);
  }

  /**
   * ADMIN: Create a new flash sale
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateFlashSaleDto) {
    const result = await this.flashSalesService.create(dto);
    await this.cacheInvalidation.invalidateFlashSales();
    return result;
  }

  /**
   * ADMIN: Update a flash sale
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateFlashSaleDto) {
    const result = await this.flashSalesService.update(id, dto);
    await this.cacheInvalidation.invalidateFlashSales();
    return result;
  }

  /**
   * ADMIN: Delete a flash sale
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const result = await this.flashSalesService.remove(id);
    await this.cacheInvalidation.invalidateFlashSales();
    return result;
  }

  /**
   * ADMIN: Add a product item to a flash sale
   */
  @Post(':id/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddFlashSaleItemDto,
  ) {
    const result = await this.flashSalesService.addItem(id, dto);
    await this.cacheInvalidation.invalidateFlashSales();
    return result;
  }

  /**
   * ADMIN: Remove a product item from a flash sale
   */
  @Delete(':id/items/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async removeItem(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    const result = await this.flashSalesService.removeItem(id, productId);
    await this.cacheInvalidation.invalidateFlashSales();
    return result;
  }
}
