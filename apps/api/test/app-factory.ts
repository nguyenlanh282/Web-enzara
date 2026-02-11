import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { prismaMock } from './prisma-mock';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Create a fully bootstrapped NestJS app with mocked Prisma and disabled throttling.
 * CacheService gracefully handles missing REDIS_URL (no-op), so no override needed.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleFixture.createNestApplication();

  // Mirror production bootstrap
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.setGlobalPrefix('api');

  await app.init();
  return app;
}

/**
 * Generate a valid JWT Bearer token for integration tests.
 * Uses the app's real JwtService (configured with JWT_SECRET from ConfigService).
 */
export function getAuthToken(
  app: INestApplication,
  userId: string,
  email = 'test@enzara.vn',
  role = 'CUSTOMER',
): string {
  const jwtService = app.get(JwtService);
  const token = jwtService.sign({ sub: userId, email, role });
  return `Bearer ${token}`;
}
