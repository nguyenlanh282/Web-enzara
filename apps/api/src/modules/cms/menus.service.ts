import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { UpsertMenuDto } from './dto/upsert-menu.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPosition(position: string) {
    const menu = await this.prisma.menu.findUnique({ where: { position } });
    if (!menu) {
      throw new NotFoundException(
        `Menu with position "${position}" not found`,
      );
    }
    return menu;
  }

  async upsert(position: string, dto: UpsertMenuDto) {
    return this.prisma.menu.upsert({
      where: { position },
      update: {
        name: dto.name,
        items: dto.items as any,
        isActive: dto.isActive ?? true,
      },
      create: {
        name: dto.name,
        position,
        items: dto.items as any,
        isActive: dto.isActive ?? true,
      },
    });
  }
}
