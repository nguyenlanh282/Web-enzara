import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductFilterDto } from "./dto/product-filter.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllAdmin(filter: ProductFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (filter.search) {
      where.name = { contains: filter.search, mode: "insensitive" };
    }

    if (filter.category) {
      where.category = { slug: filter.category };
    }

    if (filter.brand) {
      where.brand = { slug: filter.brand };
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.basePrice = {};
      if (filter.minPrice !== undefined) {
        where.basePrice.gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        where.basePrice.lte = filter.maxPrice;
      }
    }

    if (filter.featured !== undefined) {
      where.isFeatured = filter.featured;
    }

    const orderBy = this.getSortOrder(filter.sort);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          brand: true,
          variants: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAdmin(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        variants: { orderBy: { createdAt: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const productData: Prisma.ProductCreateInput = {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        shortDesc: dto.shortDesc,
        basePrice: dto.basePrice,
        salePrice: dto.salePrice,
        sku: dto.sku,
        barcode: dto.barcode,
        stockQuantity: dto.stockQuantity ?? 0,
        weight: dto.weight,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        tags: dto.tags || [],
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      };

      if (dto.categoryId) {
        productData.category = { connect: { id: dto.categoryId } };
      }

      if (dto.brandId) {
        productData.brand = { connect: { id: dto.brandId } };
      }

      if (dto.variants && dto.variants.length > 0) {
        productData.variants = {
          create: dto.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            price: v.price,
            salePrice: v.salePrice,
            stockQuantity: v.stockQuantity ?? 0,
            attributes: v.attributes || {},
            isActive: v.isActive ?? true,
          })),
        };
      }

      if (dto.images && dto.images.length > 0) {
        productData.images = {
          create: dto.images.map((img) => ({
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder ?? 0,
            isPrimary: img.isPrimary ?? false,
          })),
        };
      }

      const product = await tx.product.create({
        data: productData,
        include: {
          category: true,
          brand: true,
          variants: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
      });

      return product;
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      const productData: Prisma.ProductUpdateInput = {};

      if (dto.name !== undefined) productData.name = dto.name;
      if (dto.slug !== undefined) productData.slug = dto.slug;
      if (dto.description !== undefined) productData.description = dto.description;
      if (dto.shortDesc !== undefined) productData.shortDesc = dto.shortDesc;
      if (dto.basePrice !== undefined) productData.basePrice = dto.basePrice;
      if (dto.salePrice !== undefined) productData.salePrice = dto.salePrice;
      if (dto.sku !== undefined) productData.sku = dto.sku;
      if (dto.barcode !== undefined) productData.barcode = dto.barcode;
      if (dto.stockQuantity !== undefined) productData.stockQuantity = dto.stockQuantity;
      if (dto.weight !== undefined) productData.weight = dto.weight;
      if (dto.isActive !== undefined) productData.isActive = dto.isActive;
      if (dto.isFeatured !== undefined) productData.isFeatured = dto.isFeatured;
      if (dto.tags !== undefined) productData.tags = dto.tags;
      if (dto.metaTitle !== undefined) productData.metaTitle = dto.metaTitle;
      if (dto.metaDescription !== undefined) productData.metaDescription = dto.metaDescription;

      if (dto.categoryId !== undefined) {
        productData.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
      }

      if (dto.brandId !== undefined) {
        productData.brand = dto.brandId ? { connect: { id: dto.brandId } } : { disconnect: true };
      }

      if (dto.variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (dto.variants.length > 0) {
          await tx.productVariant.createMany({
            data: dto.variants.map((v) => ({
              productId: id,
              name: v.name,
              sku: v.sku,
              price: v.price,
              salePrice: v.salePrice,
              stockQuantity: v.stockQuantity ?? 0,
              attributes: v.attributes || {},
              isActive: v.isActive ?? true,
            })),
          });
        }
      }

      if (dto.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (dto.images.length > 0) {
          await tx.productImage.createMany({
            data: dto.images.map((img) => ({
              productId: id,
              url: img.url,
              altText: img.altText,
              sortOrder: img.sortOrder ?? 0,
              isPrimary: img.isPrimary ?? false,
            })),
          });
        }
      }

      const product = await tx.product.update({
        where: { id },
        data: productData,
        include: {
          category: true,
          brand: true,
          variants: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
      });

      return product;
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAllSlugs(): Promise<string[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return products.map((p) => p.slug);
  }

  async findPublic(filter: ProductFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (filter.search) {
      where.name = { contains: filter.search, mode: "insensitive" };
    }

    if (filter.category) {
      where.category = { slug: filter.category, isActive: true };
    }

    if (filter.brand) {
      where.brand = { slug: filter.brand, isActive: true };
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.basePrice = {};
      if (filter.minPrice !== undefined) {
        where.basePrice.gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        where.basePrice.lte = filter.maxPrice;
      }
    }

    if (filter.featured !== undefined) {
      where.isFeatured = filter.featured;
    }

    const orderBy = this.getSortOrder(filter.sort);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          brand: true,
          images: {
            where: { isPrimary: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        brand: true,
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  async findFeatured(limit: number = 10) {
    return this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        brand: true,
        images: {
          where: { isPrimary: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
    });
  }

  async searchProducts(query: string, limit: number = 20, page: number = 1) {
    if (!query?.trim()) {
      return { items: [], total: 0, page: 1, totalPages: 0 };
    }

    const skip = (page - 1) * limit;
    const searchTerm = query.trim();

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { shortDesc: { contains: searchTerm, mode: "insensitive" } },
        { sku: { contains: searchTerm, mode: "insensitive" } },
        { tags: { has: searchTerm } },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { soldCount: "desc" },
          { viewCount: "desc" },
        ],
        include: {
          category: true,
          brand: true,
          images: {
            where: { isPrimary: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async incrementViewCount(slug: string) {
    try {
      await this.prisma.product.update({
        where: { slug, isActive: true },
        data: { viewCount: { increment: 1 } },
      });
    } catch (error) {
      // Silently fail - fire and forget
    }
  }

  async getSuggestions(slug: string, limit: number = 8) {
    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      select: { id: true, categoryId: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    const excludeIds: string[] = [product.id];
    let suggestions: any[] = [];

    // 1. Find products frequently bought together via co-purchase data
    try {
      const coPurchased = await this.prisma.$queryRawUnsafe<
        Array<{ product_id: string; co_count: bigint }>
      >(
        `SELECT oi2.product_id, COUNT(*) as co_count
         FROM order_items oi1
         INNER JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id != oi2.product_id
         WHERE oi1.product_id = $1
         GROUP BY oi2.product_id
         ORDER BY co_count DESC
         LIMIT $2`,
        product.id,
        limit,
      );

      if (coPurchased.length > 0) {
        const coIds = coPurchased.map((r) => r.product_id);
        const coProducts = await this.prisma.product.findMany({
          where: { id: { in: coIds }, isActive: true },
          include: {
            images: {
              where: { isPrimary: true },
              orderBy: { sortOrder: "asc" },
              take: 1,
            },
          },
        });

        // Preserve co-purchase order
        const coMap = new Map(coProducts.map((p) => [p.id, p]));
        for (const cp of coPurchased) {
          const p = coMap.get(cp.product_id);
          if (p) {
            suggestions.push(p);
            excludeIds.push(p.id);
          }
        }
      }
    } catch {
      // Raw query may fail if no orders exist yet - continue to fallback
    }

    // 2. Fill with same-category products
    if (suggestions.length < limit && product.categoryId) {
      const remaining = limit - suggestions.length;
      const categoryProducts = await this.prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          isActive: true,
          id: { notIn: excludeIds },
        },
        take: remaining,
        orderBy: { soldCount: "desc" },
        include: {
          images: {
            where: { isPrimary: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      });

      for (const p of categoryProducts) {
        suggestions.push(p);
        excludeIds.push(p.id);
      }
    }

    // 3. Fill with bestselling products
    if (suggestions.length < limit) {
      const remaining = limit - suggestions.length;
      const bestSellers = await this.prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: excludeIds },
        },
        take: remaining,
        orderBy: { soldCount: "desc" },
        include: {
          images: {
            where: { isPrimary: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      });

      for (const p of bestSellers) {
        suggestions.push(p);
      }
    }

    return suggestions.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: p.basePrice,
      salePrice: p.salePrice,
      images: p.images,
      avgRating: p.avgRating,
      soldCount: p.soldCount,
    }));
  }

  async getCartSuggestions(productIds: string[], limit: number = 4) {
    if (productIds.length === 0) return [];

    // Get categories of products in cart
    const cartProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { categoryId: true },
    });

    const categoryIds = [
      ...new Set(
        cartProducts
          .map((p) => p.categoryId)
          .filter((id): id is string => id !== null),
      ),
    ];

    let suggestions: any[] = [];

    // Find products from same categories, exclude cart items
    if (categoryIds.length > 0) {
      suggestions = await this.prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          isActive: true,
          id: { notIn: productIds },
        },
        take: limit,
        orderBy: { soldCount: "desc" },
        include: {
          images: {
            where: { isPrimary: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
          variants: {
            where: { isActive: true },
            select: { id: true },
            take: 1,
          },
        },
      });
    }

    // Fill with bestsellers if not enough
    if (suggestions.length < limit) {
      const remaining = limit - suggestions.length;
      const existingIds = [
        ...productIds,
        ...suggestions.map((s) => s.id),
      ];
      const bestSellers = await this.prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: existingIds },
        },
        take: remaining,
        orderBy: { soldCount: "desc" },
        include: {
          images: {
            where: { isPrimary: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
          variants: {
            where: { isActive: true },
            select: { id: true },
            take: 1,
          },
        },
      });

      suggestions.push(...bestSellers);
    }

    return suggestions.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: p.basePrice,
      salePrice: p.salePrice,
      images: p.images,
      avgRating: p.avgRating,
      soldCount: p.soldCount,
      hasVariants: p.variants && p.variants.length > 0,
    }));
  }

  async exportCsv(): Promise<string> {
    const products = await this.prisma.product.findMany({
      include: { category: true, brand: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'SKU',
      'Name',
      'Slug',
      'Base Price',
      'Sale Price',
      'Stock',
      'Category',
      'Brand',
      'Description',
      'Short Desc',
      'Tags',
      'Weight',
      'Active',
      'Featured',
    ];

    const rows = products.map((p) =>
      [
        this.csvEscape(p.sku || ''),
        this.csvEscape(p.name),
        this.csvEscape(p.slug),
        p.basePrice.toString(),
        p.salePrice?.toString() || '',
        p.stockQuantity.toString(),
        this.csvEscape(p.category?.name || ''),
        this.csvEscape(p.brand?.name || ''),
        this.csvEscape(p.description || ''),
        this.csvEscape(p.shortDesc || ''),
        this.csvEscape(Array.isArray(p.tags) ? p.tags.join(', ') : ''),
        p.weight?.toString() || '',
        p.isActive ? 'Yes' : 'No',
        p.isFeatured ? 'Yes' : 'No',
      ].join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }

  async importCsv(
    csvContent: string,
  ): Promise<{ imported: number; errors: string[] }> {
    const lines = csvContent.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException(
        'CSV file is empty or has no data rows',
      );
    }

    const headers = this.parseCsvLine(lines[0]).map((h) =>
      h.toLowerCase().trim(),
    );
    const errors: string[] = [];
    let imported = 0;

    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      headerMap[h] = i;
    });

    const getVal = (values: string[], key: string): string => {
      const idx = headerMap[key];
      if (idx === undefined) return '';
      return values[idx] || '';
    };

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCsvLine(lines[i]);
        if (values.every((v) => !v.trim())) continue;

        const name = getVal(values, 'name');
        if (!name) {
          errors.push(`Row ${i + 1}: Missing product name`);
          continue;
        }

        const basePriceStr = getVal(values, 'base price');
        if (!basePriceStr) {
          errors.push(`Row ${i + 1}: Missing base price`);
          continue;
        }

        const basePrice = parseInt(basePriceStr, 10);
        if (isNaN(basePrice)) {
          errors.push(`Row ${i + 1}: Invalid base price "${basePriceStr}"`);
          continue;
        }

        const salePriceStr = getVal(values, 'sale price');
        const salePrice = salePriceStr ? parseInt(salePriceStr, 10) : null;
        if (salePriceStr && isNaN(salePrice as number)) {
          errors.push(
            `Row ${i + 1}: Invalid sale price "${salePriceStr}"`,
          );
          continue;
        }

        const stockStr = getVal(values, 'stock');
        const stockQuantity = stockStr ? parseInt(stockStr, 10) : 0;

        const weightStr = getVal(values, 'weight');
        const weight = weightStr ? parseInt(weightStr, 10) : null;

        const categoryName = getVal(values, 'category');
        const brandName = getVal(values, 'brand');

        let categoryId: string | null = null;
        if (categoryName) {
          const category = await this.prisma.category.findFirst({
            where: { name: { equals: categoryName, mode: 'insensitive' } },
          });
          if (category) {
            categoryId = category.id;
          }
        }

        let brandId: string | null = null;
        if (brandName) {
          const brand = await this.prisma.brand.findFirst({
            where: { name: { equals: brandName, mode: 'insensitive' } },
          });
          if (brand) {
            brandId = brand.id;
          }
        }

        const slug =
          getVal(values, 'slug') ||
          this.generateSlug(name);
        const sku = getVal(values, 'sku') || null;
        const description = getVal(values, 'description') || null;
        const shortDesc = getVal(values, 'short desc') || null;
        const tagsStr = getVal(values, 'tags');
        const tags = tagsStr
          ? tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
          : [];

        const activeStr = getVal(values, 'active');
        const isActive =
          activeStr.toLowerCase() === 'no' ? false : true;

        const featuredStr = getVal(values, 'featured');
        const isFeatured =
          featuredStr.toLowerCase() === 'yes' ? true : false;

        const productData: Prisma.ProductCreateInput = {
          name,
          slug,
          sku,
          basePrice,
          salePrice,
          stockQuantity,
          weight,
          description,
          shortDesc,
          tags,
          isActive,
          isFeatured,
          ...(categoryId
            ? { category: { connect: { id: categoryId } } }
            : {}),
          ...(brandId ? { brand: { connect: { id: brandId } } } : {}),
        };

        if (sku) {
          const existing = await this.prisma.product.findUnique({
            where: { sku },
          });

          if (existing) {
            await this.prisma.product.update({
              where: { sku },
              data: {
                name,
                slug,
                basePrice,
                salePrice,
                stockQuantity,
                weight,
                description,
                shortDesc,
                tags,
                isActive,
                isFeatured,
                ...(categoryId
                  ? { category: { connect: { id: categoryId } } }
                  : {}),
                ...(brandId
                  ? { brand: { connect: { id: brandId } } }
                  : {}),
              },
            });
          } else {
            await this.prisma.product.create({ data: productData });
          }
        } else {
          // No SKU - check by slug to avoid duplicates
          const existingBySlug = await this.prisma.product.findUnique({
            where: { slug },
          });

          if (existingBySlug) {
            await this.prisma.product.update({
              where: { slug },
              data: {
                name,
                basePrice,
                salePrice,
                stockQuantity,
                weight,
                description,
                shortDesc,
                tags,
                isActive,
                isFeatured,
                ...(categoryId
                  ? { category: { connect: { id: categoryId } } }
                  : {}),
                ...(brandId
                  ? { brand: { connect: { id: brandId } } }
                  : {}),
              },
            });
          } else {
            await this.prisma.product.create({ data: productData });
          }
        }

        imported++;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Row ${i + 1}: ${message}`);
      }
    }

    return { imported, errors };
  }

  private csvEscape(value: string): string {
    if (
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n')
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private getSortOrder(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case "newest":
        return { createdAt: "desc" };
      case "price_asc":
        return { basePrice: "asc" };
      case "price_desc":
        return { basePrice: "desc" };
      case "bestseller":
        return { soldCount: "desc" };
      default:
        return { createdAt: "desc" };
    }
  }
}
