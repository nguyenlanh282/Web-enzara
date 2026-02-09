import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              stockQuantity: true,
              images: {
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
      }),
      this.prisma.wishlist.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addToWishlist(userId: string, productId: string) {
    // Validate product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('San pham khong ton tai');
    }

    // Upsert pattern: if already exists, return existing
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.wishlist.create({
      data: { userId, productId },
    });
  }

  async removeFromWishlist(userId: string, productId: string) {
    await this.prisma.wishlist.deleteMany({
      where: { userId, productId },
    });

    return { message: 'Xoa khoi danh sach yeu thich thanh cong' };
  }

  async checkWishlist(userId: string, productIds: string[]) {
    const items = await this.prisma.wishlist.findMany({
      where: {
        userId,
        productId: { in: productIds },
      },
      select: { productId: true },
    });

    return items.map((item) => item.productId);
  }

  async getWishlistCount(userId: string) {
    const count = await this.prisma.wishlist.count({
      where: { userId },
    });

    return count;
  }
}
