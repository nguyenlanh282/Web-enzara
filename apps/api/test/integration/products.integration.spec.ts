import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../app-factory';
import { prismaMock } from '../prisma-mock';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

describe('Product Endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/products', () => {
    it('should return paginated product list', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Product 1', slug: 'product-1', isActive: true, basePrice: 100000 },
      ];

      prismaMock.product.findMany.mockResolvedValue(mockProducts as any);
      prismaMock.product.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support pagination query params', async () => {
      prismaMock.product.findMany.mockResolvedValue([] as any);
      prismaMock.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/products?page=2&limit=5')
        .expect(200);
    });
  });

  describe('GET /api/products/featured', () => {
    it('should return featured products', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Featured', slug: 'featured', isFeatured: true },
      ] as any);

      const res = await request(app.getHttpServer())
        .get('/api/products/featured')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/products/search', () => {
    it('should return search results', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Matching Product', slug: 'matching-product' },
      ] as any);
      prismaMock.product.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/api/products/search?q=matching')
        .expect(200);

      expect(res.body).toHaveProperty('items');
    });

    it('should return empty for blank query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products/search?q=')
        .expect(200);

      expect(res.body.items).toEqual([]);
    });
  });

  describe('GET /api/products/:slug', () => {
    it('should return product detail for valid slug', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test Product',
        slug: 'test-product',
        isActive: true,
        variants: [],
        images: [],
        category: { id: 'c1', name: 'Cat' },
        brand: { id: 'b1', name: 'Brand' },
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/products/test-product')
        .expect(200);

      expect(res.body.slug).toBe('test-product');
    });

    it('should return 404 for non-existent slug', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/products/non-existent')
        .expect(404);
    });
  });
});
