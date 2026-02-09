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
} from '@nestjs/common';
import { FlashSalesService } from './flash-sales.service';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { UpdateFlashSaleDto } from './dto/update-flash-sale.dto';
import { FlashSaleFilterDto } from './dto/flash-sale-filter.dto';
import { AddFlashSaleItemDto } from './dto/add-flash-sale-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('flash-sales')
export class FlashSalesController {
  constructor(private readonly flashSalesService: FlashSalesService) {}

  /**
   * PUBLIC: Get the currently active flash sale
   * No authentication required
   */
  @Get('active')
  async getActive() {
    return this.flashSalesService.getActive();
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
    return this.flashSalesService.create(dto);
  }

  /**
   * ADMIN: Update a flash sale
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateFlashSaleDto) {
    return this.flashSalesService.update(id, dto);
  }

  /**
   * ADMIN: Delete a flash sale
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.flashSalesService.remove(id);
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
    return this.flashSalesService.addItem(id, dto);
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
    return this.flashSalesService.removeItem(id, productId);
  }
}
