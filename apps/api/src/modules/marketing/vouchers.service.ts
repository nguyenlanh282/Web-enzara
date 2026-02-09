import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherFilterDto } from './dto/voucher-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a random uppercase voucher code
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new voucher
   */
  async create(dto: CreateVoucherDto) {
    // Generate code if not provided
    let code = dto.code?.toUpperCase();
    if (!code) {
      code = this.generateCode();
      // Ensure uniqueness
      while (await this.prisma.voucher.findUnique({ where: { code } })) {
        code = this.generateCode();
      }
    } else {
      // Check if code already exists
      const existing = await this.prisma.voucher.findUnique({
        where: { code },
      });
      if (existing) {
        throw new BadRequestException('Voucher code already exists');
      }
    }

    // Validate date range
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.voucher.create({
      data: {
        code,
        name: dto.name,
        description: dto.description || null,
        type: dto.type,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount || null,
        maxDiscount: dto.maxDiscount || null,
        usageLimit: dto.usageLimit || null,
        perUserLimit: dto.perUserLimit ?? 1,
        startDate,
        endDate,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Find all vouchers with pagination and filters
   */
  async findAll(filter: VoucherFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.VoucherWhereInput = {};

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.search) {
      where.OR = [
        { code: { contains: filter.search, mode: 'insensitive' } },
        { name: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [vouchers, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.voucher.count({ where }),
    ]);

    return {
      data: vouchers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a voucher by ID
   */
  async findById(id: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true } },
      },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    return voucher;
  }

  /**
   * Update a voucher
   */
  async update(id: string, dto: UpdateVoucherDto) {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } });
    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    // If code is being updated, check uniqueness
    if (dto.code) {
      const code = dto.code.toUpperCase();
      if (code !== voucher.code) {
        const existing = await this.prisma.voucher.findUnique({
          where: { code },
        });
        if (existing) {
          throw new BadRequestException('Voucher code already exists');
        }
      }
      dto.code = code;
    }

    // Validate date range if both dates are provided
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : voucher.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : voucher.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.voucher.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        _count: { select: { orders: true } },
      },
    });
  }

  /**
   * Delete a voucher (only if not used)
   */
  async delete(id: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    if (voucher.usedCount > 0) {
      throw new BadRequestException(
        'Cannot delete voucher that has been used',
      );
    }

    return this.prisma.voucher.delete({ where: { id } });
  }
}
