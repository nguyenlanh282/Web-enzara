import { NotFoundException } from '@nestjs/common';
import { createTestModule } from '../../../test/helpers';
import { prismaMock } from '../../../test/prisma-mock';
import { ProductsService } from './products.service';

let service: ProductsService;

const mockProduct = {
  id: 'p1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test description',
  shortDesc: 'Short desc',
  basePrice: 150000,
  salePrice: 120000,
  sku: 'SKU-001',
  barcode: null,
  stockQuantity: 50,
  weight: 500,
  isActive: true,
  isFeatured: false,
  tags: ['test'],
  metaTitle: null,
  metaDescription: null,
  pancakeId: null,
  categoryId: 'c1',
  brandId: 'b1',
  avgRating: 0,
  reviewCount: 0,
  soldCount: 0,
  viewCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: {
    id: 'c1',
    name: 'Category 1',
    slug: 'category-1',
    isActive: true,
    description: null,
    image: null,
    sortOrder: 0,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  brand: {
    id: 'b1',
    name: 'Brand 1',
    slug: 'brand-1',
    isActive: true,
    description: null,
    logo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  variants: [],
  images: [],
};

beforeEach(async () => {
  const module = await createTestModule({
    providers: [ProductsService],
  });
  service = module.get(ProductsService);
});

describe('ProductsService', () => {
  describe('findAllAdmin', () => {
    it('should return paginated products with meta', async () => {
      prismaMock.product.findMany.mockResolvedValue([mockProduct]);
      prismaMock.product.count.mockResolvedValue(1);

      const result = await service.findAllAdmin({});

      expect(result).toEqual(
        expect.objectContaining({
          data: [mockProduct],
          meta: expect.objectContaining({
            total: 1,
          }),
        }),
      );
      expect(prismaMock.product.findMany).toHaveBeenCalled();
      expect(prismaMock.product.count).toHaveBeenCalled();
    });

    it('should apply search filter', async () => {
      prismaMock.product.findMany.mockResolvedValue([mockProduct]);
      prismaMock.product.count.mockResolvedValue(1);

      await service.findAllAdmin({ search: 'Test' });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({ contains: 'Test', mode: 'insensitive' }),
          }),
        }),
      );
    });
  });

  describe('findOneAdmin', () => {
    it('should return a product by id', async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOneAdmin('p1');

      expect(result).toEqual(mockProduct);
      expect(prismaMock.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
        }),
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(service.findOneAdmin('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySlug', () => {
    it('should return an active product by slug', async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findBySlug('test-product');

      expect(result).toEqual(mockProduct);
      expect(prismaMock.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ slug: 'test-product' }),
        }),
      );
    });

    it('should throw NotFoundException for missing slug', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a product by setting isActive to false', async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct);
      prismaMock.product.update.mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      const result = await service.remove('p1');

      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({ isActive: false }),
        }),
      );
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException if product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchProducts', () => {
    it('should return empty result for empty query', async () => {
      const result = await service.searchProducts('', 10, 1);

      expect(result).toEqual(
        expect.objectContaining({
          items: [],
          total: 0,
        }),
      );
    });
  });
});
