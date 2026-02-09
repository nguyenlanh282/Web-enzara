import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { UpdateFlashSaleDto } from './dto/update-flash-sale.dto';
import { FlashSaleFilterDto } from './dto/flash-sale-filter.dto';
import { AddFlashSaleItemDto } from './dto/add-flash-sale-item.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FlashSalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all flash sales with pagination and filters
   */
  async findAll(filter: FlashSaleFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FlashSaleWhereInput = {};

    if (filter.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }

    const [flashSales, total] = await Promise.all([
      this.prisma.flashSale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
        },
      }),
      this.prisma.flashSale.count({ where }),
    ]);

    return {
      data: flashSales,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a flash sale by ID with items and product details
   */
  async findOne(id: string) {
    const flashSale = await this.prisma.flashSale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: {
                    id: true,
                    url: true,
                    altText: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!flashSale) {
      throw new NotFoundException(`Flash sale with ID ${id} not found`);
    }

    return flashSale;
  }

  /**
   * Create a new flash sale
   */
  async create(dto: CreateFlashSaleDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    return this.prisma.flashSale.create({
      data: {
        name: dto.name,
        startTime,
        endTime,
        isActive: dto.isActive ?? true,
      },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  /**
   * Update a flash sale
   */
  async update(id: string, dto: UpdateFlashSaleDto) {
    const flashSale = await this.prisma.flashSale.findUnique({
      where: { id },
    });

    if (!flashSale) {
      throw new NotFoundException(`Flash sale with ID ${id} not found`);
    }

    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : flashSale.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : flashSale.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    return this.prisma.flashSale.update({
      where: { id },
      data: {
        name: dto.name,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        isActive: dto.isActive,
      },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  /**
   * Delete a flash sale
   */
  async remove(id: string) {
    const flashSale = await this.prisma.flashSale.findUnique({
      where: { id },
    });

    if (!flashSale) {
      throw new NotFoundException(`Flash sale with ID ${id} not found`);
    }

    return this.prisma.flashSale.delete({ where: { id } });
  }

  /**
   * Add a product item to a flash sale
   */
  async addItem(flashSaleId: string, dto: AddFlashSaleItemDto) {
    const flashSale = await this.prisma.flashSale.findUnique({
      where: { id: flashSaleId },
    });

    if (!flashSale) {
      throw new NotFoundException(
        `Flash sale with ID ${flashSaleId} not found`,
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${dto.productId} not found`,
      );
    }

    // Check if product already in this flash sale
    const existing = await this.prisma.flashSaleItem.findUnique({
      where: {
        flashSaleId_productId: {
          flashSaleId,
          productId: dto.productId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Product already exists in this flash sale',
      );
    }

    return this.prisma.flashSaleItem.create({
      data: {
        flashSaleId,
        productId: dto.productId,
        salePrice: dto.salePrice,
        quantity: dto.quantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: {
                id: true,
                url: true,
                altText: true,
                isPrimary: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Remove a product item from a flash sale
   */
  async removeItem(flashSaleId: string, productId: string) {
    const item = await this.prisma.flashSaleItem.findUnique({
      where: {
        flashSaleId_productId: {
          flashSaleId,
          productId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Product not found in this flash sale',
      );
    }

    return this.prisma.flashSaleItem.delete({
      where: {
        flashSaleId_productId: {
          flashSaleId,
          productId,
        },
      },
    });
  }

  /**
   * Get currently active flash sale (public endpoint)
   */
  async getActive() {
    const now = new Date();

    const flashSale = await this.prisma.flashSale.findFirst({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: {
                    id: true,
                    url: true,
                    altText: true,
                    isPrimary: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return flashSale;
  }
}
