import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async findAll(filter: ReviewFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.isApproved !== undefined) {
      where.isApproved = filter.isApproved;
    }

    if (filter.productId) {
      where.productId = filter.productId;
    }

    if (filter.rating) {
      where.rating = filter.rating;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, fullName: true, email: true, avatar: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByProduct(productId: string, filter: ReviewFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };
    if (filter.sort === 'highest') {
      orderBy = { rating: 'desc' };
    } else if (filter.sort === 'lowest') {
      orderBy = { rating: 'asc' };
    }

    const where: any = {
      productId,
      isApproved: true,
    };

    if (filter.rating) {
      where.rating = filter.rating;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: { id: true, fullName: true, avatar: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRatingSummary(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      select: { rating: true },
    });

    const total = reviews.length;
    const average = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

    const stars: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      stars[r.rating] = (stars[r.rating] || 0) + 1;
    });

    return { average: Math.round(average * 10) / 10, total, stars };
  }

  async canReview(productId: string, userId: string): Promise<{ canReview: boolean; message?: string }> {
    // Check if user has a DELIVERED order containing this product
    const deliveredOrder = await this.prisma.order.findFirst({
      where: {
        customerId: userId,
        status: 'DELIVERED',
        items: {
          some: { productId },
        },
      },
      select: { id: true },
    });

    if (!deliveredOrder) {
      return {
        canReview: false,
        message: 'Ban can mua va nhan hang de co the danh gia'
      };
    }

    // Check if user has already reviewed this product for this order
    const existingReview = await this.prisma.review.findUnique({
      where: {
        productId_userId_orderId: {
          productId,
          userId,
          orderId: deliveredOrder.id,
        },
      },
    });

    if (existingReview) {
      return {
        canReview: false,
        message: 'Ban da danh gia san pham nay roi'
      };
    }

    return { canReview: true };
  }

  async create(productId: string, userId: string, dto: CreateReviewDto) {
    // Validate product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('San pham khong ton tai');
    }

    // Check if user can review
    const { canReview, message } = await this.canReview(productId, userId);
    if (!canReview) {
      throw new BadRequestException(message);
    }

    // Get the delivered order if orderId not provided
    let orderId = dto.orderId;
    if (!orderId) {
      const deliveredOrder = await this.prisma.order.findFirst({
        where: {
          customerId: userId,
          status: 'DELIVERED',
          items: { some: { productId } },
        },
        select: { id: true },
      });
      orderId = deliveredOrder?.id;
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        productId,
        userId,
        orderId,
        rating: dto.rating,
        content: dto.content,
        images: dto.images || [],
        isApproved: false,
      },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    // Recalculate product avgRating (even though this review isn't approved yet)
    await this.recalculateAvgRating(productId);

    return review;
  }

  async approve(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Danh gia khong ton tai');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });

    await this.recalculateAvgRating(review.productId);

    // Earn loyalty points for approved review (non-blocking)
    this.loyaltyService
      .earnPoints(review.userId, 50, 'Tich diem danh gia san pham')
      .catch((err) => {
        this.logger.error('Failed to earn loyalty points for review:', err);
      });

    return updated;
  }

  async reject(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Danh gia khong ton tai');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: { isApproved: false },
    });

    await this.recalculateAvgRating(review.productId);
    return updated;
  }

  async reply(id: string, adminReply: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Danh gia khong ton tai');
    }

    return this.prisma.review.update({
      where: { id },
      data: { adminReply },
    });
  }

  async delete(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Danh gia khong ton tai');
    }

    await this.prisma.review.delete({ where: { id } });
    await this.recalculateAvgRating(review.productId);

    return { message: 'Xoa danh gia thanh cong' };
  }

  async getFeaturedReviews(limit = 6) {
    return this.prisma.review.findMany({
      where: {
        isApproved: true,
        rating: { gte: 4 },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async recalculateAvgRating(productId: string) {
    const approvedReviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      select: { rating: true },
    });

    const avgRating = approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : 0;

    await this.prisma.product.update({
      where: { id: productId },
      data: { avgRating: Math.round(avgRating * 10) / 10 },
    });
  }
}
