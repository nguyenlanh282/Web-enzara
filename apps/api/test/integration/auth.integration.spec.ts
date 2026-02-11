import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, getAuthToken } from '../app-factory';
import { prismaMock } from '../prisma-mock';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

const bcrypt = await import('bcrypt');

describe('Auth Endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with accessToken for valid credentials', async () => {
      (bcrypt.compare as any).mockResolvedValue(true);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@enzara.vn',
        password: '$2b$10$hashed',
        fullName: 'Test User',
        phone: '+84123456789',
        emailVerified: true,
        isActive: true,
        role: 'CUSTOMER',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@enzara.vn', password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'no@enzara.vn', password: 'wrongpass' })
        .expect(401);
    });

    it('should return 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400);
    });

    it('should return 400 for password too short', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@enzara.vn', password: '12345' })
        .expect(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 with accessToken for valid registration', async () => {
      (bcrypt.hash as any).mockResolvedValue('$2b$12$newhashedpassword');
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'new-user-1',
        email: 'new@enzara.vn',
        fullName: 'New User',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.setting.upsert.mockResolvedValue({} as any);
      prismaMock.loyaltyPoint.create.mockResolvedValue({} as any);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'new@enzara.vn',
          password: 'StrongPass123',
          fullName: 'New User',
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('should return 409 for duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'existing@enzara.vn',
          password: 'StrongPass123',
          fullName: 'Dup User',
        })
        .expect(409);
    });

    it('should return 400 for missing fullName', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'new@enzara.vn',
          password: 'StrongPass123',
        })
        .expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return profile with valid auth token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@enzara.vn',
        fullName: 'Test User',
        phone: '+84123456789',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: true,
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // JwtStrategy calls prisma.user.findUnique to validate token
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const token = getAuthToken(app, 'user-1');

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', token)
        .expect(200);

      expect(res.body).toHaveProperty('email', 'test@enzara.vn');
    });
  });
});
