import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/common/services/prisma.service';
import { prismaMock } from './prisma-mock';
import { ModuleMetadata } from '@nestjs/common';

/**
 * Create a NestJS testing module with PrismaService already mocked.
 */
export async function createTestModule(
  metadata: ModuleMetadata,
): Promise<TestingModule> {
  return Test.createTestingModule({
    ...metadata,
    providers: [
      ...(metadata.providers || []),
      { provide: PrismaService, useValue: prismaMock },
    ],
  }).compile();
}
