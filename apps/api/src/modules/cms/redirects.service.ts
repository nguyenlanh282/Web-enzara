import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import {
  CreateRedirectDto,
  UpdateRedirectDto,
} from './dto/create-redirect.dto';

@Injectable()
export class RedirectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.redirect.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const redirect = await this.prisma.redirect.findUnique({ where: { id } });
    if (!redirect) {
      throw new NotFoundException(`Redirect with id "${id}" not found`);
    }
    return redirect;
  }

  async create(dto: CreateRedirectDto) {
    const existing = await this.prisma.redirect.findUnique({
      where: { fromPath: dto.fromPath },
    });
    if (existing) {
      throw new ConflictException(
        `Redirect from "${dto.fromPath}" already exists`,
      );
    }

    return this.prisma.redirect.create({
      data: {
        fromPath: dto.fromPath,
        toPath: dto.toPath,
        type: dto.type ?? 301,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateRedirectDto) {
    const redirect = await this.prisma.redirect.findUnique({ where: { id } });
    if (!redirect) {
      throw new NotFoundException(`Redirect with id "${id}" not found`);
    }

    if (dto.fromPath && dto.fromPath !== redirect.fromPath) {
      const existing = await this.prisma.redirect.findUnique({
        where: { fromPath: dto.fromPath },
      });
      if (existing) {
        throw new ConflictException(
          `Redirect from "${dto.fromPath}" already exists`,
        );
      }
    }

    return this.prisma.redirect.update({
      where: { id },
      data: {
        ...(dto.fromPath !== undefined && { fromPath: dto.fromPath }),
        ...(dto.toPath !== undefined && { toPath: dto.toPath }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async delete(id: string) {
    const redirect = await this.prisma.redirect.findUnique({ where: { id } });
    if (!redirect) {
      throw new NotFoundException(`Redirect with id "${id}" not found`);
    }

    await this.prisma.redirect.delete({ where: { id } });
    return { message: 'Redirect deleted successfully' };
  }
}
