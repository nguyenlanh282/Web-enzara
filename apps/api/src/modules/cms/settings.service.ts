import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByGroup(group: string) {
    const settings = await this.prisma.setting.findMany({
      where: { group },
    });

    // Return as key-value object
    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return { group, settings: result };
  }

  async upsertGroup(group: string, settings: Record<string, any>) {
    const operations = Object.entries(settings).map(([key, value]) =>
      this.prisma.setting.upsert({
        where: { group_key: { group, key } },
        update: { value: value as any },
        create: { group, key, value: value as any },
      }),
    );

    await this.prisma.$transaction(operations);

    return this.getByGroup(group);
  }
}
