import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailService } from '../notifications/email.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { prismaMock } from '../../../test/prisma-mock';
import { createTestModule } from '../../../test/helpers';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

const mockJwtService = {
  sign: vi.fn().mockReturnValue('mock-token'),
  verify: vi.fn(),
  signAsync: vi.fn(),
  verifyAsync: vi.fn(),
};

const mockConfigService = {
  get: vi.fn((key: string, defaultValue?: string) => {
    const defaults: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION: '7d',
      FRONTEND_URL: 'http://localhost:3000',
    };
    return defaults[key] ?? defaultValue ?? '';
  }),
};

const mockEmailService = {
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendEmail: vi.fn().mockResolvedValue(undefined),
  welcomeHtml: vi.fn().mockReturnValue('<p>Welcome</p>'),
  emailVerificationHtml: vi.fn().mockReturnValue('<p>Verify</p>'),
  passwordResetHtml: vi.fn().mockReturnValue('<p>Reset</p>'),
};

const mockLoyaltyService = {
  earnPoints: vi.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    fullName: 'Test User',
    phone: '+1234567890',
    emailVerified: true,
    isActive: true,
    role: 'CUSTOMER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await createTestModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
      ],
    });

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as any).mockResolvedValue(true);
      prismaMock.user.update.mockResolvedValue(mockUser as any);
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'test@example.com' },
        }),
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user and return tokens', async () => {
      // First findUnique for email check returns null
      prismaMock.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('$2b$10$newhashedpassword');
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        id: 'new-user-1',
        email: 'new@example.com',
        password: '$2b$10$newhashedpassword',
      } as any);
      prismaMock.setting.upsert.mockResolvedValue({} as any);
      prismaMock.loyaltyPoint.create.mockResolvedValue({} as any);
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.register({
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
        phone: '+1234567890',
      } as any);

      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw ConflictException when email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
          phone: '+1234567890',
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for a valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(mockJwtService.verify).toHaveBeenCalledWith(
        'valid-refresh-token',
        expect.any(Object),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for an invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return the user profile with addresses', async () => {
      const userWithAddresses = {
        ...mockUser,
        addresses: [
          {
            id: 'addr-1',
            street: '123 Main St',
            city: 'HCMC',
            country: 'Vietnam',
          },
        ],
      };
      prismaMock.user.findUnique.mockResolvedValue(userWithAddresses as any);

      const result = await service.getProfile('user-1');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com',
        }),
      );
    });

    it('should throw when user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent-id')).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should update the password when current password is correct', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue('$2b$10$newhashedpassword');
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        password: '$2b$10$newhashedpassword',
      } as any);

      await service.changePassword('user-1', {
        currentPassword: 'password123',
        newPassword: 'newPassword456',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            password: '$2b$10$newhashedpassword',
          }),
        }),
      );
    });

    it('should throw BadRequestException when current password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrongpassword',
          newPassword: 'newPassword456',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
